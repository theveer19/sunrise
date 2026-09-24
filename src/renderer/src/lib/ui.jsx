import React from "react";
import { X, Printer, Download, Search } from "lucide-react";

export const Field = ({ label, children }) => (
  <div><label className="lbl">{label}</label>{children}</div>
);
export const Text = ({ label, value, onChange, type = "text", placeholder }) => (
  <Field label={label}>
    <input className="inp" type={type} value={value ?? ""} placeholder={placeholder}
      onChange={(ev) => onChange(ev.target.value)} />
  </Field>
);
export const Pick = ({ label, value, onChange, options }) => (
  <Field label={label}>
    <select className="inp" value={value ?? ""} onChange={(ev) => onChange(ev.target.value)}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </Field>
);
export const Area = ({ label, value, onChange, rows = 2 }) => (
  <Field label={label}>
    <textarea className="inp" rows={rows} value={value ?? ""} onChange={(ev) => onChange(ev.target.value)} />
  </Field>
);

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", flex: "1 1 220px" }}>
      <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--slate)" }} />
      <input className="inp" style={{ paddingLeft: 30 }} placeholder={placeholder}
        value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card modal" style={{ maxWidth: wide ? 980 : 640 }}>
        <div className="modal-head">
          <h3 className="serif" style={{ margin: 0, fontSize: 18 }}>{title}</h3>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  );
}

export function Panel({ title, note, action, children }) {
  return (
    <section className="card" style={{ marginBottom: 18 }}>
      <header className="panel-head">
        <div>
          <h2 className="serif" style={{ margin: 0, fontSize: 17 }}>{title}</h2>
          {note && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--slate)" }}>{note}</p>}
        </div>
        {action}
      </header>
      <div style={{ padding: 18 }}>{children}</div>
    </section>
  );
}

export const Empty = ({ children }) => (
  <p style={{ padding: "22px 4px", fontSize: 13, color: "var(--slate)" }}>{children}</p>
);

export function Stat({ label, value, sub, tone }) {
  return (
    <div className="card" style={{ padding: "14px 16px", borderTop: `3px solid ${tone || "var(--sun)"}` }}>
      <p className="eyebrow" style={{ margin: 0 }}>{label}</p>
      <p className="serif" style={{ margin: "6px 0 2px", fontSize: 25, fontWeight: 700, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 11, color: "var(--slate)" }}>{sub}</p>}
    </div>
  );
}

/* Document viewer: renders certificate HTML, prints & downloads via main process */
export function DocViewer({ html, fileName, onClose }) {
  const [busy, setBusy] = React.useState("");
  const download = async () => {
    setBusy("pdf");
    await window.api.pdf.save(html, fileName || "document.pdf");
    setBusy("");
  };
  const print = async () => {
    setBusy("print");
    await window.api.pdf.print(html);
    setBusy("");
  };
  return (
    <div className="overlay doc-overlay">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="doc-bar">
          <span style={{ color: "#fff", fontSize: 13 }}>Preview — A4</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={print} disabled={busy}><Printer size={14} /> {busy === "print" ? "Printing…" : "Print"}</button>
            <button className="btn btn-teal" onClick={download} disabled={busy}><Download size={14} /> {busy === "pdf" ? "Saving…" : "Download PDF"}</button>
            <button className="btn btn-ghost" style={{ background: "#fff" }} onClick={onClose}><X size={14} /> Close</button>
          </div>
        </div>
        <div className="doc-scroll">
          <iframe title="preview" className="doc-frame" srcDoc={html} />
        </div>
      </div>
    </div>
  );
}
