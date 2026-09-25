import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, CalendarCheck, FileSpreadsheet, IndianRupee, Clock3, BookMarked,
  Megaphone, Library, User, LogOut, Printer, Moon, Sun, Menu, KeyRound
} from "lucide-react";
import {
  DAYS, PERIODS, PERIOD_TIMES, ATT_COLOR, ATT_SHORT, today, thisMonth, monthOffset,
  fmtDate, fmtMonth, daysInMonth, dayName, isSunday, inr, pct, gradeOf, divisionOf,
  ageOf, initialsOf, daysBetween
} from "../lib/helpers";
import {
  Panel, Stat, Empty, Pill, Donut, LineChart, DataTable, Modal, Text, useToast, useConfirm
} from "../lib/ui.jsx";
import { marksheetHtml, receiptHtml } from "../lib/templates";

const NAV = [
  ["home", "My dashboard", LayoutDashboard],
  ["attendance", "My attendance", CalendarCheck],
  ["results", "My results", FileSpreadsheet],
  ["fees", "Fees", IndianRupee],
  ["timetable", "Timetable", Clock3],
  ["homework", "Homework", BookMarked],
  ["notices", "Notices & events", Megaphone],
  ["library", "Library", Library],
  ["profile", "My profile", User],
];

export default function StudentPortal({ student: initial, school, openDoc, onSignOut, theme, setTheme }) {
  const [student, setStudent] = useState(initial);
  const [view, setView] = useState("home");
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState(false);

  const shared = { student, school, openDoc, go: setView };
  const pages = {
    home: <Home {...shared} />,
    attendance: <MyAttendance {...shared} />,
    results: <MyResults {...shared} />,
    fees: <MyFees {...shared} />,
    timetable: <MyTimetable {...shared} />,
    homework: <MyHomework {...shared} />,
    notices: <MyNotices {...shared} />,
    library: <MyLibrary {...shared} />,
    profile: <MyProfile {...shared} onChangePassword={() => setPw(true)} />,
  };
  const current = NAV.find((n) => n[0] === view) || NAV[0];

  return (
    <div className="app">
      <aside className={"side side-student" + (open ? " open" : "")}>
        <div className="brand">
          <div className="mono">{school.initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="serif" style={{ color: "#fff", fontSize: 14.5, lineHeight: 1.2 }}>{school.name}</div>
            <div style={{ fontSize: 10, color: "#8b93a4", letterSpacing: ".08em", textTransform: "uppercase" }}>
              Student portal
            </div>
          </div>
        </div>

        <div className="student-chip">
          <span className="avatar">{initialsOf(student.name)}</span>
          <span style={{ minWidth: 0 }}>
            <span className="sc-name">{student.name}</span>
            <span className="sc-sub">Class {student.class}-{student.section} · Roll {student.roll || "—"}</span>
          </span>
        </div>

        {NAV.map(([k, label, Icon]) => (
          <button key={k} className={"navitem" + (view === k ? " on" : "")}
            onClick={() => { setView(k); setOpen(false); }}>
            <Icon size={15} /> {label}
          </button>
        ))}

        <div className="side-foot">
          <button onClick={onSignOut} className="signout"><LogOut size={12} /> Sign out</button>
          <div style={{ marginTop: 8 }}>Session {school.session}</div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button className="btn btn-ghost btn-sm menu-btn" aria-label="Open menu" onClick={() => setOpen(!open)}>
              <Menu size={14} />
            </button>
            <div className="tb-title" style={{ minWidth: 0 }}>
              <div className="eyebrow">Student portal</div>
              <div className="serif" style={{ fontSize: 15 }}>{current[1]}</div>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm btn-icon" aria-label="Toggle colour theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onSignOut}><LogOut size={13} /> Sign out</button>
          </div>
        </div>
        <div className="content">{pages[view]}</div>
      </div>

      {open && <div className="side-backdrop" onClick={() => setOpen(false)} />}
      {pw && <ChangePassword student={student} onClose={() => setPw(false)} onSaved={setStudent} />}
    </div>
  );
}

/* ==================================================================== */
/*  Shared hooks                                                        */
/* ==================================================================== */
function useMonthAttendance(student, month) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    window.api.attendance.forMonth(month, student.class, student.section)
      .then((all) => setRows(all.filter((r) => r.student_id === student.id)));
  }, [month, student.id, student.class, student.section]);
  return rows;
}

function attStats(rows) {
  const present = rows.filter((r) => r.status === "Present" || r.status === "Late").length;
  const absent = rows.filter((r) => r.status === "Absent").length;
  const leave = rows.filter((r) => r.status === "Leave").length;
  const late = rows.filter((r) => r.status === "Late").length;
  return { present, absent, leave, late, total: rows.length, pct: pct(present, rows.length) };
}

/* ==================================================================== */
/*  My dashboard                                                        */
/* ==================================================================== */
function Home({ student, school, go }) {
  const month = thisMonth();
  const attRows = useMonthAttendance(student, month);
  const st = attStats(attRows);

  const [fees, setFees] = useState([]);
  const [structure, setStructure] = useState({});
  const [homework, setHomework] = useState([]);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    window.api.fees.list().then((all) => setFees(all.filter((f) => f.student_id === student.id)));
    window.api.fees.getStructure().then(setStructure);
    window.api.comms.homework().then((all) =>
      setHomework(all.filter((h) => h.class === student.class && h.section === student.section)));
    // staff-only notices never reach the student portal
    window.api.comms.notices().then((all) =>
      setNotices(all.filter((n) => !["Teachers", "Staff"].includes(n.audience))));
    window.api.comms.events().then(setEvents);
    window.api.library.issues().then((all) =>
      setIssues(all.filter((i) => i.member_type === "student" && Number(i.member_id) === student.id)));
  }, [student.id, student.class, student.section]);

  const paid = fees.reduce((a, f) => a + Number(f.amount || 0), 0);
  const monthly = Number(structure[student.class]) || 0;
  const dueHomework = homework.filter((h) => daysBetween(today(), h.due_date) >= 0).slice(0, 4);
  const upcoming = events.filter((e) => daysBetween(today(), e.end_date || e.date) >= 0).slice(0, 3);
  const outBooks = issues.filter((i) => !i.return_date);

  return (
    <>
      <div className="welcome">
        <h2 className="serif">Hello, {student.name.split(" ")[0]}</h2>
        <p>Class {student.class}-{student.section} · Admission no. {student.adm_no || "—"} · Session {school.session}</p>
      </div>

      <div className="stat-grid">
        <Stat label="Attendance this month" value={st.total ? `${st.pct.toFixed(1)}%` : "—"}
          sub={st.total ? `${st.present} of ${st.total} days` : "not marked yet"}
          tone={!st.total ? "var(--slate)" : st.pct >= 75 ? "var(--ok)" : "var(--danger)"}
          onClick={() => go("attendance")} />
        <Stat label="Fees paid so far" value={inr(paid)} sub={`${fees.length} receipt${fees.length === 1 ? "" : "s"}`}
          tone="var(--ok)" onClick={() => go("fees")} />
        <Stat label="Monthly fee" value={inr(monthly)} sub={`Class ${student.class} rate`} tone="var(--amber)"
          onClick={() => go("fees")} />
        <Stat label="Books issued" value={outBooks.length} sub="from the library" tone="var(--teal)"
          onClick={() => go("library")} />
      </div>

      <div className="col2">
        <Panel title="Homework due" note="What to finish next"
          action={<button className="btn btn-ghost btn-sm" onClick={() => go("homework")}>All homework</button>}>
          {dueHomework.length === 0 ? <Empty>No homework pending right now.</Empty> : dueHomework.map((h) => {
            const left = daysBetween(today(), h.due_date);
            return (
              <div key={h.id} className="alert-row" style={{ alignItems: "flex-start" }}>
                <span className="alert-dot" style={{ background: left === 0 ? "var(--danger)" : "var(--teal)", marginTop: 6 }} />
                <span style={{ flex: 1 }}>
                  <b style={{ display: "block" }}>{h.subject} — {h.title}</b>
                  <span style={{ fontSize: 11, color: "var(--slate)" }}>
                    {left === 0 ? "Due today" : `Due in ${left} day${left === 1 ? "" : "s"} · ${fmtDate(h.due_date)}`}
                  </span>
                </span>
              </div>
            );
          })}
        </Panel>

        <Panel title="Attendance" note={fmtMonth(month)}>
          <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            <Donut value={st.pct} label="This month" sub={`${st.total} days marked`} size={110}
              color={st.pct >= 75 ? "var(--ok)" : "var(--warn)"} />
            <div style={{ flex: 1, minWidth: 160 }}>
              <div className="alert-row"><span className="alert-dot" style={{ background: "var(--ok)" }} />
                <span style={{ flex: 1 }}>Present</span><b>{st.present}</b></div>
              <div className="alert-row"><span className="alert-dot" style={{ background: "var(--danger)" }} />
                <span style={{ flex: 1 }}>Absent</span><b>{st.absent}</b></div>
              <div className="alert-row"><span className="alert-dot" style={{ background: "var(--warn)" }} />
                <span style={{ flex: 1 }}>Late</span><b>{st.late}</b></div>
              <div className="alert-row"><span className="alert-dot" style={{ background: "var(--teal)" }} />
                <span style={{ flex: 1 }}>Leave</span><b>{st.leave}</b></div>
            </div>
          </div>
          {st.total > 0 && st.pct < 75 && (
            <p className="hint" style={{ color: "var(--danger)" }}>
              Attendance is below the 75% the school expects. Please speak to the class teacher.
            </p>
          )}
        </Panel>
      </div>

      <div className="col2">
        <Panel title="Notices" action={<button className="btn btn-ghost btn-sm" onClick={() => go("notices")}>All notices</button>}>
          {notices.length === 0 ? <Empty>No notices on the board.</Empty> : notices.slice(0, 4).map((n) => (
            <div key={n.id} className="alert-row" style={{ alignItems: "flex-start" }}>
              <span className="alert-dot" style={{ background: n.priority === "High" ? "var(--danger)" : "var(--teal)", marginTop: 6 }} />
              <span style={{ flex: 1 }}>
                <b style={{ display: "block" }}>{n.title}</b>
                <span style={{ fontSize: 11, color: "var(--slate)" }}>{fmtDate(n.date)}</span>
              </span>
            </div>
          ))}
        </Panel>

        <Panel title="Coming up" action={<button className="btn btn-ghost btn-sm" onClick={() => go("notices")}>Calendar</button>}>
          {upcoming.length === 0 ? <Empty>Nothing scheduled ahead.</Empty> : (
            <div className="timeline">
              {upcoming.map((e) => {
                const away = daysBetween(today(), e.date);
                return (
                  <div key={e.id} className="tl-item">
                    <div className="tl-date">{fmtDate(e.date)} · {away <= 0 ? "on now" : `in ${away} day${away === 1 ? "" : "s"}`}</div>
                    <div className="tl-title">{e.title}</div>
                    <div className="tl-desc">{e.venue || e.type}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

/* ==================================================================== */
/*  My attendance                                                       */
/* ==================================================================== */
function MyAttendance({ student }) {
  const [month, setMonth] = useState(thisMonth());
  const rows = useMonthAttendance(student, month);
  const st = attStats(rows);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    (async () => {
      const months = Array.from({ length: 6 }, (_, i) => monthOffset(thisMonth(), -(5 - i)));
      const out = [];
      for (const m of months) {
        const all = await window.api.attendance.forMonth(m, student.class, student.section);
        const mine = all.filter((r) => r.student_id === student.id);
        out.push({ month: m, pct: attStats(mine).pct });
      }
      setTrend(out);
    })();
  }, [student.id, student.class, student.section]);

  const byDate = Object.fromEntries(rows.map((r) => [r.date, r.status]));
  const nDays = daysInMonth(month);
  const days = Array.from({ length: nDays }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);

  return (
    <>
      <div className="stat-grid">
        <Stat label="Attendance" value={st.total ? `${st.pct.toFixed(1)}%` : "—"} sub={fmtMonth(month)}
          tone={!st.total ? "var(--slate)" : st.pct >= 75 ? "var(--ok)" : "var(--danger)"} />
        <Stat label="Present" value={st.present} sub={`of ${st.total} days marked`} tone="var(--ok)" />
        <Stat label="Absent" value={st.absent} sub="days missed" tone="var(--danger)" />
        <Stat label="Late / leave" value={`${st.late} / ${st.leave}`} sub="late arrivals · approved leave" tone="var(--warn)" />
      </div>

      <Panel title="Attendance trend" note="Last six months">
        {trend.length === 0 ? <Empty icon={false}>Loading…</Empty> : (
          <LineChart labels={trend.map((t) => fmtMonth(t.month).slice(0, 3))}
            values={trend.map((t) => Number(t.pct.toFixed(1)))} format={(v) => `${v}%`} yLabel="Attendance %" />
        )}
      </Panel>

      <Panel title="Day by day" note="P = present · A = absent · L = late · LV = leave">
        <div style={{ width: 180, marginBottom: 14 }}>
          <label className="lbl">Month</label>
          <input className="inp" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        {rows.length === 0 ? <Empty>No attendance marked in {fmtMonth(month)}.</Empty> : (
          <div className="daygrid">
            {days.map((d) => {
              const status = byDate[d];
              const sunday = isSunday(d);
              return (
                <div key={d} className={"daycell" + (sunday ? " sunday" : "")}
                  title={`${fmtDate(d)}${status ? " — " + status : sunday ? " — Sunday" : ""}`}>
                  <span className="dc-num">{d.slice(8)}</span>
                  {status
                    ? <span className="att-cell" style={{ background: ATT_COLOR[status] }}>{ATT_SHORT[status]}</span>
                    : <span className="dc-blank">{sunday ? "—" : "·"}</span>}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}

/* ==================================================================== */
/*  My results                                                          */
/* ==================================================================== */
function MyResults({ student, school, openDoc }) {
  const [exams, setExams] = useState([]);
  const [marksByExam, setMarksByExam] = useState({});

  useEffect(() => {
    (async () => {
      const all = await window.api.exams.list();
      const mine = all.filter((e) => e.class === student.class && (!e.section || e.section === student.section));
      setExams(mine);
      const map = {};
      for (const ex of mine) {
        const rows = await window.api.exams.marks(ex.id);
        const m = {};
        rows.filter((r) => r.student_id === student.id).forEach((r) => (m[r.subject] = r.marks));
        map[ex.id] = m;
      }
      setMarksByExam(map);
    })();
  }, [student.id, student.class, student.section]);

  const withMarks = exams.filter((ex) => {
    const m = marksByExam[ex.id] || {};
    return ex.subjects.some((s) => m[s] != null && m[s] !== "");
  });

  const summaryOf = (ex) => {
    const m = marksByExam[ex.id] || {};
    const got = ex.subjects.reduce((a, s) => a + Number(m[s] || 0), 0);
    const total = ex.max_marks * ex.subjects.length;
    const p = pct(got, total);
    const failed = ex.subjects.filter((s) => Number(m[s] || 0) < ex.pass_marks);
    return { got, total, pct: p, grade: gradeOf(p)[1], division: divisionOf(p), pass: failed.length === 0 };
  };

  return (
    <>
      {withMarks.length === 0 ? (
        <Panel title="My results">
          <Empty>No results have been declared for your class yet. They appear here as soon as the school publishes them.</Empty>
        </Panel>
      ) : withMarks.map((ex) => {
        const m = marksByExam[ex.id] || {};
        const s = summaryOf(ex);
        return (
          <Panel key={ex.id} title={ex.name}
            note={`${ex.term} · declared ${fmtDate(ex.exam_date)} · max ${ex.max_marks} per subject`}
            action={
              <button className="btn btn-ghost btn-sm"
                onClick={() => openDoc(marksheetHtml(school, student, ex, m), `Marksheet-${student.name}-${ex.name}.pdf`)}>
                <Printer size={13} /> Marksheet
              </button>
            }>
            <div className="stat-grid" style={{ marginBottom: 14 }}>
              <Stat label="Marks obtained" value={`${s.got} / ${s.total}`} sub="grand total" tone="var(--teal)" />
              <Stat label="Percentage" value={`${s.pct.toFixed(2)}%`} sub={s.division} tone="var(--amber)" />
              <Stat label="Grade" value={s.grade} sub="overall grade" tone="var(--sun)" />
              <Stat label="Result" value={s.pass ? "PASS" : "FAIL"} sub={s.pass ? "all subjects cleared" : "below pass marks"}
                tone={s.pass ? "var(--ok)" : "var(--danger)"} />
            </div>
            <DataTable rows={ex.subjects.map((sub) => ({ id: sub, sub, marks: m[sub] }))} rowKey={(r) => r.sub}
              cols={[
                { key: "sub", label: "Subject", render: (r) => <b>{r.sub}</b> },
                { key: "max", label: "Max", align: "right", value: () => ex.max_marks },
                {
                  key: "marks", label: "Obtained", align: "right",
                  value: (r) => (r.marks == null || r.marks === "" ? 0 : Number(r.marks)),
                  render: (r) => (r.marks == null || r.marks === "" ? "—" : <b>{r.marks}</b>)
                },
                {
                  key: "grade", label: "Grade", align: "right",
                  value: (r) => gradeOf(pct(Number(r.marks || 0), ex.max_marks))[1]
                },
                {
                  key: "res", label: "Result", align: "right",
                  render: (r) => {
                    const passed = Number(r.marks || 0) >= ex.pass_marks;
                    return <Pill tone={passed ? "var(--ok)" : "var(--danger)"}>{passed ? "Pass" : "Fail"}</Pill>;
                  }
                },
              ]} />
          </Panel>
        );
      })}
    </>
  );
}

/* ==================================================================== */
/*  Fees                                                                */
/* ==================================================================== */
function MyFees({ student, school, openDoc }) {
  const [fees, setFees] = useState([]);
  const [structure, setStructure] = useState({});
  const [transport, setTransport] = useState(null);
  const [hostel, setHostel] = useState(null);

  useEffect(() => {
    window.api.fees.list().then((all) => setFees(all.filter((f) => f.student_id === student.id)));
    window.api.fees.getStructure().then(setStructure);
    (async () => {
      const [allot, routes] = await Promise.all([window.api.transport.allotments(), window.api.transport.routes()]);
      const mine = allot.find((a) => a.student_id === student.id);
      setTransport(mine ? routes.find((r) => r.id === mine.route_id) : null);
    })();
    (async () => {
      const [allot, rooms] = await Promise.all([window.api.hostel.allotments(), window.api.hostel.rooms()]);
      const mine = allot.find((a) => a.student_id === student.id);
      setHostel(mine ? rooms.find((r) => r.id === mine.room_id) : null);
    })();
  }, [student.id]);

  const paid = fees.reduce((a, f) => a + Number(f.amount || 0), 0);
  const monthly = Number(structure[student.class]) || 0;
  const perMonth = monthly + Number(transport?.fee || 0) + Number(hostel?.fee || 0);
  const lastPaid = fees.map((f) => f.date).sort().slice(-1)[0];

  return (
    <>
      <div className="stat-grid">
        <Stat label="Paid so far" value={inr(paid)} sub={`${fees.length} receipt${fees.length === 1 ? "" : "s"}`} tone="var(--ok)" />
        <Stat label="Tuition fee" value={inr(monthly)} sub={`Class ${student.class}, per month`} tone="var(--amber)" />
        <Stat label="Total per month" value={inr(perMonth)} sub="tuition + transport + hostel" tone="var(--teal)" />
        <Stat label="Last payment" value={lastPaid ? fmtDate(lastPaid) : "—"} sub={lastPaid ? "receipt issued" : "nothing paid yet"} tone="var(--sun)" />
      </div>

      {(transport || hostel) && (
        <Panel title="What makes up the monthly fee">
          <div className="alert-row"><span className="alert-dot" style={{ background: "var(--amber)" }} />
            <span style={{ flex: 1 }}>Tuition fee — Class {student.class}</span><b>{inr(monthly)}</b></div>
          {transport && (
            <div className="alert-row"><span className="alert-dot" style={{ background: "var(--teal)" }} />
              <span style={{ flex: 1 }}>Transport — {transport.name}</span><b>{inr(transport.fee)}</b></div>
          )}
          {hostel && (
            <div className="alert-row"><span className="alert-dot" style={{ background: "var(--sun)" }} />
              <span style={{ flex: 1 }}>Hostel — {hostel.block}, Room {hostel.room_no}</span><b>{inr(hostel.fee)}</b></div>
          )}
          <div className="alert-row" style={{ borderTop: "2px solid var(--rule)", marginTop: 4 }}>
            <span className="alert-dot" style={{ background: "transparent" }} />
            <span style={{ flex: 1, fontWeight: 700 }}>Total per month</span><b>{inr(perMonth)}</b>
          </div>
        </Panel>
      )}

      <Panel title="My receipts" note="Every payment made to the school office. Open any receipt to print or save it.">
        {fees.length === 0 ? <Empty>No fee receipts yet.</Empty> : (
          <DataTable exportName={`My-fees-${student.adm_no || student.id}`} rows={fees}
            cols={[
              { key: "receipt_no", label: "Receipt" },
              { key: "date", label: "Date", render: (f) => fmtDate(f.date) },
              { key: "head", label: "Fee head" },
              { key: "months", label: "Period" },
              { key: "mode", label: "Mode" },
              { key: "amount", label: "Amount", align: "right", value: (f) => Number(f.amount || 0), render: (f) => <b>{inr(f.amount)}</b> },
              {
                key: "act", label: "", sortable: false, csv: false, align: "right",
                render: (f) => (
                  <button className="btn btn-ghost btn-sm"
                    onClick={() => openDoc(receiptHtml(school, student, f), `Receipt-${f.receipt_no}.pdf`)}>
                    <Printer size={12} />
                  </button>
                )
              },
            ]}
            footer={
              <tr>
                <td colSpan={5} style={{ textAlign: "right" }}>Total paid</td>
                <td style={{ textAlign: "right" }}>{inr(paid)}</td>
                <td />
              </tr>
            } />
        )}
        <p className="hint">
          For anything that looks wrong on a receipt, please contact the school office on {school.phone}.
        </p>
      </Panel>
    </>
  );
}

/* ==================================================================== */
/*  Timetable                                                           */
/* ==================================================================== */
function MyTimetable({ student, school, openDoc }) {
  const [rows, setRows] = useState([]);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    window.api.timetable.forClass(student.class, student.section).then(setRows);
    window.api.staff.list().then(setStaff);
  }, [student.class, student.section]);

  const cell = (day, p) => rows.find((r) => r.day === day && Number(r.period) === p);
  const teacherName = (id) => staff.find((s) => s.id === Number(id))?.name || "";
  const todayName = dayName(today());

  return (
    <>
      {DAYS.includes(todayName) && (
        <Panel title={`Today — ${todayName}`} note="Your periods for today">
          {PERIODS.filter((p) => cell(todayName, p)).length === 0 ? (
            <Empty>No periods set for today.</Empty>
          ) : (
            <div className="today-periods">
              {PERIODS.map((p) => {
                const c = cell(todayName, p);
                if (!c) return null;
                return (
                  <div key={p} className="tp">
                    <span className="tp-time">{PERIOD_TIMES[p]}</span>
                    <span className="tp-sub">{c.subject}</span>
                    <span className="tp-meta">{teacherName(c.staff_id) || "—"}{c.room ? ` · ${c.room}` : ""}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      <Panel flush title={`Weekly timetable — Class ${student.class}-${student.section}`}
        action={
          <button className="btn btn-ghost btn-sm" disabled={!rows.length} style={{ margin: "0 18px 0 0" }}
            onClick={() => {
              import("../lib/templates").then(({ timetableHtml }) =>
                openDoc(timetableHtml(school, {
                  title: `Class ${student.class}-${student.section} — Weekly Timetable`,
                  rows, staffById: Object.fromEntries(staff.map((s) => [s.id, s.name]))
                }), `Timetable-${student.class}${student.section}.pdf`));
            }}>
            <Printer size={13} /> Print
          </button>
        }>
        {rows.length === 0 ? (
          <div style={{ padding: 18 }}><Empty>The timetable for your class has not been put up yet.</Empty></div>
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
                      const isToday = d === todayName;
                      return (
                        <td key={d}>
                          <div className={"tt-cell" + (c ? "" : " free")}
                            style={{ cursor: "default", ...(isToday && c ? { borderColor: "var(--sun)" } : {}) }}>
                            {c ? (
                              <>
                                <span className="tt-sub">{c.subject}</span>
                                <span className="tt-meta">{teacherName(c.staff_id) || "—"}</span>
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

/* ==================================================================== */
/*  Homework                                                            */
/* ==================================================================== */
function MyHomework({ student }) {
  const [rows, setRows] = useState([]);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    window.api.comms.homework().then((all) =>
      setRows(all.filter((h) => h.class === student.class && h.section === student.section)));
    window.api.staff.list().then(setStaff);
  }, [student.class, student.section]);

  const teacherName = (id) => staff.find((s) => s.id === Number(id))?.name || "—";
  const pending = rows.filter((h) => daysBetween(today(), h.due_date) >= 0);
  const done = rows.filter((h) => daysBetween(today(), h.due_date) < 0);

  const Card = ({ h, past }) => {
    const left = daysBetween(today(), h.due_date);
    return (
      <div className="notice" style={past ? { opacity: .65, borderLeftColor: "var(--rule)" } : undefined}>
        <div className="n-meta" style={{ marginBottom: 4 }}>
          <b style={{ color: "var(--sun)" }}>{h.subject}</b>
          <span>·</span>
          <span>given {fmtDate(h.date)}</span>
          <span>·</span>
          <span>{teacherName(h.staff_id)}</span>
        </div>
        <h4 className="serif">{h.title}</h4>
        {h.details && <p>{h.details}</p>}
        <div style={{ marginTop: 8 }}>
          {past
            ? <Pill tone="var(--slate)">Was due {fmtDate(h.due_date)}</Pill>
            : <Pill tone={left === 0 ? "var(--danger)" : "var(--teal)"}>
                {left === 0 ? "Due today" : `Due in ${left} day${left === 1 ? "" : "s"} — ${fmtDate(h.due_date)}`}
              </Pill>}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="stat-grid">
        <Stat label="Pending homework" value={pending.length} sub="still to hand in" tone="var(--sun)" />
        <Stat label="Due today" value={rows.filter((h) => h.due_date === today()).length} sub="hand in today" tone="var(--danger)" />
        <Stat label="Given this month" value={rows.filter((h) => (h.date || "").startsWith(thisMonth())).length}
          sub={fmtMonth(thisMonth())} tone="var(--teal)" />
      </div>

      <Panel title="Pending" note={`Class ${student.class}-${student.section}`}>
        {pending.length === 0 ? <Empty>Nothing pending. All homework is handed in.</Empty>
          : pending.map((h) => <Card key={h.id} h={h} />)}
      </Panel>

      {done.length > 0 && (
        <Panel title="Earlier homework" note="Already past its due date">
          {done.slice(0, 8).map((h) => <Card key={h.id} h={h} past />)}
        </Panel>
      )}
    </>
  );
}

/* ==================================================================== */
/*  Notices & events                                                    */
/* ==================================================================== */
function MyNotices({ student }) {
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    window.api.comms.notices().then(setNotices);
    window.api.comms.events().then(setEvents);
  }, []);

  // students see everything except staff-only notices
  const visible = notices.filter((n) => !["Teachers", "Staff"].includes(n.audience));
  const live = visible.filter((n) => !n.expires || daysBetween(today(), n.expires) >= 0);
  const upcoming = events.filter((e) => daysBetween(today(), e.end_date || e.date) >= 0);

  return (
    <>
      <Panel title="Notice board" note={`${live.length} notice(s) currently up`}>
        {live.length === 0 ? <Empty>No notices on the board right now.</Empty> : live.map((n) => (
          <div key={n.id} className={"notice" + (n.priority === "High" ? " high" : "")}>
            <h4 className="serif">{n.title}</h4>
            <div className="n-meta">
              <span>{dayName(n.date)}, {fmtDate(n.date)}</span>
              <span>·</span><span>{n.audience}</span>
              {n.priority === "High" && <Pill tone="var(--danger)">Important</Pill>}
            </div>
            <p>{n.body}</p>
          </div>
        ))}
      </Panel>

      <Panel title="School calendar" note="Holidays, examinations and functions coming up">
        {upcoming.length === 0 ? <Empty>Nothing scheduled ahead.</Empty> : (
          <div className="timeline">
            {upcoming.map((e) => {
              const away = daysBetween(today(), e.date);
              return (
                <div key={e.id} className="tl-item">
                  <div className="tl-date">
                    {fmtDate(e.date)}{e.end_date ? ` – ${fmtDate(e.end_date)}` : ""}
                    {away >= 0 && <> · {away === 0 ? "today" : `in ${away} day${away === 1 ? "" : "s"}`}</>}
                  </div>
                  <div className="tl-title">{e.title} <Pill tone="var(--teal)">{e.type}</Pill></div>
                  <div className="tl-desc">{e.venue ? `${e.venue} — ` : ""}{e.description}</div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}

/* ==================================================================== */
/*  Library                                                             */
/* ==================================================================== */
function MyLibrary({ student }) {
  const [issues, setIssues] = useState([]);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    window.api.library.issues().then((all) =>
      setIssues(all.filter((i) => i.member_type === "student" && Number(i.member_id) === student.id)));
    window.api.library.books().then(setBooks);
  }, [student.id]);

  const title = (id) => books.find((b) => b.id === Number(id))?.title || "(removed from catalogue)";
  const out = issues.filter((i) => !i.return_date);
  const overdue = out.filter((i) => daysBetween(i.due_date, today()) > 0);

  return (
    <>
      <div className="stat-grid">
        <Stat label="Books with me" value={out.length} sub="not yet returned" tone="var(--teal)" />
        <Stat label="Overdue" value={overdue.length} sub="past the due date" tone={overdue.length ? "var(--danger)" : "var(--ok)"} />
        <Stat label="Borrowed in all" value={issues.length} sub="since admission" tone="var(--amber)" />
      </div>

      {overdue.length > 0 && (
        <Panel title="Please return these">
          {overdue.map((i) => {
            const late = daysBetween(i.due_date, today());
            return (
              <div key={i.id} className="alert-row">
                <span className="alert-dot" style={{ background: "var(--danger)" }} />
                <span style={{ flex: 1 }}><b>{title(i.book_id)}</b></span>
                <Pill tone="var(--danger)">{late} day{late === 1 ? "" : "s"} overdue · fine {inr(late * 2)}</Pill>
              </div>
            );
          })}
        </Panel>
      )}

      <Panel title="My library record">
        {issues.length === 0 ? <Empty>You have not borrowed any books yet.</Empty> : (
          <DataTable rows={issues}
            cols={[
              { key: "book", label: "Book", value: (i) => title(i.book_id), render: (i) => <b>{title(i.book_id)}</b> },
              { key: "issue_date", label: "Issued", render: (i) => fmtDate(i.issue_date) },
              { key: "due_date", label: "Due", render: (i) => fmtDate(i.due_date) },
              {
                key: "status", label: "Status",
                value: (i) => (i.return_date ? "Returned" : daysBetween(i.due_date, today()) > 0 ? "Overdue" : "With me"),
                render: (i) => {
                  if (i.return_date) return <Pill tone="var(--ok)">Returned {fmtDate(i.return_date)}</Pill>;
                  const late = daysBetween(i.due_date, today());
                  return late > 0
                    ? <Pill tone="var(--danger)">{late} day{late === 1 ? "" : "s"} overdue</Pill>
                    : <Pill tone="var(--teal)">With me</Pill>;
                }
              },
              { key: "fine", label: "Fine paid", align: "right", render: (i) => (Number(i.fine) ? inr(i.fine) : "—") },
            ]} />
        )}
      </Panel>
    </>
  );
}

/* ==================================================================== */
/*  My profile                                                          */
/* ==================================================================== */
function MyProfile({ student, school, onChangePassword }) {
  const [transport, setTransport] = useState(null);
  const [stop, setStop] = useState("");
  const [hostel, setHostel] = useState(null);

  useEffect(() => {
    (async () => {
      const [allot, routes] = await Promise.all([window.api.transport.allotments(), window.api.transport.routes()]);
      const mine = allot.find((a) => a.student_id === student.id);
      setTransport(mine ? routes.find((r) => r.id === mine.route_id) : null);
      setStop(mine?.stop || "");
    })();
    (async () => {
      const [allot, rooms] = await Promise.all([window.api.hostel.allotments(), window.api.hostel.rooms()]);
      const mine = allot.find((a) => a.student_id === student.id);
      setHostel(mine ? rooms.find((r) => r.id === mine.room_id) : null);
    })();
  }, [student.id]);

  const Row = ({ k, v }) => (
    <div className="prow"><span>{k}</span><b>{v || "—"}</b></div>
  );

  return (
    <>
      <Panel title="My details" note="These come from the school admission register. To correct anything, contact the office."
        action={<button className="btn btn-ghost btn-sm" onClick={onChangePassword}><KeyRound size={13} /> Change password</button>}>
        <div className="profile-head">
          <span className="avatar" style={{ width: 56, height: 56, flex: "0 0 56px", fontSize: 18 }}>
            {initialsOf(student.name)}
          </span>
          <div>
            <h3 className="serif" style={{ margin: 0, fontSize: 19 }}>{student.name}</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--slate)" }}>
              Class {student.class}-{student.section} · Roll {student.roll || "—"} · Admission no. {student.adm_no || "—"}
            </p>
          </div>
        </div>

        <div className="col2" style={{ marginTop: 16 }}>
          <div>
            <p className="eyebrow">Personal</p>
            <Row k="Father's name" v={student.father} />
            <Row k="Mother's name" v={student.mother} />
            <Row k="Date of birth" v={`${fmtDate(student.dob)}${student.dob ? ` (${ageOf(student.dob)} years)` : ""}`} />
            <Row k="Gender" v={student.gender} />
            <Row k="Category" v={student.category} />
            <Row k="Blood group" v={student.blood_group} />
          </div>
          <div>
            <p className="eyebrow">School record</p>
            <Row k="Admitted on" v={fmtDate(student.doa)} />
            <Row k="PEN number" v={student.pen_no} />
            <Row k="Samagra ID" v={student.samagra_no} />
            <Row k="Examination roll no." v={student.exam_no} />
            <Row k="Contact" v={student.phone} />
            <Row k="Address" v={student.address} />
          </div>
        </div>
      </Panel>

      <div className="col2">
        <Panel title="Transport">
          {!transport ? <Empty icon={false}>Not using school transport — day scholar.</Empty> : (
            <>
              <Row k="Route" v={transport.name} />
              <Row k="Boarding stop" v={stop} />
              <Row k="Vehicle" v={transport.vehicle_no} />
              <Row k="Driver" v={`${transport.driver}${transport.driver_phone ? ` · ${transport.driver_phone}` : ""}`} />
              <Row k="Monthly fee" v={inr(transport.fee)} />
            </>
          )}
        </Panel>
        <Panel title="Hostel">
          {!hostel ? <Empty icon={false}>Not in the hostel — day scholar.</Empty> : (
            <>
              <Row k="Block" v={hostel.block} />
              <Row k="Room" v={hostel.room_no} />
              <Row k="Room type" v={hostel.type} />
              <Row k="Monthly fee" v={inr(hostel.fee)} />
            </>
          )}
        </Panel>
      </div>
    </>
  );
}

/* ==================================================================== */
/*  Change password                                                     */
/* ==================================================================== */
function ChangePassword({ student, onClose, onSaved }) {
  const toast = useToast();
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (next.trim().length < 4) return toast.warn("Choose a password of at least 4 characters.");
    if (next !== again) return toast.warn("The two passwords do not match.");
    setBusy(true);
    const res = await window.api.auth.setStudentPassword(student.id, next.trim());
    setBusy(false);
    if (!res.ok) return toast.error(res.error || "Could not change the password.");
    onSaved({ ...student, password: next.trim() });
    onClose();
    toast.ok("Password changed. Use the new one next time you sign in.");
  };

  return (
    <Modal title="Change password" subtitle="Pick something you will remember" onClose={onClose}>
      <div style={{ display: "grid", gap: 13 }}>
        <Text label="New password" type="password" value={next} onChange={setNext} />
        <Text label="Repeat new password" type="password" value={again} onChange={setAgain} />
      </div>
      <p className="hint" style={{ marginTop: 10 }}>
        If you forget it, the school office can reset it back to the date of birth.
      </p>
      <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={busy}>
          <KeyRound size={14} /> {busy ? "Saving…" : "Change password"}
        </button>
      </div>
    </Modal>
  );
}
