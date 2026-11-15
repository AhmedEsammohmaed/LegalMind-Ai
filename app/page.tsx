"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

const icon = {
  scale: <><path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 7 8 4 8-4M4 7v5l8 4 8-4V7M4 12v5l8 4 8-4v-5"/></>,
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
};

function Icon({ name, size = 20 }: { name: keyof typeof icon; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icon[name]}</svg>;
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [jurisdiction, setJurisdiction] = useState("Egypt");
  const [reviewStarted, setReviewStarted] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  function acceptFile(candidate?: File) {
    if (!candidate) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
    if (allowed.includes(candidate.type) || /\.(pdf|docx|doc)$/i.test(candidate.name)) {
      setFile(candidate);
      setReviewStarted(false);
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) { acceptFile(event.target.files?.[0]); }
  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <a className="brand" href="#home" aria-label="LegalMind home">
          <span className="brand-mark"><Icon name="scale" size={22}/></span>
          <span>legal<span className="brand-light">mind</span><small>LEGAL CLARITY, MADE SIMPLE</small></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#home"><Icon name="home"/>Overview</a>
          <a className="nav-link" href="#review"><Icon name="file"/>Contract review</a>
          <a className="nav-link" href="#activity"><Icon name="clock"/>Activity</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-card"><span className="privacy-icon"><Icon name="shield" size={18}/></span><strong>Your documents stay yours</strong><p>Private by design. Your contracts are never shared with other users.</p><a href="#privacy">How we protect you <span>↗</span></a></div>
          <a className="nav-link settings-link" href="#settings"><Icon name="settings"/>Settings</a>
          <div className="profile"><div className="avatar">AM</div><div><strong>Ahmed Mohamed</strong><small>Freelancer account</small></div><span className="profile-dots">···</span></div>
        </div>
      </aside>

      <section className="main-panel" id="home">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMobileNav(!mobileNav)}><Icon name="menu"/></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div>
          <div className="topbar-right"><span className="secure-status"><i/> Secure workspace</span><button className="help-link" onClick={() => document.getElementById("help")?.scrollIntoView({ behavior: "smooth" })}>Help center <span>↗</span></button></div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-line"/> YOUR CONTRACT, CLEARER</div><h1>Know what you’re<br className="desktop-break"/> <em>signing.</em></h1><p className="welcome-copy">Understand your contract before you commit. Start with a private review, built for independent professionals.</p></div>
            <div className="welcome-stamp"><div className="stamp-icon"><Icon name="scale" size={25}/></div><div><strong>Made for freelancers</strong><span>Starting with Egypt</span></div></div>
          </section>

          <section className="review-card" id="review">
            <div className="card-heading"><div><div className="step-label"><span>01</span> START A REVIEW</div><h2>Let’s look at your contract.</h2><p>Upload a document to see its key terms in plain language.</p></div><div className="document-illustration"><div className="doc-back"/><div className="doc-front"><span/><span/><span/><b/></div><div className="doc-check"><Icon name="check" size={15}/></div></div></div>

            {!reviewStarted ? <>
              <div className={`upload-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
                <input ref={inputRef} className="visually-hidden" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFileChange}/>
                {file ? <><div className="upload-icon file-ready"><Icon name="file" size={22}/></div><div className="upload-text"><strong>{file.name}</strong><span>{(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to review</span></div><button className="remove-file" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }} aria-label="Remove selected file"><Icon name="close" size={17}/></button></> : <><div className="upload-icon"><Icon name="upload" size={21}/></div><div className="upload-text"><strong>Drop your contract here, or <button className="browse-button" onClick={() => inputRef.current?.click()}>browse files</button></strong><span>PDF or Word document · Up to 20 MB</span></div></>}
              </div>
              <div className="review-options"><label className="field-label" htmlFor="jurisdiction">WHICH LAW APPLIES?</label><div className="select-wrap"><select id="jurisdiction" value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}><option>Egypt</option><option>United Arab Emirates</option><option>I’m not sure</option></select><span className="select-caret">⌄</span></div><button className="primary-button" disabled={!file} onClick={() => setReviewStarted(true)}>Review my contract <Icon name="arrow" size={17}/></button></div>
            </> : <div className="preview-notice"><span className="preview-icon"><Icon name="shield" size={20}/></span><div><strong>Your file is ready</strong><p>This frontend preview doesn’t process or upload documents yet. The next step is connecting the secure review service.</p></div><button className="remove-file" aria-label="Dismiss" onClick={() => setReviewStarted(false)}><Icon name="close" size={17}/></button></div>}
            <div className="card-foot"><span><Icon name="shield" size={15}/> Your document stays private and secure</span><a href="#privacy">Learn about privacy <Icon name="arrow" size={13}/></a></div>
          </section>

          <section className="below-grid" id="activity">
            <article className="how-card"><div className="step-label"><span>02</span> WHAT YOU’LL GET</div><h3>Clarity, in three steps.</h3><div className="steps"><div className="mini-step"><span className="mini-number">1</span><div><strong>Understand the terms</strong><p>Get the key points without the legal jargon.</p></div></div><div className="mini-step"><span className="mini-number">2</span><div><strong>Spot what to look at</strong><p>See clauses that may deserve a closer look.</p></div></div><div className="mini-step"><span className="mini-number">3</span><div><strong>Know what to ask</strong><p>Prepare useful questions before you sign.</p></div></div></div></article>
            <article className="trust-card" id="privacy"><div className="trust-top"><div className="trust-icon"><Icon name="shield" size={20}/></div><span className="trust-tag">OUR PROMISE</span></div><h3>Your work is your own.</h3><p>Contracts can contain sensitive details. Privacy is built into the way we’re designing LegalMind, from the very first step.</p><a href="#privacy">Our approach to privacy <Icon name="arrow" size={14}/></a><div className="trust-decoration"/></article>
          </section>
          <footer className="page-footer" id="help"><span>© 2026 LegalMind</span><span>Designed for clarity. Built with care.</span><a href="#help">Need a hand? <span>↗</span></a></footer>
        </div>
      </section>
    </main>
  );
}
