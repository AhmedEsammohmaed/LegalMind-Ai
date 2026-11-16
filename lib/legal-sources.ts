export type Jurisdiction = "Egypt" | "United Arab Emirates" | "I’m not sure";

export type LegalReference = {
  title: string;
  citation: string;
  url: string;
  language: "Arabic" | "English";
  effectiveFrom: string;
  checkedOn: string;
  sourceNote: string;
  sourceNoteAr: string;
  note: string;
};

const egyptSource = {
  title: "القانون المدني رقم 131 لسنة 1948",
  url: "https://www.eta.gov.eg/sites/default/files/2024-10/law-131-1948.pdf",
  language: "Arabic" as const,
  effectiveFrom: "1949-10-15",
  checkedOn: "2026-11-16",
  sourceNote: "Government-hosted original text. The Ministry of Finance lists the law as in force but says its online texts are guidance and the Official Gazette is controlling. This source is not a consolidated amendment history; verify the current text in the Gazette.",
  sourceNoteAr: "نص أصلي مستضاف حكومياً. تدرج وزارة المالية القانون كسارٍ، لكنها توضح أن النصوص الإلكترونية إرشادية وأن الوقائع المصرية هي المرجع القانوني. هذا الملف ليس تجميعاً للتعديلات؛ تحقق من النص الحالي في الجريدة الرسمية.",
};

const uaeSource = {
  title: "Federal Decree by Law No. 25 of 2025 Promulgating the Civil Transactions Law",
  url: "https://uaelegislation.gov.ae/en/legislations/4011/download",
  language: "English" as const,
  effectiveFrom: "2026-06-01",
  checkedOn: "2026-11-16",
  sourceNote: "Official UAE Legislation platform text. Article 3 brings this law into force on 1 June 2026 and Article 2 repeals Federal Law No. 5 of 1985. Check the official Arabic text and any subsequent amendment before relying on this translation.",
  sourceNoteAr: "نص منشور على منصة تشريعات الإمارات الرسمية. تقضي المادة 3 بسريان القانون من 1 يونيو 2026، وتلغي المادة 2 القانون الاتحادي رقم 5 لسنة 1985. تحقق من النص العربي الرسمي وأي تعديل لاحق.",
};

const egyptDataSource = {
  title: "قانون رقم 151 لسنة 2020 بإصدار قانون حماية البيانات الشخصية",
  url: "https://escc.gov.eg/assets/docs/law-151-2020.pdf",
  language: "Arabic" as const,
  effectiveFrom: "Article 7: three months after the day following publication (Official Gazette, 2020-07-15)",
  checkedOn: "2026-11-16",
  sourceNote: "Arabic text reproduced from the Official Gazette, Issue 28 bis (e), 15 July 2020. Executive Regulations and later amendments are not checked in this citation record.",
  sourceNoteAr: "نص عربي منشور في الجريدة الرسمية، العدد 28 مكرر (هـ)، 15 يوليو 2020. لم نتحقق هنا من اللائحة التنفيذية أو التعديلات اللاحقة.",
};

const uaeDataSource = {
  title: "Federal Decree by Law No. 45 of 2021 Concerning the Protection of Personal Data",
  url: "https://www.uaelegislation.gov.ae/en/legislations/1972/download",
  language: "English" as const,
  effectiveFrom: "2022-01-02",
  checkedOn: "2026-11-16",
  sourceNote: "Official UAE Legislation platform English text. Executive Regulations, sector-specific exemptions, and any later amendments are not covered by this citation record; check the official Arabic text.",
  sourceNoteAr: "نص إنجليزي منشور على منصة تشريعات الإمارات الرسمية. لا يشمل هذا المرجع اللائحة التنفيذية أو الاستثناءات القطاعية أو أي تعديلات لاحقة؛ راجع النص العربي الرسمي.",
};

const egyptCopyrightSource = {
  title: "Law No. 82 of 2002 on the Protection of Intellectual Property Rights (amended through 2020)",
  url: "https://www.wipo.int/wipolex/en/legislation/details/22066",
  language: "English" as const,
  effectiveFrom: "2002-06-03",
  checkedOn: "2026-11-16",
  sourceNote: "WIPO Lex identifies this consolidated text as amended through 5 September 2020; later amendments are not checked here. Its English page provides the Arabic text as the authoritative version.",
  sourceNoteAr: "تعرف WIPO Lex هذه النسخة المجمعة بأنها معدلة حتى 5 سبتمبر 2020؛ لم نتحقق هنا من تعديلات لاحقة. النص العربي هو النص المعتمد.",
};

const uaeCopyrightSource = {
  title: "Federal Decree-Law No. 38 of 2021 on Copyright and Neighboring Rights",
  url: "https://uaelegislation.gov.ae/en/legislations/1534/download",
  language: "English" as const,
  effectiveFrom: "2022-01-02",
  checkedOn: "2026-11-16",
  sourceNote: "Official UAE Legislation platform English text. Check the official Arabic text and subsequent amendments or executive regulations before relying on it.",
  sourceNoteAr: "نص إنجليزي منشور على منصة تشريعات الإمارات الرسمية. تحقق من النص العربي الرسمي والتعديلات واللوائح التنفيذية قبل الاعتماد عليه.",
};

type SourceCitation = Omit<LegalReference, "note" | "citation"> & { citation: string };
type SourceRule = { topic: string; article: string; note: string; jurisdictions: Partial<Record<"Egypt" | "United Arab Emirates", SourceCitation>> };

const issueIds = ["payment-contingent", "payment-timing", "scope", "deadlines", "termination", "ownership", "liability", "confidentiality", "data-protection", "renewal", "exclusivity", "expenses", "warranties", "force-majeure", "subcontracting", "notices", "amendments", "late-payment", "disputes"] as const;
type IssueId = typeof issueIds[number];

const egyptHasNoSpecificSource = "No specific provision was verified in this curated registry for this topic. This is a coverage gap, not a finding that no applicable law exists.";
const uaeHasNoSpecificSource = "No specific provision was verified in this curated registry for this topic. This is a coverage gap, not a finding that no applicable law exists.";

const mappings: Record<string, SourceRule[]> = {
  "payment-contingent": [
    { topic: "Contract performance and good faith", article: "Article 148", note: "General contract-performance provision; it does not specifically decide whether this acceptance condition is valid or adequate.", jurisdictions: { Egypt: { ...egyptSource, citation: "Article 148" } } },
    { topic: "Contract performance and good faith", article: "Article 221", note: "General contract-performance provision; it does not specifically decide whether this acceptance condition is valid or adequate.", jurisdictions: { "United Arab Emirates": { ...uaeSource, citation: "Article 221" } } },
  ],
  "payment-timing": [
    { topic: "Contract performance", article: "Article 148", note: "General performance provision only; no conclusion is made about a specific payment term.", jurisdictions: { Egypt: { ...egyptSource, citation: "Article 148" } } },
    { topic: "Due performance", article: "Article 292", note: "General rule on performing an obligation when due; it does not decide whether this payment term is valid or adequate.", jurisdictions: { "United Arab Emirates": { ...uaeSource, citation: "Article 292" } } },
  ],
  scope: [
    { topic: "Interpreting contract wording", article: "Article 150", note: "General interpretation provision; it does not determine the scope of this particular work.", jurisdictions: { Egypt: { ...egyptSource, citation: "Article 150" } } },
    { topic: "Interpreting contract wording", article: "Articles 119–120", note: "General interpretation provisions; they do not determine the scope of this particular work.", jurisdictions: { "United Arab Emirates": { ...uaeSource, citation: "Articles 119–120" } } },
  ],
  deadlines: [
    { topic: "Delay and non-performance", article: "Articles 215 and 221", note: "Remedies for non-performance or delay; the text match alone does not establish breach or damages.", jurisdictions: { Egypt: { ...egyptSource, citation: "Articles 215 and 221" } } },
    { topic: "Notice and non-performance remedies", article: "Article 234", note: "Concerns remedies for non-performance after notice; the text match alone does not establish breach.", jurisdictions: { "United Arab Emirates": { ...uaeSource, citation: "Article 234" } } },
  ],
  termination: [
    { topic: "Rescission for non-performance", article: "Articles 157–160", note: "General rules for rescission and its effects; they do not decide whether the contract's termination wording is enforceable.", jurisdictions: { Egypt: { ...egyptSource, citation: "Articles 157–160" } } },
    { topic: "Dissolution and rescission", article: "Articles 232–237", note: "General dissolution provisions; application depends on the facts, the contract, and any special law.", jurisdictions: { "United Arab Emirates": { ...uaeSource, citation: "Articles 232–237" } } },
  ],
  ownership: [
    { topic: "Copyright transfer and licensing", article: "Article 149", note: "Copyright-specific reference on written transfer and rights identified; not a conclusion about the uploaded clause or all forms of intellectual property.", jurisdictions: { Egypt: { ...egyptCopyrightSource, citation: "Article 149" } } },
    { topic: "Copyright transfer and licensing", article: "Article 9", note: "Copyright-specific reference on written transfer or licence and specified rights, place, and duration; not a conclusion about the uploaded clause or all forms of intellectual property.", jurisdictions: { "United Arab Emirates": { ...uaeCopyrightSource, citation: "Article 9" } } },
  ],
  liability: [
    { topic: "Contractual liability and compensation", article: "Articles 217 and 221–225", note: "General compensation provisions; their application and current consolidated wording require qualified legal review.", jurisdictions: { Egypt: { ...egyptSource, citation: "Articles 217 and 221–225" } } },
    { topic: "Failure or delay in contractual performance", article: "Articles 336–340", note: "General remedies and agreed-compensation provisions; they do not determine whether this particular liability clause is enforceable.", jurisdictions: { "United Arab Emirates": { ...uaeSource, citation: "Articles 336–340" } } },
  ],
  "data-protection": [
    { topic: "Controller and processor duties", article: "Articles 4–5", note: "Personal-data law references only; application depends on statutory scope, exceptions, and the Executive Regulations.", jurisdictions: { Egypt: { ...egyptDataSource, citation: "Articles 4–5" } } },
    { topic: "Processing controls and controller/processor duties", article: "Articles 5–8", note: "Personal-data law references only; scope, exceptions, free-zone rules, and Executive Regulations may affect application.", jurisdictions: { "United Arab Emirates": { ...uaeDataSource, citation: "Articles 5–8" } } },
  ],
  confidentiality: [
    { topic: "Unauthorized use or disclosure of confidential information in negotiations or a contract", article: "Article 123", note: "The provision concerns confidential information obtained in connection with negotiations or a contract; it does not validate every confidentiality clause or define all protected information.", jurisdictions: { "United Arab Emirates": { ...uaeSource, citation: "Article 123" } } },
  ],
  "force-majeure": [
    { topic: "Foreign cause and force majeure", article: "Articles 159, 165, and 217", note: "General provisions; effect depends on the specific obligation and facts.", jurisdictions: { Egypt: { ...egyptSource, citation: "Articles 159, 165, and 217" } } },
    { topic: "Exceptional circumstances and force majeure", article: "Articles 224 and 236", note: "These provisions address onerous exceptional circumstances and impossibility caused by force majeure; application is fact-specific.", jurisdictions: { "United Arab Emirates": { ...uaeSource, citation: "Articles 224 and 236" } } },
  ],
  "late-payment": [
    { topic: "Delay in monetary obligations", article: "Articles 226–228", note: "References concerning delay in monetary obligations. No interest rate or current amended wording is stated here; verify the Official Gazette and obtain legal advice.", jurisdictions: { Egypt: { ...egyptSource, citation: "Articles 226–228" } } },
    { topic: "Delay in performance and agreed compensation", article: "Articles 336–340", note: "General delay and agreed-compensation provisions; these are not an interest-rate determination for this contract.", jurisdictions: { "United Arab Emirates": { ...uaeSource, citation: "Articles 336–340" } } },
  ],
  warranties: [
    { topic: "Quality of materials and defective performance in contracts for work", article: "Articles 648 and 650", note: "These provisions concern contracts for work and specified material-quality or defective-performance situations; they are not a general warranty rule for every service or product contract.", jurisdictions: { Egypt: { ...egyptSource, citation: "Articles 648 and 650" } } },
  ],
  subcontracting: [
    { topic: "Subcontracting in a contract for work", article: "Article 661", note: "For contracts for work, subcontracting is permitted unless prohibited by contract or the personal skill of the contractor is intended; the original contractor remains responsible to the employer. Confirm this contract type and current text.", jurisdictions: { Egypt: { ...egyptSource, citation: "Article 661" } } },
  ],
  amendments: [
    { topic: "Contract amendment", article: "Article 147", note: "General rule on amendment and rescission; it does not assess this amendment clause.", jurisdictions: { Egypt: { ...egyptSource, citation: "Article 147" } } },
    { topic: "Contract amendment", article: "Article 113(2)", note: "General rule on amendment and rescission; it does not assess this amendment clause.", jurisdictions: { "United Arab Emirates": { ...uaeSource, citation: "Article 113(2)" } } },
  ],
};

// Every analyzer topic has an explicit decision per supported jurisdiction.
// Missing mappings remain visible as research gaps; they are never filled with a loosely related citation.
export function getLegalSourceCoverage() {
  return issueIds.map((findingId) => ({
    findingId,
    Egypt: mappings[findingId]?.some((rule) => rule.jurisdictions.Egypt) ? "verified-reference" as const : "no-verified-topic-specific-source" as const,
    "United Arab Emirates": mappings[findingId]?.some((rule) => rule.jurisdictions["United Arab Emirates"]) ? "verified-reference" as const : "no-verified-topic-specific-source" as const,
    noSourceReason: { Egypt: egyptHasNoSpecificSource, "United Arab Emirates": uaeHasNoSpecificSource },
  }));
}

export function getLegalReferences(jurisdiction: Jurisdiction, findingIds: string[]) {
  const key = jurisdiction === "I’m not sure" ? null : jurisdiction;
  return findingIds.map((findingId) => {
    const reference = key
      ? mappings[findingId]?.map((rule) => rule.jurisdictions[key]).find((item) => item !== undefined)
      : undefined;
    const rule = key ? mappings[findingId]?.find((item) => item.jurisdictions[key] !== undefined) : undefined;
    return {
      findingId,
      references: reference ? [{ ...reference, topic: rule?.topic ?? "", note: rule?.note ?? "" }] : [],
      unavailableReason: reference ? null : key
        ? key === "Egypt" ? egyptHasNoSpecificSource : uaeHasNoSpecificSource
        : "Select the contract jurisdiction to see any connected legal references.",
    };
  });
}
