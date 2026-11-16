export type ContractFactCategory = "amount" | "date" | "payment-period";

export type ContractFact = {
  id: string;
  category: ContractFactCategory;
  label: Record<"ar" | "en", string>;
  value: string;
  evidence: string;
  pageNumber: number | null;
  startOffset: number;
  endOffset: number;
};

type FactPattern = {
  id: string;
  category: ContractFactCategory;
  label: Record<"ar" | "en", string>;
  match: RegExp;
};

const patterns: FactPattern[] = [
  {
    id: "amount",
    category: "amount",
    label: { en: "Amount", ar: "المبلغ" },
    match: /(?:\b(?:EGP|AED|USD|EUR|GBP|SAR|KWD|QAR|BHD|OMR)\s*[0-9٠-٩][0-9٠-٩,٬]*(?:[.٫][0-9٠-٩]{1,2})?|\b[0-9٠-٩][0-9٠-٩,٬]*(?:[.٫][0-9٠-٩]{1,2})?\s*(?:EGP|AED|USD|EUR|GBP|SAR|KWD|QAR|BHD|OMR)\b|[$€£]\s*[0-9٠-٩][0-9٠-٩,٬]*(?:[.٫][0-9٠-٩]{1,2})?|(?:جنيه(?:\s*مصري)?|درهم(?:\s*إماراتي)?|دولار)\s*[٠-٩0-9][٠-٩0-9,٬]*(?:[.٫][٠-٩0-9]{1,2})?)/giu,
  },
  {
    id: "date",
    category: "date",
    label: { en: "Date", ar: "التاريخ" },
    match: /(?:\b(?:19|20)[0-9٠-٩]{2}[-/.][0-9٠-٩]{1,2}[-/.][0-9٠-٩]{1,2}\b|\b[0-9٠-٩]{1,2}[/-][0-9٠-٩]{1,2}[/-](?:19|20)?[0-9٠-٩]{2}\b|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+[0-9]{1,2},?\s+(?:19|20)[0-9]{2}\b|\b[0-9]{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(?:19|20)[0-9]{2}\b|[٠-٩0-9]{1,2}\s+(?:يناير|فبراير|مارس|أبريل|ابريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|أكتوبر|اكتوبر|نوفمبر|ديسمبر)\s+[٠-٩0-9]{4})/giu,
  },
  {
    id: "payment-period",
    category: "payment-period",
    label: { en: "Payment period", ar: "مهلة السداد" },
    match: /(?:\b(?:net|within|no later than|due within)\s+[0-9]+\s+(?:(?:calendar|business)\s+)?days?\b|خلال\s*[٠-٩0-9]+\s*(?:يوم(?:اً|ًا)?|أيام|أسبوع(?:اً|ًا)?|أسابيع|شهر|أشهر))/giu,
  },
];

const MAX_FACTS = 40;

function pageNumberFor(text: string, index: number): number | null {
  const markerStart = text.lastIndexOf("[Page ", index);
  if (markerStart < 0) return null;
  const marker = /^\[Page\s+([0-9]+)\]/u.exec(text.slice(markerStart, index));
  return marker ? Number(marker[1]) : null;
}

function sentenceFor(text: string, start: number, end: number) {
  const sentenceStart = Math.max(
    text.lastIndexOf("\n", start),
    text.lastIndexOf(".", start),
    text.lastIndexOf("؟", start),
    text.lastIndexOf("!", start),
  ) + 1;
  const stops = ["\n", ".", "؟", "!"]
    .map((separator) => text.indexOf(separator, end))
    .filter((index) => index >= 0);
  const sentenceEnd = stops.length ? Math.min(...stops) + 1 : text.length;
  return text.slice(sentenceStart, sentenceEnd).trim().slice(0, 700);
}

/**
 * Extracts only verbatim candidate values. It does not infer what a value means
 * legally or whether it applies; each result needs checking against the source.
 */
export function extractContractFacts(text: string, language: "ar" | "en"): ContractFact[] {
  const facts: ContractFact[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    pattern.match.lastIndex = 0;
    for (const match of text.matchAll(pattern.match)) {
      const value = match[0];
      const startOffset = match.index ?? 0;
      const endOffset = startOffset + value.length;
      const pageNumber = pageNumberFor(text, startOffset);
      const key = `${pattern.id}:${startOffset}:${value.toLocaleLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      facts.push({
        id: key,
        category: pattern.category,
        label: pattern.label[language],
        value,
        evidence: sentenceFor(text, startOffset, endOffset),
        pageNumber,
        startOffset,
        endOffset,
      });
      if (facts.length >= MAX_FACTS) return facts;
    }
  }

  return facts.sort((left, right) => left.startOffset - right.startOffset);
}
