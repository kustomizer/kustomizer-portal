import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUser,
  jsonResponse,
} from '../_shared/edge.ts';
import { normalizeShopifyDomainInput } from '../_shared/store-access.ts';
import { encryptShopifyToken } from '../_shared/shopify-token-crypto.ts';

type OwnerShopifyCredentialsUpsertRequest = {
  shop_id?: string;
  // Accept both names to ease integrations
  shopify_domain?: string;
  shop?: string;
  access_token?: string;
  accessToken?: string;
};

const SHOPIFY_API_VERSION = Deno.env.get('SHOPIFY_API_VERSION') ?? '2024-10';

async function shopifyGraphQL(shopifyDomain: string, accessToken: string, query: string, variables?: unknown) {
  const url = `https://${shopifyDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const bodyText = await resp.text();

  if (!resp.ok) {
    return { ok: false as const, status: resp.status, body: bodyText };
  }

  try {
    const json = JSON.parse(bodyText);
    return { ok: true as const, json };
  } catch {
    return { ok: false as const, status: 500, body: bodyText };
  }
}

async function validateCredentials(shopifyDomain: string, accessToken: string): Promise<{ ok: boolean }> {
  const query = `query ValidateToken($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) {
      id
    }
  }`;

  const variables = {
    handle: {
      type: 'kustomizer_probe',
      handle: 'kustomizer-probe',
    },
  };

  const resp = await shopifyGraphQL(shopifyDomain, accessToken, query, variables);

  if (!resp.ok) {
    return { ok: false };
  }

  if (resp.json?.errors?.length) {
    return { ok: false };
  }

  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  let payload: OwnerShopifyCredentialsUpsertRequest;
  try {
    payload = await req.json();
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const shopId = payload.shop_id?.trim();
  const shopifyDomain = payload.shopify_domain ?? payload.shop;
  const normalizedShopifyDomain = shopifyDomain ? normalizeShopifyDomainInput(shopifyDomain) : '';
  const accessToken = (payload.access_token ?? payload.accessToken)?.trim();

  if (!shopId || !normalizedShopifyDomain || !accessToken) {
    return errorResponse(
      422,
      'shop_id, shopify_domain (or shop), and access_token (or accessToken) are required'
    );
  }

  const user = await getUser(req);
  const userEmail = user?.email?.trim().toLowerCase();
  if (!userEmail) {
    return errorResponse(401, 'Unauthorized');
  }

  const supabaseAdmin = getServiceClient();

  const { data: shop, error: shopError } = await supabaseAdmin
    .from('shops')
    .select('id, owner_email')
    .eq('id', shopId)
    .maybeSingle();

  if (shopError || !shop) {
    return errorResponse(404, 'Shop not found');
  }

  const ownerEmail = String(shop.owner_email ?? '').trim().toLowerCase();
  if (!ownerEmail || ownerEmail !== userEmail) {
    return errorResponse(403, 'Only owners can set Shopify credentials');
  }

  const credentialCheck = await validateCredentials(normalizedShopifyDomain, accessToken);
  if (!credentialCheck.ok) {
    return errorResponse(422, 'Invalid Shopify credentials');
  }

  let encrypted;
  try {
    encrypted = await encryptShopifyToken(accessToken);
  } catch (e) {
    return errorResponse(500, e instanceof Error ? e.message : 'Encryption failed');
  }

  const now = new Date().toISOString();

  const { error: upsertError } = await supabaseAdmin
    .from('shop_credentials')
    .upsert(
      {
        shop_id: shopId,
        shopify_domain: normalizedShopifyDomain,
        access_token_ciphertext: encrypted.ciphertextB64,
        access_token_iv: encrypted.ivB64,
        updated_at: now,
        last_validated_at: now,
      },
      { onConflict: 'shop_id' }
    );

  if (upsertError) {
    return errorResponse(500, upsertError.message || 'Failed to save Shopify credentials');
  }

  return jsonResponse({
    ok: true,
    shop_id: shopId,
    shopify_domain: normalizedShopifyDomain,
    last_validated_at: now,
  });
});
