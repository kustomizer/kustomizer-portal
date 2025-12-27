import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment.development';

export async function validateLicenseByUserName(userName: string) {
    let supabase: SupabaseClient | null = null;

    const { supabaseUrl, supabaseKey } = environment;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase URL o Key no configuradas');
        return false; // chequear si lanzar error
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    let { data, error } = await supabase
        .schema('public')
        .from('licenses')
        .select('status, license_tier, expires_at, users!inner(username)')
        .eq('users.username', userName)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
    if (error) {  
        console.error('Error validating license:', error);
        return false;
    }
    if (data && data?.length > 0) {
        console.log('License data:', data);
        return data;
    } else {
        return null;
    }
}

export async function createUserWithLicense(userName: string, licenseTier: string, expiresAt?: string) {
    let supabase: SupabaseClient | null = null;

    const { supabaseUrl, supabaseKey } = environment;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase URL o Key no configuradas');
        return { success: false, error: 'Supabase not configured' };
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Crear usuario
        const { data: userData, error: userError } = await supabase
            .schema('public')
            .from('users')
            .insert([
                {
                    username: userName,
                    created_at: new Date().toISOString(),
                }
            ])
            .select();

        if (userError) {
            console.error('Error creating user:', userError);
            return { success: false, error: userError.message };
        }

        if (!userData || userData.length === 0) {
            return { success: false, error: 'Failed to create user' };
        }

        const userId = userData[0].id;
        const expiresAtDate = expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

        // Crear licencia
        const { data: licenseData, error: licenseError } = await supabase
            .schema('public')
            .from('licenses')
            .insert([
                {
                    user_id: userId,
                    license_tier: licenseTier,
                    status: 'active',
                    expires_at: expiresAtDate,
                    created_at: new Date().toISOString(),
                }
            ])
            .select();

        if (licenseError) {
            console.error('Error creating license:', licenseError);
            return { success: false, error: licenseError.message };
        }

        console.log('User and license created successfully:', { user: userData[0], license: licenseData[0] });
        return { success: true, data: { user: userData[0], license: licenseData[0] } };
    } catch (error) {
        console.error('Unexpected error:', error);
        return { success: false, error: String(error) };
    }
}
