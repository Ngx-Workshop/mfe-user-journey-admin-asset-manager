# Tasks: MVVM quality refactor
- [x] T001 Separate transport/models/helpers and centralize singleton data operations (FR-001, AC-001/002/003).
- [x] T002 Value view models and focused dialog/file/card components (FR-002/003, AC-004).
- [x] T003 Test singleton lifetime, lazy requests, pending cleanup and successful cache writes; run existing tests/build (FR-004, AC-001–004).
- [x] T004 Update context docs and handoff with actual evidence.
No external implementation dependencies.

## Evidence
- T001: Production imports of AssetApiService occur only in AssetManagerStore;
  DTOs/helpers separated; root-provided store owns all cache commits.
- T002: Library receives AssetLibraryViewModel values. Dialog coordinator, file
  intake and card visual extracted; components 39–242 lines (card exception documented).
- T003: Production build passes; 36/36 ChromeHeadless tests pass; live shell read-only
  and narrow viewport checks pass. Mutation coverage uses HTTP mocks.
- T004: Architecture, development, constitution, feature index and handoff updated.
