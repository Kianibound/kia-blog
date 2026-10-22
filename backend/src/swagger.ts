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
    .setDescription('REST API documentation for Kia Blog backend')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Keep the generated initializer and OpenAPI document on the application origin.
  SwaggerModule.setup('api', app, document);
}
