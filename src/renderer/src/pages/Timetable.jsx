import React, { useState, useEffect, useMemo } from "react";
import { Printer, Trash2, Wand2, Save } from "lucide-react";
import { CLASSES, SECTIONS, SUBJECTS, DAYS, PERIODS, PERIOD_TIMES } from "../lib/helpers";
import { Panel, Pick, Modal, Text, Empty, Tabs, useToast, useConfirm } from "../lib/ui.jsx";
import { timetableHtml } from "../lib/templates";

export default function Timetable(props) {
  const [tab, setTab] = useState("class");
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[["class", "Class timetable"], ["teacher", "Teacher timetable"]]} />
      {tab === "class" ? <ClassTimetable {...props} /> : <TeacherTimetable {...props} />}
    </>
  );
}

/* ==================================================================== */
/*  Class timetable                                                     */
/* ==================================================================== */
function ClassTimetable({ students, staff, school, openDoc }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [cls, setCls] = useState("8");
  const [sec, setSec] = useState("A");
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);

  const classList = CLASSES.filter((c) => students.some((s) => s.status === "Active" && s.class === c));
  const sectionList = [...new Set(students.filter((s) => s.status === "Active" && s.class === cls).map((s) => s.section))].sort();
  const teachers = staff.filter((s) => s.status === "Active");

  const load = async () => setRows(await window.api.timetable.forClass(cls, sec));
  useEffect(() => { load(); }, [cls, sec]);

  const cell = (day, period) => rows.find((r) => r.day === day && Number(r.period) === period);
  const teacherName = (id) => staff.find((s) => s.id === Number(id))?.name || "";

  const save = async () => {
    if (!edit.subject) return toast.warn("Choose a subject.");
    await window.api.timetable.save({ ...edit, class: cls, section: sec });
    setEdit(null);
    await load();
    toast.ok(`${edit.subject} set for ${edit.day}, period ${edit.period}.`);
  };
  const clearCell = async () => {
    if (edit.id) await window.api.timetable.remove(edit.id);
    setEdit(null);
    await load();
    toast.info("Period cleared.");
  };
  const clearAll = async () => {
    const ok = await confirm({
      title: "Clear the whole timetable?",
      message: `Every period for Class ${cls}-${sec} will be removed. This cannot be undone.`,
      confirmLabel: "Clear timetable", danger: true
    });
    if (!ok) return;
    await window.api.timetable.clearClass(cls, sec);
    await load();
    toast.ok("Timetable cleared.");
  };

  // fills every empty period by rotating the class subjects — a quick starting point
  const autoFill = async () => {
    const ok = await confirm({
      title: "Auto-fill empty periods?",
      message: "Empty periods will be filled by rotating the main subjects. Periods you have already set are left untouched.",
      confirmLabel: "Auto-fill"
    });
    if (!ok) return;
    const base = ["Mathematics", "English", "Science", "Hindi", "Social Science", "Computer"];
    const jobs = [];
    DAYS.forEach((day, di) => {
      const upto = day === "Saturday" ? 4 : 8;
      for (let p = 1; p <= upto; p++) {
        if (cell(day, p)) continue;
        const subject = base[(p - 1 + di) % base.length];
        jobs.push({ class: cls, section: sec, day, period: p, subject, staff_id: teachers[0]?.id || "", room: `Room ${cls}${sec}` });
      }
    });
    if (!jobs.length) return toast.info("Every period is already filled.");
    for (const j of jobs) await window.api.timetable.save(j);
    await load();
    toast.ok(`${jobs.length} empty period${jobs.length === 1 ? "" : "s"} filled.`);
  };

  const print = () => {
    if (!rows.length) return toast.warn("Set at least one period first.");
    openDoc(timetableHtml(school, {
      title: `Class ${cls}-${sec} — Weekly Timetable`,
      rows, staffById: Object.fromEntries(staff.map((s) => [s.id, s.name]))
    }), `Timetable-${cls}${sec}.pdf`);
  };

  const filled = rows.length;

  return (
    <>
      <Panel title="Weekly class timetable" note={`Class ${cls}-${sec} · ${filled} period${filled === 1 ? "" : "s"} set · click any cell to edit`}
        action={
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-sm" onClick={autoFill}><Wand2 size={13} /> Auto-fill</button>
            <button className="btn btn-ghost btn-sm" onClick={clearAll} disabled={!filled}><Trash2 size={13} /> Clear</button>
            <button className="btn btn-ghost btn-sm" onClick={print} disabled={!filled}><Printer size={13} /> Print</button>
          </div>
        }>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ width: 140 }}>
            <Pick label="Class" value={cls} onChange={(v) => {
              setCls(v);
              const secs = [...new Set(students.filter((s) => s.status === "Active" && s.class === v).map((s) => s.section))].sort();
              if (secs.length && !secs.includes(sec)) setSec(secs[0]);
            }} options={classList.length ? classList : CLASSES} />
          </div>
          <div style={{ width: 140 }}>
            <Pick label="Section" value={sec} onChange={setSec} options={sectionList.length ? sectionList : SECTIONS} />
          </div>
        </div>
      </Panel>

      <Panel flush title="Timetable grid">
        <div className="table-scroll" style={{ padding: 14 }}>
          <table className="tt-grid">
            <thead>
              <tr>
                <th style={{ width: 88 }} />
                {DAYS.map((d) => <th key={d}>{d.slice(0, 3)}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p}>
                  <td className="tt-period">
                    <b style={{ color: "var(--ink)" }}>Period {p}</b><br />{PERIOD_TIMES[p]}
                  </td>
                  {DAYS.map((d) => {
                    const c = cell(d, p);
                    const closed = d === "Saturday" && p > 4;
                    if (closed) {
                      return <td key={d}><div className="tt-cell free" style={{ opacity: .5, cursor: "default" }}>—</div></td>;
                    }
                    return (
                      <td key={d}>
                        <button className={"tt-cell" + (c ? "" : " free")}
                          onClick={() => setEdit(c
                            ? { ...c, period: Number(c.period) }
                            : { day: d, period: p, subject: "", staff_id: teachers[0]?.id || "", room: `Room ${cls}${sec}` })}>
                          {c ? (
                            <>
                              <span className="tt-sub">{c.subject}</span>
                              <span className="tt-meta">{teacherName(c.staff_id) || "—"}</span>
                              {c.room && <span className="tt-meta">{c.room}</span>}
                            </>
                          ) : <span style={{ fontSize: 11 }}>+ free</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {edit && (
        <Modal title={`${edit.day} · Period ${edit.period}`} subtitle={`Class ${cls}-${sec} · ${PERIOD_TIMES[edit.period]}`}
          onClose={() => setEdit(null)}>
          <div className="grid-form">
            <Pick label="Subject" value={edit.subject} onChange={(v) => setEdit({ ...edit, subject: v })}
              options={["", ...SUBJECTS, "Games", "Library", "Assembly"]} />
            <Pick label="Teacher" value={String(edit.staff_id ?? "")} onChange={(v) => setEdit({ ...edit, staff_id: v })}
              options={[{ value: "", label: "— none —" }, ...teachers.map((t) => ({ value: String(t.id), label: `${t.name} (${t.designation})` }))]} />
            <Text label="Room" value={edit.room} onChange={(v) => setEdit({ ...edit, room: v })} />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "space-between" }}>
            <button className="btn btn-ghost" onClick={clearCell} disabled={!edit.id}><Trash2 size={13} /> Clear period</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn" onClick={save}><Save size={14} /> Save period</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ==================================================================== */
/*  Teacher timetable — same data, seen from the staff side             */
/* ==================================================================== */
function TeacherTimetable({ staff, school, openDoc }) {
  const toast = useToast();
  const [staffId, setStaffId] = useState("");
  const [rows, setRows] = useState([]);
  const teachers = staff.filter((s) => s.status === "Active");

  useEffect(() => {
    if (!staffId && teachers.length) setStaffId(String(teachers[0].id));
  }, [teachers.length]);

  useEffect(() => {
    if (!staffId) return setRows([]);
    window.api.timetable.forTeacher(Number(staffId)).then(setRows);
  }, [staffId]);

  const teacher = staff.find((s) => s.id === Number(staffId));
  const cell = (day, period) => rows.find((r) => r.day === day && Number(r.period) === period);
  const load = useMemo(() => rows.length, [rows]);

  const print = () => {
    if (!rows.length) return toast.warn("This teacher has no periods assigned yet.");
    openDoc(timetableHtml(school, {
      title: `${teacher?.name} — Weekly Timetable`,
      rows, byClass: true, staffById: {}
    }), `Timetable-${teacher?.name}.pdf`);
  };

  return (
    <>
      <Panel title="Teacher timetable" note={teacher ? `${teacher.name} · ${load} period(s) a week` : "Pick a teacher"}
        action={<button className="btn btn-ghost btn-sm" onClick={print} disabled={!rows.length}><Printer size={13} /> Print</button>}>
        <div style={{ width: 280 }}>
          <Pick label="Teacher" value={staffId} onChange={setStaffId}
            options={teachers.map((t) => ({ value: String(t.id), label: `${t.name} — ${t.designation}` }))} />
        </div>
      </Panel>

      <Panel flush title="Weekly load">
        {!rows.length ? (
          <div style={{ padding: 18 }}>
            <Empty>No periods assigned to this teacher yet. Assign them from the Class timetable tab.</Empty>
          </div>
        ) : (
          <div className="table-scroll" style={{ padding: 14 }}>
            <table className="tt-grid">
              <thead>
                <tr><th style={{ width: 88 }} />{DAYS.map((d) => <th key={d}>{d.slice(0, 3)}</th>)}</tr>
              </thead>
              <tbody>
                {PERIODS.map((p) => (
                  <tr key={p}>
                    <td className="tt-period"><b style={{ color: "var(--ink)" }}>Period {p}</b><br />{PERIOD_TIMES[p]}</td>
                    {DAYS.map((d) => {
                      const c = cell(d, p);
                      return (
                        <td key={d}>
                          <div className={"tt-cell" + (c ? "" : " free")} style={{ cursor: "default" }}>
                            {c ? (
                              <>
                                <span className="tt-sub">{c.subject}</span>
                                <span className="tt-meta">Class {c.class}-{c.section}</span>
                                {c.room && <span className="tt-meta">{c.room}</span>}
                              </>
                            ) : <span style={{ fontSize: 11 }}>free</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
