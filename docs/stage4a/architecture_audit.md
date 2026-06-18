# STAGE 4A: Architecture Audit

## 1. System Topology
**Verdict:** MONOLITH
The architecture has drifted from a multi-service structure into a single monolithic backend (`backoffice/backend`). While folders like `pos/`, `kds/`, `crm/`, `cost/` still exist at the root, their backends appear to be consolidated into the single entrypoint under `backoffice/backend`.

## 2. Codebase Organization
* **Orphaned Folders / Dead Code:** There are multiple unused folders and duplicate code outside the monolith (e.g., `pos/backend`, `kds/backend`). The frontend code resides in these folders but relies on the `backoffice/backend` API.
* **Duplicate Entrypoints:** The `start-local.ps1` explicitly navigates to `backoffice\backend` to boot the server and assumes all endpoints are served from port `3099`.
* **Root Files:** Several orphaned root files like `api-client-v2.js` and patch files exist, cluttering the workspace.

## 3. Architecture Drift Conclusion
The architecture is functionally a Monolith running on port 3099. However, the repository structure implies microservices, leading to confusion and potential deployment regressions. The dead code needs pruning before production deployment.
