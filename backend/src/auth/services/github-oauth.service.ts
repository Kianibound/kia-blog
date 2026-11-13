import {
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { GithubCallbackDto } from '../dto/github-oauth.dto';
import { AuthService } from '../auth.service';
import { RolesService } from '../../roles/roles.service';
import { isEmail } from 'class-validator';
import { Prisma } from '../../generated/prisma/client';

export const GITHUB_FETCH = Symbol('GITHUB_FETCH');
const digest = (value: string) =>
  createHash('sha256').update(value).digest('base64url');
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

@Injectable()
export class GithubOAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(GITHUB_FETCH) private readonly fetch: typeof globalThis.fetch,
    private readonly auth: AuthService,
    private readonly roles: RolesService,
  ) {}

  private configuration() {
    const clientId = this.config.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.config.get<string>('GITHUB_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GITHUB_REDIRECT_URI');
    try {
      const url = new URL(redirectUri ?? '');
      if (
        !clientId ||
        !clientSecret ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== '/auth/github/callback' ||
        (url.protocol !== 'https:' &&
          !(
            url.protocol === 'http:' &&
            url.hostname === 'localhost' &&
            this.config.get('NODE_ENV') !== 'production'
          ))
      )
        throw new Error();
    } catch {
      throw new ServiceUnavailableException('GitHub login is not configured.');
    }
    return {
      clientId: clientId!,
      clientSecret: clientSecret!,
      redirectUri: redirectUri!,
    };
  }

  async initiate() {
    const { clientId, redirectUri } = this.configuration();
    const state = randomBytes(32).toString('base64url');
    const flowVerifier = randomBytes(32).toString('base64url');
    await this.prisma.githubOAuthState.create({
      data: {
        stateHash: digest(state),
        verifierHash: digest(flowVerifier),
        expiresAt: new Date(Date.now() + 600_000),
      },
    });
    const url = new URL('https://github.com/login/oauth/authorize');
    url.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state,
      code_challenge: digest(flowVerifier),
      code_challenge_method: 'S256',
    }).toString();
    return { authorizationUrl: url.toString(), flowVerifier, expiresIn: 600 };
  }

  async callback(dto: GithubCallbackDto) {
    const { clientId, clientSecret, redirectUri } = this.configuration();
    const consumed = await this.prisma.githubOAuthState.updateMany({
      where: {
        stateHash: digest(dto.state),
        verifierHash: digest(dto.flowVerifier),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1)
      throw new UnauthorizedException('Invalid or expired GitHub login state.');
    if (dto.error || !dto.code)
      throw new UnauthorizedException('GitHub login failed.');
    let subject: string;
    let accessToken: string;
    try {
      const tokens = await this.requestJson(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code: dto.code,
            code_verifier: dto.flowVerifier,
          }),
        },
      );
      if (
        !isRecord(tokens) ||
        tokens.error ||
        typeof tokens.access_token !== 'string' ||
        !tokens.access_token ||
        typeof tokens.token_type !== 'string' ||
        tokens.token_type.toLowerCase() !== 'bearer'
      )
        throw new Error();
      accessToken = tokens.access_token;
      // Revalidate the identity at GitHub on every login. Login/email are mutable.
      const profile = await this.requestJson('https://api.github.com/user', {
        headers: this.apiHeaders(tokens.access_token),
      });
      if (
        !isRecord(profile) ||
        !Number.isSafeInteger(profile.id) ||
        Number(profile.id) <= 0
      )
        throw new Error();
      subject = String(profile.id);
    } catch {
      // Never expose fetch errors or provider response details/credentials.
      throw new UnauthorizedException('GitHub login failed.');
    }
    const linked = await this.prisma.githubIdentity.findUnique({
      where: { subject },
      include: { user: { include: { role: true } } },
    });
    if (linked) return this.auth.createSession(linked.user);
    let email: string;
    try {
      email = await this.verifiedPrimaryEmail(accessToken);
    } catch {
      throw new UnauthorizedException(
        'GitHub login failed. A verified primary email is required for registration.',
      );
    }
    // A matching email never proves that this subject owns an existing account.
    const collision = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (collision)
      throw new ConflictException(
        'GitHub account cannot be linked. Use the existing sign-in method.',
      );
    const role = await this.roles.findRequiredByName('USER');
    const user = await this.prisma.user
      .create({
        data: {
          email,
          emailVerified: true,
          roleId: role.id,
          username: `github_${createHash('sha256').update(subject).digest('hex')}`,
          githubIdentity: { create: { subject } },
        },
        include: { role: true },
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'GitHub account cannot be linked. Use the existing sign-in method.',
          );
        }
        throw error;
      });
    return this.auth.createSession(user);
  }

  private async verifiedPrimaryEmail(token: string): Promise<string> {
    // Bound provider work and construct page URLs locally; never follow supplied links.
    for (let page = 1; page <= 10; page++) {
      const emails = await this.requestJson(
        `https://api.github.com/user/emails?per_page=100&page=${page}`,
        { headers: this.apiHeaders(token) },
      );
      if (!Array.isArray(emails) || emails.length > 100) throw new Error();
      const primary = emails.filter(
        (entry: unknown) => isRecord(entry) && entry.primary === true,
      );
      if (primary.length > 1) throw new Error();
      if (primary.length === 1) {
        const entry: unknown = primary[0];
        if (
          !isRecord(entry) ||
          entry.verified !== true ||
          typeof entry.email !== 'string' ||
          !isEmail(entry.email)
        )
          throw new Error();
        return entry.email;
      }
      if (emails.length < 100) break;
    }
    throw new Error();
  }

  private async requestJson(
    url: string,
    options: RequestInit,
  ): Promise<unknown> {
    const response = await this.fetch(url, {
      ...options,
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error();
    return response.json();
  }

  private apiHeaders(token: string) {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Kia-Blog',
      'X-GitHub-Api-Version': '2026-03-10',
    };
  }
}
