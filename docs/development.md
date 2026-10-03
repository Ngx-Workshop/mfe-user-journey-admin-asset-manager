# Development and verification

Run commands from this repository root. Use Node 22, matching CI, with a version
supported by the installed Angular tools. Read `package.json`, the lockfile, and
`angular.json` if requirements change. No other repository is needed to build;
private/package registry access may still be needed to install dependencies.

## Commands

| Purpose | Command | Notes |
| --- | --- | --- |
| Install | `npm ci` | Uses the committed lockfile |
| Dev server | `npm start` | Port 4201; does not supply the backend API |
| Shell integration loop | `npm run dev:bundle` | Production watch build plus CORS-enabled static serving; stop both processes when done |
| Build | `npm run build` | Outputs `dist/mfe-user-journey-admin-asset-manager`, including federation entry |
| Unit tests | `npm test -- --watch=false --browsers=ChromeHeadless` | Requires Chrome/Chromium available to Karma |

There is no lint script or configured end-to-end runner in this seed. Do not report
them as completed checks. A static bundle server does not proxy `/api` calls.
For standalone development, supply an explicit local API proxy/configuration or
mock HTTP. For host integration, the documented platform workflow uses an
Orchestrator dev-mode override to load `http://localhost:4201/remoteEntry.js` in
your shell session. Record the chosen environment; use test data for mutations.

## Verification for implementations

1. Run the build after TypeScript/template/federation changes.
2. Add or update focused behavior tests for affected forms, request mapping,
   component state, and error handling. Mock external APIs; never require live
   platform data for unit tests.
3. For UI changes, check loading/empty/error/success states, keyboard navigation,
   form validation, and a narrow viewport.
4. For integration changes, inspect emitted `remoteEntry.js` and check consumption
   through the host when available, including exports, providers, route mounting,
   shared versions, and API requests. A local build alone cannot verify the host.
5. Record actual commands/results and remaining limitations in the feature handoff.

For documentation-only changes, check paths, links, source accuracy, and whitespace;
an application build is normally unnecessary.

## Known inherited limitations

These are source observations from 2026-09-29, not executed test results. Recheck
before diagnosing failures. Fix them when relevant to the requested scope.

- `src/app/app.spec.ts` expects `Hello, mfe-user-journey-admin-asset-manager`, while the rendered list uses
  `Example MongoDB Docs`. Its setup also lacks the HTTP test providers needed by
  the child list's injected service. The scaffold is not a reliable green baseline.
- `ExampleCrudApiService` ends its base URL with `/` and appends `/${id}`. Detail,
  update, and delete requests therefore contain a double slash. Do not assume the
  gateway normalizes it or copy it into a new client.
- `ExampleFormService.toCreateDto` omits `archived: false` and blank descriptions.
  The edit flow reuses this mapper, so it cannot reliably express resetting those
  fields. Define create and patch semantics explicitly when changing forms.
- Address inputs are optional individually in the form; the service contract
  requires all four nonempty strings when an address object is supplied. A
  partially filled address needs explicit validation behavior.
- Dialog errors currently close the dialog without detailed feedback. Several
  `any` casts remain. These are example-code limitations, not preferred patterns.
- The source has no authentication route guard or standalone router provider.
  The shared metadata package being present does not supply those automatically.

## Keep the context accurate

Update architecture docs after changing exposures, routes, DTO usage, or ownership.
Update this guide after changing scripts or resolving a listed limitation. Update
the source-baseline date/reference when rechecking those facts.
