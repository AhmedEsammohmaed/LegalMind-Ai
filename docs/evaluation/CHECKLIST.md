# Text extraction and OCR evaluation

These fixtures are synthetic software test data, not legal templates or legal advice. They contain no real parties and make no claims about Egyptian or UAE law.

## Fixture map

- `output/pdf/synthetic_contract_english_mixed.pdf`: page 1 has selectable digital text; page 2 is image-only English and should be OCRed.
- `output/pdf/synthetic_contract_arabic_scanned.pdf`: two image-only Arabic pages; request Arabic OCR, then repeat with Arabic + English.
- `docs/evaluation/ground-truth/freelance_contract_english.txt`: expected English text.
- `docs/evaluation/ground-truth/freelance_contract_arabic.txt`: expected Arabic text.

The fixture generator is `scripts/create_synthetic_contract_fixtures.py`. It requires ReportLab, Pillow, `arabic-reshaper`, and `python-bidi`, plus Arial fonts at `C:\Windows\Fonts`. The generated PDFs are committed so OCR can be evaluated without regenerating them.

## Run a manual extraction check

Start the app with `npm run dev`, then in PowerShell from the project directory run:

```powershell
curl.exe -F "file=@output/pdf/synthetic_contract_english_mixed.pdf" -F "ocrLanguage=eng" http://localhost:3000/api/extract
curl.exe -F "file=@output/pdf/synthetic_contract_arabic_scanned.pdf" -F "ocrLanguage=ara" http://localhost:3000/api/extract
curl.exe -F "file=@output/pdf/synthetic_contract_arabic_scanned.pdf" -F "ocrLanguage=ara+eng" http://localhost:3000/api/extract
```

The English response should report OCR on page 2 only. The Arabic response should report OCR on pages 1 and 2. Use the output text and `ocrConfidence` only as signals to inspect; OCR confidence is not an accuracy score.

## Review checklist

- [ ] English page 1 is extracted from its text layer; page 2 is identified as an OCR page.
- [ ] Both English pages retain the date `16 November 2026`, `EGP 24,500`, `50%`, `5 business days`, and `14 calendar days`.
- [ ] Both Arabic pages are readable in the correct right-to-left order.
- [ ] Arabic output retains `16 نوفمبر 2026`, `24,500`, `50%`, `5 أيام عمل`, `14 يوما تقويميا`, and `30 نوفمبر 2026`.
- [ ] Names, section order, negations, and ownership/termination wording are compared with the ground truth.
- [ ] Record OCR language, OCR page numbers, confidence estimates, missing/changed words, and manual corrections separately for each run.
- [ ] Confirm scanned pages without usable text produce a clear OCR warning; confirm digital text pages do not invoke OCR unnecessarily.
- [ ] Confirm oversized, malformed, and password-protected files fail with understandable errors.
- [ ] Confirm the upload endpoint does not persist the document or include document text in server logs.

## Observed first run (16 November 2026)

- English mixed PDF: HTTP 200; only page 2 was OCRed. The digital page retained the test date, amount, and percentages. The English OCR page retained the key payment, ownership, and deadline terms after removing a decorative dark header that produced OCR noise.
- Arabic scanned PDF: HTTP 200; pages 1 and 2 were OCRed in both Arabic-only and Arabic + English modes. Dates, the `24,500` amount, `5` business days, and `14` calendar days were recognized. Arabic-only misread the Latin `PNG` and `SVG` labels; Arabic + English recognized those labels.
- **Known accuracy failure:** both Arabic language settings read `50%` as `9650` on page 1. The average confidence signal was still about `91/100` and did not flag the error. Treat OCR confidence as diagnostic metadata only; verify every amount, date, name, and negation against the original. Do not pass this Arabic fixture until the percentage is recovered correctly or the UI adds a reliable field-level warning.
- CER/WER have not been calculated. The results below are manual observations from this tiny synthetic fixture set, not product accuracy evidence.

## Results record

| Fixture and page | Language selection | OCR pages returned | Key fields correct | CER / WER | Confidence estimate | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| English, page 1 (digital) | N/A | N/A | Key sample fields correct | Not measured | N/A | First pass |
| English, page 2 (scan) | English | 2 | Key sample fields visually correct | Not measured | 95/100 signal | |
| Arabic, pages 1-2 (scan) | Arabic | 1, 2 | `50%` misread as `9650`; Latin labels misread | Not measured | 91/100 signal | Fail |
| Arabic, pages 1-2 (scan) | Arabic + English | 1, 2 | `50%` misread as `9650`; Latin labels correct | Not measured | 91/100 signal | Fail |

CER and WER should be calculated after documented normalization (at minimum whitespace; for Arabic, decide in advance how to handle optional diacritics and character variants). Exclude the clearly labeled synthetic fixture banners, footer, and `[Page N]` markers from body-text scoring. Keep digital extraction and OCR scores separate. This tiny synthetic set is a smoke-check only; it cannot support product-level accuracy claims. Expand it with licensed or synthetic variations and qualified legal review before relying on analysis results.
