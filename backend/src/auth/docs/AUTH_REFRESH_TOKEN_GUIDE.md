# Auth Refresh Token Guide

این فایل منطق `refresh()` در `AuthService` پروژه Kia Blog را توضیح می‌دهد.

## هدف Refresh Token چیست؟

Access Token عمر کوتاهی دارد، مثلاً 15 دقیقه.

اگر فقط Access Token داشته باشیم، کاربر بعد از منقضی شدن آن باید دوباره Login کند.

Refresh Token عمر بیشتری دارد و فقط برای گرفتن Access Token جدید استفاده می‌شود.

```text
Login
  ↓
Access Token (short-lived)
Refresh Token (long-lived)

Access Token expires
  ↓
POST /auth/refresh
  ↓
Validate Refresh Token
  ↓
New Access Token
```

Refresh Token برای دسترسی مستقیم به endpointهای protected استفاده نمی‌شود.

---

## Flow کامل متد refresh

```text
POST /auth/refresh
        ↓
Raw Refresh Token
        ↓
1. Verify JWT signature + expiration
        ↓
2. Extract payload.sub (userId)
        ↓
3. Find active RefreshToken records for user
        ↓
4. Compare raw token with stored hashes using Argon2
        ↓
5. Matching DB token exists?
       / \
     No   Yes
     ↓     ↓
   401   Create new Access Token
            ↓
       Return Access Token
```

دو نوع validation داریم:

```text
JWT Validation
+
Database Validation
```

JWT Validation می‌گوید:

> این Token توسط Backend ما امضا شده و expire نشده است.

Database Validation می‌گوید:

> این Token هنوز در سیستم فعال است و revoke نشده است.

این تفاوت بعداً برای Logout بسیار مهم است.

---

# متد refresh با کامنت

```ts
async refresh(dto: RefreshTokenDto) {
  // Payloadی که بعد از verify کردن JWT می‌گیریم.
  let payload: JwtPayload;

  try {
    // بررسی می‌کند:
    // 1. JWT با JWT_REFRESH_SECRET امضا شده باشد.
    // 2. Token منقضی نشده باشد.
    payload = await this.jwtService.verifyAsync<JwtPayload>(
      dto.refreshToken,
      {
        secret: this.configService.getOrThrow<string>(
          'JWT_REFRESH_SECRET',
        ),
      },
    );
  } catch {
    // Token جعلی، خراب یا expire شده است.
    throw new UnauthorizedException(
      'Invalid or expired refresh token.',
    );
  }

  // Refresh Tokenهای فعال این User را از DB می‌گیریم.
  const tokens = await this.prisma.refreshToken.findMany({
    where: {
      // sub همان User ID است.
      userId: payload.sub,

      // Token قبلاً logout/revoke نشده باشد.
      revokedAt: null,

      // تاریخ انقضا هنوز نرسیده باشد.
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  // چون در DB فقط hash ذخیره شده،
  // باید raw token ورودی را با hashهای موجود verify کنیم.
  const matchingToken = await Promise.all(
    tokens.map(async (token) => ({
      token,

      // true یعنی raw refresh token با این hash مطابقت دارد.
      matches: await argon2.verify(
        token.tokenHash,
        dto.refreshToken,
      ),
    })),
  );

  // اولین Token مطابق را پیدا می‌کنیم.
  const validToken = matchingToken.find(
    (item) => item.matches,
  );

  // JWT ممکن است از نظر signature معتبر باشد،
  // ولی اگر در DB Token فعال متناظر نداشته باشد، قبولش نمی‌کنیم.
  if (!validToken) {
    throw new UnauthorizedException(
      'Invalid or expired refresh token.',
    );
  }

  // Refresh Token معتبر است؛
  // حالا Access Token جدید صادر می‌کنیم.
  const accessToken = await this.jwtService.signAsync({
    sub: payload.sub,
    email: payload.email,
  });

  return {
    accessToken,
  };
}
```

---

# توضیح مرحله‌به‌مرحله

## 1. verifyAsync

```ts
payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
  secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
});
```

این مرحله بررسی می‌کند Refresh Token:

- امضای معتبر داشته باشد.
- با Refresh Secret ما ساخته شده باشد.
- expire نشده باشد.

اگر معتبر باشد، payload استخراج می‌شود.

نمونه:

```ts
{
  sub: 'USER_ID',
  email: 'user@example.com',
  iat: 1234567890,
  exp: 1234569999,
}
```

`sub` همان شناسه User است.

---

## 2. پیدا کردن Tokenهای فعال User

```ts
const tokens = await this.prisma.refreshToken.findMany({
  where: {
    userId: payload.sub,
    revokedAt: null,
    expiresAt: {
      gt: new Date(),
    },
  },
});
```

شرایط:

```text
userId = current user
revokedAt = null
expiresAt > now
```

`gt` در Prisma یعنی `greater than`.

---

## 3. چرا Refresh Token را مستقیم مقایسه نمی‌کنیم؟

Raw Refresh Token مثلاً:

```text
eyJhbGciOi...
```

ولی در Database:

```text
$argon2id$...
```

ذخیره شده است.

پس این اشتباه است:

```ts
token.tokenHash === dto.refreshToken;
```

باید از Argon2 استفاده کنیم:

```ts
await argon2.verify(token.tokenHash, dto.refreshToken);
```

---

## 4. map و Promise.all

```ts
const matchingToken = await Promise.all(
  tokens.map(async (token) => ({
    token,
    matches: await argon2.verify(token.tokenHash, dto.refreshToken),
  })),
);
```

`map()` هر Token را بررسی می‌کند. چون `argon2.verify()` async است، نتیجه هر iteration یک Promise است.

`Promise.all()` منتظر می‌ماند همه Promiseها تمام شوند و بعد نتایج واقعی را می‌دهد.

---

## 5. پیدا کردن Token معتبر

```ts
const validToken = matchingToken.find((item) => item.matches);
```

یعنی اولین موردی که `matches === true` است پیدا شود.

اگر نبود:

```ts
throw new UnauthorizedException('Invalid or expired refresh token.');
```

---

## 6. ساخت Access Token جدید

```ts
const accessToken = await this.jwtService.signAsync({
  sub: payload.sub,
  email: payload.email,
});
```

Refresh Token معتبر شده و Access Token جدید صادر می‌شود.

---

# چرا Refresh Token را hash می‌کنیم؟

Refresh Token عمر بیشتری نسبت به Access Token دارد. اگر Database لو برود، ذخیره raw token خطرناک است.

پس:

```text
Raw Refresh Token
       ↓
Argon2 Hash
       ↓
Database
```

مثل Password.

---

# ارتباط با Logout

بعداً برای Logout رکورد Refresh Token را revoke می‌کنیم:

```text
revokedAt = current time
```

در نتیجه حتی اگر raw token هنوز دست User باشد:

```text
JWT valid ✅
Database token revoked ❌
        ↓
401 Unauthorized
```

---

# خلاصه ذهنی

```text
Refresh Token Request
→ verify JWT
→ get userId
→ find active DB tokens
→ argon2.verify
→ issue new Access Token
```

و مهم‌ترین نکته:

```text
JWT valid ≠ Session valid
```

RefreshTokenPayload
→ فقط sub

refresh()
→ verify refresh token
→ payload.sub
→ load current user from DB
→ get current email
→ get current role
→ create new access token
