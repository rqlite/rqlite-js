# Migrating from rqlite-js v2 to v3

v3 keeps the same client-facing API intent (`DataApiClient`, `BackupApiClient`, `StatusApiClient`, query/execute/backup/status, auth, hosts, retries) while replacing the support stack: TypeScript source, tsdown dual ESM/CJS builds, native `fetch`, Jest tests, and **zero runtime npm dependencies**.

## Breaking changes

### Node.js engines

- **v2:** `>=18`
- **v3:** `>=20.19`

Native `fetch` and modern package `exports` are required.

### Package layout and imports

| v2 | v3 |
|----|----|
| Published `lib/` (Babel output) | Published `dist/` (JS + `.d.ts`) and `src/` (TypeScript) |
| `main`: `lib/index.js` | Dual `exports` for ESM + CJS + types |
| Deep imports like `rqlite-js/lib/...` | **Unsupported** — import from `rqlite-js` only |

```js
// ESM
import { DataApiClient } from 'rqlite-js'

// CommonJS
const { DataApiClient } = require('rqlite-js')
```

Types ship in-box (`dist/*.d.ts` / `*.d.cts`). No `@types/rqlite-js` package.

### HTTP stack (axios → fetch)

- **Removed runtime deps:** `axios`, `qs`
- HTTP uses platform **`fetch`** and **`URLSearchParams`**
- Non-2xx responses still reject (axios-compatible behavior)
- Redirects (301/302) are still followed manually so request bodies can be replayed
- `stream: true` (backup/load) returns a Node **`Readable`** created from the fetch body (`Readable.fromWeb`)

`httpAgent` / `httpsAgent` option names are unchanged. For keepalive with native fetch, pass an **undici-compatible `Dispatcher`** (object with a `dispatch` method). Classic `http.Agent` / `https.Agent` instances are still stored and returned by getters for API compatibility, but are not attached to `fetch` unless they expose `dispatch`.

### Removed tooling (authors / contributors)

- Babel / `es6/` / `lib/` pipeline → TypeScript `src/` + tsdown `dist/`
- Mocha / Chai → Jest
- `jsconfig` + `checkJs` → `tsconfig` + real types

Consumers do not install these; they are `devDependencies` only.

## What stayed the same

- Public class names and primary methods: `query`, `execute`, `backup`, `load`, `status`, `statusAllHosts`
- Result helpers: `DataResults`, `DataResult`, `DataResultError`
- Exported path/level/format constants
- Host lists (array or comma-separated string), authentication map, retry/backoff options (including historical `DEAULT_*` / `exponentail*` spellings)
- Default export object `{ DataApiClient, BackupApiClient, StatusApiClient }`

## Suggested upgrade steps

1. Upgrade Node to `>=20.19`.
2. `npm install rqlite-js@3`.
3. Replace any deep `lib/` imports with package-root imports.
4. Re-run your app tests; adjust only if you depended on axios error shapes or raw axios streams.
5. If you customised keepalive agents for fetch, switch to an undici `Agent` / `Dispatcher`.

## Verify locally (maintainers)

```bash
npm run verify
npm run verify:integrations
```
