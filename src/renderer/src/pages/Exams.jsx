import React, { useState, useEffect } from "react";
import { Plus, Trash2, Printer, Save, Trophy } from "lucide-react";
import { CLASSES, SECTIONS, SUBJECTS, fmtDate, today, gradeOf, divisionOf } from "../lib/helpers";
import { Panel, Modal, Text, Pick, Empty, Field, Tabs, Pill, useToast, useConfirm } from "../lib/ui.jsx";
import { marksheetHtml, finalMarksheetHtml } from "../lib/templates";

/* helper: pct for a student in an exam given a subject->marks map */
function examPct(exam, map) {
  if (!exam || !map) return null;
  const has = exam.subjects.some((s) => map[s] != null && map[s] !== "");
  if (!has) return null;
  const got = exam.subjects.reduce((a, s) => a + Number(map[s] || 0), 0);
  const total = exam.max_marks * exam.subjects.length;
  return { obtained: got, total, pct: total ? (got / total) * 100 : 0 };
}

export default function Exams({ students, school, openDoc }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState("entry");
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [creating, setCreating] = useState(null);
  const [marks, setMarks] = useState({});          // studentId -> {subject: value}
  const [rollMap, setRollMap] = useState({});      // studentId -> exam_no (session roll)

  const loadExams = async (selectId) => {
    const list = await window.api.exams.list();
    setExams(list);
    // keep the current selection if it still exists, otherwise pick the newest exam
    setExamId((cur) => {
      const want = selectId ?? cur;
      return want && list.some((e) => e.id === Number(want)) ? want : (list[0]?.id ?? "");
    });
  };
  useEffect(() => { loadExams(); }, []);
  useEffect(() => {
    const m = {}; students.forEach((s) => (m[s.id] = s.exam_no || ""));
    setRollMap(m);
  }, [students]);

  const exam = exams.find((e) => e.id === Number(examId));
  const roster = exam ? students.filter((s) => s.status === "Active" && s.class === exam.class && (!exam.section || s.section === exam.section)) : [];

  useEffect(() => {
    if (!exam) { setMarks({}); return; }
    window.api.exams.marks(exam.id).then((rows) => {
      const m = {};
      rows.forEach((r) => { (m[r.student_id] = m[r.student_id] || {})[r.subject] = r.marks; });
      setMarks(m);
    });
  }, [examId, exams.length]);

  const blank = { name: "Final Examination", term: "Final", class: "8", section: "", max_marks: 100, pass_marks: 33, exam_date: today(), subjects: ["English", "Hindi", "Mathematics", "Science", "Social Science"] };

  const createExam = async () => {
    if (!creating.name.trim()) return toast.warn("Enter the examination name.");
    if (!creating.subjects.length) return toast.warn("Select at least one subject.");
    if (!(creating.max_marks > 0)) return toast.warn("Max marks must be more than 0.");
    if (creating.pass_marks > creating.max_marks) return toast.warn("Pass marks cannot be more than max marks.");
    const saved = await window.api.exams.save(creating);
    setCreating(null);
    await loadExams(saved.id);
    toast.ok(`${saved.name} created for Class ${saved.class}${saved.section ? "-" + saved.section : ""}.`);
  };
  const removeExam = async () => {
    const ok = await confirm({
      title: "Delete this examination?", danger: true, confirmLabel: "Delete examination",
      message: `${exam.name} and every mark entered against it will be removed. This cannot be undone.`
    });
    if (!ok) return;
    await window.api.exams.remove(exam.id);
    setMarks({});
    loadExams("");
    toast.ok("Examination deleted.");
  };
  const setMark = async (sid, sub, val) => {
    // keep marks within 0 … max marks
    if (val !== "") {
      const n = Number(val);
      if (Number.isNaN(n)) return;
      if (n < 0) val = "0";
      else if (n > exam.max_marks) val = String(exam.max_marks);
    }
    setMarks((m) => ({ ...m, [sid]: { ...(m[sid] || {}), [sub]: val } }));
    await window.api.exams.setMark(exam.id, sid, sub, val);
  };
  const saveExamNo = async (sid, val) => {
    setRollMap((m) => ({ ...m, [sid]: val }));
    const st = students.find((x) => x.id === sid);
    if (st) await window.api.students.save({ ...st, exam_no: val });
  };
  const studentWithRoll = (st) => ({ ...st, exam_no: rollMap[st.id] ?? st.exam_no });

  const printMarksheet = (st) => {
    openDoc(marksheetHtml(school, studentWithRoll(st), exam, marks[st.id] || {}), `Marksheet-${st.name}-${exam.name}.pdf`);
  };

  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[["entry", "Marks entry"], ["result", "Final result & rank"]]} />

      {tab === "entry" && (
        <>
          <Panel title="Examinations" note="Create Quarterly, Half-Yearly and Final exams, enter marks, set each student's exam roll number. Marks save as you type."
            action={<button className="btn" onClick={() => setCreating(blank)}><Plus size={14} /> New examination</button>}>
            {exams.length === 0 ? <Empty>No examination created yet.</Empty> : (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: "1 1 320px" }}>
                  <Field label="Select examination">
                    <select className="inp" value={examId} onChange={(e) => setExamId(e.target.value)}>
                      <option value="">— choose —</option>
                      {exams.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.term} · Class {e.class}{e.section ? "-" + e.section : ""} · {fmtDate(e.exam_date)}</option>)}
                    </select>
                  </Field>
                </div>
                {exam && <button className="btn btn-ghost" onClick={removeExam}><Trash2 size={13} /> Delete</button>}
              </div>
            )}
          </Panel>

          {exam && (
            <Panel title={`Marks entry — ${exam.name}`} note={`${exam.term} · Class ${exam.class}${exam.section ? "-" + exam.section : ""} · max ${exam.max_marks}/subject · pass ${exam.pass_marks}`}>
              {roster.length === 0 ? <Empty>No active students in this class/section. Tip: create the exam for the section your students are in (sample students are in 8-A).</Empty> : (
                <div style={{ overflowX: "auto" }}>
                  <table className="grid">
                    <thead><tr>
                      <th>Roll</th><th>Exam No.</th><th>Name</th>
                      {exam.subjects.map((s) => <th key={s} style={{ minWidth: 84 }}>{s}</th>)}
                      <th>Total</th><th>%</th><th>Grade</th><th>Marksheet</th>
                    </tr></thead>
                    <tbody>
                      {roster.map((st) => {
                        const m = marks[st.id] || {};
                        const got = exam.subjects.reduce((a, s) => a + Number(m[s] || 0), 0);
                        const maxTotal = exam.max_marks * exam.subjects.length;
                        const pct = maxTotal ? (got / maxTotal) * 100 : 0;
                        return (
                          <tr key={st.id}>
                            <td>{st.roll}</td>
                            <td><input className="inp" style={{ padding: "4px 6px", width: 90 }} value={rollMap[st.id] ?? ""} onChange={(e) => saveExamNo(st.id, e.target.value)} placeholder="exam no." /></td>
                            <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{st.name}</td>
                            {exam.subjects.map((s) => (
                              <td key={s}>
                                <input className="inp" style={{ padding: "4px 6px", width: 64 }} type="number" min="0" max={exam.max_marks}
                                  value={m[s] ?? ""} onChange={(e) => setMark(st.id, s, e.target.value)} />
                              </td>
                            ))}
                            <td style={{ fontWeight: 700 }}>{got}</td>
                            <td>{pct.toFixed(1)}</td>
                            <td>{gradeOf(pct)[1]}</td>
                            <td><button className="btn btn-ghost btn-sm" onClick={() => printMarksheet(st)}><Printer size={12} /> Open</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )}
        </>
      )}

      {tab === "result" && (
        <ResultTab exams={exams} students={students} school={school} openDoc={openDoc}
          rollMap={rollMap} saveExamNo={saveExamNo} studentWithRoll={studentWithRoll} />
      )}

      {creating && (
        <Modal wide title="New examination" onClose={() => setCreating(null)}>
          <div className="grid-form">
            <Text label="Examination name" value={creating.name} onChange={(v) => setCreating({ ...creating, name: v })} />
            <Pick label="Term" value={creating.term} onChange={(v) => setCreating({ ...creating, term: v })} options={["Quarterly", "Half Yearly", "Final", "Unit Test", "Pre-Board", "Annual"]} />
            <Pick label="Class" value={creating.class} onChange={(v) => setCreating({ ...creating, class: v })} options={CLASSES} />
            <Pick label="Section (blank = all)" value={creating.section} onChange={(v) => setCreating({ ...creating, section: v })} options={["", ...SECTIONS]} />
            <Text label="Max marks / subject" type="number" value={creating.max_marks} onChange={(v) => setCreating({ ...creating, max_marks: Number(v) })} />
            <Text label="Pass marks" type="number" value={creating.pass_marks} onChange={(v) => setCreating({ ...creating, pass_marks: Number(v) })} />
            <Text label="Result date" type="date" value={creating.exam_date} onChange={(v) => setCreating({ ...creating, exam_date: v })} />
          </div>
          <div style={{ marginTop: 14 }}>
            <label className="lbl">Subjects</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SUBJECTS.map((s) => {
                const on = creating.subjects.includes(s);
                return (
                  <button key={s} className="btn btn-ghost btn-sm"
                    style={{ background: on ? "var(--sun)" : "#fff", color: on ? "#fff" : "var(--slate)", borderColor: on ? "var(--sun)" : "var(--rule)" }}
                    onClick={() => setCreating({ ...creating, subjects: on ? creating.subjects.filter((x) => x !== s) : [...creating.subjects, s] })}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setCreating(null)}>Cancel</button>
            <button className="btn" onClick={createExam}><Save size={14} /> Create examination</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ---------- Final result & rank ------------------------------------- */
function ExamPick({ exams, label, value, onChange }) {
  return (
    <Field label={label}>
      <select className="inp" value={value} onChange={(ev) => onChange(ev.target.value)}>
        <option value="">— none —</option>
        {exams.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.term})</option>)}
      </select>
    </Field>
  );
}

function ResultTab({ exams, students, school, openDoc, rollMap, saveExamNo, studentWithRoll }) {
  const toast = useToast();
  const [cls, setCls] = useState("8");
  const [sec, setSec] = useState("A");
  const [qId, setQId] = useState("");
  const [hId, setHId] = useState("");
  const [fId, setFId] = useState("");
  const [byExam, setByExam] = useState({}); // examId -> {studentId:{subject:marks}}

  const forClass = exams.filter((e) => e.class === cls && (!e.section || e.section === sec));
  const findTerm = (t) => forClass.find((e) => e.term === t);

  // auto-pick exams when class/section changes
  useEffect(() => {
    setQId(findTerm("Quarterly")?.id || "");
    setHId(findTerm("Half Yearly")?.id || "");
    setFId(findTerm("Final")?.id || findTerm("Annual")?.id || "");
  }, [cls, sec, exams.length]);

  const selected = [
    { label: "Quarterly", id: qId },
    { label: "Half-Yearly", id: hId },
    { label: "Final", id: fId },
  ].filter((x) => x.id);

  // fetch marks for the three selected exams
  useEffect(() => {
    (async () => {
      const map = {};
      for (const s of selected) {
        const rows = await window.api.exams.marks(Number(s.id));
        const m = {};
        rows.forEach((r) => { (m[r.student_id] = m[r.student_id] || {})[r.subject] = r.marks; });
        map[s.id] = m;
      }
      setByExam(map);
    })();
  }, [qId, hId, fId]);

  const finalExam = exams.find((e) => e.id === Number(fId));
  const roster = students.filter((s) => s.status === "Active" && s.class === cls && s.section === sec);

  // build per-student computed rows
  const rows = roster.map((st) => {
    const terms = selected.map((s) => {
      const ex = exams.find((e) => e.id === Number(s.id));
      const p = examPct(ex, (byExam[s.id] || {})[st.id]);
      return p ? { label: s.label, ...p } : null;
    }).filter(Boolean);
    const avg = terms.length ? terms.reduce((a, t) => a + t.pct, 0) / terms.length : null;
    // pass/fail from final exam subjects
    let result = "—";
    if (finalExam) {
      const fm = (byExam[fId] || {})[st.id];
      if (fm && finalExam.subjects.some((s) => fm[s] != null && fm[s] !== "")) {
        const failed = finalExam.subjects.some((s) => Number(fm[s] || 0) < finalExam.pass_marks);
        result = failed ? "FAIL" : "PASS";
      }
    }
    return { st, terms, avg, result };
  });

  // rank by average (only students with an average)
  const ranked = [...rows].filter((r) => r.avg != null).sort((a, b) => b.avg - a.avg);
  const rankMap = {};
  ranked.forEach((r, i) => { rankMap[r.st.id] = i + 1; });
  const outOf = ranked.length;

  const openFinal = (row) => {
    if (!finalExam) return toast.warn("Select the Final examination first.");
    const summary = {
      averagePct: row.avg ?? 0,
      grade: gradeOf(row.avg ?? 0)[1],
      division: divisionOf(row.avg ?? 0),
      result: row.result === "—" ? "PENDING" : row.result,
      rank: rankMap[row.st.id] || "—",
      outOf,
    };
    const html = finalMarksheetHtml(school, studentWithRoll(row.st), {
      terms: row.terms, finalExam, finalMarks: (byExam[fId] || {})[row.st.id] || {}, summary,
    });
    openDoc(html, `Final-Result-${row.st.name}.pdf`);
  };

  const CLS = CLASSES.filter((c) => students.some((s) => s.status === "Active" && s.class === c));
  const SEC = [...new Set(students.filter((s) => s.status === "Active" && s.class === cls).map((s) => s.section))].sort();
  const changeClass = (c) => {
    setCls(c);
    const secs = [...new Set(students.filter((s) => s.status === "Active" && s.class === c).map((s) => s.section))].sort();
    if (secs.length && !secs.includes(sec)) setSec(secs[0]);
  };


  return (
    <>
      <Panel title="Final result & rank" note="Pick a class + section and its three exams. The app averages the term percentages, ranks students, and prints a consolidated marksheet.">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ width: 120 }}><Pick label="Class" value={cls} onChange={changeClass} options={CLS.length ? CLS : CLASSES} /></div>
          <div style={{ width: 120 }}><Pick label="Section" value={sec} onChange={setSec} options={SEC.length ? SEC : SECTIONS} /></div>
          <div style={{ flex: "1 1 180px" }}><ExamPick exams={forClass} label="Quarterly exam" value={qId} onChange={setQId} /></div>
          <div style={{ flex: "1 1 180px" }}><ExamPick exams={forClass} label="Half-Yearly exam" value={hId} onChange={setHId} /></div>
          <div style={{ flex: "1 1 180px" }}><ExamPick exams={forClass} label="Final exam" value={fId} onChange={setFId} /></div>
        </div>
        <p style={{ fontSize: 11, color: "var(--slate)", marginBottom: 0 }}>
          Exams are picked automatically by term (Quarterly / Half Yearly / Final). Create those exams for this class to fill them in.
        </p>
      </Panel>

      <Panel title="Class result sheet" note={`${roster.length} students · ranked by average of ${selected.length} exam(s)`}>
        {roster.length === 0 ? <Empty>No active students in {cls}-{sec}.</Empty> : (
          <div style={{ overflowX: "auto" }}>
            <table className="grid">
              <thead><tr>
                <th>Rank</th><th>Exam No.</th><th>Name</th>
                <th>Quarterly %</th><th>Half-Yearly %</th><th>Final %</th>
                <th>Average %</th><th>Result</th><th>Marksheet</th>
              </tr></thead>
              <tbody>
                {[...rows].sort((a, b) => (rankMap[a.st.id] || 999) - (rankMap[b.st.id] || 999)).map((row) => {
                  const term = (label) => row.terms.find((t) => t.label === label);
                  const pctCell = (t) => (t ? t.pct.toFixed(1) : "—");
                  return (
                    <tr key={row.st.id}>
                      <td style={{ fontWeight: 700 }}>{rankMap[row.st.id] ? <span className="pill" style={{ color: "var(--sun)", borderColor: "currentColor" }}>#{rankMap[row.st.id]}</span> : "—"}</td>
                      <td><input className="inp" style={{ padding: "4px 6px", width: 90 }} value={rollMap[row.st.id] ?? ""} onChange={(e) => saveExamNo(row.st.id, e.target.value)} placeholder="exam no." /></td>
                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{row.st.name}</td>
                      <td>{pctCell(term("Quarterly"))}</td>
                      <td>{pctCell(term("Half-Yearly"))}</td>
                      <td>{pctCell(term("Final"))}</td>
                      <td style={{ fontWeight: 700 }}>{row.avg != null ? row.avg.toFixed(2) : "—"}</td>
                      <td><span className="pill" style={{ color: row.result === "PASS" ? "var(--ok)" : row.result === "FAIL" ? "var(--danger)" : "var(--slate)", borderColor: "currentColor" }}>{row.result}</span></td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => openFinal(row)}><Trophy size={12} /> Final result</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}