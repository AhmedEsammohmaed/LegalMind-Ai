const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "lib", "legal-analysis.ts");
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = new Module(sourcePath, module);
loaded.filename = sourcePath;
loaded.paths = module.paths;
loaded._compile(compiled, sourcePath);
const { analyzeContract } = loaded.exports;
const factsPath = path.join(root, "lib", "contract-facts.ts");
const factsCompiled = ts.transpileModule(fs.readFileSync(factsPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const factsModule = new Module(factsPath, module);
factsModule.filename = factsPath;
factsModule.paths = module.paths;
factsModule._compile(factsCompiled, factsPath);
const { extractContractFacts } = factsModule.exports;
const obligationsPath = path.join(root, "lib", "contract-obligations.ts");
const obligationsCompiled = ts.transpileModule(fs.readFileSync(obligationsPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const obligationsModule = new Module(obligationsPath, module);
obligationsModule.filename = obligationsPath;
obligationsModule.paths = module.paths;
obligationsModule._compile(obligationsCompiled, obligationsPath);
const { extractObligationCandidates } = obligationsModule.exports;
const sourcesPath = path.join(root, "lib", "legal-sources.ts");
const sourcesCompiled = ts.transpileModule(fs.readFileSync(sourcesPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const sourcesModule = new Module(sourcesPath, module);
sourcesModule.filename = sourcesPath;
sourcesModule.paths = module.paths;
sourcesModule._compile(sourcesCompiled, sourcesPath);
const { getLegalReferences, getLegalSourceCoverage } = sourcesModule.exports;
const corpus = JSON.parse(fs.readFileSync(path.join(root, "docs", "evaluation", "analysis-cases.json"), "utf8"));

let passed = 0;
let failed = 0;
function check(name, text, language, expectedId) {
  const findings = analyzeContract(text, language);
  const matched = findings.some((finding) => finding.id === expectedId);
  const bad = expectedId ? !matched : findings.length > 0;
  if (bad) {
    failed += 1;
    console.error(`FAIL ${language.toUpperCase()} ${name}: expected ${expectedId ?? "no findings"}; got ${findings.map((finding) => finding.id).join(", ") || "none"}`);
    return;
  }
  if (findings.some((finding) => finding.priority !== "Review" || !finding.evidence || !finding.title || !finding.explanation || !finding.question)) {
    failed += 1;
    console.error(`FAIL ${language.toUpperCase()} ${name}: incomplete or uncalibrated output fields`);
    return;
  }
  passed += 1;
}

for (const item of corpus.cases) {
  check(item.id, item.en, "en", item.id);
  check(item.id, item.ar, "ar", item.id);
}
for (const item of corpus.negativeCases) {
  check(item.name, item.en, "en", null);
  check(item.name, item.ar, "ar", null);
}

const pageFinding = analyzeContract("[Page 4]\
The scope of work lists the deliverables.", "en")
  .find((finding) => finding.id === "scope");
if (pageFinding?.pageNumber === 4) passed += 1;
else {
  failed += 1;
  console.error("FAIL PDF page marker was not attached to the matching finding");
}
const unpaginatedFinding = analyzeContract("The scope of work lists the deliverables.", "en")
  .find((finding) => finding.id === "scope");
if (unpaginatedFinding?.pageNumber === null) passed += 1;
else {
  failed += 1;
  console.error("FAIL finding without a PDF page marker should not invent a page number");
}
for (const [language, file] of [
  ["en", "freelance_contract_english.txt"],
  ["ar", "freelance_contract_arabic.txt"],
]) {
  const text = fs.readFileSync(path.join(root, "docs", "evaluation", "ground-truth", file), "utf8");
  const actual = analyzeContract(text, language).map((finding) => finding.id);
  const ids = new Set(actual);
  const expected = language === "en"
    ? ["payment-contingent", "scope", "termination", "ownership", "liability", "notices"]
    : ["payment-contingent", "termination", "ownership", "liability", "notices"];
  for (const id of expected) {
    if (ids.has(id)) passed += 1;
    else {
      failed += 1;
      console.error(`FAIL ${language.toUpperCase()} baseline fixture missing ${id}`);
    }
  }
  if (ids.has("disputes")) {
    failed += 1;
    console.error(`FAIL ${language.toUpperCase()} baseline fixture false dispute finding`);
  } else passed += 1;
  const unexpected = actual.filter((id) => !expected.includes(id));
  if (unexpected.length) {
    failed += unexpected.length;
    console.error(`FAIL ${language.toUpperCase()} baseline fixture unexpected findings: ${unexpected.join(", ")}`);
  } else passed += 1;
}

const englishFacts = extractContractFacts("[Page 2]\
Payment: AED 1,250. Payment is due within 30 days by 2026-04-01.", "en");
if (
  englishFacts.some((fact) => fact.category === "amount" && fact.value === "AED 1,250" && fact.pageNumber === 2) &&
  englishFacts.some((fact) => fact.category === "payment-period" && fact.value.endsWith("within 30 days") && fact.pageNumber === 2) &&
  englishFacts.some((fact) => fact.category === "date" && fact.value === "2026-04-01" && fact.pageNumber === 2)
) passed += 1;
else {
  failed += 1;
  console.error("FAIL English amount/date/payment-period extraction or page reference:", JSON.stringify(englishFacts));
}
const arabicFacts = extractContractFacts("[Page 3]\
يلتزم العميل بسداد ٥٠٠٠ جنيه مصري خلال ١٥ يوماً قبل ٣٠/٠٤/٢٠٢٦.", "ar");
if (
  arabicFacts.some((fact) => fact.category === "amount" && fact.pageNumber === 3) &&
  arabicFacts.some((fact) => fact.category === "payment-period" && fact.pageNumber === 3) &&
  arabicFacts.some((fact) => fact.category === "date" && fact.pageNumber === 3)
) passed += 1;
else {
  failed += 1;
  console.error("FAIL Arabic amount/date/payment-period extraction or page reference:", JSON.stringify(arabicFacts));
}

const obligationEnglishText = "[Page 2]\
The Client shall pay AED 1,250 within 30 days.";
const obligationEnglishFacts = extractContractFacts(obligationEnglishText, "en");
const obligationEnglish = extractObligationCandidates(obligationEnglishText, obligationEnglishFacts);
if (obligationEnglish.length === 1 && obligationEnglish[0].partyRole.toLowerCase() === "the client" && obligationEnglish[0].dutyVerb === "pay" && obligationEnglish[0].pageNumber === 2 && obligationEnglish[0].amountCandidates.includes("AED 1,250") && obligationEnglish[0].timingCandidates.some((value) => value.includes("30 days")) && obligationEnglish[0].evidence.includes("shall pay")) passed += 1;
else { failed += 1; console.error("FAIL English obligation candidate evidence, page, or related facts:", JSON.stringify(obligationEnglish)); }
const obligationArabicText = "[Page 3]\
يلتزم العميل بسداد ٥٠٠٠ جنيه مصري خلال ١٥ يوماً.";
const obligationArabicFacts = extractContractFacts(obligationArabicText, "ar");
const obligationArabic = extractObligationCandidates(obligationArabicText, obligationArabicFacts);
if (obligationArabic.length === 1 && obligationArabic[0].partyRole === "العميل" && obligationArabic[0].dutyVerb === "بسداد" && obligationArabic[0].pageNumber === 3 && obligationArabic[0].amountCandidates.length > 0 && obligationArabic[0].timingCandidates.length > 0 && obligationArabic[0].evidence.includes("يلتزم العميل")) passed += 1;
else { failed += 1; console.error("FAIL Arabic obligation candidate evidence, page, or related facts:", JSON.stringify(obligationArabic)); }

const triggeredEnglishText = "[Page 8]\\nThe Client shall pay the fee within 30 days after receipt of the invoice if the work is accepted.";
const triggeredEnglishFacts = extractContractFacts(triggeredEnglishText, "en");
const triggeredEnglish = extractObligationCandidates(triggeredEnglishText, triggeredEnglishFacts);
if (triggeredEnglish[0]?.triggerCandidates.some((value) => value.toLowerCase().includes("after receipt")) && triggeredEnglish[0]?.conditionCandidates.some((value) => value.toLowerCase().startsWith("if")) && triggeredEnglish[0]?.pageNumber === 8) passed += 1;
else { failed += 1; console.error("FAIL English trigger/condition wording detection:", JSON.stringify(triggeredEnglish)); }
const triggeredArabicText = "[Page 9]\\nيلتزم العميل بسداد الأجر خلال ٣٠ يوماً بعد استلام الفاتورة إذا تم قبول العمل.";
const triggeredArabicFacts = extractContractFacts(triggeredArabicText, "ar");
const triggeredArabic = extractObligationCandidates(triggeredArabicText, triggeredArabicFacts);
if (triggeredArabic[0]?.triggerCandidates.some((value) => value.includes("بعد استلام")) && triggeredArabic[0]?.conditionCandidates.some((value) => value.startsWith("إذا")) && triggeredArabic[0]?.pageNumber === 9) passed += 1;
else { failed += 1; console.error("FAIL Arabic trigger/condition wording detection:", JSON.stringify(triggeredArabic)); }

const citationChecks = [
  ["Egypt privacy", "Egypt", "data-protection", "Articles 4–5", "escc.gov.eg"],
  ["UAE privacy", "United Arab Emirates", "data-protection", "Articles 5–8", "/1972/download"],
  ["Egypt copyright", "Egypt", "ownership", "Article 149", "wipo.int"],
  ["UAE copyright", "United Arab Emirates", "ownership", "Article 9", "/1534/download"],
  ["UAE confidentiality", "United Arab Emirates", "confidentiality", "Article 123", "/4011/download"],
  ["Egypt subcontracting", "Egypt", "subcontracting", "Article 661", "eta.gov.eg"],
  ["Egypt work quality", "Egypt", "warranties", "Articles 648 and 650", "eta.gov.eg"],
];
for (const [name, jurisdiction, findingId, citation, host] of citationChecks) {
  const item = getLegalReferences(jurisdiction, [findingId])[0]?.references[0];
  if (item?.citation === citation && item.url.includes(host) && item.sourceNote && item.checkedOn) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL ${name} citation mapping`);
  }
}
const coverage = getLegalSourceCoverage();
const expectedTopics = [...new Set(corpus.cases.map((item) => item.id))].sort();
const coverageTopics = coverage.map((item) => item.findingId).sort();
if (JSON.stringify(expectedTopics) === JSON.stringify(coverageTopics)) passed += 1;
else {
  failed += 1;
  console.error(`FAIL source coverage registry topics do not match analyzer corpus: ${coverageTopics.join(", ")}`);
}
for (const item of coverage) {
  for (const jurisdiction of ["Egypt", "United Arab Emirates"]) {
    const state = item[jurisdiction];
    const refs = getLegalReferences(jurisdiction, [item.findingId])[0];
    const valid = state === "verified-reference"
      ? refs?.references.length > 0 && refs.unavailableReason === null
      : state === "no-verified-topic-specific-source" && refs?.references.length === 0 && Boolean(refs.unavailableReason);
    if (valid) passed += 1;
    else {
      failed += 1;
      console.error(`FAIL ${jurisdiction} ${item.findingId} missing an explicit, consistent source coverage decision`);
    }
  }
}
if (getLegalReferences("I’m not sure", ["ownership"])[0]?.references.length === 0) passed += 1;
else {
  failed += 1;
  console.error("FAIL unknown jurisdiction should not return law citations");
}

console.log(`Legal analysis rule evaluation: ${passed} passed, ${failed} failed.`);
console.log("Synthetic phrase coverage only; this does not validate legal correctness or OCR accuracy.");
process.exitCode = failed ? 1 : 0;

