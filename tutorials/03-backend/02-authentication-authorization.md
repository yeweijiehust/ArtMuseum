# Authentication and Authorization

Prerequisites:

- [Data model, rules, and security boundaries](../01-domain/02-data-and-rules.md)
- [Fastify application factory and plugins](01-fastify-application.md)

## The Two Questions

**Authentication** asks: who is making this request?

**Authorization** asks: may that person perform this action?

This repository authenticates with a cookie-backed JWT and authorizes image changes through ownership checks.

## Registration

The registration route in [`auth.ts`](../../apps/api/src/routes/auth.ts):

1. receives a schema-validated body;
2. normalizes email with `trim().toLowerCase()`;
3. trims display name;
4. performs an additional email-format check;
5. hashes the password with Argon2;
6. asks the store to create the user;
7. converts the internal record to a public record;
8. signs a JWT whose `sub` claim is the user ID;
9. sets the session cookie;
10. returns `201`.

### Why hash passwords?

A password hash is a one-way, deliberately expensive transformation. The server verifies a password without storing the original password.

Argon2 is designed for password hashing. A fast general-purpose hash would make stolen hashes easier to guess at scale.

Never log, return, or store plaintext passwords.

## Duplicate Email Defense

The API normalizes email before storage so `Ada@example.com` and `ada@example.com` represent one identity.

MongoDB also has a unique email index. The route catches `DuplicateEmailError` and returns `409 EMAIL_EXISTS`.

Application-level “check then insert” alone would have a race condition: two requests could both observe no user before either inserts. The unique database index is the final concurrency-safe rule.

## Login

Login:

1. normalizes email;
2. retrieves a user;
3. runs `argon2.verify(storedHash, submittedPassword)`;
4. rejects missing users and wrong passwords with the same error;
5. signs and sets a session token on success.

Using the same `INVALID_CREDENTIALS` response avoids revealing whether a particular email exists.

## JWT Session Token

A **JWT** is a signed token containing claims. The code signs:

```ts
{ sub: user.id }
```

`sub` means subject: the identity the token refers to. Signing prevents a caller from changing the user ID without invalidating the token.

The JWT is not encryption. Anyone who obtains it may decode its claims, so sensitive data should not be placed inside. The server stores only the user ID.

## Session Cookie

[`cookies.ts`](../../apps/api/src/http/cookies.ts) configures:

- `httpOnly: true`: browser JavaScript cannot read it;
- `sameSite: "lax"`: reduces cross-site request risk while supporting normal navigation;
- `secure: true` in production: send only over HTTPS;
- `path: "/"`: available to all app paths;
- `maxAge`: two weeks.

`credentials: "include"` in frontend `apiFetch` ensures browser requests include cookies.

## Authentication Pre-handler

`app.authenticate` in [`app.ts`](../../apps/api/src/app.ts):

1. verifies the JWT from the cookie;
2. extracts `sub`;
3. asks the store whether the user still exists;
4. clears stale cookies when necessary;
5. assigns a safe public user to `request.currentUser`;
6. sends `401` on failure.

Protected routes declare `preHandler: app.authenticate`.

Checking that the user still exists means deleting a user would invalidate their existing token at the next request.

## Authorization Through Ownership

Patch and delete routes:

1. require authentication;
2. find the target image;
3. compare `image.ownerId` with `request.currentUser.id`;
4. send `403` if they differ;
5. perform the mutation only when they match.

The frontend's “My uploads” page is not the security boundary. A malicious caller can submit a direct PATCH request; therefore the API performs ownership checks.

## Logout

Logout clears the cookie and returns `204`. JWTs are otherwise stateless: there is no server-side session record or revocation list. A copied token remains valid until expiration unless additional revocation behavior is added.

## Security Limitations and Possible Extensions

Current V1 does not include:

- password reset;
- email verification;
- brute-force-specific login limits;
- JWT revocation;
- refresh tokens;
- administrator roles;
- multi-factor authentication.

For a higher-risk application, consider short-lived access tokens, revocation/session records, CSRF analysis, stronger rate limits, audit logs, and account recovery.

## Alternative Approaches

- Server-side sessions: store random session IDs in cookies and session data in a database. Easier revocation, but requires session persistence.
- OAuth/social login: avoids local password handling, but adds provider integration.
- Tokens in local storage: easy for frontend code, but more exposed to script injection; not used here.

## Real Trace

Continue with [Registration and login walkthrough](../05-walkthroughs/01-register-login.md).
