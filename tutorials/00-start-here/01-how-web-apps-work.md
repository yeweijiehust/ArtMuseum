# How Web Applications Work

This chapter supplies the foundation for every later tutorial. It explains what a browser, server, HTTP request, API, cookie, database, and image storage service are.

## The Browser and the Server

A **browser** is an application such as Chrome or Firefox. It displays HTML, applies CSS, and executes JavaScript. In this repository, the browser executes the React application from [`apps/web`](../../apps/web).

A **server** is a program that waits for network requests and sends responses. In this repository, the Fastify application in [`apps/api`](../../apps/api) is the server.

The browser and server are separate programs, even when both run on your computer. They communicate through **HTTP**.

## HTTP Requests and Responses

An HTTP request contains:

- a **method**, describing the intended action;
- a **path**, identifying a resource or operation;
- headers, carrying metadata;
- sometimes a body, carrying data.

An HTTP response contains:

- a numeric **status code**;
- headers;
- sometimes a body.

Examples from this repository:

| Purpose | Method | Path | Typical status |
| --- | --- | --- | --- |
| Read public images | `GET` | `/api/images` | `200` |
| Register | `POST` | `/api/auth/register` | `201` |
| Edit an image | `PATCH` | `/api/images/:id` | `200` |
| Delete an image | `DELETE` | `/api/images/:id` | `204` |

Common status codes:

- `200 OK`: the request succeeded and has a response body.
- `201 Created`: a new resource was created.
- `204 No Content`: the request succeeded without a response body.
- `400 Bad Request`: the supplied data was invalid.
- `401 Unauthorized`: the user is not logged in.
- `403 Forbidden`: the user is known but may not perform the action.
- `404 Not Found`: the resource or route does not exist.
- `502 Bad Gateway`: an external service failed.

An **API** is a defined way for programs to communicate. The paths above form this repository's HTTP API. The API is documented automatically at `/api/docs` when Swagger UI is enabled.

## JSON and Serialization

**JSON** is a text format for structured data. A JavaScript object:

```ts
{ user: { id: "123", displayName: "Ada" } }
```

can cross the network as JSON text:

```json
{"user":{"id":"123","displayName":"Ada"}}
```

Converting an in-memory value into transportable text is called **serialization**. Fastify serializes route return values. The browser's `response.json()` parses JSON text back into a JavaScript value.

Image uploads are different. They use **multipart form data**, which can carry both text fields and binary file bytes in one request. See [Image upload and storage](../03-backend/03-image-upload-storage.md).

## URLs, Routes, and Resources

A URL such as `https://artmuseum-w9mm.onrender.com/zh` has:

- `https`: the protocol;
- `artmuseum-w9mm.onrender.com`: the host;
- `/zh`: the path.

This application has two kinds of routes:

- frontend routes such as `/en/login`, interpreted by React Router;
- API routes such as `/api/auth/login`, interpreted by Fastify.

In production, Fastify serves the React application's `index.html` for non-API paths. React Router then decides which page to show. Read [Architecture and repository map](../02-architecture/01-system-map.md) after completing the prerequisites.

## Cookies, Sessions, and Authentication

A **cookie** is a small value that a server asks a browser to store. The browser can automatically send it with later requests to the same site.

After registration or login, the API creates a signed JSON Web Token and places it in an `am_session` cookie. This is how later requests prove who the user is.

The cookie is `httpOnly`, so frontend JavaScript cannot read it. That reduces damage from certain script-injection attacks. It is `secure` in production, so browsers send it only over HTTPS.

Authentication answers **who are you?** Authorization answers **may you do this?** These are separate checks. Read [Authentication and authorization](../03-backend/02-authentication-authorization.md).

## Databases and Object Storage

A **database** stores structured records that the application needs to query. MongoDB stores:

- user records;
- image metadata such as title, owner, URL, dimensions, and dates.

The image file itself can be large and needs specialized delivery. Cloudinary is an **object/media storage service** that stores the bytes and delivers optimized image URLs.

This separation means MongoDB answers questions such as “which images belong to this user?” while Cloudinary answers “give the browser the actual image.”

## Frontend and Backend Responsibilities

The frontend:

- renders pages and controls;
- collects user input;
- validates obvious form mistakes;
- sends API requests;
- translates stable API error codes.

The backend:

- treats every request as untrusted;
- validates again;
- authenticates and authorizes;
- stores durable data;
- protects secrets;
- talks to MongoDB and Cloudinary.

Client-side validation improves usability, but it is never a security boundary because a caller can bypass the UI and call the API directly.

## Development and Production

During development:

- Vite serves the React app on port `5173`;
- Fastify serves the API on port `3000`;
- Vite proxies `/api` requests to Fastify.

In production:

- Vite compiles static frontend files;
- Fastify serves those files and the API from one process;
- Render exposes that process on the internet.

This arrangement is explained in [Build, CI, deployment, and production](../07-operations/01-build-ci-deploy.md).

## Check Your Understanding

You are ready to continue when you can answer:

1. Why can frontend and backend routes share one domain?
2. Why does an upload use multipart data rather than JSON?
3. Why are image bytes stored in Cloudinary while metadata is stored in MongoDB?
4. What is the difference between `401` and `403`?
