import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:8000";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "pt", label: "Portuguese" },
];

function Tab({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        border: "none",
        borderBottom: active ? "2px solid #7F77DD" : "2px solid transparent",
        background: "none",
        color: active ? "#7F77DD" : "var(--color-text-secondary)",
        fontWeight: active ? 500 : 400,
        fontSize: 14,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      <i className={`ti ti-${icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
      {label}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    running: { bg: "#FAEEDA", color: "#BA7517", label: "Running" },
    done: { bg: "#EAF3DE", color: "#3B6D11", label: "Done" },
    failed: { bg: "#FCEBEB", color: "#A32D2D", label: "Failed" },
    cached: { bg: "#E6F1FB", color: "#185FA5", label: "Cached" },
  };
  const s = map[status] || { bg: "#F1EFE8", color: "#5F5E5A", label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 12, padding: "2px 8px",
      borderRadius: 6, fontWeight: 500,
    }}>
      {s.label}
    </span>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 12,
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "#EEEDFE", color: "#534AB7",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 500, marginRight: 8, flexShrink: 0, marginTop: 2,
        }}>
          <i className="ti ti-robot" style={{ fontSize: 14 }} aria-hidden="true" />
        </div>
      )}
      <div style={{
        maxWidth: "75%",
        background: isUser ? "#534AB7" : "var(--color-background-secondary)",
        color: isUser ? "#fff" : "var(--color-text-primary)",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        padding: "10px 14px",
        fontSize: 14,
        lineHeight: 1.6,
        border: isUser ? "none" : "0.5px solid var(--color-border-tertiary)",
      }}>
        {msg.content}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "0.5px solid rgba(255,255,255,0.2)" }}>
            <span style={{ fontSize: 11, opacity: 0.7 }}>Sources: </span>
            {msg.sources.map((s, i) => (
              <span key={i} style={{ fontSize: 11, opacity: 0.8 }}>{s}{i < msg.sources.length - 1 ? ", " : ""}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScrapePanel({ onIngested }) {
  const [urls, setUrls] = useState("");
  const [status, setStatus] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [ingested, setIngested] = useState([]);
  const [force, setForce] = useState(false);

  const loadIngested = async () => {
    try {
      const r = await fetch(`${API_BASE}/scrape/ingested`);
      const d = await r.json();
      setIngested(d);
    } catch {}
  };

  useEffect(() => { loadIngested(); }, []);

  useEffect(() => {
    if (!jobId || !polling) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/scrape/status/${jobId}`);
        const d = await r.json();
        setStatus(d);
        if (d.status === "done" || d.status === "failed") {
          setPolling(false);
          loadIngested();
          if (d.status === "done") onIngested();
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [jobId, polling]);

  const handleScrape = async () => {
    const urlList = urls.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urlList.length) return;
    setStatus({ status: "starting" });
    try {
      const r = await fetch(`${API_BASE}/scrape/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList, force }),
      });
      const d = await r.json();
      if (d.job_id) {
        setJobId(d.job_id);
        setPolling(true);
        setStatus({ status: "running", message: d.message });
      } else {
        setStatus({ status: "cached", message: d.message });
        onIngested();
      }
    } catch (e) {
      setStatus({ status: "failed", error: String(e) });
    }
  };

  const handleDelete = async (url) => {
    await fetch(`${API_BASE}/scrape/ingested/${encodeURIComponent(url)}`, { method: "DELETE" });
    loadIngested();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "1.25rem",
      }}>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 10 }}>
          Enter one URL per line. The scraper will follow internal links up to depth 2.
        </p>
        <textarea
          value={urls}
          onChange={e => setUrls(e.target.value)}
          placeholder={"https://example.com\nhttps://docs.example.com"}
          style={{
            width: "100%", minHeight: 100, resize: "vertical",
            fontFamily: "var(--font-mono)", fontSize: 13,
            padding: "10px 12px", boxSizing: "border-box",
            borderRadius: "var(--border-radius-md)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} />
            Re-scrape already ingested URLs
          </label>
          <button onClick={handleScrape} style={{ marginLeft: "auto", padding: "8px 20px", borderRadius: "var(--border-radius-md)", background: "#534AB7", color: "#fff", border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            <i className="ti ti-world-download" style={{ marginRight: 6 }} aria-hidden="true" />
            Scrape &amp; Ingest
          </button>
        </div>
      </div>

      {status && (
        <div style={{
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)",
          padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <StatusBadge status={status.status} />
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            {status.status === "running" && (polling ? "Scraping in progress… this may take a minute." : status.message)}
            {status.status === "done" && `✓ ${status.ingest_result || "Complete"}`}
            {status.status === "failed" && `Error: ${status.error}`}
            {status.status === "cached" && status.message}
            {status.status === "starting" && "Starting…"}
          </span>
          {status.status === "running" && polling && (
            <i className="ti ti-loader-2" style={{ marginLeft: "auto", fontSize: 16, color: "#BA7517", animation: "spin 1s linear infinite" }} aria-hidden="true" />
          )}
        </div>
      )}

      {ingested.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Ingested URLs ({ingested.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ingested.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--color-background-secondary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-md)",
                padding: "8px 12px",
              }}>
                <i className="ti ti-circle-check" style={{ fontSize: 15, color: "#3B6D11", flexShrink: 0 }} aria-hidden="true" />
                <span style={{ fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.url}</span>
                <button
                  onClick={() => handleDelete(item.url)}
                  style={{ border: "none", background: "none", cursor: "pointer", padding: "2px 4px", color: "var(--color-text-secondary)" }}
                  aria-label="Remove"
                >
                  <i className="ti ti-trash" style={{ fontSize: 15 }} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hello! Scrape some URLs first, then ask me anything about that content." }
  ]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, language: lang }),
      });
      const d = await r.json();
      setMessages(prev => [...prev, { role: "bot", content: d.answer, sources: d.sources }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "bot", content: "Error connecting to the API. Make sure the backend is running." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 480 }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0 8px" }}>
        {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--color-text-secondary)", fontSize: 13, padding: "4px 0" }}>
            <i className="ti ti-loader-2" style={{ fontSize: 15, animation: "spin 1s linear infinite" }} aria-hidden="true" />
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{
        display: "flex", gap: 8, alignItems: "flex-end",
        borderTop: "0.5px solid var(--color-border-tertiary)",
        paddingTop: 12,
      }}>
        <select value={lang} onChange={e => setLang(e.target.value)} style={{ fontSize: 13, padding: "7px 10px", borderRadius: "var(--border-radius-md)", flexShrink: 0, height: 36 }}>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask a question about the scraped content…"
          style={{ flex: 1, resize: "none", fontSize: 14, padding: "8px 12px", borderRadius: "var(--border-radius-md)", minHeight: 36, maxHeight: 100 }}
          rows={1}
        />
        <button onClick={send} disabled={!input.trim() || loading} style={{
          background: "#534AB7", color: "#fff", border: "none",
          borderRadius: "var(--border-radius-md)", width: 36, height: 36,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          opacity: (!input.trim() || loading) ? 0.5 : 1,
        }}>
          <i className="ti ti-send" style={{ fontSize: 16 }} aria-hidden="true" />
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function KnowledgePanel() {
  const [summary, setSummary] = useState(null);
  const [faqs, setFaqs] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const r = await fetch(`${API_BASE}/knowledge/summary`);
      const d = await r.json();
      setSummary(d.summary);
    } catch { setSummary("Error fetching summary."); }
    setLoadingSummary(false);
  };

  const fetchFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const r = await fetch(`${API_BASE}/knowledge/faqs`);
      const d = await r.json();
      setFaqs(d.faqs);
    } catch { setFaqs([]); }
    setLoadingFaqs(false);
  };

  const handleExport = async () => {
    try {
      const r = await fetch(`${API_BASE}/knowledge/export/markdown`);
      const text = await r.text();
      const blob = new Blob([text], { type: "text/markdown" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "knowledge_summary.md";
      a.click();
      setExportMsg("Downloaded!");
      setTimeout(() => setExportMsg(""), 3000);
    } catch { setExportMsg("Export failed."); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={fetchSummary} disabled={loadingSummary} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", background: "#EEEDFE", color: "#534AB7", border: "0.5px solid #AFA9EC", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          {loadingSummary ? <><i className="ti ti-loader-2" style={{ marginRight: 4, animation: "spin 1s linear infinite" }} aria-hidden="true" />Generating…</> : <><i className="ti ti-file-description" style={{ marginRight: 4 }} aria-hidden="true" />Generate Summary</>}
        </button>
        <button onClick={fetchFaqs} disabled={loadingFaqs} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", background: "#E1F5EE", color: "#0F6E56", border: "0.5px solid #5DCAA5", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
          {loadingFaqs ? <><i className="ti ti-loader-2" style={{ marginRight: 4, animation: "spin 1s linear infinite" }} aria-hidden="true" />Generating…</> : <><i className="ti ti-help-circle" style={{ marginRight: 4 }} aria-hidden="true" />Generate FAQs</>}
        </button>
        <button onClick={handleExport} style={{ padding: "8px 16px", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-tertiary)", fontSize: 13, fontWeight: 500, cursor: "pointer", marginLeft: "auto" }}>
          <i className="ti ti-download" style={{ marginRight: 4 }} aria-hidden="true" />Export Markdown
        </button>
        {exportMsg && <span style={{ fontSize: 13, color: "#3B6D11", alignSelf: "center" }}>{exportMsg}</span>}
      </div>

      {summary && (
        <div style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)",
          padding: "1.25rem",
        }}>
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "#534AB7" }}>
            <i className="ti ti-file-description" style={{ marginRight: 6 }} aria-hidden="true" />Summary
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{summary}</p>
        </div>
      )}

      {faqs && faqs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#0F6E56" }}>
            <i className="ti ti-help-circle" style={{ marginRight: 6 }} aria-hidden="true" />Frequently Asked Questions
          </p>
          {faqs.map((faq, i) => (
            <div key={i} style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              padding: "12px 16px",
            }}>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Q: {faq.question}</p>
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{faq.answer}</p>
            </div>
          ))}
        </div>
      )}

      {faqs && faqs.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>No FAQs generated. Make sure you have content ingested first.</p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function WebBotApp() {
  const [tab, setTab] = useState("scrape");
  const [hasData, setHasData] = useState(false);

  return (
    <div style={{ padding: "1rem 0", maxWidth: 720 }}>
      <h2 className="sr-only">WebBot — Scrape websites and chat with their content</h2>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <i className="ti ti-robot" style={{ fontSize: 18, color: "#fff" }} aria-hidden="true" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 500 }}>WebBot</span>
          {hasData && <span style={{ fontSize: 12, background: "#EAF3DE", color: "#3B6D11", padding: "2px 8px", borderRadius: 6, fontWeight: 500 }}>Data ready</span>}
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Scrape websites → build a knowledge base → chat with your data
        </p>
      </div>

      <div style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          padding: "0 8px",
          overflowX: "auto",
        }}>
          <Tab label="Scrape URLs" icon="world-download" active={tab === "scrape"} onClick={() => setTab("scrape")} />
          <Tab label="Chat" icon="message-circle" active={tab === "chat"} onClick={() => setTab("chat")} />
          <Tab label="Knowledge" icon="brain" active={tab === "knowledge"} onClick={() => setTab("knowledge")} />
        </div>
        <div style={{ padding: "1.25rem" }}>
          {tab === "scrape" && <ScrapePanel onIngested={() => setHasData(true)} />}
          {tab === "chat" && <ChatPanel />}
          {tab === "knowledge" && <KnowledgePanel />}
        </div>
      </div>

      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 12, textAlign: "center" }}>
        Backend must be running at <code style={{ fontFamily: "var(--font-mono)" }}>http://localhost:8000</code>
      </p>
    </div>
  );
}
