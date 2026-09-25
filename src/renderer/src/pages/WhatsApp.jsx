import React, { useState, useEffect } from "react";
import { Send, Smartphone, QrCode, LogOut } from "lucide-react";
import { Panel, Pick, Empty, Area, Pill, useToast, useConfirm } from "../lib/ui.jsx";
import { CLASSES } from "../lib/helpers";

/* templates by audience -> language -> name -> (person, school) => text */
const T = {
  students: {
    English: {
      "Fee reminder": (s, sc) => `Dear Parent, this is a gentle reminder from ${sc.name} that the monthly fee for ${s.name} (Class ${s.class}-${s.section}) is due. Kindly pay at the school office at your earliest convenience. Thank you.`,
      "Absent alert": (s, sc) => `Dear Parent, ${s.name} (Class ${s.class}-${s.section}) was marked absent today at ${sc.name}. Please inform us if this was on leave. Regards, School Office.`,
      "Result declared": (s, sc) => `Dear Parent, the examination result of ${s.name} (Class ${s.class}-${s.section}) has been declared at ${sc.name}. Please collect the marksheet from the class teacher. Regards.`,
      "PTM invite": (s, sc) => `Dear Parent, you are invited to the Parent-Teacher Meeting at ${sc.name} this Saturday. We look forward to discussing ${s.name}'s progress. Regards.`,
      "Custom": () => "",
    },
    Hindi: {
      "फीस अनुस्मारक": (s, sc) => `प्रिय अभिभावक, ${sc.name} की ओर से सूचित किया जाता है कि ${s.name} (कक्षा ${s.class}-${s.section}) की मासिक फीस बकाया है। कृपया शीघ्र विद्यालय कार्यालय में जमा करें। धन्यवाद।`,
      "अनुपस्थिति सूचना": (s, sc) => `प्रिय अभिभावक, आज ${s.name} (कक्षा ${s.class}-${s.section}) विद्यालय में अनुपस्थित रहे/रहीं। यदि अवकाश पर हैं तो कृपया सूचित करें। — ${sc.name}`,
      "परिणाम घोषित": (s, sc) => `प्रिय अभिभावक, ${s.name} (कक्षा ${s.class}-${s.section}) का परीक्षा परिणाम घोषित हो गया है। कृपया कक्षा शिक्षक से अंकसूची प्राप्त करें। — ${sc.name}`,
      "अभिभावक बैठक": (s, sc) => `प्रिय अभिभावक, ${sc.name} में इस शनिवार अभिभावक-शिक्षक बैठक आयोजित है। ${s.name} की प्रगति पर चर्चा हेतु आपकी उपस्थिति अपेक्षित है। धन्यवाद।`,
      "स्वयं लिखें": () => "",
    },
  },
  teachers: {
    English: {
      "Salary credited": (s, sc) => `Dear ${s.name}, your salary for this month has been processed by ${sc.name}. Kindly check your account. Regards, Administration.`,
      "Staff meeting": (s, sc) => `Dear ${s.name}, a staff meeting is scheduled at ${sc.name}. Your presence is requested. Regards, Principal.`,
      "Holiday notice": (s, sc) => `Dear ${s.name}, please note the school will remain closed on the announced holiday. Regards, ${sc.name}.`,
      "Custom": () => "",
    },
    Hindi: {
      "वेतन सूचना": (s, sc) => `प्रिय ${s.name}, ${sc.name} द्वारा इस माह का वेतन जारी कर दिया गया है। कृपया अपना खाता जाँचें। — प्रशासन`,
      "स्टाफ बैठक": (s, sc) => `प्रिय ${s.name}, ${sc.name} में स्टाफ बैठक आयोजित है। कृपया समय पर उपस्थित हों। — प्राचार्य`,
      "अवकाश सूचना": (s, sc) => `प्रिय ${s.name}, कृपया ध्यान दें कि घोषित अवकाश के दिन विद्यालय बंद रहेगा। — ${sc.name}`,
      "स्वयं लिखें": () => "",
    },
  },
};

export default function WhatsApp({ students, staff = [], school }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [wa, setWa] = useState({ status: "disconnected", qr: null });
  const [audience, setAudience] = useState("students");
  const [language, setLanguage] = useState("English");
  const [cls, setCls] = useState("All");
  const [template, setTemplate] = useState("Fee reminder");
  const [custom, setCustom] = useState("");
  const [selected, setSelected] = useState({});
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState([]);

  useEffect(() => {
    window.api.wa.status().then(setWa);
    // unsubscribe on unmount, otherwise every visit to this page adds another listener
    const off = window.api.wa.onEvent(setWa);
    return () => { if (typeof off === "function") off(); };
  }, []);
  const isWeb = wa.status === "web";
  const connect = async () => setWa(await window.api.wa.connect());
  const disconnect = async () => setWa(await window.api.wa.disconnect());

  const templateSet = T[audience][language];
  const templateNames = Object.keys(templateSet);
  // keep template valid when audience/language changes
  useEffect(() => {
    if (!templateNames.includes(template)) setTemplate(templateNames[0]);
    setSelected({});
  }, [audience, language]);

  const isCustom = template === templateNames[templateNames.length - 1]; // last is always Custom/स्वयं लिखें
  const build = (p) => (isCustom ? custom : (templateSet[template] || (() => ""))(p, school));

  const recipients =
    audience === "students"
      ? students.filter((s) => s.status === "Active" && (cls === "All" || s.class === cls) && (s.whatsapp || s.phone))
      : staff.filter((s) => s.status === "Active" && (s.whatsapp || s.phone));

  const numFor = (p) => p.whatsapp || p.phone;
  const toggle = (id) => setSelected((m) => ({ ...m, [id]: !m[id] }));
  const allOn = recipients.length > 0 && recipients.every((p) => selected[p.id]);
  const toggleAll = () => { const v = !allOn; const m = {}; recipients.forEach((p) => (m[p.id] = v)); setSelected(m); };
  const quickSend = (p) => {
    const text = build(p);
    if (!text.trim()) return toast.warn("Write the message first.");
    return window.api.wa.quick(numFor(p), text);
  };

  const sendBulk = async () => {
    const list = recipients.filter((p) => selected[p.id]);
    if (!list.length) return toast.warn("Select at least one recipient.");
    if (isCustom && !custom.trim()) return toast.warn("Write the custom message first.");
    if (wa.status !== "ready") {
      if (list.length === 1) return quickSend(list[0]);
      const ok = await confirm({
        title: "Send with quick-links?",
        message: `Automated WhatsApp is not connected. ${list.length} WhatsApp chats will open with the message ready to send.`
          + (isWeb ? "\n\nIf only one opens, allow pop-ups for this site in your browser." : ""),
        confirmLabel: `Open ${list.length} chats`
      });
      if (ok) list.forEach(quickSend);
      return;
    }
    setSending(true);
    const results = [];
    for (const p of list) {
      const r = await window.api.wa.send(numFor(p), build(p));
      results.push({ name: p.name, ok: r.ok, error: r.error });
    }
    setLog(results); setSending(false);
    const good = results.filter((r) => r.ok).length;
    if (good === results.length) toast.ok(`Message sent to ${good} recipient${good === 1 ? "" : "s"}.`);
    else toast.warn(`${good} of ${results.length} sent — see the report below.`);
  };

  return (
    <>
      <Panel title="WhatsApp centre" note="Message parents and staff — fee reminders, absentee alerts, salary and meeting notices, in English or Hindi."
        action={
          wa.status === "ready"
            ? <button className="btn btn-ghost btn-sm" onClick={disconnect}><LogOut size={13} /> Disconnect</button>
            : isWeb ? null
            : <button className="btn btn-sm" onClick={connect} disabled={wa.status === "authenticating"}><QrCode size={13} /> Connect WhatsApp</button>
        }>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <span className="pill" style={{ color: wa.status === "ready" ? "var(--ok)" : "var(--warn)", borderColor: "currentColor" }}>
            {wa.status === "ready" ? "Connected — automated sending on" :
             wa.status === "qr" ? "Scan QR to connect" :
             wa.status === "authenticating" ? "Authenticating…" :
             wa.status === "error" ? "Automated mode unavailable — quick-links still work" :
             isWeb ? "Quick-send mode (automated bulk sending is in the desktop app)" : "Not connected"}
          </span>
          <span style={{ fontSize: 12, color: "var(--slate)" }}>
            Quick-send (green button per row) always works with zero setup — it opens WhatsApp with the message ready.
          </span>
        </div>
        {wa.error && wa.status !== "web" && <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 0 }}>{wa.error}</p>}
        {wa.status === "qr" && wa.qr && (
          <div style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center" }}>
            <img src={wa.qr} alt="WhatsApp QR" style={{ width: 180, height: 180, border: "1px solid var(--rule)", borderRadius: 8 }} />
            <div style={{ fontSize: 13, color: "var(--slate)", maxWidth: 320 }}>
              Open WhatsApp on the school phone → Linked devices → Link a device → scan this code.
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Compose & send" note="Choose who to message, the language, and a template."
        action={<button className="btn" onClick={sendBulk} disabled={sending}><Send size={14} /> {sending ? "Sending…" : "Send to selected"}</button>}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ width: 150 }}><Pick label="Send to" value={audience} onChange={setAudience} options={["students", "teachers"]} /></div>
          <div style={{ width: 130 }}><Pick label="Language" value={language} onChange={setLanguage} options={["English", "Hindi"]} /></div>
          <div style={{ width: 210 }}><Pick label="Template" value={template} onChange={setTemplate} options={templateNames} /></div>
          {audience === "students" && (
            <div style={{ width: 130 }}><Pick label="Class filter" value={cls} onChange={setCls} options={["All", ...CLASSES.filter((c) => students.some((s) => s.class === c))]} /></div>
          )}
        </div>
        {isCustom && <Area label="Custom message" rows={3} value={custom} onChange={setCustom} />}

        {recipients.length === 0 ? (
          <Empty>No active {audience === "students" ? "students" : "staff"} with a phone/WhatsApp number{audience === "students" ? " in this filter" : ""}.</Empty>
        ) : (
          <table className="grid" style={{ marginTop: 12 }}>
            <thead><tr>
              <th><input type="checkbox" checked={allOn} onChange={toggleAll} /></th>
              <th>Name</th><th>{audience === "students" ? "Class" : "Designation"}</th><th>WhatsApp</th><th>Preview</th><th></th>
            </tr></thead>
            <tbody>
              {recipients.map((p) => (
                <tr key={p.id}>
                  <td><input type="checkbox" checked={!!selected[p.id]} onChange={() => toggle(p.id)} /></td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{audience === "students" ? `${p.class}-${p.section}` : p.designation}</td>
                  <td>{numFor(p)}</td>
                  <td style={{ fontSize: 11, color: "var(--slate)", maxWidth: 320 }}>{(build(p) || "").slice(0, 70)}{build(p) ? "…" : ""}</td>
                  <td><button className="btn btn-teal btn-sm" onClick={() => quickSend(p)}><Smartphone size={12} /> Quick send</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {log.length > 0 && (
          <div style={{ marginTop: 14, fontSize: 12 }}>
            <p className="eyebrow">Last send report</p>
            {log.map((r, i) => (
              <div key={i} style={{ color: r.ok ? "var(--ok)" : "var(--danger)" }}>
                {r.ok ? "✓" : "✗"} {r.name}{r.error ? ` — ${r.error}` : ""}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}