# JavaScript and TypeScript from Zero

Prerequisite: [How web applications work](01-how-web-apps-work.md).

JavaScript is the programming language executed by browsers and Node.js. TypeScript adds a static type system to JavaScript. Most repository source files use TypeScript: `.ts` for ordinary modules and `.tsx` for React modules containing JSX.

## Values, Variables, Objects, and Arrays

A value may be text, a number, a Boolean, `null`, an object, an array, or a function.

```ts
const title = "Morning Lake";
const bytes = 400;
const published = true;
const description = null;
const image = { title, bytes };
const images = [image];
```

`const` creates a binding that cannot be reassigned. The object it refers to may still be mutable. `let` creates a binding that may be reassigned.

An object groups named properties. An array stores an ordered sequence. `image.title` reads a property. `images[0]` reads the first array item.

## Functions and Arrow Functions

A function is reusable behavior:

```ts
function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
```

`value: string` says the input must be text. The function returns normalized text.

An arrow function is a shorter function expression:

```ts
const titles = images.map((image) => image.title);
```

`map` calls the arrow function once per item and produces a new array. The repository also uses:

- `filter` to keep matching items;
- `find` or lookup methods to locate an item;
- `sort` to order items;
- `at(-1)` to read the last item.

## TypeScript Types and Interfaces

A type describes allowed values before the program runs:

```ts
interface UploadImageInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}
```

This interface says an upload input must have those three properties with those types. It does not create a runtime object. TypeScript erases types during compilation.

Important syntax:

- `value?: string`: optional property; it may be absent.
- `string | null`: union; it may be text or `null`.
- `Promise<UserRecord>`: asynchronous work that eventually produces a user.
- `Record<string, string>`: object whose keys and values are strings.
- `type A = B`: gives a type another name.
- `as const`: asks TypeScript to preserve exact literal values.
- `import type`: imports type information only.
- `<T>`: a generic type parameter, explained below.

Types prevent many mistakes, but runtime data is still untrusted. That is why the repository also uses TypeBox and Zod validation.

## Generics

A **generic** describes behavior that works with several types while preserving information about which type is used.

```ts
export async function apiFetch<T>(path: string): Promise<T>
```

`T` is a placeholder. Calling `apiFetch<ImageListResponse>` tells TypeScript that this request should produce an `ImageListResponse`.

Generics help the editor and compiler, but they do not validate a server response at runtime.

## Modules, Imports, and Exports

Each source file is a module. `export` makes a value available to other modules:

```ts
export const sessionCookieName = "am_session";
```

Another file imports it:

```ts
import { sessionCookieName } from "./http/cookies.js";
```

The repository uses ECMAScript modules because each package has `"type": "module"`. Backend TypeScript source imports local files with `.js` endings because the compiled output is JavaScript and Node's `NodeNext` resolution follows the eventual runtime path.

## Asynchronous Work, Promises, and `await`

Network, database, password hashing, and file operations take time. JavaScript represents future completion with a **Promise**.

```ts
const user = await app.store.findUserByEmail(email);
```

`await` pauses this async function until the promise settles, without blocking the whole Node.js process. An `async` function always returns a promise.

Errors reject promises. `try`/`catch` handles them:

```ts
try {
  await app.imageStorage.delete(publicId);
} catch (error) {
  request.log.error({ err: error }, "Image delete storage failure");
}
```

## Classes and Interfaces

An interface defines a contract:

```ts
interface ImageStorage {
  upload(input: UploadImageInput): Promise<UploadedImage>;
  delete(publicId: string): Promise<void>;
}
```

A class provides an implementation:

```ts
class CloudinaryImageStorage implements ImageStorage {
  // methods satisfy the interface
}
```

The repository can swap `CloudinaryImageStorage` for `FakeImageStorage` because both satisfy the same contract. Read [Contracts, schemas, adapters, and dependency inversion](../02-architecture/02-contracts-and-adapters.md).

## Object Spread and Conditional Spread

Object spread copies properties:

```ts
const updated = { ...image, ...input, updatedAt: new Date().toISOString() };
```

Later properties overwrite earlier properties with the same name.

Conditional spread builds an update object only from supplied values:

```ts
{
  ...(body.title !== undefined ? { title: body.title.trim() } : {})
}
```

If `title` was supplied, the small `{ title: ... }` object is spread in. Otherwise, the empty object adds nothing.

## Destructuring, Optional Chaining, and Nullish Coalescing

```ts
const { locale } = useParams();
const saved = value?.trim();
const title = input.title ?? "Untitled";
```

- destructuring extracts properties;
- `?.` stops safely if the left side is `null` or `undefined`;
- `??` uses the right side only when the left side is `null` or `undefined`.

## JSX and React Components

JSX looks like HTML inside TypeScript:

```tsx
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}
```

It compiles into JavaScript calls that describe UI elements. `{name}` switches from markup into a JavaScript expression. A React component is a function that returns this description.

## Important Runtime Versus Compile-Time Distinction

TypeScript checks code before it runs. TypeBox and Zod check values while the program runs.

Examples:

- `type RegisterBody` helps developers write correct code.
- `RegisterBodySchema` rejects an invalid HTTP request.
- a Zod schema rejects an invalid browser form before submission.

See [Validation, OpenAPI, errors, and configuration](../03-backend/05-contracts-errors-config.md).

## Alternatives

The repository could use plain JavaScript, but would lose static checks and editor guidance. It could use another language for the backend, but sharing TypeBox types between frontend and backend would be less direct. TypeScript does add compilation complexity and can create false confidence if runtime validation is omitted.

## Check Your Understanding

Before continuing, explain:

1. Why `Promise<UserRecord>` is different from `UserRecord`.
2. Why an interface does not validate incoming JSON.
3. What `...input` does inside an object.
4. Why local backend imports end with `.js` even though source files end with `.ts`.
