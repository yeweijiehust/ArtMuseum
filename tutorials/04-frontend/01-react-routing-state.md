# React, Routing, Server State, and API Calls

Prerequisites:

- [JavaScript and TypeScript from zero](../00-start-here/02-javascript-typescript.md)
- [HTTP request lifecycle and data flow](../02-architecture/03-request-lifecycle.md)

## What React Does

React turns application state into a user interface. A React **component** is a function that returns JSX. When relevant state changes, React calls components again and updates the browser DOM.

The browser entry point [`main.tsx`](../../apps/web/src/main.tsx):

1. finds `<div id="root">` from `index.html`;
2. creates a React root;
3. renders `<App />`;
4. imports translations and CSS.

`React.StrictMode` helps reveal unsafe component behavior during development.

## Providers

A **provider** makes shared capabilities available to descendant components.

[`App.tsx`](../../apps/web/src/App.tsx) wraps the application with:

- `QueryClientProvider`: TanStack Query cache and operations;
- `BrowserRouter`: routing based on browser URL.

This avoids manually passing these services through every component.

## React Router

Routes map browser paths to components:

```text
/                 -> choose preferred locale
/:locale          -> locale layout + gallery
/:locale/login    -> login page
/:locale/register -> registration page
/:locale/upload   -> protected upload page
/:locale/mine     -> protected management page
*                 -> redirect to /en
```

`:locale` is a dynamic path parameter. `useParams()` reads it.

`LocaleLayout` validates the locale, updates i18next, stores preference in local storage, renders the shared header, and places the child route at `<Outlet />`.

## Preferred Locale and Route Preservation

At `/`, `getPreferredLocale()` chooses:

1. saved `artmuseum.locale`;
2. Chinese when browser language begins with `zh`;
3. English fallback.

`switchLocalePath` replaces only the leading locale segment. Switching from `/en/login` therefore navigates to `/zh/login`, preserving the user's current task.

The locale is in the URL so links are shareable and back/forward navigation remains meaningful.

## Protected Routes

`RequireAuth` calls `useMe()`:

- while loading, show a loading state;
- if no user, redirect to locale-specific login;
- if user exists, render children.

This improves navigation but does not secure the API. Backend authentication remains mandatory.

## Local State

`useState` stores component-local state:

```ts
const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
```

The gallery uses it to track which image is open in the lightbox. This state is temporary and does not belong on the server.

## Effects

`useEffect` synchronizes a component with something outside React.

Examples:

- `LocaleLayout` updates local storage and i18next after locale changes.
- `Lightbox` attaches a global Escape-key listener and removes it during cleanup.

The cleanup function prevents duplicate listeners and leaks:

```ts
return () => window.removeEventListener("keydown", handleKeydown);
```

## Server State and TanStack Query

**Server state** is data owned by the backend but displayed in the browser. It has loading, error, caching, and staleness concerns.

TanStack Query manages this state:

```ts
const images = useQuery({
  queryKey: ["images"],
  queryFn: api.listImages
});
```

- `queryKey` identifies cached data;
- `queryFn` fetches it;
- result exposes `isLoading`, `isError`, and `data`.

`useMutation` handles operations that change server state, such as login, upload, update, and delete.

After a mutation, queries are invalidated so the UI fetches current server truth.

## API Client

[`api.ts`](../../apps/web/src/api.ts) centralizes HTTP behavior.

`apiFetch<T>`:

1. calls browser `fetch`;
2. includes cookies;
3. sets JSON content type unless body is `FormData`;
4. handles `204`;
5. parses JSON;
6. throws `ApiClientError` on failure;
7. returns typed success data.

Centralization prevents each page from implementing subtly different network/error behavior.

## Render Props and Conditional Rendering

JSX uses JavaScript expressions:

```tsx
{images.isLoading ? <p>Loading</p> : null}
{images.data ? <GalleryGrid images={images.data.items} /> : null}
```

This is conditional rendering. The ternary operator chooses one value based on a Boolean condition.

Components receive **props**, which are function inputs. `GalleryGrid` receives images and an `onSelect` callback. The child does not own lightbox state; it informs the parent when selection occurs.

## Alternatives

- Redux could manage state globally, but TanStack Query plus local state is sufficient here.
- A framework such as Next.js could add server rendering and file-based routing, but would change the simple Fastify/Vite architecture.
- Plain DOM JavaScript could avoid React dependencies, but complex state transitions and reusable components would require more manual coordination.

## Next Step

Read [Forms, bilingual UI, accessibility, and responsive layout](02-forms-i18n-responsive.md).
