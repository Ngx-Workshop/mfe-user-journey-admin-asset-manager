# Adopting this seed for a new remote

Perform these steps in the new repository. Keep this guide as a checklist until
the copied seed describes the new product accurately.

1. Define the remote's audience, user journey or structural role, boundaries, and
   acceptance scenarios using the spec template. Decide which service owns data.
2. Replace seed identity deliberately: package name, Angular project/build target
   names and output path, serve scripts, HTML title/root selector, component
   selector, federation name, and deployment workflow name/concurrency/target.
   Keep `remoteEntry.js`, `./Component`, and `./Routes` consistent with host expectations.
3. Replace example components, services, forms, DTO imports, and route names with
   feature-specific ones. Use the correct published contracts package and version.
   Resolve the relevant known limitations before copying the example patterns.
4. Keep shared dependency versions compatible with the host. Document required
   host providers and authentication behavior; specify server-side authorization
   with the owning service where necessary.
5. Record the remote registration and gateway requirements: owner, name, URL,
   role/type, route mount, API prefix, and verification scenario. Do not assume
   the new repository's code creates these external settings.
6. Adapt tests to actual behavior and run the checks in the development guide.
   Record unavailable host/backend verification as pending.
7. Review the copied deployment workflow before pushing to `main`: it targets the
   seed's production directory. Configure the new target and secrets deliberately.
8. Rewrite `AGENTS.md`, the constitution, architecture/development docs, and README
   for the new repository. Preserve the workflow and templates; remove obsolete
   seed facts and historical feature records that do not belong to the new product.

Completion means an agent opening only the new repository can identify the
feature, its external contracts, its commands, and its unresolved dependencies.
