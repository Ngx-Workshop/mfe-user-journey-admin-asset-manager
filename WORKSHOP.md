# mfe-user-journey-admin-asset-manager integration checklist

Register in https://admin.ngx-workshop.io/list-mfe-remotes with name mfe-user-journey-admin-asset-manager, role user-journey, and remote URL https://beta.ngx-workshop.io/remotes/mfe-user-journey-admin-asset-manager/remoteEntry.js.
Use http://localhost:4201/remoteEntry.js for a session-local development override.
Preserved exports: ./Component (default App) and ./Routes (named Routes).
Deployment directory: /opt/mfe-remotes/mfe-user-journey-admin-asset-manager/.
The example client still uses /api/example-crud and the published seed service contracts; replace them when implementing your domain.

Scaffolding saves seed deployment examples in .ngx-workshop/workflows. Run ngx-workshop deploy . to publish and deploy this project. For services, the CLI updates/pushes Nginx and waits for its deployment to succeed before dispatching service deployment. Configure Actions secrets first; see the CLI deployment guide. Contracts publishing and MFE registration remain separate operations.

The inherited architecture/development docs describe example behavior; the identity, port, and route settings in this file take precedence. Update those docs and AGENTS.md after implementing the product. Existing source-baseline commits refer to the seed, not this new repository.
