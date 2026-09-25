import React, { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Save, Megaphone, Printer, CalendarDays, BookMarked } from "lucide-react";
import {
  CLASSES, SECTIONS, SUBJECTS, NOTICE_AUDIENCE, EVENT_TYPES, today, addDays,
  fmtDate, dayName, daysBetween
} from "../lib/helpers";
import {
  Panel, Modal, Text, Pick, Area, Empty, Tabs, SearchBox, DataTable, Pill, Stat, useToast, useConfirm
} from "../lib/ui.jsx";
import { noticeHtml } from "../lib/templates";

export default function Communication(props) {
  const [tab, setTab] = useState("notices");
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[
        ["notices", "Notice board"],
        ["homework", "Homework"],
        ["events", "Events calendar"],
      ]} />
      {tab === "notices" && <Notices {...props} />}
      {tab === "homework" && <Homework {...props} />}
      {tab === "events" && <Events {...props} />}
    </>
  );
}

/* ==================================================================== */
/*  Notice board                                                        */
/* ==================================================================== */
function Notices({ school, openDoc }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState("");

  const load = async () => setRows(await window.api.comms.notices());
  useEffect(() => { load(); }, []);

  const blank = () => ({
    date: today(), title: "", body: "", audience: "All", priority: "Normal", expires: addDays(today(), 30)
  });

  const save = async () => {
    if (!(edit.title || "").trim()) return toast.warn("Enter the notice title.");
    if (!(edit.body || "").trim()) return toast.warn("Write the notice text.");
    await window.api.comms.saveNotice(edit);
    setEdit(null); await load();
    toast.ok("Notice published to the board.");
  };
  const remove = async (n) => {
    const ok = await confirm({ title: "Delete this notice?", message: `“${n.title}” will be removed.`, danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    await window.api.comms.removeNotice(n.id);
    await load();
    toast.ok("Notice deleted.");
  };

  const shown = rows.filter((n) => (n.title + " " + n.body).toLowerCase().includes(q.trim().toLowerCase()));
  const live = rows.filter((n) => !n.expires || daysBetween(today(), n.expires) >= 0).length;

  return (
    <>
      <div className="stat-grid">
        <Stat label="Notices on the board" value={live} sub={`${rows.length} in all`} tone="var(--teal)" />
        <Stat label="High priority" value={rows.filter((n) => n.priority === "High").length} sub="marked urgent" tone="var(--danger)" />
        <Stat label="Latest notice" value={rows[0] ? fmtDate(rows[0].date) : "—"} sub={rows[0]?.title?.slice(0, 28) || "nothing yet"} tone="var(--amber)" />
      </div>

      <Panel title="Notice board" note="Notices shown here are what the office pins up and sends to parents."
        action={<button className="btn" onClick={() => setEdit(blank())}><Plus size={14} /> New notice</button>}>
        <SearchBox value={q} onChange={setQ} placeholder="Search notices" />
      </Panel>

      {shown.length === 0 ? <Panel><Empty>No notices match this search.</Empty></Panel> : shown.map((n) => {
        const expired = n.expires && daysBetween(today(), n.expires) < 0;
        return (
          <div key={n.id} className={"notice" + (n.priority === "High" ? " high" : "")} style={expired ? { opacity: .6 } : undefined}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <h4 className="serif">{n.title}</h4>
                <div className="n-meta">
                  <span>{dayName(n.date)}, {fmtDate(n.date)}</span>
                  <span>·</span>
                  <span>{n.audience}</span>
                  {n.priority === "High" && <Pill tone="var(--danger)">High priority</Pill>}
                  {expired && <Pill tone="var(--slate)">Expired</Pill>}
                </div>
              </div>
              <span className="row-actions">
                <button className="btn btn-ghost btn-sm" title="Print notice"
                  onClick={() => openDoc(noticeHtml(school, n), `Notice-${n.title.slice(0, 24)}.pdf`)}>
                  <Printer size={12} />
                </button>
                <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setEdit(n)}><Pencil size={12} /></button>
                <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => remove(n)}><Trash2 size={12} /></button>
              </span>
            </div>
            <p>{n.body}</p>
          </div>
        );
      })}

      {edit && (
        <Modal wide title={edit.id ? "Edit notice" : "New notice"} onClose={() => setEdit(null)}>
          <div className="grid-form">
            <Text label="Title" value={edit.title} onChange={(v) => setEdit({ ...edit, title: v })}
              placeholder="Parent-Teacher Meeting on Saturday" />
            <Text label="Date" type="date" value={edit.date} onChange={(v) => setEdit({ ...edit, date: v })} />
            <Pick label="Audience" value={edit.audience} onChange={(v) => setEdit({ ...edit, audience: v })} options={NOTICE_AUDIENCE} />
            <Pick label="Priority" value={edit.priority} onChange={(v) => setEdit({ ...edit, priority: v })} options={["Normal", "High"]} />
            <Text label="Show until" type="date" value={edit.expires} onChange={(v) => setEdit({ ...edit, expires: v })}
              hint="After this date the notice is greyed out" />
          </div>
          <div style={{ marginTop: 12 }}>
            <Area label="Notice text" rows={6} value={edit.body} onChange={(v) => setEdit({ ...edit, body: v })} />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
            <button className="btn" onClick={save}><Megaphone size={14} /> Publish notice</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ==================================================================== */
/*  Homework                                                            */
/* ==================================================================== */
function Homework({ students, staff }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);
  const [cls, setCls] = useState("All");

  const load = async () => setRows(await window.api.comms.homework());
  useEffect(() => { load(); }, []);

  const blank = () => ({
    date: today(), class: "8", section: "A", subject: "Mathematics", title: "", details: "",
    due_date: addDays(today(), 2), staff_id: staff[0]?.id || ""
  });

  const save = async () => {
    if (!(edit.title || "").trim()) return toast.warn("Enter what the homework is.");
    await window.api.comms.saveHomework(edit);
    setEdit(null); await load();
    toast.ok("Homework saved.");
  };
  const remove = async (h) => {
    const ok = await confirm({ title: "Delete this homework?", message: `“${h.title}” will be removed.`, danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    await window.api.comms.removeHomework(h.id);
    await load();
    toast.ok("Homework deleted.");
  };

  const shown = cls === "All" ? rows : rows.filter((h) => h.class === cls);
  const classList = CLASSES.filter((c) => students.some((s) => s.status === "Active" && s.class === c));
  const teacherName = (id) => staff.find((s) => s.id === Number(id))?.name || "—";
  const dueToday = rows.filter((h) => h.due_date === today()).length;

  return (
    <>
      <div className="stat-grid">
        <Stat label="Homework entries" value={rows.length} sub="across all classes" tone="var(--teal)" />
        <Stat label="Due today" value={dueToday} sub="to be collected" tone="var(--sun)" />
        <Stat label="Given this week" value={rows.filter((h) => daysBetween(h.date, today()) <= 7 && daysBetween(h.date, today()) >= 0).length}
          sub="last 7 days" tone="var(--amber)" />
      </div>

      <Panel title="Class homework" note="What was given, by whom, and when it is due back."
        action={<button className="btn" onClick={() => setEdit(blank())}><Plus size={14} /> Add homework</button>}>
        <div style={{ width: 170 }}>
          <Pick label="Class filter" value={cls} onChange={setCls} options={["All", ...classList]} />
        </div>
      </Panel>

      <Panel title={`${shown.length} entr${shown.length === 1 ? "y" : "ies"}`}>
        <DataTable exportName="Homework" rows={shown} empty="No homework recorded for this class yet."
          cols={[
            { key: "date", label: "Given", render: (h) => fmtDate(h.date) },
            { key: "class", label: "Class", value: (h) => `${h.class}-${h.section}` },
            { key: "subject", label: "Subject" },
            {
              key: "title", label: "Homework",
              render: (h) => (
                <span>
                  <b>{h.title}</b>
                  {h.details && <span style={{ display: "block", fontSize: 11, color: "var(--slate)", marginTop: 2 }}>{h.details}</span>}
                </span>
              )
            },
            { key: "staff", label: "Teacher", value: (h) => teacherName(h.staff_id) },
            {
              key: "due_date", label: "Due",
              render: (h) => {
                const left = daysBetween(today(), h.due_date);
                const tone = left < 0 ? "var(--slate)" : left === 0 ? "var(--danger)" : "var(--teal)";
                return <Pill tone={tone}>{left === 0 ? "Due today" : left < 0 ? fmtDate(h.due_date) : `in ${left} day${left === 1 ? "" : "s"}`}</Pill>;
              }
            },
            {
              key: "act", label: "", sortable: false, csv: false, align: "right",
              render: (h) => (
                <span className="row-actions" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEdit(h)}><Pencil size={12} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(h)}><Trash2 size={12} /></button>
                </span>
              )
            },
          ]} />
      </Panel>

      {edit && (
        <Modal wide title={edit.id ? "Edit homework" : "Add homework"} onClose={() => setEdit(null)}>
          <div className="grid-form">
            <Pick label="Class" value={edit.class} onChange={(v) => setEdit({ ...edit, class: v })} options={CLASSES} />
            <Pick label="Section" value={edit.section} onChange={(v) => setEdit({ ...edit, section: v })} options={SECTIONS} />
            <Pick label="Subject" value={edit.subject} onChange={(v) => setEdit({ ...edit, subject: v })} options={SUBJECTS} />
            <Pick label="Given by" value={String(edit.staff_id ?? "")} onChange={(v) => setEdit({ ...edit, staff_id: v })}
              options={[{ value: "", label: "— none —" }, ...staff.filter((s) => s.status === "Active")
                .map((s) => ({ value: String(s.id), label: s.name }))]} />
            <Text label="Given on" type="date" value={edit.date} onChange={(v) => setEdit({ ...edit, date: v })} />
            <Text label="Due date" type="date" value={edit.due_date} onChange={(v) => setEdit({ ...edit, due_date: v })} />
          </div>
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <Text label="Homework" value={edit.title} onChange={(v) => setEdit({ ...edit, title: v })}
              placeholder="Exercise 8.2 — Linear Equations" />
            <Area label="Details" rows={3} value={edit.details} onChange={(v) => setEdit({ ...edit, details: v })}
              placeholder="Solve questions 1 to 12 in the classwork notebook." />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
            <button className="btn" onClick={save}><BookMarked size={14} /> Save homework</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ==================================================================== */
/*  Events calendar                                                     */
/* ==================================================================== */
function Events() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);

  const load = async () => setRows(await window.api.comms.events());
  useEffect(() => { load(); }, []);

  const blank = () => ({ date: today(), end_date: "", title: "", type: "Function", venue: "", description: "" });

  const save = async () => {
    if (!(edit.title || "").trim()) return toast.warn("Enter the event name.");
    if (edit.end_date && daysBetween(edit.date, edit.end_date) < 0) return toast.warn("The end date cannot be before the start date.");
    await window.api.comms.saveEvent(edit);
    setEdit(null); await load();
    toast.ok("Event added to the calendar.");
  };
  const remove = async (e) => {
    const ok = await confirm({ title: "Delete this event?", message: `“${e.title}” will be removed from the calendar.`, danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    await window.api.comms.removeEvent(e.id);
    await load();
    toast.ok("Event deleted.");
  };

  const upcoming = rows.filter((e) => daysBetween(today(), e.end_date || e.date) >= 0);
  const past = rows.filter((e) => daysBetween(today(), e.end_date || e.date) < 0).reverse();
  const next = upcoming[0];

  const typeTone = (t) => ({
    Holiday: "var(--teal)", Examination: "var(--danger)", Function: "var(--sun)",
    Sports: "var(--amber)", PTM: "var(--warn)", Trip: "var(--ok)"
  }[t] || "var(--slate)");

  const Item = ({ e, past: isPast }) => {
    const away = daysBetween(today(), e.date);
    return (
      <div className={"tl-item" + (isPast ? " past" : "")}>
        <div className="tl-date">
          {fmtDate(e.date)}{e.end_date ? ` – ${fmtDate(e.end_date)}` : ""}
          {!isPast && away >= 0 && <> · {away === 0 ? "today" : `in ${away} day${away === 1 ? "" : "s"}`}</>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div className="tl-title">{e.title} <Pill tone={typeTone(e.type)}>{e.type}</Pill></div>
            <div className="tl-desc">{e.venue ? `${e.venue} — ` : ""}{e.description}</div>
          </div>
          <span className="row-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setEdit(e)}><Pencil size={12} /></button>
            <button className="btn btn-ghost btn-sm" onClick={() => remove(e)}><Trash2 size={12} /></button>
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="stat-grid">
        <Stat label="Upcoming events" value={upcoming.length} sub="still to come" tone="var(--sun)" />
        <Stat label="Next event" value={next ? fmtDate(next.date) : "—"} sub={next?.title?.slice(0, 26) || "nothing scheduled"} tone="var(--teal)" />
        <Stat label="Events this session" value={rows.length} sub="whole calendar" tone="var(--amber)" />
      </div>

      <Panel title="Academic calendar" note="Holidays, examinations, functions and meetings for the session."
        action={<button className="btn" onClick={() => setEdit(blank())}><Plus size={14} /> Add event</button>}>
        {rows.length === 0 ? <Empty>No events in the calendar yet.</Empty> : (
          <div className="col2">
            <div>
              <p className="eyebrow" style={{ marginTop: 0 }}>Upcoming</p>
              {upcoming.length === 0 ? <Empty icon={false}>Nothing scheduled ahead.</Empty> : (
                <div className="timeline">{upcoming.map((e) => <Item key={e.id} e={e} />)}</div>
              )}
            </div>
            <div>
              <p className="eyebrow" style={{ marginTop: 0 }}>Already held</p>
              {past.length === 0 ? <Empty icon={false}>Nothing in the past yet.</Empty> : (
                <div className="timeline">{past.map((e) => <Item key={e.id} e={e} past />)}</div>
              )}
            </div>
          </div>
        )}
      </Panel>

      {edit && (
        <Modal title={edit.id ? "Edit event" : "Add event"} onClose={() => setEdit(null)}>
          <div className="grid-form">
            <Text label="Event name" value={edit.title} onChange={(v) => setEdit({ ...edit, title: v })} />
            <Pick label="Type" value={edit.type} onChange={(v) => setEdit({ ...edit, type: v })} options={EVENT_TYPES} />
            <Text label="Start date" type="date" value={edit.date} onChange={(v) => setEdit({ ...edit, date: v })} />
            <Text label="End date" type="date" value={edit.end_date} onChange={(v) => setEdit({ ...edit, end_date: v })}
              hint="Leave blank for a single-day event" />
            <Text label="Venue" value={edit.venue} onChange={(v) => setEdit({ ...edit, venue: v })} placeholder="School Hall" />
          </div>
          <div style={{ marginTop: 12 }}>
            <Area label="Description" rows={3} value={edit.description} onChange={(v) => setEdit({ ...edit, description: v })} />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
            <button className="btn" onClick={save}><CalendarDays size={14} /> Save event</button>
          </div>
        </Modal>
      )}
    </>
  );
}
