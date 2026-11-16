import type { ContractFact } from "@/lib/contract-facts";

export type ObligationCandidate = {
  id: string;
  partyRole: string;
  dutyVerb: string;
  evidence: string;
  pageNumber: number | null;
  amountCandidates: string[];
  timingCandidates: string[];
  startOffset: number;
  endOffset: number;
};

type ObligationPattern = {
  expression: RegExp;
};

const patterns: ObligationPattern[] = [
  {
    expression: /(the\s+(?:client|customer|service provider|freelancer|contractor|supplier|company|first party|second party)|(?:client|customer|service provider|freelancer|contractor|supplier|company))\s+(shall|must|is required to)\s+(make payment|pay|deliver|submit|provide|review|approve|notify|return|delete|assign|reimburse|maintain|protect|complete|perform|transfer|refund)\b/giu,
  },
  {
    expression: /(يلتزم|يتعين على|يجب على)\s+(العميل|الزبون|مقدم الخدمة|المستقل|المقاول|المورد|الشركة|الطرف الأول|الطرف الثاني)\s+(بسداد|بدفع|بتسليم|بتقديم|بمراجعة|باعتماد|بإخطار|بإعادة|بحذف|بالتنازل|برد|بأداء|بتنفيذ|بسداد|بدفع|تسليم|تقديم|مراجعة|إخطار|إعادة|حذف|أداء|تنفيذ)/giu,
  },
];

function pageNumberFor(text: string, index: number): number | null {
  const markerStart = text.lastIndexOf("[Page ", index);
  if (markerStart < 0) return null;
  const marker = /^\[Page\s+([0-9]+)\]/u.exec(text.slice(markerStart, index));
  return marker ? Number(marker[1]) : null;
}

function sentenceBounds(text: string, start: number, end: number) {
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
  return { start: sentenceStart, end: sentenceEnd };
}

/**
 * Finds explicit party-role + modal-verb wording. These candidates are not
 * legal interpretations and do not resolve what the parties intended.
 */
export function extractObligationCandidates(text: string, facts: ContractFact[]): ObligationCandidate[] {
  const obligations: ObligationCandidate[] = [];
  const seen = new Set<string>();

  for (const { expression } of patterns) {
    expression.lastIndex = 0;
    for (const match of text.matchAll(expression)) {
      const startOffset = match.index ?? 0;
      const matchEnd = startOffset + match[0].length;
      const bounds = sentenceBounds(text, startOffset, matchEnd);
      const isArabic = expression.source.includes("يلتزم");
      const partyRole = (isArabic ? match[2] : match[1])?.trim();
      const dutyVerb = (isArabic ? match[3] : match[3])?.trim();
      if (!partyRole || !dutyVerb) continue;

      const key = `${startOffset}:${match[0].toLocaleLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const relatedFacts = facts.filter((fact) =>
        fact.startOffset >= bounds.start && fact.endOffset <= bounds.end,
      );
      obligations.push({
        id: key,
        partyRole,
        dutyVerb,
        evidence: text.slice(bounds.start, bounds.end).trim().slice(0, 700),
        pageNumber: pageNumberFor(text, startOffset),
        amountCandidates: relatedFacts.filter((fact) => fact.category === "amount").map((fact) => fact.value),
        timingCandidates: relatedFacts
          .filter((fact) => fact.category === "date" || fact.category === "payment-period")
          .map((fact) => fact.value),
        startOffset: bounds.start,
        endOffset: bounds.end,
      });
    }
  }

  return obligations.sort((left, right) => left.startOffset - right.startOffset).slice(0, 40);
}
