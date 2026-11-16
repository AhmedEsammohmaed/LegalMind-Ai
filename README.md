# LegalMind

LegalMind is a contract review prototype for freelancers, starting with Egypt and the UAE.

## Run locally

Install Node.js LTS, open PowerShell in this folder, then run:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. Stop the server with `Ctrl+C`.

## Current document flow

- The frontend accepts PDF and DOCX files up to 20 MB. It lets you choose Arabic, English, or both for OCR.
- `POST /api/extract` validates the file signature and extracts selectable PDF or DOCX text.
- Uploaded documents are processed in server memory and are not written to disk by this endpoint.
- PDF processing is limited to 200 pages, and OCR is limited to 10 sparse-text pages per request. OCR confidence is an automated estimate; verify all OCR text against the source. DOCX archives are checked for unsafe expansion. Extracted text is capped at 200,000 characters.
- OCR runs locally in the app server with Tesseract.js and installed Arabic/English language data.
- `POST /api/analyze` runs a transparent bilingual rule screen over extracted text. It flags selected clause topics and returns source wording, a plain-language explanation, and a question to discuss. It does not determine legal risk, interpret the full contract, or verify current law.
- The analyzer uses rule-based matching only. Jurisdiction selection does not change findings; it selects from a small, manually curated source registry for mapped topics. Citations are research leads, not a legal conclusion that a clause is valid, invalid, or breached. Source status and known version limits are shown with each reference; there is no automatic law update or full-text search.
- Run `npm run evaluate:analysis` to check English and Arabic phrase coverage against synthetic positive/negative cases and the two ground-truth fixtures. See `docs/evaluation/ANALYSIS.md` for scope and limits.
- Synthetic Arabic/English fixtures and a manual OCR checklist are in `docs/evaluation/CHECKLIST.md`. Regenerate fixtures with `python scripts/create_synthetic_contract_fixtures.py` (requires the documented Python packages and Arial fonts).

This is a local development prototype. Do not expose the upload endpoint publicly or use it with confidential contracts until authentication, rate limits, deployment limits, privacy controls, and security review are added.

## Production build

```powershell
npm run build
npm start
```
