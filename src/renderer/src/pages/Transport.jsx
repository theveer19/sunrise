import React, { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Save, Bus, UserPlus, X } from "lucide-react";
import { CLASSES, today, inr } from "../lib/helpers";
import {
  Panel, Modal, Text, Pick, Area, Empty, Tabs, SearchBox, DataTable, Pill, Stat, useToast, useConfirm
} from "../lib/ui.jsx";

export default function Transport(props) {
  const [tab, setTab] = useState("routes");
  const [routes, setRoutes] = useState([]);
  const [allot, setAllot] = useState([]);

  const load = async () => {
    const [r, a] = await Promise.all([window.api.transport.routes(), window.api.transport.allotments()]);
    setRoutes(r); setAllot(a);
  };
  useEffect(() => { load(); }, []);

  const shared = { ...props, routes, allot, reloadTr: load };
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[["routes", "Routes & vehicles"], ["students", "Student allotment"]]} />
      {tab === "routes" ? <Routes {...shared} /> : <Allotment {...shared} />}
    </>
  );
}

const stopList = (r) => String(r?.stops || "").split(",").map((s) => s.trim()).filter(Boolean);

/* ==================================================================== */
/*  Routes                                                              */
/* ==================================================================== */
function Routes({ routes, allot, reloadTr }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [edit, setEdit] = useState(null);

  const blank = () => ({ name: "", vehicle_no: "", driver: "", driver_phone: "", fee: 0, stops: "" });
  const riders = (id) => allot.filter((a) => a.route_id === id).length;

  const save = async () => {
    if (!(edit.name || "").trim()) return toast.warn("Enter the route name.");
    await window.api.transport.saveRoute({ ...edit, fee: Number(edit.fee) || 0 });
    setEdit(null); await reloadTr();
    toast.ok("Route saved.");
  };
  const remove = async (r) => {
    const n = riders(r.id);
    const ok = await confirm({
      title: "Delete this route?", danger: true, confirmLabel: "Delete route",
      message: n ? `${r.name} has ${n} student${n === 1 ? "" : "s"} allotted. They will lose their transport allotment.`
        : `${r.name} will be removed.`
    });
    if (!ok) return;
    await window.api.transport.removeRoute(r.id);
    await reloadTr();
    toast.ok("Route removed.");
  };

  const monthly = allot.reduce((a, x) => a + (Number(routes.find((r) => r.id === x.route_id)?.fee) || 0), 0);

  return (
    <>
      <div className="stat-grid">
        <Stat label="Routes running" value={routes.length} sub="school buses & vans" tone="var(--teal)" />
        <Stat label="Students using transport" value={allot.length} sub="allotted to a route" tone="var(--sun)" />
        <Stat label="Monthly transport fee" value={inr(monthly)} sub="at current allotment" tone="var(--ok)" />
      </div>

      <Panel title="Routes & vehicles" note={`${routes.length} route(s)`}
        action={<button className="btn" onClick={() => setEdit(blank())}><Plus size={14} /> Add route</button>}>
        <DataTable exportName="Transport-routes" rows={routes} empty="No routes added yet."
          cols={[
            { key: "name", label: "Route", render: (r) => <b>{r.name}</b> },
            { key: "vehicle_no", label: "Vehicle" },
            { key: "driver", label: "Driver" },
            { key: "driver_phone", label: "Driver phone" },
            {
              key: "stops", label: "Stops",
              value: (r) => stopList(r).join(" · "),
              render: (r) => <span style={{ fontSize: 12, color: "var(--slate)" }}>{stopList(r).join(" · ") || "—"}</span>
            },
            { key: "fee", label: "Monthly fee", align: "right", value: (r) => Number(r.fee || 0), render: (r) => inr(r.fee) },
            {
              key: "riders", label: "Students", align: "right", value: (r) => riders(r.id),
              render: (r) => <Pill tone="var(--teal)">{riders(r.id)}</Pill>
            },
            {
              key: "act", label: "", sortable: false, csv: false, align: "right",
              render: (r) => (
                <span className="row-actions" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setEdit(r)}><Pencil size={12} /></button>
                  <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => remove(r)}><Trash2 size={12} /></button>
                </span>
              )
            },
          ]} />
      </Panel>

      {edit && (
        <Modal title={edit.id ? "Edit route" : "Add a route"} onClose={() => setEdit(null)}>
          <div className="grid-form">
            <Text label="Route name" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })}
              placeholder="Route 4 — Govindpuri" />
            <Text label="Vehicle number" value={edit.vehicle_no} onChange={(v) => setEdit({ ...edit, vehicle_no: v })}
              placeholder="MP07 CD 1234" />
            <Text label="Driver name" value={edit.driver} onChange={(v) => setEdit({ ...edit, driver: v })} />
            <Text label="Driver phone" value={edit.driver_phone} onChange={(v) => setEdit({ ...edit, driver_phone: v })} />
            <Text label="Monthly fee" type="number" value={edit.fee} onChange={(v) => setEdit({ ...edit, fee: v })} />
          </div>
          <div style={{ marginTop: 12 }}>
            <Area label="Stops" rows={2} value={edit.stops} onChange={(v) => setEdit({ ...edit, stops: v })}
              hint="Separate each stop with a comma — these appear in the student allotment dropdown."
              placeholder="Govindpuri, Sithouli, Bahodapur" />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
            <button className="btn" onClick={save}><Save size={14} /> Save route</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ==================================================================== */
/*  Student allotment                                                   */
/* ==================================================================== */
function Allotment({ students, routes, allot, reloadTr }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState(null);

  const byStudent = useMemo(() => Object.fromEntries(allot.map((a) => [a.student_id, a])), [allot]);
  const active = students.filter((s) => s.status === "Active");

  const rows = active.filter((s) => {
    const a = byStudent[s.id];
    if (filter === "Using transport" && !a) return false;
    if (filter === "Not using" && a) return false;
    if (filter !== "All" && filter !== "Using transport" && filter !== "Not using") {
      if (!a || routes.find((r) => r.id === a.route_id)?.name !== filter) return false;
    }
    return [s.name, s.adm_no, s.father].map((v) => v ?? "").join(" ").toLowerCase().includes(q.trim().toLowerCase());
  });

  const routeOf = (s) => routes.find((r) => r.id === byStudent[s.id]?.route_id);

  const openForm = (s) => {
    const a = byStudent[s.id];
    const r = routes.find((x) => x.id === a?.route_id) || routes[0];
    setForm({
      student: s, student_id: s.id,
      route_id: String(r?.id || ""), stop: a?.stop || stopList(r)[0] || "",
      from_date: a?.from_date || today()
    });
  };

  const save = async () => {
    if (!form.route_id) return toast.warn("Choose a route.");
    await window.api.transport.allot(form);
    setForm(null); await reloadTr();
    toast.ok(`${form.student.name} allotted to ${routes.find((r) => r.id === Number(form.route_id))?.name}.`);
  };

  const unallot = async (s) => {
    const ok = await confirm({
      title: "Remove transport?", confirmLabel: "Remove",
      message: `${s.name} will no longer be on a bus route. The monthly transport fee stops applying.`
    });
    if (!ok) return;
    await window.api.transport.unallot(s.id);
    await reloadTr();
    toast.ok("Transport allotment removed.");
  };

  const selectedRoute = routes.find((r) => r.id === Number(form?.route_id));

  return (
    <>
      <Panel title="Student transport allotment" note={`${allot.length} of ${active.length} students use school transport`}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <SearchBox value={q} onChange={setQ} placeholder="Search student, admission no. or father" />
          <select className="inp" style={{ width: 210 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["All", "Using transport", "Not using", ...routes.map((r) => r.name)].map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
      </Panel>

      <Panel title={`${rows.length} student(s)`}>
        <DataTable exportName="Transport-allotment" rows={rows} empty="No students match this filter."
          cols={[
            { key: "adm_no", label: "Adm. No." },
            { key: "name", label: "Student", render: (s) => <b>{s.name}</b> },
            { key: "class", label: "Class", value: (s) => `${s.class}-${s.section}` },
            {
              key: "route", label: "Route", value: (s) => routeOf(s)?.name || "—",
              render: (s) => {
                const r = routeOf(s);
                return r ? <Pill tone="var(--teal)">{r.name}</Pill> : <span style={{ color: "var(--slate)" }}>Not using</span>;
              }
            },
            { key: "stop", label: "Stop", value: (s) => byStudent[s.id]?.stop || "—" },
            {
              key: "fee", label: "Monthly fee", align: "right",
              value: (s) => Number(routeOf(s)?.fee || 0),
              render: (s) => (routeOf(s) ? inr(routeOf(s).fee) : "—")
            },
            {
              key: "act", label: "", sortable: false, csv: false, align: "right",
              render: (s) => (
                <span className="row-actions" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openForm(s)} disabled={!routes.length}>
                    <UserPlus size={12} /> {byStudent[s.id] ? "Change" : "Allot"}
                  </button>
                  {byStudent[s.id] && (
                    <button className="btn btn-ghost btn-sm" title="Remove from transport" onClick={() => unallot(s)}>
                      <X size={12} />
                    </button>
                  )}
                </span>
              )
            },
          ]} />
      </Panel>

      {form && (
        <Modal title={`Transport — ${form.student.name}`}
          subtitle={`Class ${form.student.class}-${form.student.section} · ${form.student.address || "no address on record"}`}
          onClose={() => setForm(null)}>
          <div className="grid-form">
            <Pick label="Route" value={form.route_id}
              onChange={(v) => {
                const r = routes.find((x) => x.id === Number(v));
                setForm({ ...form, route_id: v, stop: stopList(r)[0] || "" });
              }}
              options={routes.map((r) => ({ value: String(r.id), label: `${r.name} — ${inr(r.fee)}/month` }))} />
            <Pick label="Boarding stop" value={form.stop} onChange={(v) => setForm({ ...form, stop: v })}
              options={stopList(selectedRoute).length ? stopList(selectedRoute) : ["—"]} />
            <Text label="From date" type="date" value={form.from_date} onChange={(v) => setForm({ ...form, from_date: v })} />
          </div>
          {selectedRoute && (
            <p className="hint" style={{ marginTop: 12 }}>
              <Bus size={12} style={{ verticalAlign: -2 }} /> {selectedRoute.vehicle_no} · Driver {selectedRoute.driver}
              {selectedRoute.driver_phone ? ` (${selectedRoute.driver_phone})` : ""}
            </p>
          )}
          <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
            <button className="btn" onClick={save}><Save size={14} /> Save allotment</button>
          </div>
        </Modal>
      )}
    </>
  );
}
