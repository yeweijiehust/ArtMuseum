# Repository File Formats and Command Line Basics

Prerequisites:

- [JavaScript and TypeScript from zero](02-javascript-typescript.md)
- [Node.js, packages, PNPM, and monorepos](03-node-pnpm-monorepos.md)

A repository contains more than program source. Beginners need to recognize configuration, documentation, styles, tests, and commands before navigating confidently.

## Paths and the Working Directory

A path identifies a file or directory. From the repository root:

```text
apps/api/src/app.ts
```

means enter `apps`, then `api`, then `src`, then read `app.ts`.

The **working directory** is the directory a command treats as its starting point. Root scripts and `process.cwd()` assume commands run from the repository root.

Useful PowerShell commands:

```powershell
Get-ChildItem
Get-Content README.md
git status
pnpm test
```

Commands have a program name followed by arguments. `pnpm --filter @artmuseum/api test` runs the `test` script only in the selected workspace.

## File Extensions

| Extension/name | Purpose |
| --- | --- |
| `.ts` | TypeScript module |
| `.tsx` | TypeScript module containing JSX |
| `.js` | JavaScript module/config |
| `.json` | Strict structured data |
| `.yaml` / `.yml` | Indentation-based configuration |
| `.css` | Browser styles |
| `.py` | Python source/test |
| `.md` | Markdown documentation |
| `package.json` | package manifest and scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `.gitignore` | patterns Git should ignore |
| `.env.example` | non-secret example environment keys |

## JSON

JSON uses objects, arrays, strings, numbers, Booleans, and `null`.

```json
{
  "name": "@artmuseum/web",
  "private": true,
  "scripts": {
    "build": "tsc -p tsconfig.json && vite build"
  }
}
```

Rules:

- property names and strings use double quotes;
- commas separate items;
- no comments;
- no trailing comma after final item.

Translation files and package manifests use JSON.

## YAML

YAML is an indentation-based configuration format:

```yaml
services:
  - type: web
    name: artmuseum
```

Indentation represents nesting. A dash begins a list item. YAML is easier to read than deeply nested JSON but indentation mistakes can change meaning.

Render and GitHub Actions configuration use YAML.

## CSS

CSS selects browser elements and assigns visual/layout properties:

```css
.gallery-grid {
  column-count: 4;
  column-gap: 18px;
}
```

`.gallery-grid` is a class selector. Declarations sit inside braces and end with semicolons.

A media query applies rules under a condition:

```css
@media (max-width: 560px) {
  .gallery-grid {
    column-count: 1;
  }
}
```

Read [Forms, bilingual UI, accessibility, and responsive layout](../04-frontend/02-forms-i18n-responsive.md) for repository behavior.

## Python

Python uses indentation rather than braces:

```python
def unique_email():
    return f"user-{uuid.uuid4().hex}@example.com"
```

- `def` defines a function;
- the colon begins an indented block;
- `f"..."` interpolates expressions;
- `assert condition` fails a test when condition is false.

The repository uses Python only for external API behavior tests. Application runtime remains TypeScript/JavaScript.

## Markdown

Markdown is documentation text with lightweight formatting:

````md
# Heading

Link syntax: square-bracket label followed by a relative path in parentheses.

```ts
const example = true;
```
````

This `tutorials/` system uses Markdown and Mermaid diagrams. GitHub renders both.

## Git Basics

Git tracks file changes:

```powershell
git status
git diff
git add tutorials
git commit -m "Add learning tutorials"
```

- working tree: current files;
- staged changes: selected content for next commit;
- commit: recorded snapshot;
- branch: movable line of commits;
- remote: hosted copy such as GitHub.

Always inspect `git status` and `git diff` before committing. Never commit real secrets or unrelated user changes.

## Generated and Ignored Files

Generated directories such as `dist`, `node_modules`, and coverage output should not be edited or committed. They can be recreated from source and dependencies.

[`.gitignore`](../../.gitignore) identifies ignored patterns. [`pnpm-lock.yaml`](../../pnpm-lock.yaml) is generated but intentionally committed because it records exact dependencies.

## Reading Configuration Safely

When a value appears in several places, determine precedence rather than assuming:

- test overrides may beat environment variables;
- environment variables may beat defaults;
- Render dashboard settings may affect deployed values;
- package scripts may invoke other package scripts.

The relevant code/config is the final evidence.
