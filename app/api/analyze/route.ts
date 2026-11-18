import { analyzeContract, type AnalysisLanguage } from "@/lib/legal-analysis";
import { getLegalReferences, LEGAL_SOURCE_CATALOG_VERSION, type Jurisdiction } from "@/lib/legal-sources";
import { extractContractFacts } from "@/lib/contract-facts";
import { extractObligationCandidates } from "@/lib/contract-obligations";
import { getLegalResearchVerification } from "@/lib/legal-research-verification";

const MAX_ANALYSIS_CHARACTERS = 80_000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "INVALID_JSON", message: "Send a valid JSON request." } }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: { code: "INVALID_REQUEST", message: "Provide extracted document text." } }, { status: 400 });
  }

  const { text, language, jurisdiction } = body as Record<string, unknown>;
  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: { code: "TEXT_REQUIRED", message: "There is no extracted text to analyze." } }, { status: 400 });
  }
  if (text.length > MAX_ANALYSIS_CHARACTERS) {
    return Response.json({ error: { code: "TEXT_TOO_LONG", message: "Analysis is limited to 80,000 characters. Use a shorter document or analyze sections separately." } }, { status: 413 });
  }
  if (language !== "ar" && language !== "en") {
    return Response.json({ error: { code: "INVALID_LANGUAGE", message: "Choose Arabic or English for the analysis output." } }, { status: 400 });
  }
  if (typeof jurisdiction !== "string" || !["Egypt", "United Arab Emirates", "I’m not sure"].includes(jurisdiction)) {
    return Response.json({ error: { code: "INVALID_JURISDICTION", message: "Choose a supported jurisdiction option." } }, { status: 400 });
  }

  const findings = analyzeContract(text, language as AnalysisLanguage);
  const contractFacts = extractContractFacts(text, language as AnalysisLanguage);
  const obligations = extractObligationCandidates(text, contractFacts);
  const legalReferences = getLegalReferences(jurisdiction as Jurisdiction, findings.map((finding) => finding.id));
  const legalResearchVerification = getLegalResearchVerification(jurisdiction as Jurisdiction, findings.map((finding) => finding.id));
  return Response.json({
    language,
    jurisdiction,
    findings,
    contractFacts,
    obligations,
    legalReferences,
    legalSourceCatalogVersion: LEGAL_SOURCE_CATALOG_VERSION,
    legalResearchVerification,
    summary: language === "ar"
      ? findings.length ? `تم رصد ${findings.length} بنداً يستحق المراجعة.` : "لم ترصد قواعد الفحص الأولي بنوداً مطابقة. هذا لا يعني خلو العقد من المخاطر."
      : findings.length ? `${findings.length} clause(s) flagged for review.` : "The initial screening found no matching clauses. This does not mean the contract is risk-free.",
    method: "transparent-rules-v1",
    disclaimer: language === "ar"
      ? "فحص أولي آلي لأنماط محددة في النص المستخرج، وليس رأياً قانونياً أو تحققاً من القانون الساري. قد تخطئ قواعد الفحص أو تفوّت بنوداً، كما قد تتأثر النتائج بأخطاء OCR. راجع النص الأصلي واستشر محامياً مؤهلاً في الاختصاص المعني."
      : "Automated first-pass screening for selected text patterns; this is not legal advice or verification of current law. Rules can miss or misclassify clauses, and OCR errors can affect results. Check the original and consult a qualified lawyer in the relevant jurisdiction.",
  });
}
