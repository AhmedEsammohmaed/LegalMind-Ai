# Legal-analysis rule evaluation

This evaluation checks whether selected English and Arabic wording patterns trigger the intended screening rule, whether unrelated synthetic text remains unflagged, and whether the current baseline contracts still produce their expected clause topics.

## Run

From the project root:

```powershell
npm run evaluate:analysis
```

The corpus is in `analysis-cases.json`; the evaluator is `scripts/evaluate-legal-analysis.cjs`. The current corpus covers 19 rule categories in both languages, 3 bilingual negative cases, and the English/Arabic baseline ground-truth contracts.

## Current result

The current corpus passes 59 checks. Checks require each positive sample to trigger its expected rule, each negative sample to have no findings, and baseline contracts to produce only the expected clause topics while avoiding a false dispute finding.

## Limits

- All added examples are synthetic software fixtures, not legal forms or legal advice.
- Passing means phrase coverage for this small corpus. It does not establish recall or precision on real contracts, correct interpretation, legal validity, or safety for any jurisdiction.
- The analyzer reports every topic as **Review**; it does not assign calibrated risk severity or infer whether a clause benefits either party.
- Rule matching can miss paraphrases, be triggered by incidental language, and fail on OCR errors, mixed scripts, tables, or clauses whose meaning depends on surrounding sections.
- No statute, regulation, court decision, or other legal source is connected or cited. Jurisdiction selection does not change the rules.
- The Arabic scanned PDF fixture has a known OCR error: `50%` was read as `9650`. Analyzer phrase checks on ground-truth text do not validate OCR accuracy.

Before making jurisdiction-specific claims, connect authoritative, versioned legal sources and have the resulting rule set reviewed by qualified counsel for the selected jurisdiction.
