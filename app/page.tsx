"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

const paths = {
  scale: <><path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 7 8 4 8-4M4 7v5l8 4 8-4v-5M4 12v5l8 4 8-4v-5"/></>,
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4L7.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2Z"/></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <><path d="m18 6-12 12M6 6l12 12"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  back: <><path d="m15 18-6-6 6-6"/><path d="M20 12H9"/></>,
  alert: <><path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3h.01"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
};

function Icon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

type ExtractionResult = { fileName: string; fileType: "PDF" | "DOCX"; text: string; pageProvenance: { pageNumber: number; source: "text-layer" | "ocr" | "text-layer+ocr" | "no-text"; ocrConfidence: number | null; ocrSkippedDueToPageLimit: boolean }[] | null; pageCount: number | null; truncated: boolean; needsOcr: boolean; ocrUsed: boolean; ocrLanguage: string | null; ocrConfidence: number | null; ocrLowConfidence: boolean; ocrPages: number[]; ocrPageLimitReached: boolean };
type AnalysisResult = { language: "ar" | "en"; jurisdiction: string; findings: { id: string; category: string; priority: "Review"; title: string; evidence: string; matchedText: string; startOffset: number; endOffset: number; pageNumber: number | null; explanation: string; question: string }[]; contractFacts: { id: string; category: "amount" | "date" | "payment-period"; label: string; value: string; evidence: string; pageNumber: number | null; startOffset: number; endOffset: number }[]; obligations: { id: string; partyRole: string; dutyVerb: string; evidence: string; pageNumber: number | null; amountCandidates: string[]; timingCandidates: string[]; triggerCandidates: string[]; conditionCandidates: string[] }[]; legalReferences: { findingId: string; references: { sourceId: string; topic: string; title: string; citation: string; url: string; language: "Arabic" | "English"; effectiveFrom: string; checkedOn: string; issuingAuthority: string; issuingAuthorityAr: string; territorialScope: string; territorialScopeAr: string; publicationDate: string; versionDescription: string; versionDescriptionAr: string; versionStatus: string; statusCheckedOn: string; statusSourceUrl: string | null; sourceNote: string; sourceNoteAr: string; note: string }[]; unavailableReason: string | null }[]; legalResearchVerification: { findingId: string; catalogVersion: string; status: string; sourceTextRetrieved: false; legalClaimVerified: false; reason: string }[]; legalSourceCatalogVersion: string; summary: string; method: string; disclaimer: string };

function detectDocumentLanguage(text: string): "Arabic" | "English" | "Mixed" | "Undetermined" {
  const letters = text.match(/[\p{L}]/gu) ?? [];
  if (!letters.length) return "Undetermined";
  const arabic = letters.filter((letter) => /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u.test(letter)).length;
  const ratio = arabic / letters.length;
  if (ratio >= 0.8) return "Arabic";
  if (ratio <= 0.2) return "English";
  return "Mixed";
}

function detectAnalysisLanguage(text: string): "ar" | "en" {
  const letters = text.match(/[\p{L}]/gu) ?? [];
  if (!letters.length) return "ar";
  const arabic = letters.filter((letter) => /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u.test(letter)).length;
  return arabic / letters.length > 0.5 ? "ar" : "en";
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [ocrVerified, setOcrVerified] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [jurisdiction, setJurisdiction] = useState("Egypt");
  const [ocrLanguage, setOcrLanguage] = useState("ara+eng");
  const [responseLanguage, setResponseLanguage] = useState<"auto" | "ar" | "en">("auto");
  const [showReport, setShowReport] = useState(false);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [negotiationFindingId, setNegotiationFindingId] = useState("");
  const [negotiationGoal, setNegotiationGoal] = useState("");
  const [negotiationProposal, setNegotiationProposal] = useState("");
  const [negotiationRationale, setNegotiationRationale] = useState("");
  const [negotiationTradeoffs, setNegotiationTradeoffs] = useState("");
  const [negotiationQuestions, setNegotiationQuestions] = useState("");

  useEffect(() => () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
  }, [originalUrl]);

  function resetNegotiation() {
    setNegotiationOpen(false);
    setNegotiationFindingId("");
    setNegotiationGoal("");
    setNegotiationProposal("");
    setNegotiationRationale("");
    setNegotiationTradeoffs("");
    setNegotiationQuestions("");
  }

  function acceptFile(candidate?: File) {
    if (!candidate) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!(allowed.includes(candidate.type) || /\.(pdf|docx)$/i.test(candidate.name))) {
      setFileError("Choose a PDF or Word document.");
      return;
    }
    if (candidate.size > 20 * 1024 * 1024) {
      setFileError("This file is over 20 MB. Choose a smaller document.");
      return;
    }
    setFileError("");
    setFile(candidate);
    setOriginalUrl(URL.createObjectURL(candidate));
    setExtraction(null);
    setShowReport(false);
    setOcrVerified(false);
    resetNegotiation();
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) { acceptFile(event.target.files?.[0]); }
  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  async function copyText(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  function downloadReviewReport() {
    if (!analysis || !extraction) return;
    const isArabic = analysis.language === "ar";
    const lines = [
      isArabic ? "# تقرير الفحص الأولي للعقد" : "# Initial contract screening report",
      "",
      `${isArabic ? "الملف" : "File"}: ${extraction.fileName}`,
      `${isArabic ? "الاختصاص المحدد" : "Selected jurisdiction"}: ${analysis.jurisdiction}`,
      `${isArabic ? "لغة التقرير" : "Report language"}: ${isArabic ? "العربية" : "English"}`,
      `${isArabic ? "طريقة الفحص" : "Screening method"}: ${analysis.method}`,
      `${isArabic ? "نسخة سجل المصادر" : "Legal source catalog version"}: ${analysis.legalSourceCatalogVersion}`,
      `${isArabic ? "النتيجة" : "Summary"}: ${analysis.summary}`,
      "",
      `## ${isArabic ? "حالة التحقق القانوني" : "Legal source verification status"}`,
      ...analysis.legalResearchVerification.map((item) => `- ${item.findingId}: ${isArabic ? "لم يُسترجع نص التشريع؛ لم يتم التحقق من أي ادعاء قانوني أو انطباقه." : `${item.status}: source text was not retrieved; no legal claim or applicability was verified.`} (${item.catalogVersion})`),
      "",
      ...(analysis.obligations.length ? [
        `## ${isArabic ? "التزامات مرشحة للتحقق" : "Obligation wording to verify"}`,
        ...analysis.obligations.flatMap((item) => [
          `- ${item.partyRole}: ${item.dutyVerb}${item.pageNumber !== null ? ` (${isArabic ? "صفحة" : "page"} ${item.pageNumber})` : ""}`,
          `  ${item.evidence}`,
          ...(item.amountCandidates.length ? [`  ${isArabic ? "مبالغ مرشحة" : "Amount candidates"}: ${item.amountCandidates.join(", ")}`] : []),
          ...(item.timingCandidates.length ? [`  ${isArabic ? "مواعيد مرشحة" : "Timing candidates"}: ${item.timingCandidates.join(", ")}`] : []),
          ...(item.triggerCandidates.length ? [`  ${isArabic ? "عبارات بدء مرشحة" : "Trigger wording candidates"}: ${item.triggerCandidates.join(" | ")}`] : []),
          ...(item.conditionCandidates.length ? [`  ${isArabic ? "شروط مرشحة" : "Condition candidates"}: ${item.conditionCandidates.join(" | ")}`] : []),
        ]),
        isArabic ? "هذه صياغات مرشحة وليست تأكيداً للمسؤولية القانونية." : "These are candidate wordings, not confirmation of legal responsibility.",
        "",
      ] : []),
      ...(analysis.contractFacts.length ? [
        `## ${isArabic ? "قيم مستخرجة للتحقق" : "Extracted values to verify"}`,
        ...analysis.contractFacts.flatMap((fact) => [
          `- ${fact.label}: ${fact.value}${fact.pageNumber !== null ? ` (${isArabic ? "صفحة" : "page"} ${fact.pageNumber})` : ""}`,
          `  ${fact.evidence}`,
        ]),
        "",
      ] : []),
      ...analysis.findings.flatMap((finding, index) => {
        const sourceResult = analysis.legalReferences.find((entry) => entry.findingId === finding.id);
        return [
          `## ${index + 1}. ${finding.title}`,
          `**${isArabic ? "الفئة" : "Category"}:** ${finding.category} · **${isArabic ? "الحالة" : "Status"}: ${isArabic ? "للمراجعة" : finding.priority}`,
          `**${isArabic ? "النص المستخرج" : "Extracted evidence"}:** ${finding.evidence || (isArabic ? "لم يتوفر اقتباس واضح." : "No clear evidence quote was available.")}`,
          `**${isArabic ? "موضع النص في الاستخراج (بداية شاملة ونهاية غير شاملة)" : "Extracted-text offsets (start inclusive, end exclusive)"}:** ${finding.startOffset}–${finding.endOffset}`,
          ...(finding.pageNumber !== null ? [`**${isArabic ? "صفحة المصدر" : "Source page"}:** ${finding.pageNumber}`] : []),
          `**${isArabic ? "التوضيح" : "Explanation"}:** ${finding.explanation}`,
          `**${isArabic ? "سؤال للمناقشة" : "Question to discuss"}:** ${finding.question}`,
          ...(sourceResult?.references.length
            ? sourceResult.references.flatMap((reference) => [
              `**${isArabic ? "مرجع بحثي" : "Research reference"}:** [${reference.title} · ${reference.citation}](${reference.url})`,
              `**${isArabic ? "حالة المصدر" : "Source status"}:** ${isArabic ? reference.sourceNoteAr : `${reference.sourceNote} ${reference.note}`}`,
              `**${isArabic ? "بيانات النسخة والنطاق" : "Version and scope metadata"}:** ${reference.sourceId}; ${isArabic ? reference.versionDescriptionAr : reference.versionDescription}; ${isArabic ? "الجهة" : "Authority"}: ${isArabic ? reference.issuingAuthorityAr : reference.issuingAuthority}; ${isArabic ? "النطاق" : "Territory"}: ${isArabic ? reference.territorialScopeAr : reference.territorialScope}; ${isArabic ? "تاريخ التحقق من الحالة" : "Status checked"}: ${reference.statusCheckedOn}${reference.statusSourceUrl ? ` ([${isArabic ? "مصدر الحالة" : "status source"}](${reference.statusSourceUrl}))` : ""}`,
              `**${isArabic ? "تاريخ التحقق" : "Checked on"}:** ${reference.checkedOn}`,
            ])
            : [`**${isArabic ? "المراجع" : "References"}:** ${isArabic ? "لم يتم التحقق من مصدر محدد لهذا الموضوع في الاختصاص المختار ضمن السجل الحالي." : sourceResult?.unavailableReason ?? "No connected reference."}`]),
          "",
        ];
      }),
      `## ${isArabic ? "حدود التقرير" : "Report limitations"}`,
      analysis.disclaimer,
      isArabic
        ? "نتائج الفحص الأولي ومراجع البحث لا تمثل رأياً قانونياً ولا تثبت صحة النص المستخرج أو انطباق أي قانون. راجع المستند الأصلي واستشر محامياً مؤهلاً."
        : "Screening findings and research references are not legal advice and do not establish that extracted text is accurate or that a law applies. Check the original document and consult a qualified lawyer.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = extraction.fileName.replace(/\.[^.]+$/u, "").replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 80) || "contract-review";
    link.href = url;
    link.download = `${safeName}-review.md`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadNegotiationBrief() {
    if (!analysis || !extraction || !negotiationGoal.trim() || !negotiationProposal.trim()) return;
    const finding = analysis.findings.find((item) => item.id === negotiationFindingId) ?? analysis.findings[0];
    if (!finding) return;
    const isArabic = analysis.language === "ar";
    const referenceItems = analysis.legalReferences.find((item) => item.findingId === finding.id)?.references ?? [];
    const lines = [
      isArabic ? "# مذكرة نقاش تفاوضي" : "# Negotiation discussion brief",
      "",
      `${isArabic ? "المستند" : "Document"}: ${extraction.fileName}`,
      `${isArabic ? "الاختصاص المختار" : "Selected jurisdiction"}: ${analysis.jurisdiction}`,
      `${isArabic ? "البند" : "Clause topic"}: ${finding.title}`,
      `${isArabic ? "الصفحة" : "Source page"}: ${finding.pageNumber ?? (isArabic ? "غير محددة" : "Not available")}`,
      "",
      `## ${isArabic ? "النص المستخرج" : "Extracted wording"}`,
      finding.evidence,
      "",
      `## ${isArabic ? "هدفك في التفاوض" : "Your negotiation goal"}`,
      negotiationGoal.trim(),
      `## ${isArabic ? "صياغة اقترحتها أنت" : "Your proposed wording"}`,
      negotiationProposal.trim(),
      `## ${isArabic ? "سبب الاقتراح" : "Why you are proposing this"}`,
      negotiationRationale.trim() || (isArabic ? "لم يحدد." : "Not provided."),
      `## ${isArabic ? "المقايضات أو الآثار" : "Tradeoffs or effects to discuss"}`,
      negotiationTradeoffs.trim() || (isArabic ? "لم تحدد." : "Not provided."),
      `## ${isArabic ? "أسئلة ونقاط غير محسومة" : "Questions and unresolved points"}`,
      negotiationQuestions.trim() || (isArabic ? "لم تحدد." : "Not provided."),
      "",
      ...(referenceItems.length ? [`## ${isArabic ? "روابط بحثية مرتبطة بالبند" : "Research links connected to this topic"}`, ...referenceItems.map((item) => `- [${item.title} · ${item.citation}](${item.url})`), ""] : []),
      `## ${isArabic ? "مهم" : "Important"}`,
      isArabic
        ? "هذه مذكرة تفاوض من إعداد المستخدم وليست صياغة مولدة أو معتمدة قانونياً. لم يتم التحقق من انطباق القانون أو صلاحية الاقتراح. راجع النص الأصلي واستشر محامياً مؤهلاً قبل اعتماد أي تعديل."
        : "This discussion brief contains wording provided by the user; it is not AI-generated or legally approved. Applicable law and proposal validity were not verified. Check the original and consult a qualified lawyer before adopting any change.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = extraction.fileName.replace(/\.[^.]+$/u, "").replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 80) || "contract";
    link.href = url;
    link.download = `${safeName}-negotiation-brief.md`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function extractContract() {
    if (!file) return;
    setIsExtracting(true);
    setExtractError("");
    const body = new FormData();
    body.set("file", file);
    body.set("ocrLanguage", ocrLanguage);
    try {
      const response = await fetch("/api/extract", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "We could not extract text from that file.");
      setExtraction(result as ExtractionResult);
      setAnalysis(null);
      setShowReport(false);
      setOcrVerified(false);
      resetNegotiation();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : "The extraction request failed. Try again.");
    } finally {
      setIsExtracting(false);
    }
  }

  async function analyzeExtractedContract() {
    if (!extraction?.text) return;
    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);
    resetNegotiation();
    const selectedLanguage = responseLanguage === "auto" ? detectAnalysisLanguage(extraction.text) : responseLanguage;
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extraction.text, language: selectedLanguage, jurisdiction }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "The document could not be analyzed.");
      setAnalysis(result as AnalysisResult);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "The analysis request failed. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const detectedLanguage = extraction ? detectDocumentLanguage(extraction.text) : "Undetermined";
  const effectiveResponseLanguage = responseLanguage === "auto"
    ? detectAnalysisLanguage(extraction?.text ?? "") === "ar" ? "Arabic" : "English"
    : responseLanguage === "ar" ? "Arabic" : "English";
  const negotiationFinding = analysis?.findings.find((finding) => finding.id === negotiationFindingId) ?? analysis?.findings[0];

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <a className="brand" href="#home" aria-label="LegalMind home"><span className="brand-mark"><Icon name="scale" size={22}/></span><span>legal<span className="brand-light">mind</span><small>LEGAL CLARITY, MADE SIMPLE</small></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation"><button className={`nav-link nav-button ${!showReport && !extraction ? "active" : ""}`} onClick={() => { setShowReport(false); setExtraction(null); }}><Icon name="home"/>Overview</button><button className={`nav-link nav-button ${showReport || extraction ? "active" : ""}`} onClick={() => { setShowReport(false); setExtraction(null); }}><Icon name="file"/>Contract review</button><a className="nav-link" href="#activity"><Icon name="clock"/>Activity</a></nav>
        <div className="sidebar-bottom"><div className="privacy-card"><span className="privacy-icon"><Icon name="shield" size={18}/></span><strong>Prototype privacy</strong><p>No documents are stored. Selected files are sent to this app for text extraction only.</p><span className="privacy-more">No account data is saved</span></div><a className="nav-link settings-link" href="#settings"><Icon name="settings"/>Settings</a><div className="profile"><div className="avatar">AM</div><div><strong>Ahmed Mohamed</strong><small>Freelancer account</small></div><span className="profile-dots">···</span></div></div>
      </aside>

      <section className="main-panel" id="home">
        <header className="topbar"><button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMobileNav(!mobileNav)}><Icon name="menu"/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{showReport ? "Contract report" : extraction ? "Extracted text" : "Overview"}</strong></div><div className="topbar-right"><span className="secure-status"><i/> Prototype</span><button className="help-link" onClick={() => document.getElementById("help")?.scrollIntoView({ behavior: "smooth" })}>Help center <span>↗</span></button></div></header>

        <div className={`content ${showReport || extraction ? "report-content" : ""}`}>
          {!showReport && !extraction ? <>
            <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR CONTRACT, CLEARER</div><h1>Know what you’re<br className="desktop-break"/> <em>signing.</em></h1><p className="welcome-copy">Extract a PDF or DOCX, review the text, then run a bilingual first-pass clause screen with linked legal-source leads.</p></div><div className="welcome-stamp"><div className="stamp-icon"><Icon name="scale" size={25}/></div><div><strong>Made for freelancers</strong><span>Starting with Egypt</span></div></div></section>
            <section className="review-card" id="review"><div className="card-heading"><div><div className="step-label"><span>01</span> START A REVIEW</div><h2>Let’s look at your contract.</h2><p>Upload a document to extract its text and screen selected clause topics.</p></div><div className="document-illustration"><div className="doc-back"/><div className="doc-front"><span/><span/><span/><b/></div><div className="doc-check"><Icon name="check" size={15}/></div></div></div>
              <div className={`upload-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}><input ref={inputRef} className="visually-hidden" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFileChange}/>{file ? <><div className="upload-icon file-ready"><Icon name="file" size={22}/></div><div className="upload-text"><strong>{file.name}</strong><span>{(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to send to this app</span></div><button className="remove-file" onClick={() => { setFile(null); setExtraction(null); if (inputRef.current) inputRef.current.value = ""; }} aria-label="Remove selected file"><Icon name="close" size={17}/></button></> : <><div className="upload-icon"><Icon name="upload" size={21}/></div><div className="upload-text"><strong>Drop your contract here, or <button className="browse-button" onClick={() => inputRef.current?.click()}>browse files</button></strong><span>PDF or DOCX document · Up to 20 MB</span></div></>}</div>
              {fileError && <p className="file-error" role="alert">{fileError}</p>}
              <div className="review-options"><div className="review-field"><label className="field-label" htmlFor="jurisdiction">JURISDICTION FOR FUTURE REVIEW</label><div className="select-wrap"><select id="jurisdiction" value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}><option>Egypt</option><option>United Arab Emirates</option><option>I’m not sure</option></select><span className="select-caret">⌄</span></div></div><div className="review-field"><label className="field-label" htmlFor="ocr-language">OCR LANGUAGE IF NEEDED</label><div className="select-wrap"><select id="ocr-language" value={ocrLanguage} onChange={(event) => setOcrLanguage(event.target.value)}><option value="ara+eng">Arabic + English</option><option value="ara">Arabic</option><option value="eng">English</option></select><span className="select-caret">⌄</span></div></div><button className="primary-button" disabled={!file || isExtracting} onClick={() => void extractContract()}>{isExtracting ? "Extracting text…" : "Extract contract text"} {!isExtracting && <Icon name="arrow" size={17}/>}</button></div>
              {extractError && <p className="file-error" role="alert">{extractError}</p>}
              <div className="card-foot"><span><Icon name="shield" size={15}/> Sent to this app server for processing; not saved</span><span className="selected-law">Selected jurisdiction: {jurisdiction}</span></div>
            </section>
            <section className="below-grid" id="activity"><article className="how-card"><div className="step-label"><span>02</span> WHAT A REVIEW CAN SHOW</div><h3>Clarity, in three steps.</h3><div className="steps"><div className="mini-step"><span className="mini-number">1</span><div><strong>Understand the terms</strong><p>See key points explained in plain language.</p></div></div><div className="mini-step"><span className="mini-number">2</span><div><strong>Spot what to discuss</strong><p>Find clauses that may deserve a closer look.</p></div></div><div className="mini-step"><span className="mini-number">3</span><div><strong>Know what to ask</strong><p>Prepare useful questions before you sign.</p></div></div></div></article><article className="trust-card" id="privacy"><div className="trust-top"><div className="trust-icon"><Icon name="shield" size={20}/></div><span className="trust-tag">PROTOTYPE</span></div><h3>Your work is your own.</h3><p>The document is sent to this app server for extraction and analysis, processed in memory, and not saved by this prototype.</p><a href="#privacy">Privacy comes first <Icon name="arrow" size={14}/></a><div className="trust-decoration"/></article></section>
          </> : showReport ? <>
            <button className="back-link" onClick={() => setShowReport(false)}><Icon name="back" size={17}/> {analysis?.language === "ar" ? "العودة إلى النص المستخرج" : "Back to extracted text"}</button>
            {analysis && extraction ? <>
              <div className="report-title-row"><div><div className="eyebrow"><span className="eyebrow-line"/> {analysis.language === "ar" ? "تقرير مراجعة العقد" : "CONTRACT REVIEW REPORT"}</div><h1>{analysis.language === "ar" ? <>تقرير <em>المراجعة.</em></> : <>Review <em>report.</em></>}</h1><p className="welcome-copy">{analysis.language === "ar" ? "فحص أولي مبني على النص المستخرج من مستندك." : "Initial screening based on text extracted from your document."}</p></div><div className="report-actions"><button className="secondary-button" disabled={!analysis.findings.length} onClick={() => setNegotiationOpen(!negotiationOpen)}>{analysis.language === "ar" ? "إعداد مذكرة تفاوض" : "Prepare negotiation brief"}</button><button className="secondary-button" onClick={downloadReviewReport}>{analysis.language === "ar" ? "تنزيل التقرير" : "Download report"}</button></div></div>
              <div className="processing-notice"><span className="processing-notice-icon"><Icon name="shield" size={17}/></span><div><strong>{analysis.language === "ar" ? "نتائج فحص أولي وليست رأياً قانونياً." : "These are initial screening results, not legal advice."}</strong><p>{analysis.language === "ar" ? "راجع النص الأصلي والمراجع المرتبطة، واستشر محامياً مؤهلاً قبل اتخاذ قرار قانوني." : "Check the original text and linked references, and consult a qualified lawyer before making a legal decision."}</p></div></div>
              <section className="report-meta-card extraction-meta"><div className="report-file-icon"><Icon name="file" size={19}/></div><div className="report-file-name"><strong>{extraction.fileName}</strong><span>{extraction.fileType} · {extraction.text.length.toLocaleString()} {analysis.language === "ar" ? "حرفاً مستخرجاً" : "extracted characters"}</span></div><div className="meta-divider"/><div className="report-law"><span>{analysis.language === "ar" ? "الاختصاص المختار" : "SELECTED JURISDICTION"}</span><strong>{analysis.jurisdiction}</strong></div><div className="report-date"><span>{analysis.language === "ar" ? "لغة التقرير" : "REPORT LANGUAGE"}</span><strong>{analysis.language === "ar" ? "العربية" : "English"}</strong></div></section>
              <section className="analysis-results" dir={analysis.language === "ar" ? "rtl" : "ltr"} lang={analysis.language}>{analysis.contractFacts.length ? <section className="contract-facts-card"><div className="step-label"><span>02</span> {analysis.language === "ar" ? "قيم مستخرجة" : "EXTRACTED VALUES"}</div><h2>{analysis.language === "ar" ? "تحقق من المبالغ والتواريخ والمهل" : "Check amounts, dates, and payment periods"}</h2><ul>{analysis.contractFacts.map((fact) => <li key={fact.id}><div><strong>{fact.label}: {fact.value}</strong>{fact.pageNumber !== null && <span className="fact-source-page">{analysis.language === "ar" ? `الصفحة ${fact.pageNumber}` : `Page ${fact.pageNumber}`}</span>}</div><p>{fact.evidence}</p></li>)}</ul><p className="fact-limit-note">{analysis.language === "ar" ? "هذه قيم مرشحة مستخرجة من النص وليست تأكيداً لمعناها أو انطباقها. راجع المستند الأصلي." : "These are candidate values found in the text, not confirmation of their meaning or applicability. Check the original document."}</p></section> : null}
            {analysis.obligations.length ? <section className="contract-facts-card"><div className="step-label"><span>03</span> {analysis.language === "ar" ? "التزامات مرشحة" : "OBLIGATION CANDIDATES"}</div><h2>{analysis.language === "ar" ? "راجع من يفعل ماذا ومتى" : "Review who does what and when"}</h2><ul>{analysis.obligations.map((item) => <li key={item.id}><div><strong>{item.partyRole}: {item.dutyVerb}</strong>{item.pageNumber !== null && <span className="fact-source-page">{analysis.language === "ar" ? `الصفحة ${item.pageNumber}` : `Page ${item.pageNumber}`}</span>}</div><p>{item.evidence}</p>{item.amountCandidates.length > 0 && <p>{analysis.language === "ar" ? "مبالغ مرشحة" : "Amount candidates"}: {item.amountCandidates.join(", ")}</p>}{item.timingCandidates.length > 0 && <p>{analysis.language === "ar" ? "مواعيد مرشحة" : "Timing candidates"}: {item.timingCandidates.join(", ")}</p>}{item.triggerCandidates.length > 0 && <p>{analysis.language === "ar" ? "عبارات بدء مرشحة" : "Trigger wording"}: {item.triggerCandidates.join(" | ")}</p>}{item.conditionCandidates.length > 0 && <p>{analysis.language === "ar" ? "شروط مرشحة" : "Condition wording"}: {item.conditionCandidates.join(" | ")}</p>}</li>)}</ul><p className="fact-limit-note">{analysis.language === "ar" ? "هذه صياغات مرشحة مستخرجة آلياً وليست تأكيداً للمسؤولية القانونية أو تفسيراً للالتزام. راجع النص الأصلي." : "These are automatically detected candidate wordings, not confirmation or interpretation of legal responsibility. Check the original text."}</p></section> : null}\n            <div className="analysis-results-heading"><div><div className="step-label"><span>01</span> {analysis.language === "ar" ? "فحص أولي" : "INITIAL SCREENING"}</div><h2>{analysis.language === "ar" ? "بنود تستحق المراجعة" : "Items to review"}</h2></div><span className="analysis-count">{analysis.findings.length} {analysis.language === "ar" ? "بنود" : "findings"}</span></div><p className="analysis-summary">{analysis.summary}</p><p className="research-verification-note">{analysis.language === "ar" ? "لم يُسترجع نص أي مادة قانونية إلى النظام؛ المراجع روابط بحثية فقط، ولم يتم التحقق من أي ادعاء قانوني أو انطباقه." : "No legal provision text was retrieved into the system. Citations are research links only; no legal claim or applicability has been verified."}</p>{analysis.findings.length ? <div className="analysis-findings">{analysis.findings.map((finding) => { const referenceResult = analysis.legalReferences.find((entry) => entry.findingId === finding.id); return <article className="analysis-finding" key={finding.id}><div className="finding-topline"><span className="finding-category">{finding.category}</span><span className="finding-priority priority-review">{analysis.language === "ar" ? "للمراجعة" : "Review"}</span></div><h3>{finding.title}</h3><p className="finding-match">{analysis.language === "ar" ? "العبارة المطابقة:" : "Matched wording:"} <q>{finding.matchedText}</q></p>{finding.pageNumber !== null && <p className="finding-source-page">{analysis.language === "ar" ? `الصفحة ${finding.pageNumber}` : `Source page ${finding.pageNumber}`}</p>}<blockquote>{finding.evidence || (analysis.language === "ar" ? "لم يتوفر اقتباس واضح." : "No clear evidence quote was available.")}</blockquote><p>{finding.explanation}</p><div className="finding-question"><strong>{analysis.language === "ar" ? "سؤال للمناقشة" : "Question to discuss"}</strong><p>{finding.question}</p></div><div className="legal-references"><strong>{analysis.language === "ar" ? "مراجع قانونية مرتبطة — للاستدلال البحثي فقط" : "Related legal references — research leads only"}</strong>{referenceResult?.references.length ? referenceResult.references.map((reference) => <div className="legal-reference" key={`${reference.url}-${reference.citation}`}><a href={reference.url} target="_blank" rel="noreferrer">{reference.title} · {reference.citation} <span aria-label="opens in new tab">↗</span></a><span>{analysis.language === "ar" ? "تاريخ السريان" : "Effective"}: {reference.effectiveFrom} · {reference.language} · {analysis.language === "ar" ? "تم التحقق من المصدر" : "Source checked"}: {reference.checkedOn}</span><details><summary>{analysis.language === "ar" ? "حالة المصدر وحدوده" : "Source status and limits"}</summary><p>{analysis.language === "ar" ? `${reference.sourceNoteAr} ${reference.versionDescriptionAr}. النطاق: ${reference.territorialScopeAr}. الجهة: ${reference.issuingAuthorityAr}. تاريخ التحقق من الحالة: ${reference.statusCheckedOn}.` : `${reference.sourceNote} ${reference.note} Version: ${reference.versionDescription}; territory: ${reference.territorialScope}; authority: ${reference.issuingAuthority}; status checked: ${reference.statusCheckedOn}.`}</p>{reference.statusSourceUrl && <a href={reference.statusSourceUrl} target="_blank" rel="noreferrer">{analysis.language === "ar" ? "مصدر حالة التشريع" : "Source for status metadata"}</a>}</details></div>) : <p className="no-legal-reference">{analysis.language === "ar" ? "لم يتم التحقق من مصدر محدد لهذا الموضوع في الاختصاص المختار ضمن السجل الحالي." : referenceResult?.unavailableReason}</p>}</div></article>; })}</div> : <p className="analysis-empty">{analysis.language === "ar" ? "لم تعثر قواعد الفحص على الأنماط المحددة. قد تظل هناك مسائل أخرى تستحق المراجعة." : "The screening rules did not find these selected patterns. Other issues may still need review."}</p>}<footer className="analysis-disclaimer">{analysis.disclaimer}</footer></section>
              {negotiationOpen && <section className="negotiation-workspace" dir={analysis.language === "ar" ? "rtl" : "ltr"} lang={analysis.language}><div className="step-label"><span>08</span> {analysis.language === "ar" ? "دعم التفاوض" : "NEGOTIATION SUPPORT"}</div><h2>{analysis.language === "ar" ? "صغ اقتراحك أنت" : "Prepare your own proposal"}</h2><p className="negotiation-safety-note">{analysis.language === "ar" ? "لا ينشئ النظام صياغة قانونية. استخدم حقولك لتوثيق هدفك ونصك المقترح، ثم راجعه مع محامٍ مؤهل قبل إرساله." : "The system does not draft legal wording. Use these fields to record your goal and proposed text, then ask a qualified lawyer to review it before sending."}</p><label>{analysis.language === "ar" ? "البند المرتبط" : "Related finding"}<select value={negotiationFinding?.id ?? ""} onChange={(event) => { setNegotiationFindingId(event.target.value); setNegotiationGoal(""); setNegotiationProposal(""); setNegotiationRationale(""); setNegotiationTradeoffs(""); setNegotiationQuestions(""); }}>{analysis.findings.map((finding) => <option key={finding.id} value={finding.id}>{finding.title}</option>)}</select></label><div className="negotiation-fields"><label>{analysis.language === "ar" ? "ما النتيجة التي تريدها؟" : "What outcome do you want?"}<textarea value={negotiationGoal} onChange={(event) => setNegotiationGoal(event.target.value)} rows={3} maxLength={2000}/></label><label>{analysis.language === "ar" ? "صياغتك المقترحة" : "Your proposed wording"}<textarea value={negotiationProposal} onChange={(event) => setNegotiationProposal(event.target.value)} rows={5} maxLength={6000}/></label><label>{analysis.language === "ar" ? "لماذا تقترح هذا التغيير؟" : "Why are you proposing this change?"}<textarea value={negotiationRationale} onChange={(event) => setNegotiationRationale(event.target.value)} rows={3} maxLength={2000}/></label><label>{analysis.language === "ar" ? "ما المقايضات أو الآثار التي تريد مناقشتها؟" : "What tradeoffs or effects do you want to discuss?"}<textarea value={negotiationTradeoffs} onChange={(event) => setNegotiationTradeoffs(event.target.value)} rows={3} maxLength={2000}/></label><label>{analysis.language === "ar" ? "أسئلة أو نقاط لم تُحسم" : "Questions or unresolved points"}<textarea value={negotiationQuestions} onChange={(event) => setNegotiationQuestions(event.target.value)} rows={3} maxLength={2000}/></label></div>{negotiationFinding && <div className="negotiation-comparison"><article><h3>{analysis.language === "ar" ? "النص المستخرج" : "Extracted wording"}</h3><blockquote>{negotiationFinding.evidence}</blockquote></article><article><h3>{analysis.language === "ar" ? "اقتراحك" : "Your proposal"}</h3><p>{negotiationProposal || (analysis.language === "ar" ? "اكتب صياغتك هنا؛ لن يملأ النظام هذا الحقل." : "Write your proposed wording here; the system will not fill this field.")}</p></article></div>}<button className="primary-button negotiation-download" disabled={!negotiationGoal.trim() || !negotiationProposal.trim()} onClick={downloadNegotiationBrief}>{analysis.language === "ar" ? "تنزيل مذكرة النقاش" : "Download discussion brief"}</button></section>}
              {(extraction.ocrUsed || extraction.truncated || extraction.ocrPageLimitReached) && <p className="report-disclaimer" dir={analysis.language === "ar" ? "rtl" : "ltr"}>{analysis.language === "ar" ? "قد يكون النص المستخرج ناقصاً أو متأثراً بأخطاء OCR. راجع المستند الأصلي، خصوصاً الأسماء والمبالغ والتواريخ والنفي." : "Extracted text may be incomplete or affected by OCR errors. Check the original document, especially names, amounts, dates, and negations."}</p>}
            </> : <p className="analysis-empty">No completed analysis is available. Return to the review and analyze a document first.</p>}          </> : extraction ? <>
            <button className="back-link" onClick={() => setExtraction(null)}><Icon name="back" size={17}/> Back to upload</button>
            <div className="report-title-row"><div><div className="eyebrow"><span className="eyebrow-line"/> DOCUMENT PROCESSING</div><h1>Text <em>extracted.</em></h1><p className="welcome-copy">Check that the text looks complete before using it elsewhere.</p></div><span className="extraction-complete"><Icon name="check" size={15}/> Extraction complete</span></div>
            <div className="processing-notice"><span className="processing-notice-icon"><Icon name="shield" size={17}/></span><div><strong>Processed in memory. This prototype does not save your document.</strong><p>The file was sent to this app server for text extraction. No legal analysis was performed, and no legal sources were checked.</p></div></div>
            <section className="report-meta-card extraction-meta"><div className="report-file-icon"><Icon name="file" size={19}/></div><div className="report-file-name"><strong>{extraction.fileName}</strong><span>{extraction.fileType} · {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "processed in this session"}</span></div><div className="meta-divider"/><div className="report-law"><span>PAGE COUNT</span><strong>{extraction.pageCount ?? "Not available"}</strong></div><div className="report-date"><span>EXTRACTED TEXT</span><strong>{extraction.text.length.toLocaleString()} characters</strong></div></section>
            {extraction.needsOcr && <div className="ocr-notice"><Icon name="alert" size={17}/><span>{extraction.ocrUsed ? "No text was recognized. Try a different OCR language or a clearer scan." : "No text was found in this document."}</span></div>}
            {extraction.ocrUsed && <div className={`ocr-result ${extraction.ocrLowConfidence ? "ocr-result-low" : ""}`} role="status"><Icon name={extraction.ocrLowConfidence ? "alert" : "check"} size={17}/><div><strong>{extraction.ocrLowConfidence ? "Low OCR confidence — verify against the original" : "OCR was used for scanned pages"}</strong><p>Pages {extraction.ocrPages.join(", ")} · {extraction.ocrLanguage === "ara+eng" ? "Arabic + English" : extraction.ocrLanguage === "ara" ? "Arabic" : "English"}{extraction.ocrConfidence !== null ? ` · OCR confidence signal ${extraction.ocrConfidence}/100` : ""}. This signal is not an accuracy score. Verify names, amounts, dates, and negations against the original.</p></div></div>}
            {extraction.ocrUsed && <section className="source-review" aria-labelledby="source-review-title"><div className="source-review-copy"><strong id="source-review-title">Compare OCR text with the source</strong><p>OCR can misread important figures even when its confidence signal is high.</p></div>{originalUrl && <a className="source-open-link" href={originalUrl} target="_blank" rel="noreferrer">Open original {extraction.fileType} <span aria-hidden="true">↗</span></a>}<label className="source-check"><input type="checkbox" checked={ocrVerified} onChange={(event) => setOcrVerified(event.target.checked)}/><span>I checked names, amounts, dates, and negations against the original.</span></label>{ocrVerified && <span className="source-reviewed"><Icon name="check" size={14}/> Marked reviewed this session</span>}</section>}
            {extraction.ocrPageLimitReached && <div className="ocr-notice"><Icon name="alert" size={17}/><span>OCR is limited to 10 scanned pages per request. Some later scanned pages may be missing from this text.</span></div>}
            {extraction.pageProvenance?.length ? <details className="page-provenance"><summary>Show page-by-page extraction details</summary><ul>{extraction.pageProvenance.map((page) => <li key={page.pageNumber}>Page {page.pageNumber}: {page.source === "text-layer+ocr" ? "text layer + OCR" : page.source === "text-layer" ? "embedded text" : page.source === "ocr" ? "OCR" : "no text found"}{page.ocrConfidence !== null ? ` · OCR confidence signal ${page.ocrConfidence}/100` : ""}{page.ocrSkippedDueToPageLimit ? " · OCR skipped: 10-page limit reached" : ""}</li>)}</ul><p>These labels describe how text was extracted; they do not measure whether the extracted content is correct.</p></details> : null}
            {extraction.truncated && <div className="ocr-notice"><Icon name="alert" size={17}/><span>For safety, the text preview stops at 200,000 characters.</span></div>}
            <section className="extracted-text-card"><div className="extracted-text-heading"><div><div className="step-label"><span>01</span> EXTRACTED CONTENT</div><h2>Review the extracted text</h2></div><button className="copy-button copy-full" disabled={!extraction.text} onClick={() => void copyText("extracted-text", extraction.text)}><Icon name="copy" size={14}/>{copied === "extracted-text" ? "Copied" : "Copy text"}</button></div><pre className="extracted-text">{extraction.text || "No machine-readable text was found in this file."}</pre></section>
            <div className="extraction-next"><div><strong>Initial clause screening</strong><p>Flags selected payment, termination, ownership, liability, renewal, and dispute wording. It does not verify current law or replace a lawyer’s review.</p><p className="language-detection">Detected document language: <strong>{detectedLanguage}</strong> · Analysis response: <strong>{effectiveResponseLanguage}</strong></p></div><label className="response-language-field">ANALYSIS LANGUAGE<select value={responseLanguage} onChange={(event) => setResponseLanguage(event.target.value as "auto" | "ar" | "en")}><option value="auto">Match document automatically</option><option value="ar">Arabic</option><option value="en">English</option></select></label><button className="primary-button analysis-button" disabled={!extraction.text || extraction.text.length > 80000 || isAnalyzing} onClick={() => void analyzeExtractedContract()}>{isAnalyzing ? "Reviewing clauses…" : "Analyze contract"} {!isAnalyzing && <Icon name="arrow" size={15}/>}</button></div>
            {analysis && <div className="report-download-row"><button className="secondary-button" onClick={() => setShowReport(true)}>{analysis.language === "ar" ? "عرض التقرير" : "View report"}</button></div>}
            {extraction.text.length > 80000 && <div className="ocr-notice"><Icon name="alert" size={17}/><span>Initial analysis is limited to 80,000 characters. Shorten the document by analyzing sections separately.</span></div>}
            {analysisError && <div className="ocr-notice" role="alert"><Icon name="alert" size={17}/><span>{analysisError}</span></div>}
            {analysis && <section className="analysis-results" dir={analysis.language === "ar" ? "rtl" : "ltr"} lang={analysis.language}>{analysis.contractFacts.length ? <section className="contract-facts-card"><div className="step-label"><span>02</span> {analysis.language === "ar" ? "قيم مستخرجة" : "EXTRACTED VALUES"}</div><h2>{analysis.language === "ar" ? "تحقق من المبالغ والتواريخ والمهل" : "Check amounts, dates, and payment periods"}</h2><ul>{analysis.contractFacts.map((fact) => <li key={fact.id}><div><strong>{fact.label}: {fact.value}</strong>{fact.pageNumber !== null && <span className="fact-source-page">{analysis.language === "ar" ? `الصفحة ${fact.pageNumber}` : `Page ${fact.pageNumber}`}</span>}</div><p>{fact.evidence}</p></li>)}</ul><p className="fact-limit-note">{analysis.language === "ar" ? "هذه قيم مرشحة مستخرجة من النص وليست تأكيداً لمعناها أو انطباقها. راجع المستند الأصلي." : "These are candidate values found in the text, not confirmation of their meaning or applicability. Check the original document."}</p></section> : null}
            <div className="analysis-results-heading"><div><div className="step-label"><span>02</span> {analysis.language === "ar" ? "فحص أولي" : "INITIAL SCREENING"}</div><h2>{analysis.language === "ar" ? "نتائج مراجعة أولية" : "Initial review findings"}</h2></div><span className="analysis-count">{analysis.findings.length} {analysis.language === "ar" ? "بنود" : "findings"}</span></div><p className="analysis-summary">{analysis.summary}</p><p className="research-verification-note">{analysis.language === "ar" ? "لم يُسترجع نص أي مادة قانونية إلى النظام؛ المراجع روابط بحثية فقط، ولم يتم التحقق من أي ادعاء قانوني أو انطباقه." : "No legal provision text was retrieved into the system. Citations are research links only; no legal claim or applicability has been verified."}</p>{analysis.findings.length ? <div className="analysis-findings">{analysis.findings.map((finding) => { const referenceResult = analysis.legalReferences.find((entry) => entry.findingId === finding.id); return <article className="analysis-finding" key={finding.id}><div className="finding-topline"><span className="finding-category">{finding.category}</span><span className={`finding-priority priority-${finding.priority.toLowerCase()}`}>{analysis.language === "ar" ? "للمراجعة" : finding.priority}</span></div><h3>{finding.title}</h3><p className="finding-match">{analysis.language === "ar" ? "العبارة المطابقة:" : "Matched wording:"} <q>{finding.matchedText}</q></p>{finding.pageNumber !== null && <p className="finding-source-page">{analysis.language === "ar" ? `الصفحة ${finding.pageNumber}` : `Source page ${finding.pageNumber}`}</p>}<blockquote>{finding.evidence || (analysis.language === "ar" ? "لم يتوفر اقتباس واضح." : "No clear evidence quote was available.")}</blockquote><p>{finding.explanation}</p><div className="finding-question"><strong>{analysis.language === "ar" ? "سؤال للمناقشة" : "Question to discuss"}</strong><p>{finding.question}</p></div><div className="legal-references"><strong>{analysis.language === "ar" ? "مراجع قانونية مرتبطة — للاستدلال البحثي فقط" : "Related legal references — research leads only"}</strong>{referenceResult?.references.length ? referenceResult.references.map((reference) => <div className="legal-reference" key={`${reference.url}-${reference.citation}`}><a href={reference.url} target="_blank" rel="noreferrer">{reference.title} · {reference.citation} <span aria-label="opens in new tab">↗</span></a><span>{analysis.language === "ar" ? "تاريخ السريان" : "Effective"}: {reference.effectiveFrom} · {reference.language} · {analysis.language === "ar" ? "تم التحقق من المصدر" : "Source checked"}: {reference.checkedOn}</span><details><summary>{analysis.language === "ar" ? "حالة المصدر وحدوده" : "Source status and limits"}</summary><p>{analysis.language === "ar" ? `${reference.sourceNoteAr} ${reference.versionDescriptionAr}. النطاق: ${reference.territorialScopeAr}. الجهة: ${reference.issuingAuthorityAr}. تاريخ التحقق من الحالة: ${reference.statusCheckedOn}.` : `${reference.sourceNote} ${reference.note} Version: ${reference.versionDescription}; territory: ${reference.territorialScope}; authority: ${reference.issuingAuthority}; status checked: ${reference.statusCheckedOn}.`}</p>{reference.statusSourceUrl && <a href={reference.statusSourceUrl} target="_blank" rel="noreferrer">{analysis.language === "ar" ? "مصدر حالة التشريع" : "Source for status metadata"}</a>}</details></div>) : <p className="no-legal-reference">{analysis.language === "ar" ? referenceResult?.unavailableReason === "Select the contract jurisdiction to see any connected legal references." ? "اختر الاختصاص القضائي لعرض المراجع القانونية المتاحة." : "لا يوجد مصدر قانوني موثق ومرتبط بهذا الموضوع والاختصاص في هذه النسخة." : referenceResult?.unavailableReason}</p>}</div></article>; })}</div> : <p className="analysis-empty">{analysis.language === "ar" ? "لم تعثر قواعد الفحص على الأنماط المحددة. قد تظل هناك مسائل أخرى تستحق المراجعة." : "The screening rules did not find these selected patterns. Other issues may still need review."}</p>}<footer className="analysis-disclaimer">{analysis.disclaimer}</footer></section>}
            <footer className="report-disclaimer">Text extraction can miss tables, layout, or text in scanned images. Review the original document before relying on this output.</footer>
          </> : null}
          <footer className="page-footer" id="help"><span>© 2026 LegalMind</span><span>Designed for clarity. Built with care.</span><a href="#help">Need a hand? <span>↗</span></a></footer>
        </div>
      </section>
    </main>
  );
}
