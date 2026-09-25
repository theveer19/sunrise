import React, { useState } from "react";
import { Plus, Pencil, Trash2, Save, LogOut, RotateCcw, GraduationCap } from "lucide-react";
import { CLASSES, SECTIONS, fmtDate, today, nextClass } from "../lib/helpers";
import { Panel, Modal, Text, Pick, Area, SearchBox, Empty, Tabs, useToast, useConfirm } from "../lib/ui.jsx";

const blank = () => ({
  adm_no: "", pen_no: "", samagra_no: "", aadhar_no: "", exam_no: "", app_id: "", name: "", father: "", mother: "",
  dob: "", doa: today(), class: "6", section: "A", roll: "", gender: "Male", category: "General",
  religion: "Hindu", nationality: "Indian", phone: "", whatsapp: "", address: "", prev_school: "",
  blood_group: "", status: "Active"
});


export default function Students({ students, reload }) {
  const [tab, setTab] = useState("register");
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[["register", "Student register"], ["promote", "Promotion & leaving"]]} />
      {tab === "register" ? <Register students={students} reload={reload} />
        : <Promotion students={students} reload={reload} />}
    </>
  );
}

/* ---------------- Register ----------------------------------------- */
function Register({ students, reload }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("All");
  const [showLeft, setShowLeft] = useState(false);
  const [edit, setEdit] = useState(null);

  const rows = students.filter((s) =>
    (cls === "All" || s.class === cls) &&
    (showLeft || s.status === "Active") &&
    [s.name, s.adm_no, s.exam_no, s.app_id, s.pen_no, s.samagra_no, s.aadhar_no, s.father, s.phone]
      .map((v) => v ?? "").join(" ").toLowerCase().includes(q.trim().toLowerCase()));

  const save = async () => {
    if (!(edit.name || "").trim()) return toast.warn("Enter the student's name.");
    const isNew = !edit.id;
    await window.api.students.save(edit);
    setEdit(null); reload();
    toast.ok(isNew ? `${edit.name} admitted to Class ${edit.class}-${edit.section}.` : "Student record updated.");
  };
  const remove = async (s) => {
    const ok = await confirm({
      title: "Delete this student?", danger: true, confirmLabel: "Delete permanently",
      message: `${s.name} and every linked mark, fee receipt and certificate will be removed. This cannot be undone.\n\nTo keep the records but take the student off the roll, use “Mark left” instead.`
    });
    if (!ok) return;
    await window.api.students.remove(s.id); reload();
    toast.ok("Student record deleted.");
  };
  const toggleLeft = async (s) => {
    const leaving = s.status === "Active";
    const msg = leaving
      ? `${s.name} stays in the records but will no longer appear in fees, exams, attendance or WhatsApp lists.`
      : `${s.name} will appear in fees, exams, attendance and WhatsApp lists again.`;
    const ok = await confirm({
      title: leaving ? "Mark as left?" : "Re-activate student?",
      message: msg, confirmLabel: leaving ? "Mark left" : "Re-activate"
    });
    if (!ok) return;
    await window.api.students.save({ ...s, status: leaving ? "Left" : "Active" });
    reload();
    toast.ok(leaving ? `${s.name} marked as left.` : `${s.name} is active again.`);
  };

  return (
    <Panel title="Student register" note={`${rows.length} record(s) shown`}
      action={<button className="btn" onClick={() => setEdit(blank())}><Plus size={14} /> New admission</button>}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search name, admission / PEN / Samagra / Aadhaar, father, phone" />
        <select className="inp" style={{ width: 150 }} value={cls} onChange={(e) => setCls(e.target.value)}>
          {["All", ...CLASSES].map((c) => <option key={c}>{c}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--slate)" }}>
          <input type="checkbox" checked={showLeft} onChange={(e) => setShowLeft(e.target.checked)} /> show left / passed out
        </label>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="grid">
          <thead><tr>
            <th>Adm. No.</th><th>App ID</th><th>Exam No.</th><th>PEN</th><th>Samagra</th><th>Name</th><th>Father</th>
            <th>Class</th><th>Roll</th><th>D.O.B.</th><th>Phone</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td style={{ whiteSpace: "nowrap" }}>{s.adm_no}</td>
                <td>{s.app_id}</td>
                <td>{s.exam_no}</td>
                <td>{s.pen_no}</td><td>{s.samagra_no}</td>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>{s.father}</td><td>{s.class}-{s.section}</td><td>{s.roll}</td>
                <td>{fmtDate(s.dob)}</td><td>{s.phone}</td>
                <td><span className="pill" style={{ color: s.status === "Active" ? "var(--ok)" : "var(--danger)", borderColor: "currentColor" }}>{s.status}</span></td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setEdit(s)}><Pencil size={12} /></button>{" "}
                  <button className="btn btn-ghost btn-sm" title={s.status === "Active" ? "Mark left (quit)" : "Re-activate"} onClick={() => toggleLeft(s)}>
                    {s.status === "Active" ? <LogOut size={12} /> : <RotateCcw size={12} />}
                  </button>{" "}
                  <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => remove(s)}><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty>No matching students. Adjust filters or record a new admission.</Empty>}
      </div>

      {edit && (
        <Modal wide title={edit.id ? "Edit student record" : "New admission"} onClose={() => setEdit(null)}>
          <p className="eyebrow" style={{ marginTop: 0 }}>Identity</p>
          <div className="grid-form" style={{ marginBottom: 16 }}>
            <Text label="Admission no." value={edit.adm_no} onChange={(v) => setEdit({ ...edit, adm_no: v })} />
            <Text label="PEN number" value={edit.pen_no} onChange={(v) => setEdit({ ...edit, pen_no: v })} />
            <Text label="Samagra ID" value={edit.samagra_no} onChange={(v) => setEdit({ ...edit, samagra_no: v })} />
            <Text label="Aadhaar number" value={edit.aadhar_no} onChange={(v) => setEdit({ ...edit, aadhar_no: v })} />
            <Text label="Examination roll no." value={edit.exam_no} onChange={(v) => setEdit({ ...edit, exam_no: v })} />
            <Text label="App ID" value={edit.app_id} onChange={(v) => setEdit({ ...edit, app_id: v })} />
          </div>
          <p className="eyebrow">Personal</p>
          <div className="grid-form" style={{ marginBottom: 16 }}>
            <Text label="Student name" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
            <Text label="Father's name" value={edit.father} onChange={(v) => setEdit({ ...edit, father: v })} />
            <Text label="Mother's name" value={edit.mother} onChange={(v) => setEdit({ ...edit, mother: v })} />
            <Text label="Date of birth" type="date" value={edit.dob} onChange={(v) => setEdit({ ...edit, dob: v })} />
            <Pick label="Gender" value={edit.gender} onChange={(v) => setEdit({ ...edit, gender: v })} options={["Male", "Female", "Other"]} />
            <Pick label="Category" value={edit.category} onChange={(v) => setEdit({ ...edit, category: v })} options={["General", "OBC", "SC", "ST", "EWS"]} />
            <Text label="Religion" value={edit.religion} onChange={(v) => setEdit({ ...edit, religion: v })} />
            <Text label="Nationality" value={edit.nationality} onChange={(v) => setEdit({ ...edit, nationality: v })} />
            <Pick label="Blood group" value={edit.blood_group} onChange={(v) => setEdit({ ...edit, blood_group: v })} options={["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]} />
          </div>
          <p className="eyebrow">Academic &amp; contact</p>
          <div className="grid-form" style={{ marginBottom: 12 }}>
            <Pick label="Class" value={edit.class} onChange={(v) => setEdit({ ...edit, class: v })} options={CLASSES} />
            <Pick label="Section" value={edit.section} onChange={(v) => setEdit({ ...edit, section: v })} options={SECTIONS} />
            <Text label="Roll no." value={edit.roll} onChange={(v) => setEdit({ ...edit, roll: v })} />
            <Text label="Date of admission" type="date" value={edit.doa} onChange={(v) => setEdit({ ...edit, doa: v })} />
            <Text label="Contact phone" value={edit.phone} onChange={(v) => setEdit({ ...edit, phone: v })} />
            <Text label="WhatsApp no." value={edit.whatsapp} onChange={(v) => setEdit({ ...edit, whatsapp: v })} />
            <Text label="Previous school" value={edit.prev_school} onChange={(v) => setEdit({ ...edit, prev_school: v })} />
            <Pick label="Status" value={edit.status} onChange={(v) => setEdit({ ...edit, status: v })} options={["Active", "Left", "Passed Out"]} />
          </div>
          <Area label="Residential address" value={edit.address} onChange={(v) => setEdit({ ...edit, address: v })} />
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
            <button className="btn" onClick={save}><Save size={14} /> Save record</button>
          </div>
        </Modal>
      )}
    </Panel>
  );
}

/* ---------------- Promotion & leaving ------------------------------ */
const DECISIONS = {
  promote: "Promote to next class",
  retain: "Retain in same class",
  passout: "Passed out (leave)",
  left: "Left / quit (leave)",
};

function Promotion({ students, reload }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [cls, setCls] = useState("");
  const [sec, setSec] = useState("");
  const [decisions, setDecisions] = useState({}); // studentId -> key
  const [busy, setBusy] = useState(false);

  const classes = [...new Set(students.filter((s) => s.status === "Active").map((s) => s.class))]
    .sort((a, b) => CLASSES.indexOf(a) - CLASSES.indexOf(b));
  const sections = [...new Set(students.filter((s) => s.status === "Active" && s.class === cls).map((s) => s.section))].sort();

  const roster = students.filter((s) => s.status === "Active" && s.class === cls && (!sec || s.section === sec));

  const defFor = (s) => (nextClass(s.class) ? "promote" : "passout");
  const decOf = (s) => decisions[s.id] || defFor(s);
  const setDec = (id, v) => setDecisions((d) => ({ ...d, [id]: v }));
  const setAll = (v) => { const d = {}; roster.forEach((s) => (d[s.id] = v)); setDecisions(d); };

  const targetOf = (s) => {
    const k = decOf(s);
    if (k === "promote") return nextClass(s.class) ? `Class ${nextClass(s.class)}` : "Passed out";
    if (k === "retain") return `Stays in Class ${s.class}`;
    if (k === "passout") return "Passed out (records kept)";
    return "Left / quit (records kept)";
  };

  const apply = async () => {
    if (!roster.length) return;
    const summary = roster.reduce((a, s) => { a[decOf(s)] = (a[decOf(s)] || 0) + 1; return a; }, {});
    const lines = Object.entries(summary).map(([k, n]) => `• ${n} ${DECISIONS[k]}`).join("\n");
    const ok = await confirm({
      title: `Promote Class ${cls}${sec ? "-" + sec : ""}?`,
      message: `${lines}\n\nRoll numbers are cleared for promoted students. Remember to update the session year in Settings afterwards.`,
      confirmLabel: "Apply changes"
    });
    if (!ok) return;
    setBusy(true);
    for (const s of roster) {
      const k = decOf(s);
      let upd = { ...s };
      if (k === "promote") {
        const nc = nextClass(s.class);
        if (nc) { upd.class = nc; upd.roll = ""; }        // new class, roll reassigned later
        else { upd.status = "Passed Out"; }
      } else if (k === "passout") upd.status = "Passed Out";
      else if (k === "left") upd.status = "Left";
      // retain → no change
      if (k !== "retain") await window.api.students.save(upd);
    }
    setBusy(false);
    setDecisions({});
    reload();
    toast.ok(`${roster.length} student record${roster.length === 1 ? "" : "s"} updated. Reassign roll numbers in the register.`);
  };

  return (
    <Panel title="Promotion & leaving" note="At year-end, move a whole class up. Passed students go to the next class; failed ones can be retained; leavers/quitters are kept in records but made inactive."
      action={roster.length > 0 && <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setAll("promote")}>All promote</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setAll("retain")}>All retain</button>
        <button className="btn" onClick={apply} disabled={busy}><GraduationCap size={14} /> {busy ? "Applying…" : "Apply"}</button>
      </div>}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ width: 160 }}>
          <Pick label="Class" value={cls} onChange={(v) => { setCls(v); setSec(""); setDecisions({}); }} options={["", ...classes]} />
        </div>
        <div style={{ width: 160 }}>
          <Pick label="Section (blank = all)" value={sec} onChange={(v) => { setSec(v); setDecisions({}); }} options={["", ...sections]} />
        </div>
      </div>

      {!cls ? <Empty>Choose a class to begin promotion.</Empty> :
        roster.length === 0 ? <Empty>No active students in this class/section.</Empty> : (
          <div style={{ overflowX: "auto" }}>
            <table className="grid">
              <thead><tr><th>Adm. No.</th><th>Name</th><th>Current</th><th>Decision</th><th>Outcome</th></tr></thead>
              <tbody>
                {roster.map((s) => (
                  <tr key={s.id}>
                    <td>{s.adm_no}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.class}-{s.section}</td>
                    <td>
                      <select className="inp" style={{ width: 210, padding: "5px 8px" }} value={decOf(s)} onChange={(e) => setDec(s.id, e.target.value)}>
                        {Object.entries(DECISIONS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                      </select>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--slate)" }}>{targetOf(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </Panel>
  );
}