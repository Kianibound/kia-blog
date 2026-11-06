import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AccessControlModule } from './access-control.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PrismaService } from '../database/prisma.service';

describe('AccessControlModule', () => {
  it('provides the complete request access-control interface', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              JWT_ACCESS_SECRET: 'test-access-secret',
              JWT_ACCESS_EXPIRES_IN: '900',
            }),
          ],
        }),
        AccessControlModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(moduleRef.get(JwtAuthGuard)).toBeInstanceOf(JwtAuthGuard);
    expect(moduleRef.get(RolesGuard)).toBeInstanceOf(RolesGuard);

    await moduleRef.close();
  });
});
