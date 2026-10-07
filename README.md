# Ngx-Workshop Asset Manager

Angular administrator MFE for `service-uploader`, using the published
`@tmdjr/service-uploader-contracts` 0.0.7 package.

Browse/search/filter assets, receive files with progress, create and edit metadata,
inspect file details, archive/restore, and confirm permanent deletion. File receipt
is explicitly shown as pending storage; preview/download are not yet supported.

## Development
Use Node 22 and install with `npm ci`.

```sh
npm run dev:bundle
npm run build
npm run check:layout
npm test -- --watch=false --browsers=ChromeHeadless
```

## Integration
The admin shell mounts at `/admin-asset-manager`. Federation exposures remain
`./Component` (named/default App) and `./Routes` (named Routes). The root route
opens the library; `hello-world` remains an alias for existing bookmarks.
Set the Orchestrator development override to `http://localhost:4201/remoteEntry.js`
for shell integration. API requests use authenticated same-origin `/api/uploader`.
The standalone server needs a separately configured API proxy to use real data.

Upload accepts one nonempty file up to 25 MiB, optional name and description.
Add tags through Edit metadata after receipt. Creating a record produces
AWAITING_UPLOAD; the current service has no upload-to-existing-record endpoint.

See [source organization](docs/source-organization.md),
[architecture](docs/architecture.md), [development](docs/development.md), and
[feature verification/handoff](specs/001-asset-manager/handoff.md). Deployment
remains a separate operation; this feature does not publish or alter the registry.
