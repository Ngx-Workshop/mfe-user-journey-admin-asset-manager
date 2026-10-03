# Agent entry point — mfe-user-journey-admin-asset-manager

This repository is the Angular remote seed for Ngx-Workshop. Assume you have
access to this repository only. The shell, gateway, services, and shared libraries
are separate repositories; their source is not required to understand this seed.

## Read before implementation

1. [Constitution](.specify/memory/constitution.md): durable design rules.
2. [Architecture](docs/architecture.md): responsibilities, source map, external contracts.
3. [Development](docs/development.md): commands, verification, known limitations.
4. [Workflow](.specify/README.md): specify → plan → tasks → implement → verify.
5. The relevant feature folder listed in [specs](specs/README.md), if one exists.

For a newly cloned product repository, also follow [seed adoption](docs/seed-adoption.md).
All links above resolve within this checkout. Do not assume a sibling repository exists.

## Working rules

- Inspect relevant source and `git status` before editing; preserve unrelated changes.
- Follow the user's requested scope. For a feature or behavior change, maintain a
  feature spec, plan, task list, and handoff using the local templates. Small docs
  edits and mechanical fixes can use a concise change/verification summary.
- Documentation describes intent and a source snapshot; executable code describes
  current behavior. Record discrepancies explicitly rather than copying a defect
  into a new implementation or silently changing the intended behavior.
- Keep the default `App` export, `Routes` export, federation exposures, and shared
  dependency compatibility intact unless the task includes changing that contract.
- Keep API calls in services and use published contract types. Do not recreate a
  backend or load another remote inside this remote to work around missing access.
- Resolve routine implementation choices and record assumptions. Ask only for
  missing decisions that materially affect requirements or external compatibility;
  continue independent work while a decision is pending.
- Verify changed behavior with the checks in the development guide. Report checks
  actually run, failures, and checks blocked by missing infrastructure separately.
- Update affected context docs when architecture, commands, or contracts change.
  End with a concise result and any remaining integration work.

This is a Markdown workflow inspired by Spec Kit. It does not install Spec Kit,
register slash commands, or require a particular AI tool.
