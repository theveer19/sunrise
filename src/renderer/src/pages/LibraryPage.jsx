import React, { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, Save, BookOpen, Undo2, AlertTriangle } from "lucide-react";
import {
  BOOK_CATEGORIES, today, fmtDate, addDays, daysBetween, inr
} from "../lib/helpers";
import {
  Panel, Modal, Text, Pick, Area, Empty, Tabs, SearchBox, DataTable, Pill, Stat, useToast, useConfirm
} from "../lib/ui.jsx";

const FINE_PER_DAY = 2;

export default function LibraryPage(props) {
  const [tab, setTab] = useState("catalogue");
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);

  const load = async () => {
    const [b, i] = await Promise.all([window.api.library.books(), window.api.library.issues()]);
    setBooks(b); setIssues(i);
  };
  useEffect(() => { load(); }, []);

  const shared = { ...props, books, issues, reloadLib: load };

  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[
        ["catalogue", "Book catalogue"],
        ["issue", "Issue & return"],
        ["overdue", "Overdue"],
      ]} />
      {tab === "catalogue" && <Catalogue {...shared} />}
      {tab === "issue" && <IssueReturn {...shared} />}
      {tab === "overdue" && <Overdue {...shared} />}
    </>
  );
}

const availableOf = (book, issues) =>
  Number(book.copies || 0) - issues.filter((i) => i.book_id === book.id && !i.return_date).length;

/* ==================================================================== */
/*  Catalogue                                                           */
/* ==================================================================== */
function Catalogue({ books, issues, reloadLib }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [edit, setEdit] = useState(null);

  const blank = () => ({ code: "", title: "", author: "", publisher: "", category: "Textbook", copies: 1, added_on: today() });

  const rows = books.filter((b) => {
    if (cat !== "All" && b.category !== cat) return false;
    return [b.title, b.author, b.code, b.publisher].map((v) => v ?? "").join(" ")
      .toLowerCase().includes(q.trim().toLowerCase());
  });

  const save = async () => {
    if (!(edit.title || "").trim()) return toast.warn("Enter the book title.");
    if (!(Number(edit.copies) > 0)) return toast.warn("Number of copies must be at least 1.");
    await window.api.library.saveBook({ ...edit, copies: Number(edit.copies) });
    setEdit(null);
    await reloadLib();
    toast.ok("Book saved to the catalogue.");
  };
  const remove = async (b) => {
    const ok = await confirm({
      title: "Delete this book?", danger: true, confirmLabel: "Delete book",
      message: `“${b.title}” and its complete issue history will be removed.`
    });
    if (!ok) return;
    await window.api.library.removeBook(b.id);
    await reloadLib();
    toast.ok("Book removed.");
  };

  const totalCopies = books.reduce((a, b) => a + Number(b.copies || 0), 0);
  const out = issues.filter((i) => !i.return_date).length;

  return (
    <>
      <div className="stat-grid">
        <Stat label="Titles in catalogue" value={books.length} sub={`${totalCopies} copies in all`} tone="var(--teal)" />
        <Stat label="Currently issued" value={out} sub="not yet returned" tone="var(--amber)" />
        <Stat label="Available now" value={totalCopies - out} sub="on the shelf" tone="var(--ok)" />
      </div>

      <Panel title="Book catalogue" note={`${rows.length} title(s) shown`}
        action={<button className="btn" onClick={() => setEdit(blank())}><Plus size={14} /> Add book</button>}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <SearchBox value={q} onChange={setQ} placeholder="Search title, author, code or publisher" />
          <select className="inp" style={{ width: 190 }} value={cat} onChange={(e) => setCat(e.target.value)}>
            {["All", ...BOOK_CATEGORIES].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <DataTable exportName="Library-catalogue" rows={rows} empty="No books match this search."
          cols={[
            { key: "code", label: "Code" },
            { key: "title", label: "Title", render: (b) => <b>{b.title}</b> },
            { key: "author", label: "Author" },
            { key: "category", label: "Category" },
            { key: "copies", label: "Copies", align: "right" },
            {
              key: "available", label: "Available", align: "right",
              value: (b) => availableOf(b, issues),
              render: (b) => {
                const a = availableOf(b, issues);
                return <Pill tone={a > 0 ? "var(--ok)" : "var(--danger)"}>{a}</Pill>;
              }
            },
            {
              key: "act", label: "", sortable: false, csv: false, align: "right",
              render: (b) => (
                <span className="row-actions" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setEdit(b)}><Pencil size={12} /></button>
                  <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => remove(b)}><Trash2 size={12} /></button>
                </span>
              )
            },
          ]} />
      </Panel>

      {edit && (
        <Modal title={edit.id ? "Edit book" : "Add book to catalogue"} onClose={() => setEdit(null)}>
          <div className="grid-form">
            <Text label="Accession code" value={edit.code} onChange={(v) => setEdit({ ...edit, code: v })} placeholder="SMS-B011" />
            <Text label="Title" value={edit.title} onChange={(v) => setEdit({ ...edit, title: v })} />
            <Text label="Author" value={edit.author} onChange={(v) => setEdit({ ...edit, author: v })} />
            <Text label="Publisher" value={edit.publisher} onChange={(v) => setEdit({ ...edit, publisher: v })} />
            <Pick label="Category" value={edit.category} onChange={(v) => setEdit({ ...edit, category: v })} options={BOOK_CATEGORIES} />
            <Text label="Number of copies" type="number" min="1" value={edit.copies} onChange={(v) => setEdit({ ...edit, copies: v })} />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
            <button className="btn" onClick={save}><Save size={14} /> Save book</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ==================================================================== */
/*  Issue & return                                                      */
/* ==================================================================== */
function IssueReturn({ books, issues, reloadLib, students, staff }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState(null);

  const memberName = (i) => {
    const list = i.member_type === "staff" ? staff : students;
    const p = list.find((x) => x.id === Number(i.member_id));
    if (!p) return "(deleted record)";
    return i.member_type === "staff" ? `${p.name} (Staff)` : `${p.name} — ${p.class}-${p.section}`;
  };
  const bookTitle = (id) => books.find((b) => b.id === Number(id))?.title || "(deleted book)";

  const blank = () => ({
    book_id: books[0]?.id || "", member_type: "student",
    member_id: students.find((s) => s.status === "Active")?.id || "",
    issue_date: today(), due_date: addDays(today(), 14)
  });

  const issue = async () => {
    if (!form.book_id) return toast.warn("Choose a book.");
    if (!form.member_id) return toast.warn("Choose who the book is issued to.");
    const book = books.find((b) => b.id === Number(form.book_id));
    if (availableOf(book, issues) <= 0) return toast.error(`No copies of “${book.title}” are available right now.`);
    await window.api.library.issue(form);
    setForm(null);
    await reloadLib();
    toast.ok(`“${book.title}” issued — due back ${fmtDate(form.due_date)}.`);
  };

  const doReturn = async (i) => {
    const late = Math.max(0, daysBetween(i.due_date, today()));
    const fine = late * FINE_PER_DAY;
    const ok = await confirm({
      title: "Return this book?",
      message: late > 0
        ? `“${bookTitle(i.book_id)}” is ${late} day${late === 1 ? "" : "s"} overdue.\nA fine of ${inr(fine)} will be recorded (₹${FINE_PER_DAY} per day).`
        : `“${bookTitle(i.book_id)}” will be marked returned today. No fine is due.`,
      confirmLabel: "Mark returned"
    });
    if (!ok) return;
    await window.api.library.returnBook(i.id, today(), fine);
    await reloadLib();
    toast.ok(fine > 0 ? `Returned. Fine of ${inr(fine)} recorded.` : "Book returned.");
  };

  const activeStudents = students.filter((s) => s.status === "Active");
  const activeStaff = staff.filter((s) => s.status === "Active");
  const memberOptions = form?.member_type === "staff"
    ? activeStaff.map((s) => ({ value: String(s.id), label: `${s.name} — ${s.designation}` }))
    : activeStudents.map((s) => ({ value: String(s.id), label: `${s.name} — Class ${s.class}-${s.section}` }));

  return (
    <>
      <Panel title="Issue & return register" note={`${issues.filter((i) => !i.return_date).length} book(s) currently out`}
        action={<button className="btn" onClick={() => setForm(blank())} disabled={!books.length}>
          <BookOpen size={14} /> Issue a book
        </button>}>
        <DataTable exportName="Library-issues" rows={issues} empty="No books issued yet."
          cols={[
            { key: "book", label: "Book", value: (i) => bookTitle(i.book_id), render: (i) => <b>{bookTitle(i.book_id)}</b> },
            { key: "member", label: "Issued to", value: memberName },
            { key: "issue_date", label: "Issued", value: (i) => i.issue_date, render: (i) => fmtDate(i.issue_date) },
            { key: "due_date", label: "Due", value: (i) => i.due_date, render: (i) => fmtDate(i.due_date) },
            {
              key: "status", label: "Status",
              value: (i) => (i.return_date ? "Returned" : daysBetween(i.due_date, today()) > 0 ? "Overdue" : "Out"),
              render: (i) => {
                if (i.return_date) return <Pill tone="var(--ok)">Returned {fmtDate(i.return_date)}</Pill>;
                const late = daysBetween(i.due_date, today());
                return late > 0
                  ? <Pill tone="var(--danger)">{late} day{late === 1 ? "" : "s"} overdue</Pill>
                  : <Pill tone="var(--teal)">Out</Pill>;
              }
            },
            { key: "fine", label: "Fine", align: "right", value: (i) => Number(i.fine || 0), render: (i) => (Number(i.fine) ? inr(i.fine) : "—") },
            {
              key: "act", label: "", sortable: false, csv: false, align: "right",
              render: (i) => (i.return_date ? null : (
                <button className="btn btn-ghost btn-sm" onClick={() => doReturn(i)}><Undo2 size={12} /> Return</button>
              ))
            },
          ]} />
      </Panel>

      {form && (
        <Modal title="Issue a book" subtitle={`Fine after the due date is ₹${FINE_PER_DAY} per day`} onClose={() => setForm(null)}>
          <div className="grid-form">
            <Pick label="Book" value={String(form.book_id)} onChange={(v) => setForm({ ...form, book_id: v })}
              options={books.map((b) => ({
                value: String(b.id),
                label: `${b.title} (${availableOf(b, issues)} available)`
              }))} />
            <Pick label="Issue to" value={form.member_type}
              onChange={(v) => setForm({
                ...form, member_type: v,
                member_id: v === "staff" ? (activeStaff[0]?.id || "") : (activeStudents[0]?.id || "")
              })}
              options={[{ value: "student", label: "Student" }, { value: "staff", label: "Staff / teacher" }]} />
            <Pick label={form.member_type === "staff" ? "Staff member" : "Student"} value={String(form.member_id)}
              onChange={(v) => setForm({ ...form, member_id: v })} options={memberOptions} />
            <Text label="Issue date" type="date" value={form.issue_date}
              onChange={(v) => setForm({ ...form, issue_date: v, due_date: addDays(v, 14) })} />
            <Text label="Due date" type="date" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })}
              hint="Two weeks by default" />
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
            <button className="btn" onClick={issue}><BookOpen size={14} /> Issue book</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ==================================================================== */
/*  Overdue                                                             */
/* ==================================================================== */
function Overdue({ books, issues, students, staff }) {
  const rows = useMemo(() => issues
    .filter((i) => !i.return_date && daysBetween(i.due_date, today()) > 0)
    .map((i) => {
      const late = daysBetween(i.due_date, today());
      const list = i.member_type === "staff" ? staff : students;
      const p = list.find((x) => x.id === Number(i.member_id));
      return {
        ...i, late, fine: late * FINE_PER_DAY,
        title: books.find((b) => b.id === Number(i.book_id))?.title || "(deleted book)",
        member: p?.name || "(deleted record)",
        contact: p?.whatsapp || p?.phone || "",
        where: i.member_type === "staff" ? (p?.designation || "Staff") : p ? `Class ${p.class}-${p.section}` : "—"
      };
    })
    .sort((a, b) => b.late - a.late), [issues, books, students, staff]);

  const totalFine = rows.reduce((a, r) => a + r.fine, 0);

  return (
    <>
      <div className="stat-grid">
        <Stat label="Overdue books" value={rows.length} sub="past the due date" tone="var(--danger)" />
        <Stat label="Fine payable" value={inr(totalFine)} sub={`at ₹${FINE_PER_DAY} per day`} tone="var(--warn)" />
        <Stat label="Longest overdue" value={rows[0] ? `${rows[0].late} days` : "—"} sub={rows[0]?.member || "nothing overdue"} tone="var(--slate)" />
      </div>

      <Panel title="Overdue books" note="Chase these up — the contact number is the one on the student or staff record.">
        {rows.length === 0 ? (
          <Empty>Nothing is overdue right now. Every issued book is within its due date.</Empty>
        ) : (
          <DataTable exportName="Library-overdue" rows={rows} rowKey={(r) => r.id}
            cols={[
              { key: "title", label: "Book", render: (r) => <b>{r.title}</b> },
              { key: "member", label: "Issued to" },
              { key: "where", label: "Class / role" },
              { key: "due_date", label: "Was due", render: (r) => fmtDate(r.due_date) },
              {
                key: "late", label: "Overdue by", align: "right",
                render: (r) => <Pill tone="var(--danger)">{r.late} day{r.late === 1 ? "" : "s"}</Pill>
              },
              { key: "fine", label: "Fine", align: "right", render: (r) => inr(r.fine) },
              { key: "contact", label: "Contact" },
            ]} />
        )}
      </Panel>
    </>
  );
}
