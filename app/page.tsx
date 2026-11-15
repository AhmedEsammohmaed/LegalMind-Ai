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

type Filter = "All items" | "High priority" | "Worth discussing";
type ExtractionResult = { fileName: string; fileType: "PDF" | "DOCX"; text: string; pageCount: number | null; truncated: boolean; needsOcr: boolean; ocrUsed: boolean; ocrLanguage: string | null; ocrConfidence: number | null; ocrLowConfidence: boolean; ocrPages: number[]; ocrPageLimitReached: boolean };

function detectDocumentLanguage(text: string): "Arabic" | "English" | "Mixed" | "Undetermined" {
  const letters = text.match(/[\p{L}]/gu) ?? [];
  if (!letters.length) return "Undetermined";
  const arabic = letters.filter((letter) => /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u.test(letter)).length;
  const ratio = arabic / letters.length;
  if (ratio >= 0.8) return "Arabic";
  if (ratio <= 0.2) return "English";
  return "Mixed";
}

const demoRisks = [
  { id: "payment", level: "High priority", title: "Payment depends on open-ended approval", clause: "Payment is due after the client has approved the deliverables.", why: "The clause does not set a review deadline or explain what happens if feedback is delayed. That could make it harder to know when payment is due.", action: "Ask for a fixed review window and a payment date, even if the client does not respond.", suggestion: "The client will review each deliverable within 5 business days. If no written feedback is received in that period, the deliverable will be considered accepted. Invoices are payable within 14 days of acceptance." },
  { id: "ip", level: "Worth discussing", title: "Work ownership transfers before payment", clause: "All work product created under this agreement belongs to the client.", why: "The example wording does not say whether ownership transfers only after full payment, or how your pre-existing tools and materials are treated.", action: "Clarify when ownership transfers and carve out materials you already own.", suggestion: "Upon full payment of the applicable fees, the client owns the final deliverables created specifically under this agreement. The freelancer retains ownership of pre-existing materials, tools, and know-how." },
  { id: "termination", level: "Worth discussing", title: "No clear payment if the project ends early", clause: "Either party may terminate this agreement by written notice.", why: "The example does not explain payment for completed work, work in progress, or committed costs if the project ends before delivery.", action: "Agree how completed milestones and in-progress work will be paid on termination.", suggestion: "On termination, the client will pay for completed milestones and approved work performed up to the effective termination date, plus any non-cancellable expenses approved in writing." },
];

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
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [filter, setFilter] = useState<Filter>("All items");
  const [expanded, setExpanded] = useState<string | null>("payment");
  const [copied, setCopied] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");

  useEffect(() => () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
  }, [originalUrl]);

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
      setShowReport(false);
      setOcrVerified(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : "The extraction request failed. Try again.");
    } finally {
      setIsExtracting(false);
    }
  }

  const visibleRisks = demoRisks.filter((risk) => filter === "All items" || risk.level === filter);
  const detectedLanguage = extraction ? detectDocumentLanguage(extraction.text) : "Undetermined";
  const effectiveResponseLanguage = responseLanguage === "auto"
    ? detectedLanguage === "Arabic" ? "Arabic" : detectedLanguage === "English" ? "English" : "Ask me / mixed source"
    : responseLanguage === "ar" ? "Arabic" : "English";

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <a className="brand" href="#home" aria-label="LegalMind home"><span className="brand-mark"><Icon name="scale" size={22}/></span><span>legal<span className="brand-light">mind</span><small>LEGAL CLARITY, MADE SIMPLE</small></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation"><button className={`nav-link nav-button ${!showReport && !extraction ? "active" : ""}`} onClick={() => { setShowReport(false); setExtraction(null); }}><Icon name="home"/>Overview</button><button className={`nav-link nav-button ${showReport || extraction ? "active" : ""}`} onClick={() => { setShowReport(false); setExtraction(null); }}><Icon name="file"/>Contract review</button><a className="nav-link" href="#activity"><Icon name="clock"/>Activity</a></nav>
        <div className="sidebar-bottom"><div className="privacy-card"><span className="privacy-icon"><Icon name="shield" size={18}/></span><strong>Prototype privacy</strong><p>No documents are stored. Selected files are sent to this app for text extraction only.</p><span className="privacy-more">No account data is saved</span></div><a className="nav-link settings-link" href="#settings"><Icon name="settings"/>Settings</a><div className="profile"><div className="avatar">AM</div><div><strong>Ahmed Mohamed</strong><small>Freelancer account</small></div><span className="profile-dots">···</span></div></div>
      </aside>

      <section className="main-panel" id="home">
        <header className="topbar"><button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMobileNav(!mobileNav)}><Icon name="menu"/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{showReport ? "Sample review" : extraction ? "Extracted text" : "Overview"}</strong></div><div className="topbar-right"><span className="secure-status"><i/> Prototype</span><button className="help-link" onClick={() => document.getElementById("help")?.scrollIntoView({ behavior: "smooth" })}>Help center <span>↗</span></button></div></header>

        <div className={`content ${showReport || extraction ? "report-content" : ""}`}>
          {!showReport && !extraction ? <>
            <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR CONTRACT, CLEARER</div><h1>Know what you’re<br className="desktop-break"/> <em>signing.</em></h1><p className="welcome-copy">Extract readable text from a PDF or DOCX contract. This first backend step does not interpret legal terms.</p></div><div className="welcome-stamp"><div className="stamp-icon"><Icon name="scale" size={25}/></div><div><strong>Made for freelancers</strong><span>Starting with Egypt</span></div></div></section>
            <section className="review-card" id="review"><div className="card-heading"><div><div className="step-label"><span>01</span> START A REVIEW</div><h2>Let’s look at your contract.</h2><p>Upload a document to extract its text. Legal analysis is not connected yet.</p></div><div className="document-illustration"><div className="doc-back"/><div className="doc-front"><span/><span/><span/><b/></div><div className="doc-check"><Icon name="check" size={15}/></div></div></div>
              <div className={`upload-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}><input ref={inputRef} className="visually-hidden" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFileChange}/>{file ? <><div className="upload-icon file-ready"><Icon name="file" size={22}/></div><div className="upload-text"><strong>{file.name}</strong><span>{(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to send to this app</span></div><button className="remove-file" onClick={() => { setFile(null); setExtraction(null); if (inputRef.current) inputRef.current.value = ""; }} aria-label="Remove selected file"><Icon name="close" size={17}/></button></> : <><div className="upload-icon"><Icon name="upload" size={21}/></div><div className="upload-text"><strong>Drop your contract here, or <button className="browse-button" onClick={() => inputRef.current?.click()}>browse files</button></strong><span>PDF or DOCX document · Up to 20 MB</span></div></>}</div>
              {fileError && <p className="file-error" role="alert">{fileError}</p>}
              <div className="review-options"><div className="review-field"><label className="field-label" htmlFor="jurisdiction">JURISDICTION FOR FUTURE REVIEW</label><div className="select-wrap"><select id="jurisdiction" value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}><option>Egypt</option><option>United Arab Emirates</option><option>I’m not sure</option></select><span className="select-caret">⌄</span></div></div><div className="review-field"><label className="field-label" htmlFor="ocr-language">OCR LANGUAGE IF NEEDED</label><div className="select-wrap"><select id="ocr-language" value={ocrLanguage} onChange={(event) => setOcrLanguage(event.target.value)}><option value="ara+eng">Arabic + English</option><option value="ara">Arabic</option><option value="eng">English</option></select><span className="select-caret">⌄</span></div></div><button className="primary-button" disabled={!file || isExtracting} onClick={() => void extractContract()}>{isExtracting ? "Extracting text…" : "Extract contract text"} {!isExtracting && <Icon name="arrow" size={17}/>}</button></div>
              {extractError && <p className="file-error" role="alert">{extractError}</p>}
              <div className="card-foot"><span><Icon name="shield" size={15}/> Sent to this app server; not saved or analyzed</span><span className="selected-law">Selected jurisdiction: {jurisdiction}</span></div>
            </section>
            <section className="below-grid" id="activity"><article className="how-card"><div className="step-label"><span>02</span> WHAT A REVIEW CAN SHOW</div><h3>Clarity, in three steps.</h3><div className="steps"><div className="mini-step"><span className="mini-number">1</span><div><strong>Understand the terms</strong><p>See key points explained in plain language.</p></div></div><div className="mini-step"><span className="mini-number">2</span><div><strong>Spot what to discuss</strong><p>Find clauses that may deserve a closer look.</p></div></div><div className="mini-step"><span className="mini-number">3</span><div><strong>Know what to ask</strong><p>Prepare useful questions before you sign.</p></div></div></div></article><article className="trust-card" id="privacy"><div className="trust-top"><div className="trust-icon"><Icon name="shield" size={20}/></div><span className="trust-tag">PROTOTYPE</span></div><h3>Your work is your own.</h3><p>The file is sent to this app server for text extraction and processed in memory. This prototype does not save it or analyze its legal terms.</p><a href="#privacy">Privacy comes first <Icon name="arrow" size={14}/></a><div className="trust-decoration"/></article></section>
          </> : showReport ? <>
            <button className="back-link" onClick={() => setShowReport(false)}><Icon name="back" size={17}/> {extraction ? "Back to extracted text" : "Back to upload"}</button>
            <div className="report-title-row"><div><div className="eyebrow"><span className="eyebrow-line"/> CONTRACT REVIEW</div><h1>Review <em>overview.</em></h1><p className="welcome-copy">A plain-language example of the insights a future review could provide.</p></div><button className="secondary-button" onClick={() => { setShowReport(false); setExtraction(null); setFile(null); }}><Icon name="plus" size={16}/> New review</button></div>
            <div className="demo-banner"><span className="demo-banner-icon"><Icon name="alert" size={18}/></span><div><strong>Sample report — not an analysis of your document</strong><p>These fictional findings are not based on the extracted text. No legal analysis was performed and no legal sources were checked.</p></div></div>
            <section className="report-meta-card"><div className="report-file-icon"><Icon name="file" size={19}/></div><div className="report-file-name"><strong>{file?.name ?? "Freelance services agreement — sample.docx"}</strong><span>{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · not used in this sample` : "Example document · illustrative only"}</span></div><div className="meta-divider"/><div className="report-law"><span>JURISDICTION SELECTED</span><strong>{jurisdiction}</strong></div><div className="report-date"><span>REPORT TYPE</span><strong>Illustrative demo</strong></div></section>
            <section className="report-summary-grid"><article className="summary-card"><div className="summary-kicker">AT A GLANCE <span className="demo-pill">SAMPLE</span></div><h2>3 points to discuss</h2><p>This example highlights a few common commercial terms a freelancer might want clarified before signing.</p><div className="summary-stat-row"><span><i className="risk-dot high-dot"/> 1 high priority</span><span><i className="risk-dot medium-dot"/> 2 worth discussing</span></div></article><article className="summary-card summary-card-tint"><div className="summary-kicker">EXAMPLE CONTRACT BASICS</div><h3>Key terms to confirm</h3><div className="basic-terms"><div><span>Payment timing</span><strong>After client approval</strong></div><div><span>Work ownership</span><strong>Transfers to client</strong></div><div><span>Ending the agreement</span><strong>Notice allowed</strong></div></div></article></section>
            <section className="risks-section"><div className="risks-heading"><div><div className="step-label"><span>01</span> EXAMPLE FINDINGS</div><h2>Clauses to look at</h2><p>Illustrative commercial observations, not legal conclusions.</p></div><span className="findings-count">{visibleRisks.length} examples</span></div>
              <div className="filter-row" role="group" aria-label="Filter example findings">{(["All items", "High priority", "Worth discussing"] as Filter[]).map((item) => <button key={item} className={`filter-chip ${filter === item ? "selected" : ""}`} onClick={() => setFilter(item)}>{item}{item === "All items" && <span>{demoRisks.length}</span>}</button>)}</div>
              <div className="risk-list">{visibleRisks.map((risk, index) => <article className={`risk-card ${expanded === risk.id ? "risk-expanded" : ""}`} key={risk.id}><button className="risk-card-head" aria-expanded={expanded === risk.id} onClick={() => setExpanded(expanded === risk.id ? null : risk.id)}><span className={`risk-number ${risk.level === "High priority" ? "risk-number-high" : ""}`}>{String(index + 1).padStart(2, "0")}</span><span className="risk-main"><span className={`risk-badge ${risk.level === "High priority" ? "badge-high" : "badge-medium"}`}><i className="risk-dot"/>{risk.level}</span><strong>{risk.title}</strong><span className="risk-clause-preview">“{risk.clause}”</span></span><span className={`risk-chevron ${expanded === risk.id ? "rotated" : ""}`}><Icon name="chevron" size={18}/></span></button>
                {expanded === risk.id && <div className="risk-detail"><div className="quoted-clause"><span>EXAMPLE WORDING</span><p>“{risk.clause}”</p></div><div className="detail-explanation"><span>WHY IT MAY MATTER</span><p>{risk.why}</p></div><div className="suggested-action"><span>NEXT STEP TO CONSIDER</span><p>{risk.action}</p></div><div className="suggested-wording"><div className="suggestion-heading"><span>EXAMPLE WORDING TO DISCUSS</span><button className="copy-button" onClick={() => void copyText(risk.id, risk.suggestion)}><Icon name="copy" size={14}/>{copied === risk.id ? "Copied" : "Copy"}</button></div><p>{risk.suggestion}</p></div></div>}
              </article>)}</div>
            </section>
            <section className="next-step-card"><div className="next-step-symbol"><Icon name="shield" size={20}/></div><div><strong>Before you sign</strong><p>Use these fictional examples to understand the report layout. For a real contract or a significant commitment, ask a qualified lawyer in the relevant jurisdiction.</p></div><span className="next-step-label">HUMAN REVIEW</span></section>
            <footer className="report-disclaimer">This sample contains no verified legal advice, legal citations, or jurisdiction-specific conclusions. It does not describe your document.</footer>
          </> : extraction ? <>
            <button className="back-link" onClick={() => setExtraction(null)}><Icon name="back" size={17}/> Back to upload</button>
            <div className="report-title-row"><div><div className="eyebrow"><span className="eyebrow-line"/> DOCUMENT PROCESSING</div><h1>Text <em>extracted.</em></h1><p className="welcome-copy">Check that the text looks complete before using it elsewhere.</p></div><span className="extraction-complete"><Icon name="check" size={15}/> Extraction complete</span></div>
            <div className="processing-notice"><span className="processing-notice-icon"><Icon name="shield" size={17}/></span><div><strong>Processed in memory. This prototype does not save your document.</strong><p>The file was sent to this app server for text extraction. No legal analysis was performed, and no legal sources were checked.</p></div></div>
            <section className="report-meta-card extraction-meta"><div className="report-file-icon"><Icon name="file" size={19}/></div><div className="report-file-name"><strong>{extraction.fileName}</strong><span>{extraction.fileType} · {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "processed in this session"}</span></div><div className="meta-divider"/><div className="report-law"><span>PAGE COUNT</span><strong>{extraction.pageCount ?? "Not available"}</strong></div><div className="report-date"><span>EXTRACTED TEXT</span><strong>{extraction.text.length.toLocaleString()} characters</strong></div></section>
            {extraction.needsOcr && <div className="ocr-notice"><Icon name="alert" size={17}/><span>{extraction.ocrUsed ? "No text was recognized. Try a different OCR language or a clearer scan." : "No text was found in this document."}</span></div>}
            {extraction.ocrUsed && <div className={`ocr-result ${extraction.ocrLowConfidence ? "ocr-result-low" : ""}`} role="status"><Icon name={extraction.ocrLowConfidence ? "alert" : "check"} size={17}/><div><strong>{extraction.ocrLowConfidence ? "Low OCR confidence — verify against the original" : "OCR was used for scanned pages"}</strong><p>Pages {extraction.ocrPages.join(", ")} · {extraction.ocrLanguage === "ara+eng" ? "Arabic + English" : extraction.ocrLanguage === "ara" ? "Arabic" : "English"}{extraction.ocrConfidence !== null ? ` · OCR confidence signal ${extraction.ocrConfidence}/100` : ""}. This signal is not an accuracy score. Verify names, amounts, dates, and negations against the original.</p></div></div>}
            {extraction.ocrUsed && <section className="source-review" aria-labelledby="source-review-title"><div className="source-review-copy"><strong id="source-review-title">Compare OCR text with the source</strong><p>OCR can misread important figures even when its confidence signal is high.</p></div>{originalUrl && <a className="source-open-link" href={originalUrl} target="_blank" rel="noreferrer">Open original {extraction.fileType} <span aria-hidden="true">↗</span></a>}<label className="source-check"><input type="checkbox" checked={ocrVerified} onChange={(event) => setOcrVerified(event.target.checked)}/><span>I checked names, amounts, dates, and negations against the original.</span></label>{ocrVerified && <span className="source-reviewed"><Icon name="check" size={14}/> Marked reviewed this session</span>}</section>}
            {extraction.ocrPageLimitReached && <div className="ocr-notice"><Icon name="alert" size={17}/><span>OCR is limited to 10 scanned pages per request. Some later scanned pages may be missing from this text.</span></div>}
            {extraction.truncated && <div className="ocr-notice"><Icon name="alert" size={17}/><span>For safety, the text preview stops at 200,000 characters.</span></div>}
            <section className="extracted-text-card"><div className="extracted-text-heading"><div><div className="step-label"><span>01</span> EXTRACTED CONTENT</div><h2>Review the extracted text</h2></div><button className="copy-button copy-full" disabled={!extraction.text} onClick={() => void copyText("extracted-text", extraction.text)}><Icon name="copy" size={14}/>{copied === "extracted-text" ? "Copied" : "Copy text"}</button></div><pre className="extracted-text">{extraction.text || "No machine-readable text was found in this file."}</pre></section>
            <div className="extraction-next"><div><strong>Legal analysis is the next build step</strong><p>This version extracts text only; it does not yet analyze clauses. The previous report preview used fictional findings and did not analyze your upload.</p><p className="language-detection">Detected document language: <strong>{detectedLanguage}</strong> · Planned response language: <strong>{effectiveResponseLanguage}</strong></p></div><label className="response-language-field">ANALYSIS LANGUAGE<select value={responseLanguage} onChange={(event) => setResponseLanguage(event.target.value as "auto" | "ar" | "en")}><option value="auto">Match document automatically</option><option value="ar">Arabic</option><option value="en">English</option></select></label></div>
            <footer className="report-disclaimer">Text extraction can miss tables, layout, or text in scanned images. Review the original document before relying on this output.</footer>
          </> : null}
          <footer className="page-footer" id="help"><span>© 2026 LegalMind</span><span>Designed for clarity. Built with care.</span><a href="#help">Need a hand? <span>↗</span></a></footer>
        </div>
      </section>
    </main>
  );
}
