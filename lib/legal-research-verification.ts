import { getLegalReferences, type Jurisdiction, LEGAL_SOURCE_CATALOG_VERSION } from "@/lib/legal-sources";

export type LegalResearchVerification = {
  findingId: string;
  catalogVersion: string;
  status: "metadata-only-no-law-text" | "abstained-no-curated-reference" | "abstained-jurisdiction-unknown";
  sourceTextRetrieved: false;
  legalClaimVerified: false;
  reason: string;
};

/**
 * Current registry items are source leads, not retrieved statutory passages.
 * This gate explicitly prevents downstream code from treating a linked law as
 * a verified answer about the user's contract.
 */
export function getLegalResearchVerification(jurisdiction: Jurisdiction, findingIds: string[]): LegalResearchVerification[] {
  const references = getLegalReferences(jurisdiction, findingIds);
  const unknownJurisdiction = jurisdiction === "I’m not sure";
  return references.map((item) => ({
    findingId: item.findingId,
    catalogVersion: LEGAL_SOURCE_CATALOG_VERSION,
    status: unknownJurisdiction
      ? "abstained-jurisdiction-unknown"
      : item.references.length
        ? "metadata-only-no-law-text"
        : "abstained-no-curated-reference",
    sourceTextRetrieved: false,
    legalClaimVerified: false,
    reason: unknownJurisdiction
      ? "Jurisdiction is unknown; no legal conclusion can be checked."
      : item.references.length
        ? "A curated source link exists, but its provision text was not retrieved into this system; legal applicability was not assessed."
        : "No verified topic-specific source is connected for this finding and jurisdiction; abstain from a legal conclusion.",
  }));
}
