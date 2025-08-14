import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import backendRouter from './backend/routes/api.routes'
import express from 'express';
import { join, resolve } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const serverDistFolder = join(import.meta.dirname); // Folder dist/server

const app = express();
const angularApp = new AngularNodeAppEngine();

/******************** API SERVER *********************/
app.use(express.json()); // <-- Tambah ini agar API bisa menerima JSON body
// ---- Tambah route API di sini ----
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'ok', time: new Date().toISOString() });
// });
app.use('/v2', backendRouter);
/*********************END API SERVER **************************/
/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * === TAMBAHAN UNTUK UPLOAD ===
 * Serve folder upload yang ada di dalam dist/upload
 * Sesuaikan path folder upload dengan lokasi fisik folder upload Anda
 */
const uploadFolder = resolve(serverDistFolder, '../upload'); // dist/upload relatif dari dist/server
app.use('/upload', express.static(uploadFolder));


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
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
