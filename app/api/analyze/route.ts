import { analyzeContract, type AnalysisLanguage } from "@/lib/legal-analysis";
import { getLegalReferences, LEGAL_SOURCE_CATALOG_VERSION, type Jurisdiction } from "@/lib/legal-sources";
import { extractContractFacts } from "@/lib/contract-facts";
import { extractObligationCandidates } from "@/lib/contract-obligations";
import { getLegalResearchVerification } from "@/lib/legal-research-verification";
import { readBoundedRequestBody } from "@/lib/request-body";

const MAX_ANALYSIS_CHARACTERS = 80_000;
const MAX_ANALYSIS_BODY_BYTES = 512 * 1024;

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(request: Request) {
  const boundedBody = await readBoundedRequestBody(request, MAX_ANALYSIS_BODY_BYTES);
  if (!boundedBody.ok) {
    return jsonResponse(
      { error: { code: boundedBody.reason === "too-large" ? "REQUEST_TOO_LARGE" : "UNREADABLE_REQUEST", message: boundedBody.reason === "too-large" ? "The analysis request is too large." : "The analysis request could not be read." } },
      boundedBody.reason === "too-large" ? 413 : 400,
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(boundedBody.bytes));
  } catch {
    return jsonResponse({ error: { code: "INVALID_JSON", message: "Send a valid JSON request." } }, 400);
  }
  if (!body || typeof body !== "object") {
    return jsonResponse({ error: { code: "INVALID_REQUEST", message: "Provide extracted document text." } }, 400);
  }

  const { text, language, jurisdiction } = body as Record<string, unknown>;
  if (typeof text !== "string" || !text.trim()) {
    return jsonResponse({ error: { code: "TEXT_REQUIRED", message: "There is no extracted text to analyze." } }, 400);
  }
  if (text.length > MAX_ANALYSIS_CHARACTERS) {
    return jsonResponse({ error: { code: "TEXT_TOO_LONG", message: "Analysis is limited to 80,000 characters. Use a shorter document or analyze sections separately." } }, 413);
  }
  if (language !== "ar" && language !== "en") {
    return jsonResponse({ error: { code: "INVALID_LANGUAGE", message: "Choose Arabic or English for the analysis output." } }, 400);
  }
  if (typeof jurisdiction !== "string" || !["Egypt", "United Arab Emirates", "I’m not sure"].includes(jurisdiction)) {
    return jsonResponse({ error: { code: "INVALID_JURISDICTION", message: "Choose a supported jurisdiction option." } }, 400);
  }

  const findings = analyzeContract(text, language as AnalysisLanguage);
  const contractFacts = extractContractFacts(text, language as AnalysisLanguage);
  const obligations = extractObligationCandidates(text, contractFacts);
  const legalReferences = getLegalReferences(jurisdiction as Jurisdiction, findings.map((finding) => finding.id));
  const legalResearchVerification = getLegalResearchVerification(jurisdiction as Jurisdiction, findings.map((finding) => finding.id));
  return jsonResponse({
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
