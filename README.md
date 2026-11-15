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
- The legal findings screen is fictional sample content. No legal analysis, source retrieval, authentication, or persistent storage is implemented.

This is a local development prototype. Do not expose the upload endpoint publicly or use it with confidential contracts until authentication, rate limits, deployment limits, privacy controls, and security review are added.

## Production build

```powershell
npm run build
npm start
```
