import {
    AngularNodeAppEngine,
    createNodeRequestHandler,
    isMainModule,
    writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { createUserWithLicense, validateLicenseByUserName } from './app/api/license.api.service';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

app.use(
    express.static(browserDistFolder, {
        maxAge: '1y',
        index: false,
        redirect: false,
    }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
    angularApp
        .handle(req)
        .then((response) =>
            response ? writeResponseToNodeResponse(response, res) : next(),
        )
        .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
    const port = process.env['PORT'] || 4000;
    app.listen(port, (error) => {
        if (error) {
            throw error;
        }

        console.log(`Node Express server listening on http://localhost:${port}`);
    });
}
app.get('/api/license/:userName', async (req, res) => {
    const userName = req.params['userName']; // string
    const supabaseResponse = await validateLicenseByUserName(userName);
    if (supabaseResponse) {
        res.json({'License': supabaseResponse });
    }
    else {
        res.json({'License': []});
    }
});

app.post('/api/license', async (req, res) => {
    const { userName, licenseTier, expiresAt } = req.body;
    
    if (!userName || !licenseTier) {
        return res.status(400).json({
            success: false,
            error: 'userName and licenseTier are required'
        });
    }
    
    const result = await createUserWithLicense(userName, licenseTier, expiresAt);
    
    if (result.success) {
        res.status(201).json(result);
    } else {
        res.status(400).json(result);
    }
});


/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
