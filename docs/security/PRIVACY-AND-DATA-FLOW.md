# Privacy and data-flow baseline

## Current prototype behavior

This is a local, single-browser prototype. It has no authentication, user accounts, database, organization/tenant model, saved review history, or public-service rate limiting.

1. The selected PDF or DOCX file is sent from the browser to `POST /api/extract`.
2. The extraction handler receives the file in memory. PDF text extraction and OCR run in the app process; OCR language files are staged in a temporary directory and removed in a `finally` cleanup. DOCX text is extracted after archive-size checks.
3. The extraction response, including extracted text, is returned to the browser. The browser sends that text to `POST /api/analyze` when the user starts screening.
4. Analysis results and the original file object URL remain in the current page session. Report and negotiation brief downloads are generated in the browser. The app does not write uploaded files, extracted text, findings, or negotiation notes to its database or local filesystem.
5. Both API routes set `Cache-Control: no-store`. The app does not intentionally log document content. These controls do not configure or guarantee the retention behavior of a future hosting provider, reverse proxy, browser download folder, operating system, or network.
6. Both API routes read request bodies through explicit byte caps before parsing: uploads are capped at 21 MiB including multipart overhead, and analysis JSON at 512 KiB. The uploaded file and extracted text have their own smaller content limits. These per-request limits do not replace edge-level rate limiting or concurrency controls.

Use synthetic or non-confidential documents during development. A successful local build is not approval for a public deployment or a guarantee that external infrastructure retains no request metadata.

## Implemented HTTP baseline

The Next.js app disables its identifying `X-Powered-By` header and emits `nosniff`, frame denial, a restrictive referrer policy, a minimal permissions policy, and same-origin opener policy. A Content Security Policy and HSTS are not enabled here: CSP needs a deployment-aware nonce strategy for Next.js, and HSTS must be configured only on a verified HTTPS origin.

## Required design before accounts or persistence

- Require explicit user consent before storing a document or review. Keep ephemeral processing as the default.
- Select and document an authentication, database, and hosting provider before implementing persistence; record data location, subprocessors, retention, training, backup, and deletion terms.
- Derive the authenticated principal on the server. Never trust a client-supplied user or tenant identifier for authorization.
- Enforce tenant isolation in every query and mutation, with database constraints that include the tenant key. Deny access by default and test cross-tenant reads, writes, exports, and deletes.
- Store the minimum necessary data. Define deletion and retention for source files, extracted text, reports, audit records, backups, and support exports separately.
- Encrypt transport and stored data; isolate keys; rotate credentials; keep secrets outside the repository.
- Audit access and security-relevant actions without recording document bodies, extracted clauses, prompts, or proposed wording in ordinary logs.
- Add request size/time/rate limits, abuse protection, upload content validation, CSRF protections where session cookies are used, and an incident response/restore procedure.
- Enforce rate limits and concurrency budgets at the hosting edge or a shared store before enabling public access; process-local counters are not reliable across instances or restarts.
- Do not send contract text to a third-party AI, OCR, or analytics provider until its retention, training, residency, and contractual terms are verified and disclosed in-product.
- Add a deployment-reviewed CSP, HTTPS/HSTS, redacted observability, dependency checks, security review, and a rollback plan before a public pilot.

## Stage 9 exit evidence still required

Stage 9 is not complete. It requires a selected provider, approved threat model and privacy notice, implemented auth and authorization, tested tenant isolation, verified retention/deletion and backup restore, production rate limits, and a security review. The current prototype does not meet those conditions.
