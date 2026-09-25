import React, { useState, useEffect } from "react";
import { ScrollText, Printer, Award } from "lucide-react";
import { CLASSES, fmtDate, today, nextClass } from "../lib/helpers";
import { Panel, Modal, Text, Pick, Empty, Tabs, DataTable, useToast } from "../lib/ui.jsx";
import { tcHtml, bonafideHtml, characterHtml, studyHtml } from "../lib/templates";

export default function Certificates({ students, school, openDoc, reload }) {
  const toast = useToast();
  const [tab, setTab] = useState("tc");
  const [tcs, setTcs] = useState([]);
  const [draft, setDraft] = useState(null);

  const loadTcs = async () => setTcs(await window.api.cert.list("tc"));
  useEffect(() => { loadTcs(); }, [students.length]);

  const active = students.filter((s) => s.status === "Active");

  const startTC = (s) => {
    setDraft({
      student_id: s.id, number: "", date: today(), leavingDate: today(),
      lastClass: s.class, promotedTo: nextClass(s.class) || "",
      qualifiedForPromotion: "Yes", subjectsStudied: "English, Hindi, Mathematics, Science, Social Science",
      workingDays: "220", daysPresent: "205", conduct: "Good",
      gamesActivities: "Participated in school games and cultural activities",
      dues: "No dues outstanding", reason: "Parents shifting to another city", remarks: "Nil"
    });
  };

  const [issuing, setIssuing] = useState(false);
  const issueTC = async () => {
    if (issuing) return;
    setIssuing(true);
    const rec = await window.api.cert.issueTC(draft).finally(() => setIssuing(false));
    const s = students.find((x) => x.id === draft.student_id);
    setDraft(null);
    await loadTcs();
    reload();
    toast.ok(`Transfer certificate ${rec.meta.number} issued — ${s.name} marked as left.`);
    openDoc(tcHtml(school, s, rec.meta), `TC-${s.name}.pdf`);
  };

  const printLetter = (s, kind) => {
    const fn = { bonafide: bonafideHtml, character: characterHtml, study: studyHtml }[kind];
    openDoc(fn(school, s), `${kind}-${s.name}.pdf`);
  };

  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[["tc", "Transfer certificate"], ["bonafide", "Bonafide"],
        ["character", "Character"], ["study", "Study"]]} />

      {tab === "tc" && (
        <>
          <Panel title="Issue transfer certificate" note="Issuing a TC marks the student as Left on the register.">
            {active.length === 0 ? <Empty>No active students.</Empty> : (
              <table className="grid">
                <thead><tr><th>Adm. No.</th><th>Name</th><th>Father</th><th>Class</th><th></th></tr></thead>
                <tbody>
                  {active.map((s) => (
                    <tr key={s.id}>
                      <td>{s.adm_no}</td><td style={{ fontWeight: 600 }}>{s.name}</td><td>{s.father}</td><td>{s.class}-{s.section}</td>
                      <td><button className="btn btn-sm" onClick={() => startTC(s)}><ScrollText size={12} /> Prepare TC</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
          <Panel title="TC record book" note={`${tcs.length} certificate(s) issued`}>
            {tcs.length === 0 ? <Empty>No TC issued yet.</Empty> : (
              <table className="grid">
                <thead><tr><th>TC No.</th><th>Student</th><th>Date</th><th>Reason</th><th></th></tr></thead>
                <tbody>
                  {tcs.map((t) => {
                    const s = students.find((x) => x.id === t.student_id) || {};
                    return (
                      <tr key={t.id}>
                        <td>{t.number}</td><td style={{ fontWeight: 600 }}>{s.name || "(deleted student)"}</td>
                        <td>{fmtDate(t.date)}</td><td>{t.meta.reason}</td>
                        <td><button className="btn btn-ghost btn-sm" onClick={() => openDoc(tcHtml(school, s, t.meta), `TC-${s.name || t.number}.pdf`)}><Printer size={12} /> Reprint</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Panel>
        </>
      )}

      {["bonafide", "character", "study"].includes(tab) && (
        <Panel title={`${tab[0].toUpperCase() + tab.slice(1)} certificate`} note="Select a student to generate a colored, print-ready certificate.">
          {active.length === 0 ? <Empty>No active students.</Empty> : (
            <table className="grid">
              <thead><tr><th>Adm. No.</th><th>Name</th><th>Class</th><th></th></tr></thead>
              <tbody>
                {active.map((s) => (
                  <tr key={s.id}>
                    <td>{s.adm_no}</td><td style={{ fontWeight: 600 }}>{s.name}</td><td>{s.class}-{s.section}</td>
                    <td><button className="btn btn-sm" onClick={() => printLetter(s, tab)}><Award size={12} /> Generate</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {draft && (() => {
        const s = students.find((x) => x.id === draft.student_id);
        return (
          <Modal wide title={`Transfer certificate — ${s.name}`} onClose={() => setDraft(null)}>
            <p style={{ fontSize: 12, color: "var(--slate)", marginTop: 0 }}>
              Name, parentage, DOB, PEN, Samagra and Aadhaar come from the student record. Fill the leaving particulars.
            </p>
            <div className="grid-form">
              <Text label="TC no. (blank = auto)" value={draft.number} onChange={(v) => setDraft({ ...draft, number: v })} />
              <Text label="Date of issue" type="date" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} />
              <Text label="Date of leaving" type="date" value={draft.leavingDate} onChange={(v) => setDraft({ ...draft, leavingDate: v })} />
              <Pick label="Class last studied" value={draft.lastClass} onChange={(v) => setDraft({ ...draft, lastClass: v })} options={CLASSES} />
              <Text label="Promoted to class" value={draft.promotedTo} onChange={(v) => setDraft({ ...draft, promotedTo: v })} />
              <Pick label="Qualified for promotion" value={draft.qualifiedForPromotion} onChange={(v) => setDraft({ ...draft, qualifiedForPromotion: v })} options={["Yes", "No"]} />
              <Text label="Total working days" value={draft.workingDays} onChange={(v) => setDraft({ ...draft, workingDays: v })} />
              <Text label="Days present" value={draft.daysPresent} onChange={(v) => setDraft({ ...draft, daysPresent: v })} />
              <Pick label="Conduct" value={draft.conduct} onChange={(v) => setDraft({ ...draft, conduct: v })} options={["Excellent", "Very Good", "Good", "Satisfactory"]} />
              <Text label="Fee dues" value={draft.dues} onChange={(v) => setDraft({ ...draft, dues: v })} />
            </div>
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              <Text label="Subjects studied" value={draft.subjectsStudied} onChange={(v) => setDraft({ ...draft, subjectsStudied: v })} />
              <Text label="Reason for leaving" value={draft.reason} onChange={(v) => setDraft({ ...draft, reason: v })} />
              <Text label="Games / activities" value={draft.gamesActivities} onChange={(v) => setDraft({ ...draft, gamesActivities: v })} />
              <Text label="Any other remarks" value={draft.remarks} onChange={(v) => setDraft({ ...draft, remarks: v })} />
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setDraft(null)}>Cancel</button>
              <button className="btn" onClick={issueTC} disabled={issuing}><Printer size={14} /> {issuing ? "Issuing…" : "Issue & open"}</button>
            </div>
          </Modal>
        );
      })()}
    </>
  );
}
