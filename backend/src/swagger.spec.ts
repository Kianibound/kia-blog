import { jest } from '@jest/globals';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import helmet from 'helmet';
import request from 'supertest';
import {
  setupSwagger,
  swaggerAssetBaseUrl,
  swaggerCspDirectives,
} from './swagger';

@Controller()
class DocumentedController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}

describe('Swagger on deployments without bundled static assets', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [DocumentedController],
    }).compile();
    app = module.createNestApplication();
    app.use(
      helmet({ contentSecurityPolicy: { directives: swaggerCspDirectives } }),
    );
    // Simulate serverless packaging: none of swagger-ui-dist's local files can be served.
    jest.spyOn(app, 'useStaticAssets').mockReturnValue(app);
    setupSwagger(app);
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
    jest.restoreAllMocks();
  });

  it.each(['/api', '/api/'])(
    'serves %s with working asset targets and a compatible CSP',
    async (path) => {
      const response = await request(app.getHttpServer())
        .get(path)
        .expect(200)
        .expect('Content-Type', /text\/html/);
      const csp = response.headers['content-security-policy'];
      expect(csp).toContain(`script-src 'self' ${swaggerAssetBaseUrl}`);
      expect(csp).toContain(
        `style-src 'self' 'unsafe-inline' ${swaggerAssetBaseUrl}`,
      );
      expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
      const assets = [...response.text.matchAll(/(?:src|href)="([^"]+)"/g)]
        .map(
          (match) =>
            new URL(match[1], `https://example.invalid${path}`).pathname,
        )
        .filter((asset) => /swagger-ui|favicon/.test(asset));
      expect(assets.length).toBeGreaterThanOrEqual(4);
      for (const asset of assets) {
        const result = await request(app.getHttpServer()).get(asset);
        if (asset.endsWith('swagger-ui-init.js')) {
          expect(result.status).toBe(200);
          expect(result.headers['content-type']).toMatch(/javascript/);
          expect(result.text).toContain('SwaggerUIBundle');
        } else {
          expect(result.status).toBe(307);
          expect(result.headers.location).toBe(
            swaggerAssetBaseUrl + asset.split('/').pop(),
          );
        }
      }
    },
  );
  it('keeps the OpenAPI JSON and bearer authentication definition available', async () => {
    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200)
      .expect('Content-Type', /application\/json/);
    expect(response.body.info.title).toBe('Kia Blog API');
    expect(response.body.paths['/health']).toBeDefined();
    expect(response.body.components.securitySchemes['access-token']).toEqual({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });
  it('keeps normal application routes working', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });
});
