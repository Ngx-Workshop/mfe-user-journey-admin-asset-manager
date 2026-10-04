# Development and verification
Use Node 22, matching CI, and run from this repository root.

| Purpose | Command |
| --- | --- |
| Install pinned dependencies | `npm ci` |
| Angular development server | `npm start` |
| Production watch and CORS bundle server on 4201 | `npm run dev:bundle` |
| Production federation build | `npm run build` |
| Behavior tests | `npm test -- --watch=false --browsers=ChromeHeadless` |

There is no lint script or end-to-end runner. A static bundle server does not
proxy APIs. For real integration, use the Orchestrator's session-local
`http://localhost:4201/remoteEntry.js` override in the authenticated shell so APIs
remain same-origin. Do not load another remote inside this remote.

## Checks for changes
Run build after source/template/federation changes. Focused mocked tests cover
API paths/credentials/multipart payloads, limits, explicit clears, search/filter
state, retry, archive failure, deletion confirmation, failed saves and progress.
Inspect host mounting, Material dialogs, required-name validation, empty/error
states and responsive layouts. Separate mocked coverage from live integration;
use disposable data in an approved environment for mutation checks.

## Current verification and limitations
2026-10-03: production build and 16 ChromeHeadless tests pass (execution host
Node 24.9.0). Component styles remain below the configured warning budget after
the orchestration/presentation refactor.
Authenticated shell consumed the local bundle, returned an empty library, and
rendered dialogs and blank-name validation. Narrow and desktop layouts inspected.
Live mutations and a library containing real assets were not exercised.

Uploader persists uploaded files in S3. The library previews image assets using
the contract's `storageUrl`; direct stored-file access depends on object
permissions. Replacement uploads and attaching a file to an existing record remain
producer-owned work. The shell console also reports inherited Angular Material
component ID collisions across
remote bundles; observed dialogs work, but shared subpath alignment is external
integration work if those warnings become disruptive.

Feature decisions and handoff: [Asset Manager](../specs/001-asset-manager/handoff.md).
