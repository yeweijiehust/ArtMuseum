# Node.js, Packages, PNPM, and Monorepos

Prerequisites:

- [How web applications work](01-how-web-apps-work.md)
- [JavaScript and TypeScript from zero](02-javascript-typescript.md)

## Node.js

Browsers execute JavaScript in a page. **Node.js** executes JavaScript outside a browser. That makes it suitable for servers, build tools, and tests.

This repository requires Node 24. Node runs:

- the Fastify API;
- Vite and TypeScript build tools;
- Vitest tests;
- ESLint.

The browser-only frontend cannot directly use Node APIs such as `node:fs`. The backend can. Conversely, the backend does not have browser globals such as `window` or `document`.

## Packages and `package.json`

A package is a directory with a `package.json` manifest. The manifest names the package, lists dependencies, and defines scripts.

The root [`package.json`](../../package.json) coordinates the whole repository. Each workspace has its own manifest:

- [`apps/api/package.json`](../../apps/api/package.json)
- [`apps/web/package.json`](../../apps/web/package.json)
- [`packages/shared/package.json`](../../packages/shared/package.json)

A **dependency** is reusable code supplied by another package. For example, the API depends on Fastify and the web app depends on React.

## PNPM

PNPM is the package manager. It installs dependencies, maintains the lockfile, links workspace packages, and runs scripts.

```powershell
pnpm install
```

reads all manifests and [`pnpm-lock.yaml`](../../pnpm-lock.yaml). The lockfile records exact resolved dependency versions so local machines and CI install the same graph.

Useful commands:

```powershell
pnpm build
pnpm --filter @artmuseum/api test
pnpm --filter @artmuseum/web dev
```

`--filter` selects one workspace package. Root scripts often run several filtered scripts in the required order.

## Monorepos and Workspaces

A **monorepo** stores several related packages in one Git repository. [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) declares:

```yaml
packages:
  - apps/*
  - packages/*
```

This repository has:

```text
apps/api       deployable backend application
apps/web       deployable/buildable frontend application
packages/shared shared contracts used by both
tests/api      external Python behavior tests
```

Benefits:

- one commit can change API and frontend together;
- shared schemas prevent contract drift;
- CI can verify the whole system;
- one lockfile controls dependency versions.

Costs:

- build order matters;
- package boundaries require care;
- a change can affect several workspaces.

The shared dependency uses `"@artmuseum/shared": "workspace:*"`. This tells PNPM to link the local workspace package instead of downloading a published package.

## Source, Compilation, and Build Output

Humans edit TypeScript source. Computers in production execute compiled JavaScript.

The TypeScript compiler reads a `tsconfig.json`. Important settings include:

- `strict`: enables stronger type checking;
- `target: ES2022`: selects JavaScript language features;
- `outDir: dist`: places compiled output in `dist`;
- `noUncheckedIndexedAccess`: makes uncertain indexing visible in types.

The frontend's Vite build bundles browser code and emits hashed assets such as `assets/index-ABC123.js`. The API's TypeScript build emits Node-compatible JavaScript.

The root build order is:

```text
shared -> web -> api
```

Shared builds first because the API package imports its compiled output. The frontend aliases shared source during its Vite build.

## Development Servers

`pnpm dev` currently starts the API's watch server. To work on the UI interactively, run the web dev server separately:

```powershell
pnpm --filter @artmuseum/api dev
pnpm --filter @artmuseum/web dev
```

Vite serves the web app on port `5173` and proxies `/api` to Fastify on port `3000`. A **proxy** forwards a request to another server, allowing the browser to act as though both are on one origin.

## Environment Variables

Environment variables are configuration values supplied outside source code. They keep secrets and deployment-specific values out of Git.

Examples:

- `MONGODB_URI`
- `CLOUDINARY_API_SECRET`
- `JWT_SECRET`
- `PORT`

[`apps/api/src/config.ts`](../../apps/api/src/config.ts) reads them through `process.env`. [`.env.example`](../../.env.example) documents expected names without containing real secrets.

Never commit a real `.env` file. [`.gitignore`](../../.gitignore) excludes it.

## Git and Continuous Integration

Git records snapshots called commits. GitHub hosts the remote repository. GitHub Actions runs the commands in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) after pushes and pull requests.

CI provides an independent check that the repository installs, lints, typechecks, tests, and builds outside one developer's machine.

## Alternatives

- npm and Yarn are alternative package managers.
- separate repositories could replace the monorepo, but shared changes would be harder to coordinate.
- a tool such as Turborepo or Nx could add caching and task orchestration; this small repository uses plain PNPM scripts because they are sufficient.

## Next Step

You now have the prerequisite vocabulary. Continue with [Domain concepts and user journeys](../01-domain/01-product-and-user-journeys.md) before studying architecture.
