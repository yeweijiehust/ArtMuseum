# Domain Concepts and User Journeys

Prerequisite: complete the [start-here sequence](../README.md#stage-0-learn-the-prerequisites).

A **domain** is the real-world problem area represented by software. Before studying frameworks, identify the people, objects, actions, and rules that matter to the product.

## Product Purpose

Art Museum is a public photography gallery with lightweight creator accounts. Its core value is not merely “storing files.” It connects an uploaded photograph with presentation metadata, a visible owner, a bilingual browsing experience, and ownership-based management.

## Actors

An **actor** is a person or external system interacting with the application.

| Actor | What they can do |
| --- | --- |
| Visitor | Browse public images, open the lightbox, change language, register, log in |
| Authenticated user | Everything a visitor can do, plus upload and manage their own images |
| Image owner | Edit metadata and delete an image they uploaded |
| MongoDB | Persist users and image metadata |
| Cloudinary | Persist and deliver image bytes |
| Render | Run the production server |

“Authenticated user” and “image owner” are different roles. A logged-in user is not necessarily the owner of a particular image.

## Core Business Concepts

### Public gallery

**What it is:** a browsable collection of images visible without login.

**Why it exists:** discovery is the primary public experience.

**How it appears:** the gallery route fetches `GET /api/images`, renders responsive columns, and opens selected images in a lightbox.

**Where implemented:**

- [`GalleryPage.tsx`](../../apps/web/src/pages/GalleryPage.tsx)
- [`GalleryGrid.tsx`](../../apps/web/src/components/GalleryGrid.tsx)
- public listing route in [`images.ts`](../../apps/api/src/routes/images.ts)

### Photography work

**What it is:** an image file plus metadata and ownership.

**Why it exists:** a file alone cannot provide a title, accessible alternative text, attribution, or management rules.

**How it appears:** an `ImageRecord` contains Cloudinary identity, delivery URL, dimensions, title, owner, optional description, optional alt text, and timestamps.

**Where implemented:** [`store.ts`](../../apps/api/src/services/store.ts).

### Account

**What it is:** a user identity represented by email, display name, password hash, and dates.

**Why it exists:** uploads need a durable owner, and management actions need identity.

**How it appears:** registration creates a user and immediately creates a session; login verifies the password and creates a session.

**Where implemented:** [`auth.ts`](../../apps/api/src/routes/auth.ts).

### Session

**What it is:** the server-recognized state that connects later requests to a user.

**Why it exists:** HTTP requests are otherwise independent; the server needs proof of identity on each protected request.

**How it appears:** a JWT containing a user ID is stored in the `am_session` cookie.

**Where implemented:**

- [`cookies.ts`](../../apps/api/src/http/cookies.ts)
- authentication decoration in [`app.ts`](../../apps/api/src/app.ts)

### Ownership

**What it is:** the relationship between an image and the user who uploaded it.

**Why it exists:** public visibility must not imply public edit permission.

**How it appears:** every image has `ownerId`; patch and delete routes compare it with `request.currentUser.id`.

**Where implemented:** owner checks in [`images.ts`](../../apps/api/src/routes/images.ts).

### Metadata

**What it is:** information describing an image rather than the image bytes themselves.

**Why it exists:** titles and descriptions provide meaning; alt text supports people who cannot see the image; dimensions support display; Cloudinary identity supports deletion.

**Where implemented:** shared response schema in [`packages/shared/src/index.ts`](../../packages/shared/src/index.ts) and persisted record in [`store.ts`](../../apps/api/src/services/store.ts).

### Locale

**What it is:** a selected language/cultural presentation context. This repository supports `en` and `zh`.

**Why it exists:** system text should be usable in English and Chinese.

**How it appears:** locale is encoded in browser paths such as `/en/upload` and `/zh/upload`. User-created titles and descriptions are not translated.

**Where implemented:**

- shared locale list in [`packages/shared/src/index.ts`](../../packages/shared/src/index.ts)
- route handling in [`App.tsx`](../../apps/web/src/App.tsx)
- translations in [`apps/web/src/locales`](../../apps/web/src/locales)

## Main User Journeys

### Browse and inspect

1. A visitor opens `/en` or `/zh`.
2. The frontend requests public images.
3. The gallery arranges them into responsive masonry-style columns.
4. Clicking an image opens a lightbox.
5. Pressing Escape or the close button closes it.

### Register and remain logged in

1. A visitor enters display name, email, and password.
2. Frontend validation catches obvious mistakes.
3. The API validates again, normalizes the email, hashes the password, and creates the user.
4. The API sets a session cookie.
5. The header changes to authenticated controls.

### Upload

1. A logged-in user chooses a supported image and enters a title.
2. The browser sends multipart data.
3. The API checks authentication, file type, file size, and title.
4. Cloudinary stores the bytes.
5. MongoDB stores metadata with the Cloudinary result and owner.
6. The frontend refreshes gallery queries and navigates to “My uploads.”

### Manage an image

1. A user opens “My uploads.”
2. The frontend requests only that user's images.
3. Editing sends a `PATCH`; deletion sends a `DELETE`.
4. The backend independently checks ownership.

Detailed traces are in the [walkthroughs](../README.md#stage-5-trace-real-execution).

## Deliberate V1 Boundaries

The product does not currently include likes, private galleries, moderation, password reset, email verification, or administrator roles. Recognizing these absences matters: do not infer behavior that the code does not implement.

## Next Step

Read [Data model, rules, and security boundaries](02-data-and-rules.md) to turn these concepts into explicit invariants.
