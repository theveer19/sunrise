import React, { useState } from "react";
import { Printer, FileText } from "lucide-react";
import { today } from "../lib/helpers";
import { Panel, Text, Area } from "../lib/ui.jsx";
import { letterheadHtml } from "../lib/templates";

const SAMPLES = {
  "Blank": { subject: "", body: "" },
  "Notice / Circular": {
    subject: "Notice regarding upcoming holiday",
    body: "This is to inform all students and parents that the school will remain closed on account of the forthcoming festival.\n\nRegular classes will resume as per the normal timetable thereafter. Kindly take note.",
  },
  "Fee reminder (formal)": {
    subject: "Reminder for pending school fees",
    body: "This is a gentle reminder that the school fees for the current term are pending. Parents are requested to clear the outstanding dues at the school office at the earliest to avoid any inconvenience.",
  },
  "Recommendation": {
    subject: "Letter of recommendation",
    body: "It gives us great pleasure to recommend the bearer of this letter, who has been associated with our institution. We have found the individual to be sincere, disciplined and of good moral character.\n\nWe wish them success in their future endeavours.",
  },
};

export default function Letterhead({ school, openDoc }) {
  const [f, setF] = useState({
    title: "Official Letter", ref: `${school.initials}/GEN/`, date: today(),
    to: "", subject: "", body: "", signOff: "Yours faithfully,", signatory: school.principal,
  });
  const up = (k, v) => setF({ ...f, [k]: v });
  const preset = (name) => setF({ ...f, subject: SAMPLES[name].subject, body: SAMPLES[name].body });

  const generate = () => openDoc(letterheadHtml(school, f), "Letter.pdf");

  return (
    <Panel title="Letter pad / letterhead" note="Fill the details, pick a template if you like, then generate a letter on the school letterhead."
      action={<button className="btn" onClick={generate}><Printer size={14} /> Generate letter</button>}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {Object.keys(SAMPLES).map((name) => (
          <button key={name} className="btn btn-ghost btn-sm" onClick={() => preset(name)}><FileText size={12} /> {name}</button>
        ))}
      </div>

      <div className="grid-form" style={{ marginBottom: 12 }}>
        <Text label="Letter title / heading" value={f.title} onChange={(v) => up("title", v)} />
        <Text label="Reference no." value={f.ref} onChange={(v) => up("ref", v)} />
        <Text label="Date" type="date" value={f.date} onChange={(v) => up("date", v)} />
        <Text label="Sign-off" value={f.signOff} onChange={(v) => up("signOff", v)} />
        <Text label="Signatory name" value={f.signatory} onChange={(v) => up("signatory", v)} />
        <Text label="Subject" value={f.subject} onChange={(v) => up("subject", v)} />
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <Area label="To (recipient — optional, one line each)" rows={3} value={f.to} onChange={(v) => up("to", v)} />
        <Area label="Body (blank line = new paragraph)" rows={9} value={f.body} onChange={(v) => up("body", v)} />
      </div>
      <p style={{ fontSize: 12, color: "var(--slate)", marginBottom: 0 }}>
        The school name, address, logo and seal are added automatically. Use the Generate button to preview, print or save as PDF.
      </p>
    </Panel>
  );
}