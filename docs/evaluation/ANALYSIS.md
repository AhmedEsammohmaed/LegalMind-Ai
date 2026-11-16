# Legal-analysis rule evaluation

This evaluation checks whether selected English and Arabic wording patterns trigger the intended screening rule, whether unrelated synthetic text remains unflagged, and whether the current baseline contracts still produce their expected clause topics.

## Run

From the project root:

```powershell
npm run evaluate:analysis
```

The corpus is in `analysis-cases.json`; the evaluator is `scripts/evaluate-legal-analysis.cjs`. The current corpus covers 19 rule categories in both languages, 3 bilingual negative cases, and the English/Arabic baseline ground-truth contracts.

## Current result

The current corpus checks English and Arabic rule matches, negative snippets, exact baseline finding sets, and selected legal-source mappings. It also checks that PDF page markers are attached to matching findings and that unpaginated text does not receive an invented page number. It also checks that all 19 analyzer topics have an explicit source-coverage decision for Egypt and the UAE, that a citation exists whenever a topic is marked covered, and that uncovered topics return an explicit gap reason. Unknown jurisdiction returns no citations.

## Curated source coverage snapshot

The registry currently has topic-specific references for 13 of 19 categories in Egypt and 13 of 19 in the UAE. The other topics remain explicit research gaps; the registry does not imply that no law applies. Egypt mappings include selected Civil Code rules and copyright/data-protection statutes. UAE mappings include selected Civil Transactions, copyright, and personal-data provisions. Coverage is a finite curated set, not full coverage of all legislation.

Additional verified mappings include UAE Civil Transactions Law Article 123 for unauthorized use or disclosure of confidential information obtained in negotiations or a contract; Egypt Civil Code Article 661 for subcontracting in contracts for work; and Egypt Civil Code Articles 648 and 650 for specified material quality and defective-performance matters in contracts for work. These contextual limits appear with the citations in the API response.

## Limits

- All added examples are synthetic software fixtures, not legal forms or legal advice.
- Passing means phrase coverage for this small corpus. It does not establish recall or precision on real contracts, correct interpretation, legal validity, or safety for any jurisdiction.
- The analyzer reports every topic as **Review**; it does not assign calibrated risk severity or infer whether a clause benefits either party.
- Rule matching can miss paraphrases, be triggered by incidental language, and fail on OCR errors, mixed scripts, tables, or clauses whose meaning depends on surrounding sections.
- A small, manually curated source registry is connected for some topics. It is not automated legal research and does not refresh source texts. The evaluator validates registry completeness and wiring, not the underlying law or whether a source applies to a particular contract.
- Citations are related research leads, not evidence that a clause is lawful/unlawful or that the cited provision governs the contract. The Egypt Civil Code PDF is not a consolidated amendment history; Egypt copyright metadata is only verified through 2020. UAE English translations should be checked against official Arabic texts. Special laws, implementing regulations, local emirate rules, and facts may alter applicability.
- The Arabic scanned PDF fixture has a known OCR error: `50%` was read as `9650`. Analyzer phrase checks on ground-truth text do not validate OCR accuracy.

Before making jurisdiction-specific claims, connect authoritative, versioned legal sources and have the resulting rule set reviewed by qualified counsel for the selected jurisdiction.
