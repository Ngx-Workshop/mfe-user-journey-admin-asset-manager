# mfe-user-journey-admin-asset-manager

Angular user-journey remote scaffolded from the Ngx-Workshop seed-mfe-remote template.

Use Node.js 22 or newer, matching the seeds.

## Development

```sh
npm install
npm run dev:bundle
# Build:
npm run build
# Tests (requires Chrome):
npm test -- --watch=false --browsers=ChromeHeadless
```

## Integration

Register in https://admin.ngx-workshop.io/list-mfe-remotes with name mfe-user-journey-admin-asset-manager, role user-journey, and remote URL https://beta.ngx-workshop.io/remotes/mfe-user-journey-admin-asset-manager/remoteEntry.js.
Use http://localhost:4201/remoteEntry.js for a session-local development override.
Preserved exports: ./Component (default App) and ./Routes (named Routes).
Deployment directory: /opt/mfe-remotes/mfe-user-journey-admin-asset-manager/.
The example client still uses /api/example-crud and the published seed service contracts; replace them when implementing your domain.

## Seed adoption

This is a starting scaffold with inherited example code. Read [seed adoption](docs/seed-adoption.md), [development limitations](docs/development.md), and [integration guidance](WORKSHOP.md). Replace example behavior with your product, adapt tests, and regenerate contracts as needed.

Scaffolding saves seed deployment examples in .ngx-workshop/workflows. Run ngx-workshop deploy . to publish and deploy this project. For services, the CLI updates/pushes Nginx and waits for its deployment to succeed before dispatching service deployment. Configure Actions secrets first; see the CLI deployment guide. Contracts publishing and MFE registration remain separate operations.
