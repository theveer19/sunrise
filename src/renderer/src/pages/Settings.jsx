import React, { useState } from "react";
import { Save } from "lucide-react";
import { Panel, Text, useToast } from "../lib/ui.jsx";

export default function Settings({ school, setSchool }) {
  const toast = useToast();
  const [s, setS] = useState(school);
  const up = (k, v) => setS({ ...s, [k]: v });
  const save = async () => {
    if (!(s.name || "").trim()) return toast.warn("School name cannot be empty.");
    const saved = await window.api.settings.save(s);
    setSchool(saved);
    toast.ok("School particulars saved — they now appear on every certificate, receipt and ID card.");
  };
  return (
    <Panel title="School particulars" note="These appear on every marksheet, certificate and receipt."
      action={<button className="btn" onClick={save}><Save size={14} /> Save</button>}>
      <div className="grid-form">
        <Text label="School name" value={s.name} onChange={(v) => up("name", v)} />
        <Text label="Second line" value={s.line2} onChange={(v) => up("line2", v)} />
        <Text label="Address" value={s.address} onChange={(v) => up("address", v)} />
        <Text label="Affiliation no." value={s.affiliation} onChange={(v) => up("affiliation", v)} />
        <Text label="UDISE code" value={s.udise} onChange={(v) => up("udise", v)} />
        <Text label="Board" value={s.board} onChange={(v) => up("board", v)} />
        <Text label="Academic session" value={s.session} onChange={(v) => up("session", v)} />
        <Text label="Principal" value={s.principal} onChange={(v) => up("principal", v)} />
        <Text label="Phone" value={s.phone} onChange={(v) => up("phone", v)} />
        <Text label="Email" value={s.email} onChange={(v) => up("email", v)} />
        <Text label="Monogram initials" value={s.initials} onChange={(v) => up("initials", v)} />
      </div>
    </Panel>
  );
}
