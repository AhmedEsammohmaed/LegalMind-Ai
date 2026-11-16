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
const sourcesPath = path.join(root, "lib", "legal-sources.ts");
const sourcesCompiled = ts.transpileModule(fs.readFileSync(sourcesPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const sourcesModule = new Module(sourcesPath, module);
sourcesModule.filename = sourcesPath;
sourcesModule.paths = module.paths;
sourcesModule._compile(sourcesCompiled, sourcesPath);
const { getLegalReferences } = sourcesModule.exports;
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

const citationChecks = [
  ["Egypt privacy", "Egypt", "data-protection", "Articles 4–5", "escc.gov.eg"],
  ["UAE privacy", "United Arab Emirates", "data-protection", "Articles 5–8", "/1972/download"],
  ["Egypt copyright", "Egypt", "ownership", "Article 149", "wipo.int"],
  ["UAE copyright", "United Arab Emirates", "ownership", "Article 9", "/1534/download"],
];
for (const [name, jurisdiction, findingId, citation, host] of citationChecks) {
  const item = getLegalReferences(jurisdiction, [findingId])[0]?.references[0];
  if (item?.citation === citation && item.url.includes(host) && item.sourceNote && item.checkedOn) passed += 1;
  else {
    failed += 1;
    console.error(`FAIL ${name} citation mapping`);
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

