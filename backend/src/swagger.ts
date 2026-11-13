import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Pinned to the Swagger UI version in package-lock.json. No runtime filesystem dependency.
export const swaggerAssetBaseUrl =
  'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.0/';

export const swaggerCspDirectives = {
  scriptSrc: ["'self'", swaggerAssetBaseUrl],
  styleSrc: ["'self'", "'unsafe-inline'", swaggerAssetBaseUrl],
  imgSrc: ["'self'", 'data:', 'https:'],
};

export function setupSwagger(app: INestApplication): void {
  const adapter = app.getHttpAdapter();
  // Register before Swagger's static middleware: Vercel may omit its asset directory.
  for (const asset of [
    'swagger-ui.css',
    'swagger-ui-bundle.js',
    'swagger-ui-standalone-preset.js',
    'favicon-16x16.png',
    'favicon-32x32.png',
  ]) {
    adapter.get(`/api/${asset}`, (_request, response) => {
      adapter.redirect(response, 307, `${swaggerAssetBaseUrl}${asset}`);
    });
  }

  const config = new DocumentBuilder()
    .setTitle('Kia Blog API')
    .setDescription(
      'REST API documentation for Kia Blog backend. Server-side Next.js adapters exchange tokens through JSON and forward access tokens as Bearer credentials. Cookies are not accepted by this API. Access tokens require a live session (sid); account status and role are checked on each protected request. Auth exchanges and bearer responses use Cache-Control: private, no-store. See backend README for HttpOnly cookie and CSRF responsibilities.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  for (const [path, item] of Object.entries(document.paths)) {
    for (const method of ['get', 'post', 'patch', 'delete'] as const) {
      const operation = item[method];
      if (
        !operation ||
        (!path.startsWith('/auth/') && !operation.security?.length)
      )
        continue;
      for (const response of Object.values(operation.responses)) {
        if (!response || '$ref' in response) continue;
        response.headers = {
          ...response.headers,
          'Cache-Control': {
            description:
              'private, no-store for auth exchanges and requests with Bearer credentials',
            schema: { type: 'string', example: 'private, no-store' },
          },
        };
      }
    }
  }
  // Keep the generated initializer and OpenAPI document on the application origin.
  SwaggerModule.setup('api', app, document);
}
