# Image Upload and Storage

Prerequisites:

- [How web applications work](../00-start-here/01-how-web-apps-work.md)
- [Contracts, schemas, adapters, and dependency inversion](../02-architecture/02-contracts-and-adapters.md)
- [Authentication and authorization](02-authentication-authorization.md)

## Why Uploads Are Different

Most API requests carry JSON text. An image upload carries binary bytes plus text fields. The browser uses `FormData`, and the HTTP body uses `multipart/form-data`.

A multipart body is divided by boundary markers into parts such as:

- `title`: text;
- `description`: text;
- `altText`: text;
- `file`: filename, MIME type, and bytes.

## Frontend Construction

[`UploadPage.tsx`](../../apps/web/src/pages/UploadPage.tsx) creates:

```ts
const data = new FormData();
data.append("title", values.title);
data.append("file", file);
upload.mutate(data);
```

The shared `apiFetch` deliberately does not set `Content-Type` for `FormData`. The browser must generate the header including its unique multipart boundary.

Manually setting only `multipart/form-data` would omit the boundary and break parsing.

## Fastify Multipart Configuration

[`app.ts`](../../apps/api/src/app.ts) registers multipart limits:

- maximum one file;
- maximum ten fields;
- maximum file size 10 MiB.

[`images.ts`](../../apps/api/src/routes/images.ts) also checks the resulting buffer size. Defense in depth ensures consistent application behavior around framework limit errors.

## Parsing the Upload

`parseUpload` uses an asynchronous iterator:

```ts
for await (const part of request.parts()) {
  // inspect each incoming multipart part
}
```

An **async iterator** produces values over time. File bytes may arrive in chunks rather than one large value.

For a file part, the code collects chunks into `Buffer[]` and then uses `Buffer.concat(chunks)`.

A `Buffer` is Node.js's representation of raw bytes. The current implementation buffers the entire file in memory before sending it to Cloudinary. This is simple and bounded at 10 MiB, but direct streaming would use less memory under concurrent uploads.

## Validation Sequence

The upload route checks:

1. authenticated current user;
2. file exists;
3. MIME type is in JPEG/PNG/WebP set;
4. title exists after trimming;
5. file remains within size limit.

It sanitizes optional text with length limits.

MIME type comes from the client and can be misleading. A stronger system could inspect magic bytes or let an image-processing library verify actual format.

## Image Storage Contract

[`image-storage.ts`](../../apps/api/src/services/image-storage.ts) defines:

```text
upload bytes -> public ID, secure URL, dimensions, format, size
delete public ID -> completion
```

The route needs those facts but does not need Cloudinary-specific syntax.

## Cloudinary Adapter

[`cloudinary-storage.ts`](../../apps/api/src/services/cloudinary-storage.ts) configures the SDK from explicit credentials or `CLOUDINARY_URL`.

Explicit `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` take priority. Credentials are trimmed to avoid signature failures caused by accidental whitespace.

Upload uses `cloudinary.uploader.upload_stream`:

1. create a Cloudinary upload stream;
2. wrap callback completion in a Promise;
3. call `stream.end(input.buffer)`;
4. map Cloudinary response to application `UploadedImage`.

The upload options:

- store under `artmuseum` folder;
- treat resource as image;
- derive readable names from original filename;
- keep names unique;
- do not overwrite.

`optimizedImageUrl` creates a delivery URL with automatic format and quality. Cloudinary can deliver a browser-appropriate format and compression level.

## Metadata Persistence

After Cloudinary succeeds, the route creates a database record containing:

- current user ownership;
- Cloudinary public ID;
- optimized secure URL;
- dimensions, format, and bytes;
- user-entered metadata.

The API returns a public image shape without the Cloudinary public ID.

## Failure Behavior

Storage or persistence errors inside the upload try block are logged and converted to `502 STORAGE_FAILURE`.

A `502` communicates that the API was reachable but a dependency involved in completing the request failed.

Current limitation: if Cloudinary succeeds and database creation fails, the Cloudinary asset may remain unused. Possible improvements:

- delete the uploaded asset as compensation;
- record upload operation states;
- schedule cleanup of unreferenced assets.

## Deletion

Delete performs:

1. authenticate;
2. find image;
3. authorize owner;
4. delete Cloudinary asset;
5. delete database metadata;
6. return `204`.

Cloudinary deletion comes first so metadata is not removed while the paid/external asset remains. The reverse failure is still possible: Cloudinary could delete successfully and MongoDB deletion could fail.

## Fake Storage

[`fake-storage.ts`](../../apps/api/src/services/fake-storage.ts) returns deterministic-shaped fake metadata and can simulate failure when the filename includes `fail-storage`.

This enables fast, credential-free tests of upload behavior and error mapping.

## Alternatives

- Browser uploads directly to signed Cloudinary endpoints: reduces API memory/bandwidth, but requires secure signing workflow and changes orchestration.
- Stream API upload directly to Cloudinary: lower memory use, but validation/error handling becomes more complex.
- Store local files: simple locally, unsuitable for ephemeral Render filesystem and distributed deployment.

## Real Trace

Continue with [Upload and gallery walkthrough](../05-walkthroughs/02-upload-gallery.md).
