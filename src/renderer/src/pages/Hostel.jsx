import React, { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Save, BedDouble, UserPlus, X } from "lucide-react";
import { HOSTEL_ROOM_TYPES, today, inr } from "../lib/helpers";
import {
  Panel, Modal, Text, Pick, Empty, Tabs, SearchBox, DataTable, Pill, Stat, useToast, useConfirm
} from "../lib/ui.jsx";

export default function Hostel(props) {
  const [tab, setTab] = useState("rooms");
  const [rooms, setRooms] = useState([]);
  const [allot, setAllot] = useState([]);

  const load = async () => {
    const [r, a] = await Promise.all([window.api.hostel.rooms(), window.api.hostel.allotments()]);
    setRooms(r); setAllot(a);
  };
  useEffect(() => { load(); }, []);

  const shared = { ...props, rooms, allot, reloadHs: load };
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[["rooms", "Rooms & blocks"], ["students", "Room allotment"]]} />
      {tab === "rooms" ? <Rooms {...shared} /> : <Allotment {...shared} />}
    </>
  );
}

/* ==================================================================== */
/*  Rooms                                                               */
/* ==================================================================== */
function Rooms({ rooms, allot, reloadHs }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [edit, setEdit] = useState(null);

  const blank = () => ({ block: "Boys Block A", room_no: "", type: "4-Seater", capacity: 4, fee: 3500 });
  const occupancy = (id) => allot.filter((a) => a.room_id === id).length;

  const save = async () => {
    if (!(edit.room_no || "").trim()) return toast.warn("Enter the room number.");
    if (!(Number(edit.capacity) > 0)) return toast.warn("Capacity must be at least 1.");
    const taken = occupancy(edit.id);
    if (edit.id && Number(edit.capacity) < taken) {
      return toast.error(`${taken} student${taken === 1 ? " is" : "s are"} already in this room — capacity cannot be less than that.`);
    }
    await window.api.hostel.saveRoom({ ...edit, capacity: Number(edit.capacity), fee: Number(edit.fee) || 0 });
    setEdit(null); await reloadHs();
    toast.ok("Room saved.");
  };

  const remove = async (r) => {
    const n = occupancy(r.id);
    const ok = await confirm({
      title: "Delete this room?", danger: true, confirmLabel: "Delete room",
      message: n ? `Room ${r.room_no} has ${n} student${n === 1 ? "" : "s"} in it. They will lose their room allotment.`
        : `Room ${r.room_no} in ${r.block} will be removed.`
    });
    if (!ok) return;
    await window.api.hostel.removeRoom(r.id);
    await reloadHs();
    toast.ok("Room removed.");
  };

  const beds = rooms.reduce((a, r) => a + Number(r.capacity || 0), 0);
  const monthly = allot.reduce((a, x) => a + (Number(rooms.find((r) => r.id === x.room_id)?.fee) || 0), 0);

  return (
    <>
      <div className="stat-grid">
        <Stat label="Rooms" value={rooms.length} sub={`${beds} beds in all`} tone="var(--teal)" />
        <Stat label="Beds occupied" value={allot.length} sub={`${beds - allot.length} free`} tone="var(--sun)" />
        <Stat label="Occupancy" value={`${beds ? Math.round((allot.length / beds) * 100) : 0}%`} sub="of total beds" tone="var(--amber)" />
        <Stat label="Monthly hostel fee" value={inr(monthly)} sub="at current occupancy" tone="var(--ok)" />
      </div>

      <Panel title="Hostel rooms" note={`${rooms.length} room(s)`}
        action={<button className="btn" onClick={() => setEdit(blank())}><Plus size={14} /> Add room</button>}>
        <DataTable exportName="Hostel-rooms" rows={rooms} empty="No hostel rooms added yet."
          cols={[
            { key: "block", label: "Block" },
            { key: "room_no", label: "Room", render: (r) => <b>{r.room_no}</b> },
            { key: "type", label: "Type" },
            { key: "capacity", label: "Beds", align: "right" },
            {
              key: "occupied", label: "Occupied", align: "right", value: (r) => occupancy(r.id),
              render: (r) => {
                const o = occupancy(r.id);
                const full = o >= Number(r.capacity);
                return <Pill tone={full ? "var(--danger)" : o ? "var(--warn)" : "var(--ok)"}>
                  {o} / {r.capacity}{full ? " · full" : ""}
                </Pill>;
              }
            },
            { key: "fee", label: "Monthly fee", align: "right", value: (r) => Number(r.fee || 0), render: (r) => inr(r.fee) },
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
        <Modal title={edit.id ? "Edit room" : "Add a room"} onClose={() => setEdit(null)}>
          <div className="grid-form">
            <Text label="Block" value={edit.block} onChange={(v) => setEdit({ ...edit, block: v })}
              placeholder="Boys Block A" />
            <Text label="Room number" value={edit.room_no} onChange={(v) => setEdit({ ...edit, room_no: v })} />
            <Pick label="Room type" value={edit.type}
              onChange={(v) => {
                const cap = { "Single": 1, "2-Seater": 2, "3-Seater": 3, "4-Seater": 4, "Dormitory": 8 }[v] ?? edit.capacity;
                setEdit({ ...edit, type: v, capacity: cap });
              }} options={HOSTEL_ROOM_TYPES} />
            <Text label="Capacity (beds)" type="number" min="1" value={edit.capacity} onChange={(v) => setEdit({ ...edit, capacity: v })} />
            <Text label="Monthly fee" type="number" value={edit.fee} onChange={(v) => setEdit({ ...edit, fee: v })} />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
            <button className="btn" onClick={save}><Save size={14} /> Save room</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ==================================================================== */
/*  Room allotment                                                      */
/* ==================================================================== */
function Allotment({ students, rooms, allot, reloadHs }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState(null);

  const byStudent = useMemo(() => Object.fromEntries(allot.map((a) => [a.student_id, a])), [allot]);
  const active = students.filter((s) => s.status === "Active");
  const roomOf = (s) => rooms.find((r) => r.id === byStudent[s.id]?.room_id);
  const occupancy = (id) => allot.filter((a) => a.room_id === id).length;

  const rows = active.filter((s) => {
    const a = byStudent[s.id];
    if (filter === "In hostel" && !a) return false;
    if (filter === "Day scholars" && a) return false;
    if (!["All", "In hostel", "Day scholars"].includes(filter) && roomOf(s)?.block !== filter) return false;
    return [s.name, s.adm_no, s.father].map((v) => v ?? "").join(" ").toLowerCase().includes(q.trim().toLowerCase());
  });

  const openForm = (s) => {
    const a = byStudent[s.id];
    setForm({ student: s, student_id: s.id, room_id: String(a?.room_id || rooms[0]?.id || ""), from_date: a?.from_date || today() });
  };

  const save = async () => {
    if (!form.room_id) return toast.warn("Choose a room.");
    const res = await window.api.hostel.allot(form);
    if (res && res.ok === false) return toast.error(res.error);
    setForm(null); await reloadHs();
    toast.ok(`${form.student.name} allotted a bed.`);
  };

  const unallot = async (s) => {
    const ok = await confirm({
      title: "Vacate the room?", confirmLabel: "Vacate",
      message: `${s.name} will be marked a day scholar and the bed becomes free.`
    });
    if (!ok) return;
    await window.api.hostel.unallot(s.id);
    await reloadHs();
    toast.ok("Room vacated.");
  };

  const blocks = [...new Set(rooms.map((r) => r.block))];

  return (
    <>
      <Panel title="Room allotment" note={`${allot.length} of ${active.length} students live in the hostel`}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <SearchBox value={q} onChange={setQ} placeholder="Search student, admission no. or father" />
          <select className="inp" style={{ width: 200 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["All", "In hostel", "Day scholars", ...blocks].map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
      </Panel>

      <Panel title={`${rows.length} student(s)`}>
        <DataTable exportName="Hostel-allotment" rows={rows} empty="No students match this filter."
          cols={[
            { key: "adm_no", label: "Adm. No." },
            { key: "name", label: "Student", render: (s) => <b>{s.name}</b> },
            { key: "class", label: "Class", value: (s) => `${s.class}-${s.section}` },
            { key: "gender", label: "Gender" },
            {
              key: "room", label: "Room", value: (s) => (roomOf(s) ? `${roomOf(s).block} · ${roomOf(s).room_no}` : "—"),
              render: (s) => {
                const r = roomOf(s);
                return r ? <Pill tone="var(--teal)">{r.block} · {r.room_no}</Pill>
                  : <span style={{ color: "var(--slate)" }}>Day scholar</span>;
              }
            },
            {
              key: "fee", label: "Monthly fee", align: "right",
              value: (s) => Number(roomOf(s)?.fee || 0), render: (s) => (roomOf(s) ? inr(roomOf(s).fee) : "—")
            },
            {
              key: "act", label: "", sortable: false, csv: false, align: "right",
              render: (s) => (
                <span className="row-actions" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openForm(s)} disabled={!rooms.length}>
                    <UserPlus size={12} /> {byStudent[s.id] ? "Change" : "Allot"}
                  </button>
                  {byStudent[s.id] && (
                    <button className="btn btn-ghost btn-sm" title="Vacate room" onClick={() => unallot(s)}><X size={12} /></button>
                  )}
                </span>
              )
            },
          ]} />
      </Panel>

      {form && (
        <Modal title={`Hostel room — ${form.student.name}`}
          subtitle={`Class ${form.student.class}-${form.student.section} · ${form.student.gender}`}
          onClose={() => setForm(null)}>
          <div className="grid-form">
            <Pick label="Room" value={form.room_id} onChange={(v) => setForm({ ...form, room_id: v })}
              options={rooms.map((r) => {
                const o = occupancy(r.id);
                const full = o >= Number(r.capacity) && Number(byStudent[form.student_id]?.room_id) !== r.id;
                return { value: String(r.id), label: `${r.block} · Room ${r.room_no} — ${o}/${r.capacity}${full ? " (full)" : ""}` };
              })} />
            <Text label="From date" type="date" value={form.from_date} onChange={(v) => setForm({ ...form, from_date: v })} />
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            <BedDouble size={12} style={{ verticalAlign: -2 }} /> A room that is already full will be refused when you save.
          </p>
          <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
            <button className="btn" onClick={save}><Save size={14} /> Save allotment</button>
          </div>
        </Modal>
      )}
    </>
  );
}
