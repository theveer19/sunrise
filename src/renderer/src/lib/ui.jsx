import React from "react";
import { X, Printer, Download, Search, ChevronUp, ChevronDown, FileDown, Check, AlertTriangle, Info, Inbox } from "lucide-react";
import { downloadFile, toCsv } from "./helpers";

/* ==================================================================== */
/*  Form fields                                                         */
/* ==================================================================== */
export const Field = ({ label, children, hint }) => (
  <div>
    <label className="lbl">{label}</label>
    {children}
    {hint && <p className="hint">{hint}</p>}
  </div>
);
export const Text = ({ label, value, onChange, type = "text", placeholder, hint, min, max, disabled }) => (
  <Field label={label} hint={hint}>
    <input className="inp" type={type} value={value ?? ""} placeholder={placeholder} min={min} max={max} disabled={disabled}
      onChange={(ev) => onChange(ev.target.value)} />
  </Field>
);
export const Pick = ({ label, value, onChange, options, hint, disabled }) => (
  <Field label={label} hint={hint}>
    <select className="inp" value={value ?? ""} disabled={disabled} onChange={(ev) => onChange(ev.target.value)}>
      {options.map((o) => {
        const val = typeof o === "object" ? o.value : o;
        const lab = typeof o === "object" ? o.label : o;
        return <option key={String(val)} value={val}>{lab}</option>;
      })}
    </select>
  </Field>
);
export const Area = ({ label, value, onChange, rows = 2, hint, placeholder }) => (
  <Field label={label} hint={hint}>
    <textarea className="inp" rows={rows} value={value ?? ""} placeholder={placeholder} onChange={(ev) => onChange(ev.target.value)} />
  </Field>
);

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="searchbox">
      <Search size={14} className="searchbox-icon" />
      <input className="inp" style={{ paddingLeft: 30 }} placeholder={placeholder}
        value={value} onChange={(e) => onChange(e.target.value)} />
      {value && <button className="searchbox-clear" onClick={() => onChange("")} aria-label="Clear search"><X size={12} /></button>}
    </div>
  );
}

/* ==================================================================== */
/*  Toasts — replace alert() for anything that is not a question        */
/* ==================================================================== */
const ToastCtx = React.createContext(() => {});
export const useToast = () => React.useContext(ToastCtx);

export function ToastHost({ children }) {
  const [items, setItems] = React.useState([]);
  const push = React.useCallback((message, tone = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, message, tone }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 4000);
  }, []);
  const api = React.useMemo(() => Object.assign(push, {
    ok: (m) => push(m, "ok"), warn: (m) => push(m, "warn"), error: (m) => push(m, "error"), info: (m) => push(m, "info")
  }), [push]);
  const Icon = { ok: Check, warn: AlertTriangle, error: AlertTriangle, info: Info };
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {items.map((t) => {
          const I = Icon[t.tone] || Info;
          return (
            <div key={t.id} className={"toast toast-" + t.tone}>
              <I size={15} /> <span>{t.message}</span>
              <button onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))} aria-label="Dismiss"><X size={12} /></button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/* ==================================================================== */
/*  Confirm dialog — replaces window.confirm                            */
/* ==================================================================== */
const ConfirmCtx = React.createContext(async () => false);
export const useConfirm = () => React.useContext(ConfirmCtx);

export function ConfirmHost({ children }) {
  const [state, setState] = React.useState(null);
  const ask = React.useCallback((opts) => new Promise((resolve) => {
    setState({ resolve, ...(typeof opts === "string" ? { message: opts } : opts) });
  }), []);
  const close = (v) => { state?.resolve(v); setState(null); };
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      {state && (
        <div className="overlay" style={{ alignItems: "center", zIndex: 90 }} onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div className="card confirm-box">
            <div className={"confirm-ico " + (state.danger ? "danger" : "")}>
              <AlertTriangle size={18} />
            </div>
            <h3 className="serif" style={{ margin: "0 0 6px", fontSize: 17 }}>{state.title || "Please confirm"}</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--slate)", lineHeight: 1.6, whiteSpace: "pre-line" }}>{state.message}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => close(false)}>{state.cancelLabel || "Cancel"}</button>
              <button className={"btn" + (state.danger ? " btn-danger" : "")} autoFocus onClick={() => close(true)}>
                {state.confirmLabel || "Yes, continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

/* ==================================================================== */
/*  Layout pieces                                                       */
/* ==================================================================== */
export function Modal({ title, subtitle, onClose, children, wide, xwide }) {
  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card modal" style={{ maxWidth: xwide ? 1180 : wide ? 980 : 640 }}>
        <div className="modal-head">
          <div>
            <h3 className="serif" style={{ margin: 0, fontSize: 18 }}>{title}</h3>
            {subtitle && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--slate)" }}>{subtitle}</p>}
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Panel({ title, note, action, children, flush }) {
  return (
    <section className="card" style={{ marginBottom: 18 }}>
      {(title || action) && (
        <header className="panel-head">
          <div>
            <h2 className="serif" style={{ margin: 0, fontSize: 17 }}>{title}</h2>
            {note && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--slate)" }}>{note}</p>}
          </div>
          {action}
        </header>
      )}
      <div style={{ padding: flush ? 0 : 18 }}>{children}</div>
    </section>
  );
}

export const Empty = ({ children, icon = true }) => (
  <div className="empty">
    {icon && <Inbox size={26} strokeWidth={1.4} />}
    <p>{children}</p>
  </div>
);

export function Stat({ label, value, sub, tone, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={"card stat" + (onClick ? " stat-click" : "")} onClick={onClick}
      style={{ borderTop: `3px solid ${tone || "var(--sun)"}` }}>
      <p className="eyebrow" style={{ margin: 0 }}>{label}</p>
      <p className="serif stat-value">{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 11, color: "var(--slate)" }}>{sub}</p>}
    </Tag>
  );
}

export const Pill = ({ tone = "var(--slate)", children }) => (
  <span className="pill" style={{ color: tone, borderColor: "currentColor" }}>{children}</span>
);

export const Tabs = ({ tabs, value, onChange }) => (
  <div className="tabs" role="tablist">
    {tabs.map(([k, label]) => (
      <button key={k} role="tab" aria-selected={value === k}
        className={"tab" + (value === k ? " on" : "")} onClick={() => onChange(k)}>{label}</button>
    ))}
  </div>
);

/* ==================================================================== */
/*  Sortable, exportable table                                          */
/* ==================================================================== */
/* cols: [{ key, label, value?(row), render?(row), align?, width?, sortable?:false, csv?:false }] */
export function DataTable({ cols, rows, empty, exportName, rowKey = (r) => r.id, onRowClick, footer }) {
  const [sort, setSort] = React.useState(null); // { key, dir }
  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const col = cols.find((c) => c.key === sort.key);
    if (!col) return rows;
    const val = (r) => {
      const v = col.value ? col.value(r) : r[col.key];
      return v == null ? "" : v;
    };
    return [...rows].sort((a, b) => {
      const x = val(a), y = val(b);
      const both = typeof x === "number" && typeof y === "number";
      const c = both ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
      return sort.dir === "asc" ? c : -c;
    });
  }, [rows, sort, cols]);

  const toggle = (key) => setSort((s) =>
    !s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null);

  const exportCsv = () => {
    const csvCols = cols.filter((c) => c.csv !== false).map((c) => ({ label: c.label, key: c.key, value: c.value }));
    downloadFile(`${exportName || "export"}.csv`, toCsv(sorted, csvCols));
  };

  if (!rows.length) return <Empty>{empty || "Nothing to show yet."}</Empty>;

  return (
    <>
      {exportName && (
        <div className="table-tools">
          <span>{sorted.length} row{sorted.length === 1 ? "" : "s"}</span>
          <button className="btn btn-ghost btn-sm" onClick={exportCsv} title="Download as CSV (opens in Excel)">
            <FileDown size={12} /> Export CSV
          </button>
        </div>
      )}
      <div className="table-scroll">
        <table className="grid">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} style={{ textAlign: c.align || "left", width: c.width }}
                  className={c.sortable === false ? "" : "th-sort"}
                  onClick={c.sortable === false ? undefined : () => toggle(c.key)}>
                  <span className="th-inner" style={{ justifyContent: c.align === "right" ? "flex-end" : undefined }}>
                    {c.label}
                    {sort?.key === c.key && (sort.dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined}
                style={onRowClick ? { cursor: "pointer" } : undefined}>
                {cols.map((c) => (
                  <td key={c.key} style={{ textAlign: c.align || "left" }}>
                    {c.render ? c.render(r) : (c.value ? c.value(r) : r[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
    </>
  );
}

/* ==================================================================== */
/*  Charts — inline SVG, no dependencies, hover tooltips                */
/* ==================================================================== */
function useTooltip() {
  const [tip, setTip] = React.useState(null);
  const node = tip ? (
    <div className="chart-tip" style={{ left: tip.x, top: tip.y }}>
      <b>{tip.title}</b>
      {tip.lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  ) : null;
  return [node, setTip];
}

/* series: [{ name, color, values:[n] }], labels: [str] */
export function BarChart({ labels, series, height = 190, format = (v) => v, yLabel }) {
  const [tip, setTip] = useTooltip();
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const groups = labels.length;
  const gap = 10;
  const W = 100; // percent-based widths
  const groupW = W / Math.max(1, groups);

  return (
    <div className="chart" style={{ position: "relative" }}>
      {series.length > 1 && (
        <div className="legend">
          {series.map((s) => (
            <span key={s.name}><i style={{ background: s.color }} /> {s.name}</span>
          ))}
        </div>
      )}
      <div className="chart-plot" style={{ height }}>
        <div className="chart-grid">
          {[1, 0.75, 0.5, 0.25, 0].map((f) => (
            <div key={f} className="chart-gridline"><span>{format(Math.round(max * f))}</span></div>
          ))}
        </div>
        <div className="chart-bars" onMouseLeave={() => setTip(null)}>
          {labels.map((lab, i) => (
            <div key={lab + i} className="bar-group" style={{ width: `${groupW}%` }}
              onMouseMove={(e) => {
                const r = e.currentTarget.closest(".chart").getBoundingClientRect();
                setTip({
                  x: e.clientX - r.left, y: e.clientY - r.top - 10, title: lab,
                  lines: series.map((s) => `${series.length > 1 ? s.name + ": " : ""}${format(s.values[i] ?? 0)}`)
                });
              }}>
              <div className="bar-stack">
                {series.map((s) => (
                  <div key={s.name} className="bar" title=""
                    style={{ height: `${((s.values[i] || 0) / max) * 100}%`, background: s.color }} />
                ))}
              </div>
              <span className="bar-label">{lab}</span>
            </div>
          ))}
        </div>
      </div>
      {yLabel && <p className="chart-axis-label">{yLabel}</p>}
      {tip}
    </div>
  );
}

/* single-series line/area chart */
export function LineChart({ labels, values, color = "var(--chart-1)", height = 190, format = (v) => v, yLabel }) {
  const [tip, setTip] = useTooltip();
  const max = Math.max(1, ...values);
  const n = values.length;
  const pts = values.map((v, i) => [n === 1 ? 50 : (i / (n - 1)) * 100, 100 - (v / max) * 100]);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
  const area = `${path} L100,100 L0,100 Z`;
  const [hover, setHover] = React.useState(null);

  return (
    <div className="chart" style={{ position: "relative" }}>
      <div className="chart-plot" style={{ height }}>
        <div className="chart-grid">
          {[1, 0.75, 0.5, 0.25, 0].map((f) => (
            <div key={f} className="chart-gridline"><span>{format(Math.round(max * f))}</span></div>
          ))}
        </div>
        <svg className="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="lcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#lcFill)" />
          <path d={path} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke"
            strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div className="chart-dots" onMouseLeave={() => { setTip(null); setHover(null); }}>
          {pts.map((p, i) => (
            <div key={i} className="dot-hit" style={{ left: `${p[0]}%` }}
              onMouseEnter={(e) => {
                const r = e.currentTarget.closest(".chart").getBoundingClientRect();
                const b = e.currentTarget.getBoundingClientRect();
                setHover(i);
                setTip({ x: b.left - r.left + b.width / 2, y: (p[1] / 100) * height - 8, title: labels[i], lines: [format(values[i])] });
              }}>
              <span className="dot" style={{ top: `${p[1]}%`, background: color, opacity: hover === i ? 1 : 0 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="chart-xaxis">
        {labels.map((l, i) => <span key={i}>{l}</span>)}
      </div>
      {yLabel && <p className="chart-axis-label">{yLabel}</p>}
      {tip}
    </div>
  );
}

/* horizontal ranked bars — for "top N" lists */
export function RankBars({ rows, format = (v) => v, color = "var(--chart-1)" }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rankbars">
      {rows.map((r) => (
        <div key={r.label} className="rankrow">
          <span className="rank-label" title={r.label}>{r.label}</span>
          <div className="bar-track">
            <span style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
          <span className="rank-value">{format(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* circular progress — one headline percentage */
export function Donut({ value, size = 104, label, sub, color = "var(--ok)" }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="donut" style={{ width: size }}>
      <svg width={size} height={size} role="img" aria-label={`${label}: ${pct.toFixed(1)} percent`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--rule)" strokeWidth="9" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="donut-text">{pct.toFixed(0)}%</text>
      </svg>
      {label && <p className="donut-label">{label}</p>}
      {sub && <p className="donut-sub">{sub}</p>}
    </div>
  );
}

/* ==================================================================== */
/*  Document viewer                                                     */
/* ==================================================================== */
export function DocViewer({ html, fileName, onClose }) {
  const [busy, setBusy] = React.useState("");
  const [zoom, setZoom] = React.useState(1);
  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const download = async () => { setBusy("pdf"); await window.api.pdf.save(html, fileName || "document.pdf"); setBusy(""); };
  const print = async () => { setBusy("print"); await window.api.pdf.print(html); setBusy(""); };
  return (
    <div className="overlay doc-overlay">
      <div style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
        <div className="doc-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#fff", fontSize: 13 }}>Preview — A4</span>
            <div className="zoomer">
              <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} aria-label="Zoom out">−</button>
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} aria-label="Zoom in">+</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={print} disabled={!!busy}><Printer size={14} /> {busy === "print" ? "Printing…" : "Print"}</button>
            <button className="btn btn-teal" onClick={download} disabled={!!busy}><Download size={14} /> {busy === "pdf" ? "Saving…" : "Download PDF"}</button>
            <button className="btn btn-ghost" style={{ background: "#fff" }} onClick={onClose}><X size={14} /> Close</button>
          </div>
        </div>
        <div className="doc-scroll">
          <iframe title="preview" className="doc-frame" srcDoc={html}
            style={{ transform: `scale(${zoom})`, marginBottom: zoom < 1 ? `${(zoom - 1) * 297}mm` : 0 }} />
        </div>
      </div>
    </div>
  );
}
