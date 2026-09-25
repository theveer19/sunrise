import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronRight, UserPlus, IndianRupee, CalendarCheck, Megaphone, FileSpreadsheet,
  BadgeCheck, AlertTriangle, CalendarDays, TrendingUp
} from "lucide-react";
import {
  CLASSES, fmtDate, fmtMonth, inr, today, thisMonth, monthOffset, daysBetween, pct
} from "../lib/helpers";
import { Panel, Stat, Empty, BarChart, LineChart, Donut, Pill, useToast } from "../lib/ui.jsx";

export default function Dashboard({ data, students, staff, go }) {
  const [trend, setTrend] = useState(null);
  const [attPct, setAttPct] = useState(null);
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [issues, setIssues] = useState([]);
  const [absentToday, setAbsentToday] = useState(null);

  // monthly collection vs expenses for the last 6 months
  useEffect(() => {
    (async () => {
      const [fees, expenses] = await Promise.all([window.api.fees.list(), window.api.expenses.list()]);
      const months = Array.from({ length: 6 }, (_, i) => monthOffset(thisMonth(), -(5 - i)));
      const sum = (list, m) => list.filter((r) => (r.date || "").startsWith(m)).reduce((a, r) => a + Number(r.amount || 0), 0);
      setTrend({
        labels: months.map((m) => fmtMonth(m).slice(0, 3)),
        collected: months.map((m) => sum(fees, m)),
        spent: months.map((m) => sum(expenses, m)),
      });
    })();
  }, []);

  // this month's attendance, and who is absent today
  useEffect(() => {
    (async () => {
      const s = await window.api.attendance.summary(thisMonth());
      const vals = Object.values(s);
      const present = vals.reduce((a, t) => a + t.present, 0);
      const total = vals.reduce((a, t) => a + t.total, 0);
      setAttPct(total ? pct(present, total) : null);
    })();
  }, []);

  useEffect(() => {
    window.api.comms.events().then(setEvents);
    window.api.comms.notices().then(setNotices);
    window.api.library.issues().then(setIssues);
  }, []);

  // absent today, counted across the classes that have attendance marked
  useEffect(() => {
    (async () => {
      const classes = [...new Set(students.filter((s) => s.status === "Active").map((s) => `${s.class}|${s.section}`))];
      let absent = 0, marked = 0;
      for (const key of classes) {
        const [c, sec] = key.split("|");
        const rows = await window.api.attendance.forDay(today(), c, sec);
        marked += rows.length;
        absent += rows.filter((r) => r.status === "Absent").length;
      }
      setAbsentToday({ absent, marked });
    })();
  }, [students.length]);

  if (!data) return <Empty icon={false}>Loading dashboard…</Empty>;

  const upcoming = events.filter((e) => daysBetween(today(), e.end_date || e.date) >= 0).slice(0, 4);
  const overdueBooks = issues.filter((i) => !i.return_date && daysBetween(i.due_date, today()) > 0).length;
  const activeCount = students.filter((s) => s.status === "Active").length;
  const unmarkedToday = absentToday ? activeCount - absentToday.marked : 0;

  const stats = [
    { label: "Students on roll", value: data.totalStudents, sub: `${data.leftStudents} left / TC issued`, tone: "var(--sun)", go: "students" },
    { label: "Fees collected", value: inr(data.feesTotal), sub: `${data.receiptCount} receipts`, tone: "var(--ok)", go: "fees" },
    { label: "Total expenses", value: inr(data.expenseTotal), sub: "paid out", tone: "var(--warn)", go: "expenses" },
    { label: "Net balance", value: inr(data.netBalance), sub: "collection − expenses", tone: "var(--teal)", go: "reports" },
    { label: "Monthly demand", value: inr(data.monthlyDemand), sub: "at current strength", tone: "var(--amber)", go: "fees" },
    {
      label: "Attendance this month", value: attPct == null ? "—" : `${attPct.toFixed(1)}%`,
      sub: attPct == null ? "not marked yet" : "whole school", tone: attPct == null ? "var(--slate)" : attPct >= 75 ? "var(--ok)" : "var(--danger)",
      go: "attendance"
    },
  ];

  const byClass = CLASSES.map((c) => ({ c, n: data.byClass[c] || 0 })).filter((x) => x.n);

  const QUICK = [
    ["Take attendance", CalendarCheck, "var(--teal)", "attendance"],
    ["New admission", UserPlus, "var(--sun)", "students"],
    ["Collect fees", IndianRupee, "var(--ok)", "fees"],
    ["Enter marks", FileSpreadsheet, "var(--amber)", "exams"],
    ["Issue TC", BadgeCheck, "var(--warn)", "certs"],
    ["Put up a notice", Megaphone, "var(--ink2)", "comms"],
  ];

  const alerts = [];
  if (absentToday && unmarkedToday > 0) {
    alerts.push({ tone: "var(--warn)", text: `Attendance not marked for ${unmarkedToday} student${unmarkedToday === 1 ? "" : "s"} today`, go: "attendance" });
  }
  if (absentToday?.absent) {
    alerts.push({ tone: "var(--danger)", text: `${absentToday.absent} student${absentToday.absent === 1 ? "" : "s"} absent today`, go: "attendance" });
  }
  if (overdueBooks) {
    alerts.push({ tone: "var(--danger)", text: `${overdueBooks} library book${overdueBooks === 1 ? "" : "s"} overdue`, go: "library" });
  }
  if (upcoming[0]) {
    const away = daysBetween(today(), upcoming[0].date);
    alerts.push({
      tone: "var(--teal)",
      text: `${upcoming[0].title} ${away <= 0 ? "is on now" : `in ${away} day${away === 1 ? "" : "s"}`}`,
      go: "comms"
    });
  }
  if (!alerts.length) alerts.push({ tone: "var(--ok)", text: "Nothing needs attention right now.", go: null });

  return (
    <>
      <div className="stat-grid">
        {stats.map((s) => <Stat key={s.label} {...s} onClick={s.go ? () => go(s.go) : undefined} />)}
      </div>

      <Panel title="Quick actions" note="The jobs the office does every day.">
        <div className="qa-grid">
          {QUICK.map(([label, Icon, tone, view]) => (
            <button key={label} className="qa" onClick={() => go(view)}>
              <span className="qa-ico" style={{ background: tone }}><Icon size={16} /></span>
              <span className="qa-label">{label}</span>
            </button>
          ))}
        </div>
      </Panel>

      <div className="col2">
        <Panel title="Fees against expenses" note="Last six months"
          action={<button className="btn btn-ghost btn-sm" onClick={() => go("reports")}>Reports <ChevronRight size={13} /></button>}>
          {!trend ? <Empty icon={false}>Loading…</Empty> : (
            <BarChart labels={trend.labels} format={(v) => inr(v)} yLabel="Amount in ₹"
              series={[
                { name: "Collected", color: "var(--chart-1)", values: trend.collected },
                { name: "Spent", color: "var(--chart-2)", values: trend.spent },
              ]} />
          )}
        </Panel>

        <Panel title="Needs attention" note="Today at a glance">
          <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
            {attPct != null && (
              <Donut value={attPct} label="Attendance" sub={fmtMonth(thisMonth())} size={96}
                color={attPct >= 75 ? "var(--ok)" : "var(--warn)"} />
            )}
            <div style={{ flex: 1, minWidth: 190 }}>
              {alerts.map((a, i) => (
                <div key={i} className="alert-row" style={a.go ? { cursor: "pointer" } : undefined}
                  onClick={a.go ? () => go(a.go) : undefined}>
                  <span className="alert-dot" style={{ background: a.tone }} />
                  <span style={{ flex: 1 }}>{a.text}</span>
                  {a.go && <ChevronRight size={13} style={{ color: "var(--slate)" }} />}
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="col2">
        <Panel title="Strength by class" note={`${data.totalStudents} students on roll`}>
          {byClass.length === 0 ? <Empty>No students on roll yet.</Empty> : (
            <BarChart labels={byClass.map((b) => b.c)}
              series={[{ name: "Students", color: "var(--chart-1)", values: byClass.map((b) => b.n) }]}
              yLabel="Students" height={170} />
          )}
        </Panel>

        <Panel title="Coming up" note="From the academic calendar"
          action={<button className="btn btn-ghost btn-sm" onClick={() => go("comms")}>Calendar <ChevronRight size={13} /></button>}>
          {upcoming.length === 0 ? <Empty>Nothing scheduled ahead.</Empty> : (
            <div className="timeline">
              {upcoming.map((e) => {
                const away = daysBetween(today(), e.date);
                return (
                  <div key={e.id} className="tl-item">
                    <div className="tl-date">
                      {fmtDate(e.date)} · {away <= 0 ? "on now" : `in ${away} day${away === 1 ? "" : "s"}`}
                    </div>
                    <div className="tl-title">{e.title}</div>
                    <div className="tl-desc">{e.venue || e.type}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <div className="col2">
        <Panel title="Recent fee receipts"
          action={<button className="btn btn-ghost btn-sm" onClick={() => go("fees")}>Open fees <ChevronRight size={13} /></button>}>
          {data.recentFees.length === 0 ? <Empty>No fees received yet.</Empty> : (
            <table className="grid">
              <thead><tr><th>Receipt</th><th>Student</th><th>Head</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
              <tbody>{data.recentFees.map((f) => (
                <tr key={f.id}>
                  <td>{f.receipt_no}</td><td>{f.name}</td><td>{f.head}</td>
                  <td style={{ fontWeight: 600, textAlign: "right" }}>{inr(f.amount)}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </Panel>

        <Panel title="Latest notices"
          action={<button className="btn btn-ghost btn-sm" onClick={() => go("comms")}>Notice board <ChevronRight size={13} /></button>}>
          {notices.length === 0 ? <Empty>No notices on the board.</Empty> : (
            <div>
              {notices.slice(0, 4).map((n) => (
                <div key={n.id} className="alert-row" style={{ alignItems: "flex-start" }}>
                  <span className="alert-dot" style={{ background: n.priority === "High" ? "var(--danger)" : "var(--teal)", marginTop: 6 }} />
                  <span style={{ flex: 1 }}>
                    <b style={{ display: "block" }}>{n.title}</b>
                    <span style={{ fontSize: 11, color: "var(--slate)" }}>{fmtDate(n.date)} · {n.audience}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
