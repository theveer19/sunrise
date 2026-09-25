import React, { useState, useEffect, useMemo } from "react";
import { BarChart3, FileDown, Printer, AlertTriangle } from "lucide-react";
import {
  CLASSES, thisMonth, monthOffset, fmtMonth, fmtDate, today, inr, pct,
  downloadFile, toCsv, daysBetween
} from "../lib/helpers";
import {
  Panel, Pick, Empty, Tabs, DataTable, Pill, Stat, Donut, BarChart, LineChart, RankBars, useToast
} from "../lib/ui.jsx";

export default function Reports(props) {
  const [tab, setTab] = useState("collection");
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[
        ["collection", "Fee collection"],
        ["defaulters", "Fee defaulters"],
        ["attendance", "Attendance report"],
        ["strength", "Strength & staff"],
      ]} />
      {tab === "collection" && <Collection {...props} />}
      {tab === "defaulters" && <Defaulters {...props} />}
      {tab === "attendance" && <AttendanceReport {...props} />}
      {tab === "strength" && <Strength {...props} />}
    </>
  );
}

/* ==================================================================== */
/*  Fee collection                                                      */
/* ==================================================================== */
function Collection({ students }) {
  const toast = useToast();
  const [fees, setFees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    window.api.fees.list().then(setFees);
    window.api.expenses.list().then(setExpenses);
  }, []);

  const range = useMemo(
    () => Array.from({ length: months }, (_, i) => monthOffset(thisMonth(), -(months - 1 - i))),
    [months]
  );

  const sumFor = (list, m) => list.filter((r) => (r.date || "").startsWith(m)).reduce((a, r) => a + Number(r.amount || 0), 0);
  const collected = range.map((m) => sumFor(fees, m));
  const spent = range.map((m) => sumFor(expenses, m));
  const labels = range.map((m) => fmtMonth(m).slice(0, 3) + " " + m.slice(2, 4));

  const totalIn = collected.reduce((a, b) => a + b, 0);
  const totalOut = spent.reduce((a, b) => a + b, 0);

  const byHead = {};
  fees.filter((f) => range.some((m) => (f.date || "").startsWith(m)))
    .forEach((f) => (byHead[f.head || "Other"] = (byHead[f.head || "Other"] || 0) + Number(f.amount || 0)));
  const headRows = Object.entries(byHead).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const byMode = {};
  fees.filter((f) => range.some((m) => (f.date || "").startsWith(m)))
    .forEach((f) => (byMode[f.mode || "Other"] = (byMode[f.mode || "Other"] || 0) + Number(f.amount || 0)));
  const modeRows = Object.entries(byMode).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const exportMonthly = () => {
    const rows = range.map((m, i) => ({
      month: fmtMonth(m), collected: collected[i], spent: spent[i], net: collected[i] - spent[i]
    }));
    downloadFile(`Collection-summary-${today()}.csv`, toCsv(rows, [
      { key: "month", label: "Month" }, { key: "collected", label: "Fees collected" },
      { key: "spent", label: "Expenses" }, { key: "net", label: "Net" },
    ]));
    toast.ok("Collection summary exported.");
  };

  return (
    <>
      <div className="stat-grid">
        <Stat label={`Collected (${months} months)`} value={inr(totalIn)} sub={`${fees.length} receipts in all`} tone="var(--ok)" />
        <Stat label="Spent in the same period" value={inr(totalOut)} sub="all expense heads" tone="var(--warn)" />
        <Stat label="Net" value={inr(totalIn - totalOut)} sub="collection − expenses" tone="var(--teal)" />
        <Stat label="Best month" value={labels[collected.indexOf(Math.max(...collected))] || "—"}
          sub={inr(Math.max(...collected, 0))} tone="var(--sun)" />
      </div>

      <Panel title="Collection against expenses" note="Month by month, from the fee receipts and the expense register."
        action={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select className="inp" style={{ width: 130 }} value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              {[3, 6, 12].map((n) => <option key={n} value={n}>Last {n} months</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={exportMonthly}><FileDown size={12} /> Export CSV</button>
          </div>
        }>
        <BarChart labels={labels} format={(v) => inr(v)} yLabel="Amount in ₹"
          series={[
            { name: "Fees collected", color: "var(--chart-1)", values: collected },
            { name: "Expenses", color: "var(--chart-2)", values: spent },
          ]} />
      </Panel>

      <div className="col2">
        <Panel title="Collection by fee head" note={`Last ${months} months`}>
          {headRows.length === 0 ? <Empty>No fees collected in this period.</Empty>
            : <RankBars rows={headRows} format={(v) => inr(v)} />}
        </Panel>
        <Panel title="Collection by payment mode" note="How parents are paying">
          {modeRows.length === 0 ? <Empty>No fees collected in this period.</Empty>
            : <RankBars rows={modeRows} format={(v) => inr(v)} color="var(--chart-2)" />}
        </Panel>
      </div>
    </>
  );
}

/* ==================================================================== */
/*  Fee defaulters                                                      */
/* ==================================================================== */
function Defaulters({ students }) {
  const toast = useToast();
  const [fees, setFees] = useState([]);
  const [structure, setStructure] = useState({});
  const [cls, setCls] = useState("All");
  const [monthsDue, setMonthsDue] = useState(3);

  useEffect(() => {
    window.api.fees.list().then(setFees);
    window.api.fees.getStructure().then(setStructure);
  }, []);

  const paidBy = useMemo(() => {
    const m = {};
    fees.forEach((f) => (m[f.student_id] = (m[f.student_id] || 0) + Number(f.amount || 0)));
    return m;
  }, [fees]);

  const lastPaid = useMemo(() => {
    const m = {};
    fees.forEach((f) => {
      if (!m[f.student_id] || (f.date || "") > m[f.student_id]) m[f.student_id] = f.date || "";
    });
    return m;
  }, [fees]);

  const rows = useMemo(() => students
    .filter((s) => s.status === "Active")
    .filter((s) => cls === "All" || s.class === cls)
    .map((s) => {
      const monthly = Number(structure[s.class]) || 0;
      const expected = monthly * monthsDue;
      const paid = paidBy[s.id] || 0;
      const due = Math.max(0, expected - paid);
      return { ...s, monthly, expected, paid, due, last: lastPaid[s.id] || "" };
    })
    .filter((r) => r.due > 0)
    .sort((a, b) => b.due - a.due), [students, structure, paidBy, lastPaid, cls, monthsDue]);

  const totalDue = rows.reduce((a, r) => a + r.due, 0);
  const classList = CLASSES.filter((c) => students.some((s) => s.status === "Active" && s.class === c));

  const byClass = {};
  rows.forEach((r) => (byClass[r.class] = (byClass[r.class] || 0) + r.due));
  const classRows = CLASSES.filter((c) => byClass[c]).map((c) => ({ label: `Class ${c}`, value: byClass[c] }));

  return (
    <>
      <div className="stat-grid">
        <Stat label="Students with dues" value={rows.length} sub={`of ${students.filter((s) => s.status === "Active").length} on roll`} tone="var(--danger)" />
        <Stat label="Total outstanding" value={inr(totalDue)} sub={`assuming ${monthsDue} months due`} tone="var(--warn)" />
        <Stat label="Largest single due" value={inr(rows[0]?.due || 0)} sub={rows[0]?.name || "nothing outstanding"} tone="var(--sun)" />
        <Stat label="Average due" value={inr(rows.length ? Math.round(totalDue / rows.length) : 0)} sub="per defaulter" tone="var(--slate)" />
      </div>

      <Panel title="Fee defaulters" note="Expected fee is the class monthly fee times the number of months you choose, less everything received so far.">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ width: 150 }}>
            <Pick label="Class" value={cls} onChange={setCls} options={["All", ...classList]} />
          </div>
          <div style={{ width: 190 }}>
            <Pick label="Months to charge" value={String(monthsDue)} onChange={(v) => setMonthsDue(Number(v))}
              options={[1, 2, 3, 4, 6, 9, 12].map((n) => ({ value: String(n), label: `${n} month${n === 1 ? "" : "s"}` }))} />
          </div>
        </div>
      </Panel>

      {classRows.length > 0 && (
        <Panel title="Outstanding by class" note="Where the money is stuck">
          <RankBars rows={classRows} format={(v) => inr(v)} color="var(--chart-2)" />
        </Panel>
      )}

      <Panel title={`${rows.length} defaulter(s)`} note="Export this list and hand it to the fee counter, or message parents from the WhatsApp screen.">
        {rows.length === 0 ? (
          <Empty>No dues outstanding for this filter. Every student has paid what is expected.</Empty>
        ) : (
          <DataTable exportName={`Fee-defaulters-${today()}`} rows={rows}
            cols={[
              { key: "adm_no", label: "Adm. No." },
              { key: "name", label: "Student", render: (r) => <b>{r.name}</b> },
              { key: "class", label: "Class", value: (r) => `${r.class}-${r.section}` },
              { key: "father", label: "Father" },
              { key: "monthly", label: "Monthly fee", align: "right", render: (r) => inr(r.monthly) },
              { key: "paid", label: "Paid so far", align: "right", render: (r) => inr(r.paid) },
              {
                key: "due", label: "Outstanding", align: "right",
                render: (r) => <Pill tone="var(--danger)">{inr(r.due)}</Pill>
              },
              { key: "last", label: "Last payment", render: (r) => (r.last ? fmtDate(r.last) : "never") },
              { key: "phone", label: "Contact", value: (r) => r.whatsapp || r.phone || "" },
            ]} />
        )}
      </Panel>
    </>
  );
}

/* ==================================================================== */
/*  Attendance report                                                   */
/* ==================================================================== */
function AttendanceReport({ students }) {
  const [month, setMonth] = useState(thisMonth());
  const [summary, setSummary] = useState({});
  const [trend, setTrend] = useState([]);
  const [cls, setCls] = useState("All");

  useEffect(() => { window.api.attendance.summary(month).then(setSummary); }, [month]);

  useEffect(() => {
    (async () => {
      const months = Array.from({ length: 6 }, (_, i) => monthOffset(thisMonth(), -(5 - i)));
      const out = [];
      for (const m of months) {
        const s = await window.api.attendance.summary(m);
        const vals = Object.values(s);
        const present = vals.reduce((a, t) => a + t.present, 0);
        const total = vals.reduce((a, t) => a + t.total, 0);
        out.push({ month: m, pct: pct(present, total) });
      }
      setTrend(out);
    })();
  }, []);

  const rows = useMemo(() => students
    .filter((s) => s.status === "Active")
    .filter((s) => cls === "All" || s.class === cls)
    .map((s) => {
      const t = summary[s.id] || { present: 0, absent: 0, late: 0, leave: 0, total: 0 };
      return { ...s, ...t, percent: pct(t.present, t.total) };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => a.percent - b.percent), [students, summary, cls]);

  const overall = useMemo(() => {
    const p = rows.reduce((a, r) => a + r.present, 0);
    const t = rows.reduce((a, r) => a + r.total, 0);
    return pct(p, t);
  }, [rows]);

  const shortfall = rows.filter((r) => r.percent < 75);
  const classList = CLASSES.filter((c) => students.some((s) => s.status === "Active" && s.class === c));

  return (
    <>
      <div className="stat-grid">
        <Stat label="Overall attendance" value={`${overall.toFixed(1)}%`} sub={fmtMonth(month)}
          tone={overall >= 75 ? "var(--ok)" : "var(--warn)"} />
        <Stat label="Below 75%" value={shortfall.length} sub="students short of attendance" tone="var(--danger)" />
        <Stat label="Students counted" value={rows.length} sub="with attendance marked" tone="var(--teal)" />
        <Stat label="Full attendance" value={rows.filter((r) => r.percent === 100).length} sub="not a single absence" tone="var(--ok)" />
      </div>

      <div className="col2">
        <Panel title="Attendance trend" note="Whole school, last 6 months">
          {trend.length === 0 ? <Empty icon={false}>Loading…</Empty> : (
            <LineChart labels={trend.map((t) => fmtMonth(t.month).slice(0, 3))}
              values={trend.map((t) => Number(t.pct.toFixed(1)))}
              format={(v) => `${v}%`} yLabel="Attendance %" />
          )}
        </Panel>
        <Panel title="This month at a glance" note={fmtMonth(month)}>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <Donut value={overall} label="Overall" sub={`${rows.length} students`}
              color={overall >= 75 ? "var(--ok)" : "var(--warn)"} size={120} />
            <div style={{ flex: 1, minWidth: 170 }}>
              <div className="alert-row"><span className="alert-dot" style={{ background: "var(--ok)" }} />
                <span style={{ flex: 1 }}>Above 90%</span><b>{rows.filter((r) => r.percent >= 90).length}</b></div>
              <div className="alert-row"><span className="alert-dot" style={{ background: "var(--teal)" }} />
                <span style={{ flex: 1 }}>75% – 90%</span><b>{rows.filter((r) => r.percent >= 75 && r.percent < 90).length}</b></div>
              <div className="alert-row"><span className="alert-dot" style={{ background: "var(--warn)" }} />
                <span style={{ flex: 1 }}>60% – 75%</span><b>{rows.filter((r) => r.percent >= 60 && r.percent < 75).length}</b></div>
              <div className="alert-row"><span className="alert-dot" style={{ background: "var(--danger)" }} />
                <span style={{ flex: 1 }}>Below 60%</span><b>{rows.filter((r) => r.percent < 60).length}</b></div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Student attendance" note="Lowest attendance first — these are the parents to call.">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ width: 168 }}>
            <label className="lbl">Month</label>
            <input className="inp" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div style={{ width: 150 }}>
            <Pick label="Class" value={cls} onChange={setCls} options={["All", ...classList]} />
          </div>
        </div>
        {rows.length === 0 ? (
          <Empty>No attendance marked in {fmtMonth(month)} yet. Mark it from the Attendance screen.</Empty>
        ) : (
          <DataTable exportName={`Attendance-report-${month}`} rows={rows}
            cols={[
              { key: "adm_no", label: "Adm. No." },
              { key: "name", label: "Student", render: (r) => <b>{r.name}</b> },
              { key: "class", label: "Class", value: (r) => `${r.class}-${r.section}` },
              { key: "present", label: "Present", align: "right" },
              { key: "absent", label: "Absent", align: "right" },
              { key: "late", label: "Late", align: "right" },
              { key: "total", label: "Days marked", align: "right" },
              {
                key: "percent", label: "Attendance", align: "right",
                value: (r) => Number(r.percent.toFixed(1)),
                render: (r) => (
                  <Pill tone={r.percent >= 75 ? "var(--ok)" : r.percent >= 60 ? "var(--warn)" : "var(--danger)"}>
                    {r.percent.toFixed(1)}%
                  </Pill>
                )
              },
              { key: "phone", label: "Contact", value: (r) => r.whatsapp || r.phone || "" },
            ]} />
        )}
      </Panel>
    </>
  );
}

/* ==================================================================== */
/*  Strength & staff                                                    */
/* ==================================================================== */
function Strength({ students, staff }) {
  const active = students.filter((s) => s.status === "Active");
  const byClass = {};
  active.forEach((s) => (byClass[s.class] = (byClass[s.class] || 0) + 1));
  const classRows = CLASSES.filter((c) => byClass[c]).map((c) => ({ label: `Class ${c}`, value: byClass[c] }));

  const boys = active.filter((s) => s.gender === "Male").length;
  const girls = active.filter((s) => s.gender === "Female").length;

  const byCategory = {};
  active.forEach((s) => (byCategory[s.category || "General"] = (byCategory[s.category || "General"] || 0) + 1));
  const catRows = Object.entries(byCategory).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const byDept = {};
  staff.filter((s) => s.status === "Active").forEach((s) => (byDept[s.department || "Other"] = (byDept[s.department || "Other"] || 0) + 1));
  const deptRows = Object.entries(byDept).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const activeStaff = staff.filter((s) => s.status === "Active");
  const ratio = activeStaff.length ? (active.length / activeStaff.length).toFixed(1) : "—";

  return (
    <>
      <div className="stat-grid">
        <Stat label="Students on roll" value={active.length} sub={`${boys} boys · ${girls} girls`} tone="var(--sun)" />
        <Stat label="Staff on roll" value={activeStaff.length} sub={`${Object.keys(byDept).length} departments`} tone="var(--teal)" />
        <Stat label="Student : teacher" value={`${ratio} : 1`} sub="on active strength" tone="var(--amber)" />
        <Stat label="Classes running" value={classRows.length} sub="with students on roll" tone="var(--ok)" />
      </div>

      <Panel title="Strength by class" note="Active students only">
        {classRows.length === 0 ? <Empty>No students on roll.</Empty> : (
          <BarChart labels={classRows.map((r) => r.label.replace("Class ", ""))}
            series={[{ name: "Students", color: "var(--chart-1)", values: classRows.map((r) => r.value) }]}
            yLabel="Students on roll" />
        )}
      </Panel>

      <div className="col2">
        <Panel title="Students by category" note="As recorded in the admission register">
          {catRows.length === 0 ? <Empty>No students on roll.</Empty> : <RankBars rows={catRows} />}
        </Panel>
        <Panel title="Staff by department">
          {deptRows.length === 0 ? <Empty>No staff on roll.</Empty> : <RankBars rows={deptRows} color="var(--chart-2)" />}
        </Panel>
      </div>
    </>
  );
}
