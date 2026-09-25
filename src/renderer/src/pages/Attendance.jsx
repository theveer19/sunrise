import React, { useState, useEffect, useMemo } from "react";
import { Check, Printer, Users, CalendarDays, Save } from "lucide-react";
import {
  CLASSES, SECTIONS, ATTENDANCE_STATUS, ATT_COLOR, ATT_SHORT, today, thisMonth,
  fmtDate, fmtMonth, daysInMonth, dayName, isSunday, pct, downloadFile, toCsv
} from "../lib/helpers";
import { Panel, Pick, Empty, Tabs, Donut, Pill, DataTable, useToast } from "../lib/ui.jsx";
import { attendanceRegisterHtml } from "../lib/templates";

export default function Attendance(props) {
  const [tab, setTab] = useState("mark");
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[
        ["mark", "Mark attendance"],
        ["register", "Monthly register"],
        ["staff", "Staff attendance"],
      ]} />
      {tab === "mark" && <MarkDay {...props} />}
      {tab === "register" && <MonthlyRegister {...props} />}
      {tab === "staff" && <StaffAttendance {...props} />}
    </>
  );
}

/* ==================================================================== */
/*  Mark attendance for one day                                         */
/* ==================================================================== */
function MarkDay({ students }) {
  const toast = useToast();
  const [date, setDate] = useState(today());
  const [cls, setCls] = useState("8");
  const [sec, setSec] = useState("A");
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const classList = CLASSES.filter((c) => students.some((s) => s.status === "Active" && s.class === c));
  const sectionList = [...new Set(students.filter((s) => s.status === "Active" && s.class === cls).map((s) => s.section))].sort();
  const roster = students.filter((s) => s.status === "Active" && s.class === cls && s.section === sec);

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    window.api.attendance.forDay(date, cls, sec).then((rows) => {
      if (!alive) return;
      const m = {};
      rows.forEach((r) => (m[r.student_id] = r.status));
      setMarks(m);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, [date, cls, sec]);

  const set = (id, status) => setMarks((m) => ({ ...m, [id]: status }));
  const setAll = (status) => {
    const m = {};
    roster.forEach((s) => (m[s.id] = status));
    setMarks(m);
  };

  const counts = ATTENDANCE_STATUS.reduce((a, s) => {
    a[s] = roster.filter((r) => marks[r.id] === s).length;
    return a;
  }, {});
  const unmarked = roster.filter((r) => !marks[r.id]).length;

  const save = async () => {
    const rows = roster.filter((s) => marks[s.id]).map((s) => ({ date, student_id: s.id, status: marks[s.id] }));
    if (!rows.length) return toast.warn("Mark at least one student first.");
    setSaving(true);
    await window.api.attendance.mark(rows);
    setSaving(false);
    toast.ok(`Attendance saved for ${rows.length} student${rows.length === 1 ? "" : "s"} — ${fmtDate(date)}.`);
  };

  const sunday = isSunday(date);

  return (
    <>
      <Panel title="Mark daily attendance"
        note={`${dayName(date)}, ${fmtDate(date)} · Class ${cls}-${sec}`}
        action={
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setAll("Present")}>
              <Check size={13} /> All present
            </button>
            <button className="btn" onClick={save} disabled={saving || !roster.length}>
              <Save size={14} /> {saving ? "Saving…" : "Save attendance"}
            </button>
          </div>
        }>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 6 }}>
          <div style={{ width: 168 }}>
            <label className="lbl">Date</label>
            <input className="inp" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div style={{ width: 130 }}>
            <Pick label="Class" value={cls} options={classList.length ? classList : CLASSES}
              onChange={(v) => {
                setCls(v);
                const secs = [...new Set(students.filter((s) => s.status === "Active" && s.class === v).map((s) => s.section))].sort();
                if (secs.length && !secs.includes(sec)) setSec(secs[0]);
              }} />
          </div>
          <div style={{ width: 130 }}>
            <Pick label="Section" value={sec} onChange={setSec} options={sectionList.length ? sectionList : SECTIONS} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginLeft: "auto" }}>
            {ATTENDANCE_STATUS.map((s) => (
              <Pill key={s} tone={ATT_COLOR[s]}>{s} {counts[s]}</Pill>
            ))}
            {unmarked > 0 && <Pill tone="var(--slate)">Unmarked {unmarked}</Pill>}
          </div>
        </div>
        {sunday && (
          <p className="hint" style={{ color: "var(--warn)" }}>
            {fmtDate(date)} is a Sunday — attendance is normally not taken on this day.
          </p>
        )}
      </Panel>

      <Panel title={`Roster — ${roster.length} student${roster.length === 1 ? "" : "s"}`}
        note="Tap a status for each student. Nothing is stored until you press Save attendance.">
        {!loaded ? <Empty icon={false}>Loading…</Empty> : roster.length === 0 ? (
          <Empty>No active students in Class {cls}-{sec}. Pick another class or add students in the register.</Empty>
        ) : (
          <div className="table-scroll">
            <table className="grid">
              <thead>
                <tr><th style={{ width: 60 }}>Roll</th><th>Student</th><th>Father</th><th style={{ width: 280 }}>Status</th></tr>
              </thead>
              <tbody>
                {roster.map((s) => (
                  <tr key={s.id}>
                    <td>{s.roll}</td>
                    <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{s.name}</td>
                    <td style={{ color: "var(--slate)" }}>{s.father}</td>
                    <td>
                      <div className="att-row">
                        {ATTENDANCE_STATUS.map((st) => (
                          <button key={st}
                            className={"att-btn" + (marks[s.id] === st ? " on" : "")}
                            style={marks[s.id] === st
                              ? { background: ATT_COLOR[st], borderColor: ATT_COLOR[st] }
                              : { color: ATT_COLOR[st] }}
                            onClick={() => set(s.id, st)}>
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
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

/* ==================================================================== */
/*  Monthly register                                                    */
/* ==================================================================== */
function MonthlyRegister({ students, school, openDoc }) {
  const toast = useToast();
  const [month, setMonth] = useState(thisMonth());
  const [cls, setCls] = useState("8");
  const [sec, setSec] = useState("A");
  const [rows, setRows] = useState([]);

  const classList = CLASSES.filter((c) => students.some((s) => s.class === c));
  const sectionList = [...new Set(students.filter((s) => s.class === cls).map((s) => s.section))].sort();
  const roster = students.filter((s) => s.status === "Active" && s.class === cls && s.section === sec);

  useEffect(() => {
    window.api.attendance.forMonth(month, cls, sec).then(setRows);
  }, [month, cls, sec]);

  const byStudent = useMemo(() => {
    const m = {};
    rows.forEach((r) => { (m[r.student_id] ||= {})[r.date] = r.status; });
    return m;
  }, [rows]);

  const nDays = daysInMonth(month);
  const days = Array.from({ length: nDays }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
  const workingDays = days.filter((d) => !isSunday(d) && rows.some((r) => r.date === d));

  const statsFor = (id) => {
    const rec = byStudent[id] || {};
    const marked = workingDays.filter((d) => rec[d]);
    const present = marked.filter((d) => rec[d] === "Present" || rec[d] === "Late").length;
    return { present, total: marked.length, pct: pct(present, marked.length) };
  };

  const classPct = useMemo(() => {
    const all = roster.map((s) => statsFor(s.id));
    const p = all.reduce((a, x) => a + x.present, 0);
    const t = all.reduce((a, x) => a + x.total, 0);
    return pct(p, t);
  }, [roster, byStudent, workingDays]);

  const exportCsv = () => {
    const data = roster.map((s) => {
      const rec = byStudent[s.id] || {};
      const st = statsFor(s.id);
      const row = { roll: s.roll, name: s.name, present: st.present, total: st.total, pct: st.pct.toFixed(1) };
      workingDays.forEach((d) => (row[d] = ATT_SHORT[rec[d]] || "-"));
      return row;
    });
    const cols = [
      { key: "roll", label: "Roll" }, { key: "name", label: "Student" },
      ...workingDays.map((d) => ({ key: d, label: d.slice(8) })),
      { key: "present", label: "Present" }, { key: "total", label: "Working days" }, { key: "pct", label: "%" },
    ];
    downloadFile(`Attendance-${cls}${sec}-${month}.csv`, toCsv(data, cols));
    toast.ok("Attendance register exported as CSV.");
  };

  const printRegister = () => {
    if (!workingDays.length) return toast.warn("No attendance marked in this month yet.");
    const data = roster.map((s) => ({ student: s, marks: byStudent[s.id] || {}, stats: statsFor(s.id) }));
    openDoc(attendanceRegisterHtml(school, { month, cls, sec, days: workingDays, data }),
      `Attendance-${cls}${sec}-${month}.pdf`);
  };

  return (
    <>
      <Panel title="Monthly attendance register" note={`${fmtMonth(month)} · Class ${cls}-${sec}`}
        action={
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!roster.length}>Export CSV</button>
            <button className="btn btn-ghost btn-sm" onClick={printRegister} disabled={!roster.length}>
              <Printer size={13} /> Print register
            </button>
          </div>
        }>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ width: 168 }}>
            <label className="lbl">Month</label>
            <input className="inp" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div style={{ width: 130 }}>
            <Pick label="Class" value={cls} onChange={(v) => {
              setCls(v);
              const secs = [...new Set(students.filter((s) => s.class === v).map((s) => s.section))].sort();
              if (secs.length && !secs.includes(sec)) setSec(secs[0]);
            }} options={classList.length ? classList : CLASSES} />
          </div>
          <div style={{ width: 130 }}>
            <Pick label="Section" value={sec} onChange={setSec} options={sectionList.length ? sectionList : SECTIONS} />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 18, alignItems: "center" }}>
            <Donut value={classPct} label="Class attendance" sub={`${workingDays.length} working days`}
              color={classPct >= 75 ? "var(--ok)" : "var(--warn)"} />
          </div>
        </div>
      </Panel>

      <Panel title="Register grid" note="P = present · A = absent · L = late · LV = leave. Scroll sideways for the whole month.">
        {roster.length === 0 ? <Empty>No active students in Class {cls}-{sec}.</Empty>
          : workingDays.length === 0 ? <Empty>No attendance has been marked in {fmtMonth(month)} yet.</Empty> : (
            <div className="table-scroll">
              <table className="grid">
                <thead>
                  <tr>
                    <th style={{ position: "sticky", left: 0, zIndex: 3 }}>Student</th>
                    {workingDays.map((d) => <th key={d} style={{ textAlign: "center", padding: "9px 4px" }}>{d.slice(8)}</th>)}
                    <th style={{ textAlign: "right" }}>Present</th>
                    <th style={{ textAlign: "right" }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((s) => {
                    const rec = byStudent[s.id] || {};
                    const st = statsFor(s.id);
                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600, whiteSpace: "nowrap", position: "sticky", left: 0, background: "var(--card)" }}>
                          {s.roll ? s.roll + ". " : ""}{s.name}
                        </td>
                        {workingDays.map((d) => (
                          <td key={d} style={{ textAlign: "center", padding: "6px 4px" }}>
                            {rec[d]
                              ? <span className="att-cell" style={{ background: ATT_COLOR[rec[d]] }}>{ATT_SHORT[rec[d]]}</span>
                              : <span style={{ color: "var(--rule)" }}>·</span>}
                          </td>
                        ))}
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{st.present}/{st.total}</td>
                        <td style={{ textAlign: "right" }}>
                          <Pill tone={st.pct >= 75 ? "var(--ok)" : st.pct >= 60 ? "var(--warn)" : "var(--danger)"}>
                            {st.pct.toFixed(0)}%
                          </Pill>
                        </td>
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

/* ==================================================================== */
/*  Staff attendance                                                    */
/* ==================================================================== */
function StaffAttendance({ staff }) {
  const toast = useToast();
  const [date, setDate] = useState(today());
  const [marks, setMarks] = useState({});
  const [summary, setSummary] = useState({});
  const [saving, setSaving] = useState(false);

  const active = staff.filter((s) => s.status === "Active");

  useEffect(() => {
    window.api.attendance.staffForDay(date).then((rows) => {
      const m = {};
      rows.forEach((r) => (m[r.staff_id] = r.status));
      setMarks(m);
    });
    window.api.attendance.staffSummary(date.slice(0, 7)).then(setSummary);
  }, [date]);

  const save = async () => {
    const rows = active.filter((s) => marks[s.id]).map((s) => ({ date, staff_id: s.id, status: marks[s.id] }));
    if (!rows.length) return toast.warn("Mark at least one staff member first.");
    setSaving(true);
    await window.api.attendance.staffMark(rows);
    setSaving(false);
    setSummary(await window.api.attendance.staffSummary(date.slice(0, 7)));
    toast.ok(`Staff attendance saved — ${fmtDate(date)}.`);
  };

  return (
    <Panel title="Staff attendance" note={`${dayName(date)}, ${fmtDate(date)} · used for payroll loss-of-pay`}
      action={
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const m = {}; active.forEach((s) => (m[s.id] = "Present")); setMarks(m);
          }}><Check size={13} /> All present</button>
          <button className="btn" onClick={save} disabled={saving}><Save size={14} /> {saving ? "Saving…" : "Save"}</button>
        </div>
      }>
      <div style={{ width: 168, marginBottom: 14 }}>
        <label className="lbl">Date</label>
        <input className="inp" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
      </div>
      {active.length === 0 ? <Empty>No active staff. Add teachers and staff first.</Empty> : (
        <div className="table-scroll">
          <table className="grid">
            <thead>
              <tr><th>Emp ID</th><th>Name</th><th>Designation</th><th style={{ width: 200 }}>Status</th>
                <th style={{ textAlign: "right" }}>This month</th></tr>
            </thead>
            <tbody>
              {active.map((s) => {
                const sum = summary[s.id];
                return (
                  <tr key={s.id}>
                    <td>{s.emp_id}</td>
                    <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{s.name}</td>
                    <td style={{ color: "var(--slate)" }}>{s.designation}</td>
                    <td>
                      <div className="att-row">
                        {["Present", "Absent", "Leave"].map((st) => (
                          <button key={st} className={"att-btn" + (marks[s.id] === st ? " on" : "")}
                            style={marks[s.id] === st ? { background: ATT_COLOR[st], borderColor: ATT_COLOR[st] } : { color: ATT_COLOR[st] }}
                            onClick={() => setMarks((m) => ({ ...m, [s.id]: st }))}>{st}</button>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontSize: 12, color: "var(--slate)" }}>
                      {sum ? `${sum.present}/${sum.total} present` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
