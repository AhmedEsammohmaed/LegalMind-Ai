# LegalMind: next 10 delivery stages

This roadmap turns the current Egypt/UAE freelancer contract-screening prototype into a reviewable product in dependency order. A stage is complete only when its exit criteria are met; a code scaffold is not production readiness. No stage authorizes use of confidential contracts in a public deployment before privacy, security, and legal review.

## Current baseline

The repository has a Next.js interface, in-memory PDF/DOCX text extraction with bounded OCR, bilingual phrase-based screening, a manually curated legal citation registry, and synthetic phrase/source coverage evaluation. There is no authentication, database, account isolation, saved review history, automated legal research, LLM analysis, or production deployment configuration. Current findings are screening prompts, not severity ratings or legal conclusions.

## Stages

### 1. Review report and user workflow

**Goal:** Make one real document review understandable, exportable, and honest about evidence.

**Deliverables:** A downloadable report built only from the current extraction and analysis response; document/jurisdiction/language metadata; exact evidence excerpts; per-finding questions and source status; explicit OCR and legal-use limitations. Keep report generation client-side until a secure storage policy exists.

**Exit criteria:** Exported report matches the displayed findings; no illustrative/sample finding can be confused with a document result; Arabic and English output preserve their selected response language; no uploaded content is sent to a third-party export service.

### 2. Document extraction quality and provenance

**Goal:** Establish what text came from which page and how it was obtained.

**Deliverables:** Page-level extraction records, OCR/text-layer provenance, improved scanned-page handling, repeatable CER/WER scoring on approved synthetic/licensed fixtures, and user correction workflow that retains original text separately.

**Exit criteria:** Page boundaries and OCR pages are traceable; extraction failures are actionable; benchmark reports separate digital text from OCR and show known field-level errors. OCR confidence must never be described as accuracy.

### 3. Contract structure and fact extraction

**Goal:** Turn flat text into a source-linked contract outline before making broader claims.

**Progress:** The prototype extracts literal candidate amounts, dates, and payment periods in Arabic and English, with source offsets and PDF page numbers where available.

**Deliverables:** Clause segmentation, document/contract-type suggestions, parties, dates, amounts, defined terms, and governing-law/forum candidates, each linked to page and character offsets. Unknown or conflicting values remain unknown/conflicting.

**Exit criteria:** Every extracted fact has evidence coordinates and a confidence/status; evaluation covers English, Arabic, mixed language, OCR noise, and missing information; user can correct extracted facts.

### 4. Obligation and deadline register

**Progress:** The prototype now surfaces a limited set of explicit English and Arabic party/action wording, source sentence, page, and co-located amount/timing candidates. It also quotes trigger and condition cue phrases when they appear verbatim. It does not resolve responsibility, contractual conditions, or calculate deadlines.

**Goal:** Help users see who must do what and when.

**Deliverables:** Structured obligations with actor, action, trigger, due date/period, condition, counterparty, evidence, and unresolved ambiguity; downloadable calendar-compatible dates only when exact dates are stated or safely computed.

**Exit criteria:** No inferred deadline is presented as contractual fact; relative dates require a verified trigger; ambiguous actors/dates are visibly marked for confirmation.

### 5. Evidence-based issue screening

**Goal:** Expand current phrase triggers into explainable, evaluated contract observations.

**Progress:** Each match now returns its exact matched phrase, surrounding evidence span, character offsets, and PDF page where available. Short evidence sentences remain local to the match rather than borrowing the next sentence. Output remains a text-pattern observation; no severity, probability, or legal-violation label is assigned.

**Deliverables:** Separate labels for ambiguity, commercial imbalance, missing protection, potential legal issue, and factual uncertainty; evidence spans; counterparty impact; mitigation questions; no unsupported probability or high/medium/low risk scores.

**Exit criteria:** Each output is traceable to source text and rule/model version; false-positive and false-negative rates are measured on reviewed, permissioned examples; qualified reviewers approve jurisdiction-specific claims.

### 6. Versioned legal-source knowledge base

**Goal:** Replace a small hand-coded mapping with maintainable primary-source records.

**Progress:** The citation registry now has a catalog version and source identifiers, authority, territory, publication/version notes, status-check metadata, and status URLs where checked. Some records deliberately say amendments/status were not checked; this is still a code-based citation index, not a full-text or change-monitored knowledge base.

**Deliverables:** Source records with issuing authority, jurisdiction/territory, language, publication/effective/amendment dates, official URL, retrieved snapshot/hash, checked date, provision mapping, and applicability caveats; change review and supersession workflow.

**Exit criteria:** Every surfaced legal claim has a verified primary-source link and provision; stale/unverified source states are visible; Egypt national, UAE federal/emirate, free-zone, and cross-border scope are not conflated. Qualified local counsel reviews the selected initial topics.

### 7. Research-grounded analysis and verification

**Goal:** Add AI only where retrieval and independent checks can constrain its output.

**Progress:** The analysis API reports a per-finding verification state. Because the current registry contains links and metadata but does not retrieve provision text, it marks legal claims unverified and abstains when jurisdiction/source coverage is missing. No LLM or RAG answer generation is enabled.

**Deliverables:** Retrieval over approved legal records; structured claim output; quote-to-source validation; jurisdiction and effective-date checks; abstention for unsupported questions; prompt-injection defenses for document text; verification layer separate from drafting.

**Exit criteria:** Citations are checked against retrieved source passages, not model memory; unsupported claims abstain; injection, cross-jurisdiction, stale-law, and adversarial-document evaluations pass agreed thresholds; model/provider and retention settings are documented.

### 8. Clause improvement and negotiation support

**Goal:** Help users discuss changes without silently rewriting legal commitments.

**Progress:** A user-authored negotiation brief can be prepared from a selected finding. It keeps the extracted wording beside the user's own proposed wording, records goals, rationale, tradeoffs, and unresolved questions, and exports only after explicit user input. No AI-generated alternatives or legal validation are provided.

**Deliverables:** Alternatives tied to user goals and source clause; side-by-side original/proposed text; change rationale, assumptions, tradeoffs, and unresolved fields; copy/export only after explicit user review.

**Exit criteria:** Proposed text is labeled as a draft for qualified review, never an automatically valid clause; no provision is invented as jurisdiction compliant; the user can reject or edit every change.

### 9. Accounts, persistence, privacy, and operations

**Goal:** Introduce multi-user use only after data handling is designed.

**Deliverables:** Select hosting/database/auth vendors; tenant isolation and role-based access; encryption and key management; consent, retention, deletion/export, audit logging without document contents, backups, rate limits, abuse controls, incident process, and data-processing disclosures.

**Exit criteria:** Threat model and privacy review approved; authorization tests demonstrate tenant isolation; deletion and backup restore are verified; secrets are outside the repository; subprocessors and cross-border transfer conditions are documented.

### 10. Production validation and launch readiness

**Goal:** Decide whether a narrowly scoped product is safe to pilot.

**Deliverables:** CI checks, API/UI regression suite, accessibility checks, load and cost tests, monitoring and redaction, deployment runbooks, rollback, support/escalation process, lawyer-reviewed boundaries, pilot consent and feedback plan, and competition demo using synthetic data.

**Exit criteria:** Security/privacy findings are resolved or explicitly accepted by owners; evaluation thresholds are met on representative data; disaster recovery, rollback, and incident exercises are completed; no public launch based solely on a successful build.

## Execution rules

- Complete stages in order where dependencies require it; a roadmap entry is not implemented software.
- Keep the first product wedge to freelance/service contract review in Egypt and the UAE until validation supports expansion.
- Do not upload real user contracts to third-party AI/OCR services until provider retention, training, residency, and contractual terms have been checked and disclosed.
- Keep legal analysis assistive, evidence-linked, jurisdiction-aware, and subject to qualified human review.
- Record stage status and evidence in this file as implementation proceeds.

## Status

- Baseline: implemented prototype, described above.
- Stage 1: complete for the current prototype. The report screen uses only the actual analysis response; it includes findings, excerpts, source status, jurisdiction/language metadata, OCR caveats, and legal-use limitations. Markdown export is generated client-side in the selected analysis language. The prior fictional sample report was removed.
- Stage 2: partially implemented. PDF extraction returns per-page text-layer/OCR provenance, OCR confidence signals, and whether the OCR page limit skipped processing. The interface exposes these details, and PDF screening findings now identify their source page when available. OCR quality benchmarks, correction workflow, and remaining extraction-quality exit criteria are still planned.
- Stage 3: partially implemented; literal value candidates are source-linked, while contract structure, parties, conflicts, and corrections remain planned.
- Stage 4: partially implemented; limited obligation wording and quoted trigger/condition candidates are exposed in the UI and report. Full obligation/deadline register and validation criteria remain planned.
- Stage 5: partially implemented; evidence spans and match offsets are returned. Taxonomy, reviewed-data evaluation, and counsel validation remain open.
- Stage 6: partially implemented; citation metadata is versioned and status limitations are explicit. There are no source snapshots, hashes, automated updates, or comprehensive legal coverage.
- Stage 7: verification gate implemented for current references; it abstains because provision text is not retrieved. RAG, quoted legal passages, and independent legal-claim verification remain unimplemented.
- Stage 8: partially implemented; user-authored, side-by-side negotiation briefs are exportable. AI clause alternatives, review workflows, and legal validation remain open.
- Stages 9–10: planned; not implemented or production-ready.
