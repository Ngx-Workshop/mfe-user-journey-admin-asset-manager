# Architecture and external context

Source baseline: 2026-09-29, commit `b5238b2`. Recheck source when changing behavior.

## Role in Ngx-Workshop

Ngx-Workshop combines Angular micro-frontends, NestJS services, MongoDB, and an
Nginx/gateway layer. Host shells compose structural remotes (header, navigation,
footer) and user journeys. Services own their data; shared npm packages carry
contracts and reusable frontend behavior between independently deployed repos.

This seed demonstrates a list, search, create/edit dialog, and delete flow for
example documents. It owns that UI and its HTTP client. It does not own the shell,
remote registry, gateway routing, authentication service, or MongoDB persistence.

## Local source map

| Concern | Source | Current behavior |
| --- | --- | --- |
| Bootstrap | `src/main.ts`, `src/bootstrap.ts` | Deferred bootstrap of standalone `App` |
| Providers | `src/app/app.config.ts` | Zoneless change detection, animations, HttpClient, reactive forms |
| Root | `src/app/app.ts` | Renders the example list; named and default `App` exports |
| Routes | `src/app/app.routes.ts` | Named `Routes` export; empty path redirects to `hello-world` |
| Federation | `webpack.config.js`, `webpack.prod.config.js` | Remote `mfe-user-journey-admin-asset-manager`; `./Component` and `./Routes`; `remoteEntry.js` |
| List/state | `src/app/components/example-mongodb-doc-list.component.ts` | Signals for documents, query, loading; computed local filtering |
| Item view | `src/app/components/example-mongodb-doc.component.ts` | Display, edit/remove events, copy ID |
| Dialog | `src/app/components/example-mongodb-doc-create-form-modal.component.ts` | Create/edit requests and dialog result |
| Forms | `src/app/services/example-form.service.ts` | Typed form construction and request mapping |
| HTTP | `src/app/services/example-crud-api.service.ts` | List, lookup, create, update, delete |

The standalone bootstrap does not register `provideRouter`; the route array is
also an integration export for a routing host. Do not assume loading a remote
component automatically executes its standalone `appConfig` providers.

## Contract boundaries

| External owner | Interface this repository uses | When that owner is unavailable |
| --- | --- | --- |
| `mfe-shell-workshop` / `mfe-shell-admin` | `remoteEntry.js`, `./Component` (default `App`), `./Routes` (named `Routes`) | Validate exports/build locally; document host checks as unverified |
| `service-mfe-orchestrator` and its admin UI | Registry metadata and session-local remote URL overrides | Record required entry/name/URL/route settings in the handoff |
| `service-bff-ngx-workshop` / `nginx-ngx-workshop.io` | Browser-relative `/api/example-crud` routed to the backend | Mock HTTP in tests; request the actual gateway mapping if needed |
| `seed-service-nestjs` | Published `@tmdjr/seed-service-nestjs-contracts` DTOs | Use installed types; document requested producer changes instead of fabricating fields |
| `ngx-user-metadata` / platform auth | Shared `@tmdjr/ngx-user-metadata` package | Preserve singleton compatibility; this seed currently has no route guard |

Repository names identify external owners, not relative filesystem dependencies.
The frontend manifest pins the contracts package to `0.0.7`; do not assume a
separately checked-out service manifest has the same version.

### HTTP and data

The intended browser boundary is `/api/example-crud`; service-native routes use
`/example-crud`. The actual client base string currently has a trailing slash.
See the development guide for the resulting detail-URL caveat.

| Method | Browser path | Payload/result |
| --- | --- | --- |
| GET | `/api/example-crud/` | Array of `ExampleMongodbDocDto` |
| GET | `/api/example-crud/:id` | One document |
| POST | `/api/example-crud/` | `CreateExampleMongodbDocDto` → document |
| PATCH | `/api/example-crud/:id` | Partial create DTO → document |
| DELETE | `/api/example-crud/:id` | No response body |

Documents include `_id`, `name`, `type`, `description`, `archived`, `version`,
`lastUpdated`, and optional `exampleMongodbDocObject` address fields. Published
types define the consumer contract; server validation defines accepted input.

### Build and deployment

The source uses Angular/Material/CDK `21.1.0`, RxJS `7.8.2`, and strict federation
singletons. Module Federation and `ngx-build-plus` still use 20-series versions;
that is an inherited configuration, not a blanket compatibility guarantee.

`angular.json` outputs `dist/mfe-user-journey-admin-asset-manager`; local serving uses port 4201.
The deployment workflow uses Node 22 and copies the bundle into
`/opt/mfe-remotes/mfe-user-journey-admin-asset-manager/`. Pushes to `main` trigger deployment. Remote
registration and gateway configuration are separate integration responsibilities.
