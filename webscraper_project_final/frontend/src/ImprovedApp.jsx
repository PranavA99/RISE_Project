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

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; }

  .webbot-root {
    font-family: 'DM Sans', system-ui, sans-serif;
    --wb-purple: #534AB7;
    --wb-purple-light: #EEEDFE;
    --wb-purple-mid: #AFA9EC;
    --wb-purple-dark: #3C3489;
    --wb-teal: #0F6E56;
    --wb-teal-light: #E1F5EE;
    --wb-teal-mid: #5DCAA5;
    --wb-green-light: #EAF3DE;
    --wb-green: #3B6D11;
    --wb-amber-light: #FAEEDA;
    --wb-amber: #BA7517;
    --wb-red-light: #FCEBEB;
    --wb-red: #A32D2D;
    --wb-blue-light: #E6F1FB;
    --wb-blue: #185FA5;
    --wb-gray-50: #F8F7F5;
    --wb-gray-100: #F1EFE8;
    --wb-gray-200: #E2E0D8;
    --wb-gray-400: #888780;
    --wb-gray-600: #5F5E5A;
    --transition: 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .wb-tab-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 4px;
    height: 48px;
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--wb-gray-400);
    font-family: 'DM Sans', system-ui, sans-serif;
    font-weight: 400;
    font-size: 13.5px;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: color var(--wb-transition), border-color var(--wb-transition);
    white-space: nowrap;
    position: relative;
  }

  .wb-tab-btn.active {
    color: var(--wb-purple);
    border-bottom-color: var(--wb-purple);
    font-weight: 500;
  }

  .wb-tab-btn:hover:not(.active) {
    color: var(--wb-gray-600);
  }

  .wb-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    background: var(--wb-purple);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    transition: background var(--transition), opacity var(--transition), transform var(--transition);
    letter-spacing: 0.01em;
  }

  .wb-btn-primary:hover:not(:disabled) {
    background: var(--wb-purple-dark);
    transform: translateY(-1px);
  }

  .wb-btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }

  .wb-btn-primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .wb-btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    background: none;
    color: var(--wb-gray-600);
    border: 1px solid var(--wb-gray-200);
    border-radius: 10px;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 400;
    cursor: pointer;
    transition: all var(--transition);
  }

  .wb-btn-ghost:hover {
    background: var(--wb-gray-50);
    border-color: var(--wb-gray-400);
    color: #2C2C2A;
  }

  .wb-btn-teal {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 16px;
    background: var(--wb-teal-light);
    color: var(--wb-teal);
    border: 1px solid var(--wb-teal-mid);
    border-radius: 10px;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition);
  }

  .wb-btn-teal:hover:not(:disabled) {
    background: #c3eed9;
  }

  .wb-btn-teal:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .wb-btn-purple-soft {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 16px;
    background: var(--wb-purple-light);
    color: var(--wb-purple);
    border: 1px solid var(--wb-purple-mid);
    border-radius: 10px;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition);
  }

  .wb-btn-purple-soft:hover:not(:disabled) {
    background: #dddaf9;
  }

  .wb-btn-purple-soft:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .wb-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--wb-gray-200);
    border-radius: 10px;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    background: white;
    color: #2C2C2A;
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition);
    resize: vertical;
  }

  .wb-input:focus {
    border-color: var(--wb-purple-mid);
    box-shadow: 0 0 0 3px rgba(83, 74, 183, 0.1);
  }

  .wb-input::placeholder {
    color: var(--wb-gray-400);
  }

  .wb-select {
    padding: 9px 12px;
    border: 1px solid var(--wb-gray-200);
    border-radius: 10px;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px;
    background: white;
    color: #2C2C2A;
    outline: none;
    cursor: pointer;
    height: 38px;
    transition: border-color var(--transition);
  }

  .wb-select:focus {
    border-color: var(--wb-purple-mid);
    box-shadow: 0 0 0 3px rgba(83, 74, 183, 0.1);
  }

  .wb-card {
    background: white;
    border: 1px solid var(--wb-gray-200);
    border-radius: 14px;
    padding: 1.25rem;
    animation: fadeSlideIn 0.25s ease;
  }

  .wb-url-item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--wb-gray-50);
    border: 1px solid var(--wb-gray-200);
    border-radius: 10px;
    padding: 9px 13px;
    animation: fadeSlideIn 0.2s ease;
    transition: border-color var(--transition);
  }

  .wb-url-item:hover {
    border-color: var(--wb-gray-400);
  }

  .wb-url-delete {
    border: none;
    background: none;
    cursor: pointer;
    padding: 3px 5px;
    color: var(--wb-gray-400);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color var(--transition), background var(--transition);
    flex-shrink: 0;
  }

  .wb-url-delete:hover {
    color: var(--wb-red);
    background: var(--wb-red-light);
  }

  .wb-chat-textarea {
    flex: 1;
    resize: none;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 14px;
    padding: 9px 14px;
    border: 1px solid var(--wb-gray-200);
    border-radius: 10px;
    min-height: 38px;
    max-height: 110px;
    outline: none;
    color: #2C2C2A;
    background: white;
    line-height: 1.5;
    transition: border-color var(--transition), box-shadow var(--transition);
  }

  .wb-chat-textarea:focus {
    border-color: var(--wb-purple-mid);
    box-shadow: 0 0 0 3px rgba(83, 74, 183, 0.1);
  }

  .wb-chat-textarea::placeholder {
    color: var(--wb-gray-400);
  }

  .wb-send-btn {
    background: var(--wb-purple);
    color: white;
    border: none;
    border-radius: 10px;
    width: 38px;
    height: 38px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background var(--transition), opacity var(--transition), transform var(--transition);
  }

  .wb-send-btn:hover:not(:disabled) {
    background: var(--wb-purple-dark);
    transform: translateY(-1px);
  }

  .wb-send-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .wb-faq-item {
    background: white;
    border: 1px solid var(--wb-gray-200);
    border-radius: 12px;
    padding: 14px 18px;
    animation: fadeSlideIn 0.25s ease;
    transition: border-color var(--transition), box-shadow var(--transition);
  }

  .wb-faq-item:hover {
    border-color: var(--wb-purple-mid);
    box-shadow: 0 2px 12px rgba(83, 74, 183, 0.07);
  }

  .wb-loading-dots span {
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--wb-gray-400);
    margin: 0 2px;
    animation: pulse-dot 1.4s ease-in-out infinite;
  }

  .wb-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .wb-loading-dots span:nth-child(3) { animation-delay: 0.4s; }

  .wb-checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--wb-gray-600);
    cursor: pointer;
    user-select: none;
  }

  .wb-checkbox-label input[type="checkbox"] {
    width: 15px;
    height: 15px;
    accent-color: var(--wb-purple);
    cursor: pointer;
  }
`;

function Tab({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`wb-tab-btn ${active ? "active" : ""}`}
    >
      <i className={`ti ti-${icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
      {label}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    running: { bg: "#FAEEDA", color: "#854F0B", border: "#EF9F27", label: "Running", dot: "#EF9F27" },
    done: { bg: "#EAF3DE", color: "#27500A", border: "#97C459", label: "Done", dot: "#639922" },
    failed: { bg: "#FCEBEB", color: "#791F1F", border: "#F09595", label: "Failed", dot: "#E24B4A" },
    cached: { bg: "#E6F1FB", color: "#0C447C", border: "#85B7EB", label: "Cached", dot: "#378ADD" },
  };
  const s = map[status] || { bg: "#F1EFE8", color: "#444441", border: "#B4B2A9", label: status, dot: "#888780" };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: s.bg,
      color: s.color,
      fontSize: 12,
      padding: "3px 10px 3px 8px",
      borderRadius: 99,
      fontWeight: 500,
      border: `1px solid ${s.border}`,
      letterSpacing: "0.01em",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: s.dot,
        flexShrink: 0,
        animation: status === "running" ? "pulse-dot 1s ease-in-out infinite" : "none",
      }} />
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
      marginBottom: 14,
      animation: "fadeSlideIn 0.2s ease",
    }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "linear-gradient(135deg, #7F77DD 0%, #534AB7 100%)",
          color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, marginRight: 9, flexShrink: 0, marginTop: 2,
          boxShadow: "0 2px 8px rgba(83, 74, 183, 0.25)",
        }}>
          <i className="ti ti-robot" style={{ fontSize: 14 }} aria-hidden="true" />
        </div>
      )}
      <div style={{
        maxWidth: "76%",
        background: isUser
          ? "linear-gradient(135deg, #7F77DD 0%, #534AB7 100%)"
          : "white",
        color: isUser ? "#fff" : "#2C2C2A",
        borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
        padding: "11px 16px",
        fontSize: 13.5,
        lineHeight: 1.65,
        border: isUser ? "none" : "1px solid #E2E0D8",
        boxShadow: isUser
          ? "0 3px 12px rgba(83, 74, 183, 0.2)"
          : "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        {msg.content}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{
            marginTop: 10, paddingTop: 10,
            borderTop: isUser ? "1px solid rgba(255,255,255,0.2)" : "1px solid #E2E0D8",
            display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center",
          }}>
            <span style={{ fontSize: 11, opacity: 0.65, flexShrink: 0 }}>Sources:</span>
            {msg.sources.map((s, i) => (
              <span key={i} style={{
                fontSize: 11,
                background: isUser ? "rgba(255,255,255,0.15)" : "#F1EFE8",
                color: isUser ? "rgba(255,255,255,0.85)" : "#444441",
                padding: "2px 7px",
                borderRadius: 5,
              }}>{s}</span>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="wb-card">
        <p style={{ fontSize: 13, color: "#888780", marginBottom: 12, lineHeight: 1.6 }}>
          Enter one URL per line. The scraper follows internal links up to depth 2.
        </p>
        <textarea
          value={urls}
          onChange={e => setUrls(e.target.value)}
          placeholder={"https://example.com\nhttps://docs.example.com"}
          className="wb-input"
          style={{ minHeight: 108 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <label className="wb-checkbox-label">
            <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} />
            Re-scrape already ingested URLs
          </label>
          <button onClick={handleScrape} className="wb-btn-primary" style={{ marginLeft: "auto" }}>
            <i className="ti ti-world-download" style={{ fontSize: 15 }} aria-hidden="true" />
            Scrape &amp; Ingest
          </button>
        </div>
      </div>

      {status && (
        <div style={{
          background: "#FAFAF8",
          border: "1px solid #E2E0D8",
          borderRadius: 12,
          padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12,
          animation: "fadeSlideIn 0.2s ease",
        }}>
          <StatusBadge status={status.status} />
          <span style={{ fontSize: 13, color: "#5F5E5A", flex: 1 }}>
            {status.status === "running" && (polling ? "Scraping in progress — this may take a moment." : status.message)}
            {status.status === "done" && `${status.ingest_result || "Complete"}`}
            {status.status === "failed" && `Error: ${status.error}`}
            {status.status === "cached" && status.message}
            {status.status === "starting" && "Starting…"}
          </span>
          {status.status === "running" && polling && (
            <i className="ti ti-loader-2" style={{ fontSize: 17, color: "#BA7517", animation: "spin 1s linear infinite", flexShrink: 0 }} aria-hidden="true" />
          )}
        </div>
      )}

      {ingested.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#2C2C2A" }}>Ingested URLs</p>
            <span style={{
              fontSize: 11, fontWeight: 500,
              background: "#EEEDFE", color: "#534AB7",
              padding: "2px 8px", borderRadius: 99,
            }}>{ingested.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ingested.map((item, i) => (
              <div key={i} className="wb-url-item">
                <i className="ti ti-circle-check-filled" style={{ fontSize: 15, color: "#639922", flexShrink: 0 }} aria-hidden="true" />
                <span style={{
                  fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", color: "#444441",
                  fontFamily: "'DM Mono', monospace",
                }}>{item.url}</span>
                <button
                  onClick={() => handleDelete(item.url)}
                  className="wb-url-delete"
                  aria-label="Remove URL"
                >
                  <i className="ti ti-trash" style={{ fontSize: 14 }} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
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
    <div style={{ display: "flex", flexDirection: "column", height: 490 }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 2px 8px" }}>
        {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 40 }}>
            <div style={{
              background: "white",
              border: "1px solid #E2E0D8",
              borderRadius: "4px 16px 16px 16px",
              padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 2,
            }}>
              <div className="wb-loading-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{
        display: "flex", gap: 8, alignItems: "flex-end",
        borderTop: "1px solid #E2E0D8",
        paddingTop: 14,
        marginTop: 4,
      }}>
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          className="wb-select"
          style={{ flexShrink: 0 }}
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask a question about the scraped content…"
          className="wb-chat-textarea"
          rows={1}
        />
        <button onClick={send} disabled={!input.trim() || loading} className="wb-send-btn">
          <i className="ti ti-send" style={{ fontSize: 16 }} aria-hidden="true" />
        </button>
      </div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={fetchSummary} disabled={loadingSummary} className="wb-btn-purple-soft">
          {loadingSummary
            ? <><i className="ti ti-loader-2" style={{ fontSize: 14, animation: "spin 1s linear infinite" }} aria-hidden="true" />Generating…</>
            : <><i className="ti ti-file-description" style={{ fontSize: 14 }} aria-hidden="true" />Generate Summary</>
          }
        </button>
        <button onClick={fetchFaqs} disabled={loadingFaqs} className="wb-btn-teal">
          {loadingFaqs
            ? <><i className="ti ti-loader-2" style={{ fontSize: 14, animation: "spin 1s linear infinite" }} aria-hidden="true" />Generating…</>
            : <><i className="ti ti-help-circle" style={{ fontSize: 14 }} aria-hidden="true" />Generate FAQs</>
          }
        </button>
        <button onClick={handleExport} className="wb-btn-ghost" style={{ marginLeft: "auto" }}>
          <i className="ti ti-download" style={{ fontSize: 14 }} aria-hidden="true" />Export Markdown
        </button>
        {exportMsg && (
          <span style={{
            fontSize: 12, color: "#27500A", fontWeight: 500,
            background: "#EAF3DE", padding: "4px 10px", borderRadius: 8,
            animation: "fadeSlideIn 0.2s ease",
          }}>{exportMsg}</span>
        )}
      </div>

      {summary && (
        <div className="wb-card">
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="ti ti-file-description" style={{ fontSize: 14, color: "#534AB7" }} aria-hidden="true" />
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#534AB7" }}>Summary</p>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.75, whiteSpace: "pre-wrap", color: "#444441" }}>{summary}</p>
        </div>
      )}

      {faqs && faqs.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="ti ti-help-circle" style={{ fontSize: 14, color: "#0F6E56" }} aria-hidden="true" />
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#0F6E56" }}>Frequently Asked Questions</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {faqs.map((faq, i) => (
              <div key={i} className="wb-faq-item">
                <p style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 7, color: "#2C2C2A", lineHeight: 1.5 }}>
                  <span style={{ color: "#534AB7", marginRight: 6, fontWeight: 600 }}>Q</span>
                  {faq.question}
                </p>
                <p style={{ fontSize: 13, color: "#5F5E5A", lineHeight: 1.7 }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {faqs && faqs.length === 0 && (
        <div style={{
          textAlign: "center", padding: "2rem 1rem",
          color: "#888780", fontSize: 13,
        }}>
          <i className="ti ti-inbox" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: 0.4 }} aria-hidden="true" />
          No FAQs generated yet. Make sure you have content ingested first.
        </div>
      )}
    </div>
  );
}

export default function WebBotApp() {
  const [tab, setTab] = useState("scrape");
  const [hasData, setHasData] = useState(false);

  return (
    <div className="webbot-root" style={{ padding: "1.25rem 1rem", maxWidth: 740, margin: "0 auto" }}>
      <style>{styles}</style>
      <h2 className="sr-only">WebBot — Scrape websites and chat with their content</h2>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 5 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "linear-gradient(135deg, #7F77DD 0%, #3C3489 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 3px 10px rgba(83, 74, 183, 0.3)",
          }}>
            <i className="ti ti-robot" style={{ fontSize: 20, color: "#fff" }} aria-hidden="true" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 21, fontWeight: 600, color: "#1C1B1A", letterSpacing: "-0.02em" }}>WebBot</span>
              {hasData && (
                <span style={{
                  fontSize: 11, fontWeight: 500, letterSpacing: "0.03em",
                  background: "#EAF3DE", color: "#27500A",
                  padding: "3px 9px", borderRadius: 99,
                  border: "1px solid #97C459",
                  animation: "fadeSlideIn 0.25s ease",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#639922", display: "inline-block" }} />
                  Data ready
                </span>
              )}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#888780", marginLeft: 50, lineHeight: 1.5 }}>
          Scrape websites → build a knowledge base → chat with your data
        </p>
      </div>

      {/* Main card */}
      <div style={{
        background: "white",
        border: "1px solid #E2E0D8",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.04)",
      }}>
        {/* Tabs */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid #E2E0D8",
          padding: "0 20px",
          gap: 4,
          background: "#FAFAF8",
          overflowX: "auto",
        }}>
          <Tab label="Scrape URLs" icon="world-download" active={tab === "scrape"} onClick={() => setTab("scrape")} />
          <Tab label="Chat" icon="message-circle" active={tab === "chat"} onClick={() => setTab("chat")} />
          <Tab label="Knowledge" icon="brain" active={tab === "knowledge"} onClick={() => setTab("knowledge")} />
        </div>

        {/* Panel content */}
        <div style={{ padding: "1.4rem 1.5rem" }}>
          {tab === "scrape" && <ScrapePanel onIngested={() => setHasData(true)} />}
          {tab === "chat" && <ChatPanel />}
          {tab === "knowledge" && <KnowledgePanel />}
        </div>
      </div>

      {/* Footer */}
      <p style={{ fontSize: 12, color: "#B4B2A9", marginTop: 14, textAlign: "center" }}>
        Backend must be running at{" "}
        <code style={{ fontFamily: "'DM Mono', monospace", color: "#888780", fontSize: 11 }}>
          http://localhost:8000
        </code>
      </p>
    </div>
  );
}
