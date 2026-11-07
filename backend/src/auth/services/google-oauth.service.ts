import {
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../database/prisma.service';
import { GoogleCallbackDto } from '../dto/google-oauth.dto';
import { AuthService } from '../auth.service';
import { RolesService } from '../../roles/roles.service';
import { Prisma } from '../../generated/prisma/client';
import { isEmail } from 'class-validator';

export const GOOGLE_OAUTH_CLIENT = Symbol('GOOGLE_OAUTH_CLIENT');
const digest = (value: string) =>
  createHash('sha256').update(value).digest('base64url');

@Injectable()
export class GoogleOAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(GOOGLE_OAUTH_CLIENT) private readonly google: OAuth2Client,
    private readonly auth: AuthService,
    private readonly roles: RolesService,
  ) {}

  private configuration() {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI');
    try {
      const url = new URL(redirectUri ?? '');
      if (
        !clientId ||
        !clientSecret ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== '/auth/google/callback' ||
        (url.protocol !== 'https:' &&
          !(
            url.protocol === 'http:' &&
            url.hostname === 'localhost' &&
            this.config.get('NODE_ENV') !== 'production'
          ))
      )
        throw new Error();
    } catch {
      throw new ServiceUnavailableException('Google login is not configured.');
    }
    return {
      clientId: clientId!,
      redirectUri: redirectUri!,
    };
  }

  async initiate() {
    const { clientId, redirectUri } = this.configuration();
    const state = randomBytes(32).toString('base64url');
    const flowVerifier = randomBytes(32).toString('base64url');
    await this.prisma.googleOAuthState.create({
      data: {
        stateHash: digest(state),
        verifierHash: digest(flowVerifier),
        expiresAt: new Date(Date.now() + 600_000),
      },
    });
    const authorizationUrl = this.google.generateAuthUrl({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: ['openid', 'email'],
      state,
      nonce: digest(state),
      code_challenge: digest(flowVerifier),
      code_challenge_method: CodeChallengeMethod.S256,
    });
    return { authorizationUrl, flowVerifier, expiresIn: 600 };
  }

  async callback(dto: GoogleCallbackDto) {
    const { clientId, redirectUri } = this.configuration();
    const consumed = await this.prisma.googleOAuthState.updateMany({
      where: {
        stateHash: digest(dto.state),
        verifierHash: digest(dto.flowVerifier),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1)
      throw new UnauthorizedException('Invalid or expired Google login state.');
    if (dto.error || !dto.code)
      throw new UnauthorizedException('Google login failed.');
    let identity;
    try {
      const { tokens } = await this.google.getToken({
        code: dto.code,
        codeVerifier: dto.flowVerifier,
        redirect_uri: redirectUri,
      });
      if (!tokens.id_token) throw new Error();
      // The official SDK verifies signature, issuer, audience and token lifetime.
      const ticket = await this.google.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });
      identity = ticket.getPayload();
      if (
        typeof identity?.sub !== 'string' ||
        !identity.sub ||
        identity.sub.length > 255 ||
        typeof identity.email !== 'string' ||
        !isEmail(identity.email) ||
        identity.email_verified !== true ||
        identity.nonce !== digest(dto.state)
      )
        throw new Error();
    } catch {
      // Provider exceptions can contain codes, tokens or client credentials.
      throw new UnauthorizedException('Google login failed.');
    }
    const linked = await this.prisma.googleIdentity.findUnique({
      where: { subject: identity.sub },
      include: { user: { include: { role: true } } },
    });
    if (linked) return this.auth.createSession(linked.user);
    // Email is not a provider identity. Never attach Google to an existing User
    // on the strength of matching email, including case variants.
    const collision = await this.prisma.user.findFirst({
      where: { email: { equals: identity.email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (collision)
      throw new ConflictException(
        'Google account cannot be linked. Use the existing sign-in method.',
      );
    const role = await this.roles.findRequiredByName('USER');
    const user = await this.prisma.user
      .create({
        data: {
          email: identity.email,
          username: `google_${createHash('sha256').update(identity.sub).digest('hex')}`,
          emailVerified: true,
          roleId: role.id,
          googleIdentity: { create: { subject: identity.sub } },
        },
        include: { role: true },
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Google account cannot be linked. Use the existing sign-in method.',
          );
        }
        throw error;
      });
    return this.auth.createSession(user);
  }
}
