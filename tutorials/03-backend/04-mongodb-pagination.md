# MongoDB, Records, Indexes, and Cursor Pagination

Prerequisites:

- [Data model, rules, and security boundaries](../01-domain/02-data-and-rules.md)
- [Contracts, schemas, adapters, and dependency inversion](../02-architecture/02-contracts-and-adapters.md)

## MongoDB Concepts

MongoDB is a document database.

- A **database** contains collections.
- A **collection** contains documents.
- A **document** is a structured record similar to a JavaScript object.
- `_id` is the primary identity field; this repository uses MongoDB `ObjectId`.
- A **query** selects matching documents.
- An **index** accelerates queries and may enforce uniqueness.

[`MongoStore`](../../apps/api/src/services/mongo-store.ts) owns all MongoDB-specific behavior.

## Application Records Versus Database Documents

The application wants portable records:

- IDs as strings;
- timestamps as ISO strings.

MongoDB naturally uses:

- `_id: ObjectId`;
- timestamps as `Date`.

Adapter functions `toUserRecord` and `toImageRecord` translate documents into application records. This keeps MongoDB types out of routes and the frontend.

## Initialization and Indexes

`MongoStore.init()`:

1. connects the client;
2. selects the database;
3. selects `users` and `images` collections;
4. creates indexes.

Indexes:

```text
users:  email ascending, unique
images: createdAt descending + _id descending
images: ownerId ascending + createdAt descending
```

The email index enforces the business rule. Image indexes support newest-first public listing and owner listing.

Indexes improve reads and constraints but consume storage and make writes slightly more expensive.

## ObjectId Validation

Routes accept IDs as strings. Before constructing `new ObjectId(id)`, the store calls `ObjectId.isValid(id)`. Invalid strings return not-found behavior instead of throwing a database-format error.

This is an example of an adapter translating vendor constraints into application semantics.

## Create, Read, Update, Delete

The common data operations are called CRUD:

- **Create:** `insertOne`;
- **Read:** `findOne` or `find`;
- **Update:** `findOneAndUpdate`;
- **Delete:** `deleteOne`.

For updates, `$set` changes supplied fields and `returnDocument: "after"` asks MongoDB to return the updated document.

## Why Pagination Exists

Returning every public image would become slow and memory-heavy as the gallery grows. Pagination returns one bounded page plus information needed to request the next page.

The API accepts `limit` from 1 to 50 and an optional cursor. It defaults to 20.

## Cursor Pagination

This repository sorts images newest-first by:

```text
createdAt descending, then ID descending
```

Two images can share the same timestamp, so ID is the tie-breaker.

The cursor contains the last returned image's `createdAt` and `id`. [`cursor.ts`](../../apps/api/src/services/cursor.ts) JSON-serializes that pair and Base64URL-encodes it.

For the next page, MongoDB selects documents that are:

- older than the cursor timestamp; or
- at the same timestamp with a lower ID.

```mermaid
flowchart LR
    Page1["Page 1: newest 20"] --> Cursor["cursor from item 20"]
    Cursor --> Filter["older date OR same date + lower ID"]
    Filter --> Page2["Page 2"]
```

The store requests `limit + 1` documents. If the extra document exists, another page is available. It returns only `limit` items and creates `nextCursor`.

## Why Not Offset Pagination?

Offset pagination uses “skip 20, take 20.” It is intuitive, but:

- large offsets can become expensive;
- newly inserted items can shift results, causing duplicates or omissions.

Cursor pagination is stable and efficient for a newest-first feed. Its tradeoff is that users cannot easily jump directly to page 50.

## MemoryStore Equivalence

[`MemoryStore`](../../apps/api/src/services/memory-store.ts) implements the same ordering and cursor semantics using Maps and arrays.

It is useful for tests and local experiments but:

- loses data on restart;
- does not model all MongoDB concurrency behavior;
- does not prove MongoDB queries and indexes are correct.

That is why adapter-specific reasoning and external integration testing remain important.

## Current Frontend Limitation

The backend returns `nextCursor`, but the current gallery frontend requests only the first page and does not provide “load more” behavior. [Extension guide](../08-extension/01-extension-guide.md) explains how to add it safely.

## Alternatives

- Relational database such as PostgreSQL: stronger relational constraints and SQL, but a different adapter/query model.
- Offset pagination: simpler UI/page numbering, weaker feed behavior at scale.
- Store dates as strings in MongoDB: avoids conversion, but native `Date` types are better for date queries and indexing.
