# Forms, Bilingual UI, Accessibility, and Responsive Layout

Prerequisites:

- [React, routing, server state, and API calls](01-react-routing-state.md)
- [Domain concepts and user journeys](../01-domain/01-product-and-user-journeys.md)

## Forms as User Workflows

Forms collect structured user input. This repository uses React Hook Form to track values/errors and Zod to validate them.

Example pattern:

```ts
const schema = z.object({
  email: z.string().email(t("forms.emailInvalid"))
});

const form = useForm({
  resolver: zodResolver(schema)
});
```

Business purpose: prevent submission of obvious invalid input and show localized feedback near the field.

`form.register("email")` connects an input to form state. `form.handleSubmit(callback)` validates first and calls the callback only when successful.

## Why Frontend and Backend Both Validate

Frontend Zod validation improves speed and clarity for normal users. Backend TypeBox and business validation protect the system from any caller.

Some rules intentionally appear in both places:

- password length;
- title required/length;
- description/alt text length;
- one image file.

The backend additionally enforces file MIME type, size, authentication, and ownership.

## Mutations and Form Outcomes

Login and registration set the `["me"]` query data after success. Upload, edit, and delete invalidate gallery-related queries.

Mutation state such as `isPending` disables submit buttons, helping prevent repeated submissions.

`FormError` distinguishes `ApiClientError` from unknown failures and translates the stable code.

## Internationalization

**Internationalization**, often abbreviated i18n, means designing software to support different languages and cultural contexts.

[`i18n.ts`](../../apps/web/src/i18n.ts) registers English and Chinese resources. `useTranslation()` provides `t(key)`.

```tsx
<h1>{t("gallery.title")}</h1>
```

The same component renders different text based on active language.

Translation files:

- [`en.json`](../../apps/web/src/locales/en.json)
- [`zh.json`](../../apps/web/src/locales/zh.json)

Keys form a contract. If code uses `errors.FILE_TOO_LARGE`, both locale files should define it.

User-created titles and descriptions remain exactly as entered. Translating application controls is different from machine-translating user content.

## Error Localization Design

The backend returns stable error codes. `FormError` translates `errors.${code}`.

This design keeps:

- HTTP behavior language-neutral;
- translation decisions in the UI;
- tests stable across wording changes.

If a new error code lacks a translation, the user may see the key rather than a helpful message. The extension checklist must include both locale files.

## Accessibility

Accessibility means making the application usable by people with diverse abilities and assistive technologies.

Existing accessibility features:

- semantic `button`, `nav`, `header`, `main`, and heading elements;
- labels wrap form controls;
- icon-only close button has `title` and `aria-label`;
- decorative icons use `aria-hidden`;
- lightbox uses `role="dialog"` and `aria-modal="true"`;
- images use uploaded alt text or title fallback;
- Escape closes the lightbox;
- navigation has accessible labels.

Important limitation: the lightbox does not currently trap keyboard focus or restore focus to the opening tile. A more complete dialog implementation should add those behaviors.

Alt text describes image content for someone who cannot see it. It should not merely repeat “image of” or the title unless the title itself adequately describes the content.

## Responsive Design

Responsive design adapts layout to available screen width.

The gallery uses CSS multi-column layout:

```text
above 1100px: 4 columns
821–1100px:   3 columns
561–820px:    2 columns
560px below:  1 column
```

`break-inside: avoid` keeps each image tile together. Images use `width: 100%` and automatic height, producing a masonry/waterfall effect.

Other responsive changes:

- header stacks vertically on tablets;
- lightbox changes from side-by-side to vertical;
- management items become one column;
- mobile navigation hides text while keeping icons and titles.

## CSS Concepts Used

- **cascade:** later/more-specific rules can override earlier ones;
- **class selector:** `.gallery-grid` selects matching elements;
- **media query:** applies rules under a viewport condition;
- **grid/flexbox:** layout systems;
- **fixed positioning:** anchors lightbox to viewport;
- **z-index:** places header/lightbox above content;
- **clamp:** bounds a responsive size;
- **aspect-ratio:** preserves predictable image preview shape.

## Alternatives

- CSS Grid masonry: evolving browser support and different layout behavior.
- Dedicated masonry library: more control, but more JavaScript and dependency weight.
- Server-side translations: useful for server-rendered pages or translated emails, but unnecessary for this client-rendered UI.
- Native `<dialog>`: built-in dialog semantics and focus behavior, though styling/browser behavior must be tested.

## Safe Change Checklist

When adding a new form:

1. define the business rule;
2. add localized frontend validation;
3. add backend schema and semantic validation;
4. add stable error codes/translations when needed;
5. test keyboard and narrow-screen behavior;
6. add frontend and API tests.
