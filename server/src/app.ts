import './schemas/zodHebrew';
import cors, { type CorsOptions } from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { openapiDocument } from './docs/openapi';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

function buildCorsOptions(): CorsOptions {
  const allowAll = env.corsOrigins.length === 0 || env.corsOrigins.includes('*');
  return {
    origin: allowAll
      ? '*'
      : (origin, callback) => {
          // בקשות בלי Origin (Swagger מאותו שרת, curl) מותרות
          if (!origin || env.corsOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: '100kb' }));

  // תיעוד API
  app.get('/', (_req, res) => res.redirect('/api-docs'));
  app.get('/openapi.json', (_req, res) => {
    res.json(openapiDocument);
  });
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openapiDocument, {
      customSiteTitle: 'Lesson Diary API',
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
