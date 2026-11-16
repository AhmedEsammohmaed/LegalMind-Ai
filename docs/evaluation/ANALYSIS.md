# Legal-analysis rule evaluation

This evaluation checks whether selected English and Arabic wording patterns trigger the intended screening rule, whether unrelated synthetic text remains unflagged, and whether the current baseline contracts still produce their expected clause topics.

## Run

From the project root:

```powershell
npm run evaluate:analysis
```

The corpus is in `analysis-cases.json`; the evaluator is `scripts/evaluate-legal-analysis.cjs`. The current corpus covers 19 rule categories in both languages, 3 bilingual negative cases, and the English/Arabic baseline ground-truth contracts.

## Current result

The current corpus checks English and Arabic rule matches, negative snippets, exact baseline finding sets, and selected legal-source mappings for Egypt/UAE copyright and data protection. It also verifies that no law is returned when the user has not selected a jurisdiction.

## Limits

- All added examples are synthetic software fixtures, not legal forms or legal advice.
- Passing means phrase coverage for this small corpus. It does not establish recall or precision on real contracts, correct interpretation, legal validity, or safety for any jurisdiction.
- The analyzer reports every topic as **Review**; it does not assign calibrated risk severity or infer whether a clause benefits either party.
- Rule matching can miss paraphrases, be triggered by incidental language, and fail on OCR errors, mixed scripts, tables, or clauses whose meaning depends on surrounding sections.
- A small, manually curated source registry is connected for some topics. It is not automated legal research, does not refresh source texts, and leaves many topics without a source. Jurisdiction selection changes references, not the underlying detection rules.
- Citations are related research leads, not evidence that a clause is lawful/unlawful or that the cited provision governs the contract. The Egypt Civil Code PDF is not a consolidated amendment history; Egypt copyright metadata is only verified through 2020. UAE English translations should be checked against official Arabic texts. Special laws, implementing regulations, local emirate rules, and facts may alter applicability.
- The Arabic scanned PDF fixture has a known OCR error: `50%` was read as `9650`. Analyzer phrase checks on ground-truth text do not validate OCR accuracy.

Before making jurisdiction-specific claims, connect authoritative, versioned legal sources and have the resulting rule set reviewed by qualified counsel for the selected jurisdiction.
