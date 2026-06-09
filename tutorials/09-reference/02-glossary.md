# Glossary

Use this as a quick reference. Follow linked tutorials for full explanations.

| Term | Meaning in this repository |
| --- | --- |
| Adapter | Class translating an application contract to MongoDB, Cloudinary, memory, or fake behavior |
| API | Fastify HTTP interface under `/api/*` |
| API contract | Agreed paths, methods, schemas, statuses, and errors |
| Application factory | `createApp()` function that constructs Fastify without listening |
| Authentication | Proving which user is making a request |
| Authorization | Deciding whether that user may perform an action |
| Base64URL | URL-safe encoding used to make pagination cursor text |
| Buffer | Node.js representation of raw bytes used for uploads |
| Build | Convert TypeScript/source assets into production output |
| CI | GitHub Actions verification on pushes and pull requests |
| Cloudinary | External image storage, transformation, and delivery service |
| Collection | MongoDB group of documents |
| Component | React function that returns UI description |
| Composition root | `app.ts`, where concrete dependencies are selected and wired |
| Cookie | Browser-stored value automatically sent with matching requests |
| CRUD | Create, read, update, delete operations |
| Cursor pagination | Page continuation based on the last item's ordered values |
| Database | Durable structured data store; MongoDB here |
| Dependency | External or workspace package used by code |
| Dependency inversion | Business code depends on interfaces rather than vendors |
| Document | MongoDB stored record |
| Domain | Product problem area: gallery, users, images, ownership |
| Environment variable | Runtime configuration supplied outside source code |
| Fastify | Node.js web framework used by the API |
| FormData | Browser structure for multipart text/file submission |
| Hook | Function run at a lifecycle point, such as authentication pre-handler |
| HTTP | Protocol used by browser and API |
| Hydration | Not used here; this is a client-rendered Vite SPA |
| i18n | Internationalization; English/Chinese application text |
| Idempotency | Ability to retry an operation without unintended duplicate effects |
| Index | Database structure speeding queries or enforcing uniqueness |
| Interface | TypeScript contract describing required members |
| JSON | Text format used for most API request/response data |
| JWT | Signed token placed in session cookie |
| Lightbox | Modal-style enlarged image viewer |
| Locale | Active language route value, `en` or `zh` |
| Metadata | Information describing an image rather than its bytes |
| MIME type | Declared media format such as `image/jpeg` |
| Module | Source file with imports/exports |
| Monorepo | One Git repository containing several packages/apps |
| MongoDB | Production metadata database |
| Multipart | HTTP body format carrying files and text fields |
| Mutation | Frontend operation that changes server state |
| ObjectId | MongoDB's ID type |
| OpenAPI | Machine-readable API description generated from route schemas |
| Ownership | Relationship deciding who may edit/delete an image |
| Package | Directory with a `package.json` |
| Plugin | Fastify extension adding behavior/routes/hooks |
| PNPM | Package manager and workspace tool |
| Promise | JavaScript representation of future async completion |
| Provider | React component making shared capability available below |
| Proxy | Vite forwarding `/api` development requests to Fastify |
| Query key | TanStack Query cache identity such as `["images"]` |
| React | Frontend component rendering library |
| Render | Production hosting platform |
| Response serialization | Convert handler value into HTTP response data |
| Route | Method/path mapped to backend handler or frontend component |
| Runtime validation | Check actual values while program executes |
| Schema | Machine-readable allowed data shape |
| Server state | Backend-owned data cached/displayed in frontend |
| Session | Continuing authenticated relationship across requests |
| SPA | Single-page application; React handles frontend navigation |
| Swagger UI | Interactive rendering of OpenAPI at `/api/docs` |
| TanStack Query | Frontend server-state/caching library |
| TypeBox | Runtime schema library used by shared/API contracts |
| TypeScript | JavaScript plus compile-time static types |
| Vite | Frontend dev server and bundler |
| Vitest | TypeScript test runner |
| Workspace | PNPM-managed package inside the monorepo |
| Zod | Runtime frontend form-validation library |

Return to the [learning roadmap](../README.md) when a term needs deeper context.
