import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";
import fs from "fs";

let db;

/* ---- open / migrate ------------------------------------------------ */
export function initDB() {
  const dir = app.getPath("userData");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "sunrise-erp.db");
  db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    adm_no TEXT, pen_no TEXT, samagra_no TEXT, aadhar_no TEXT, exam_no TEXT, app_id TEXT,
    name TEXT NOT NULL, father TEXT, mother TEXT,
    dob TEXT, doa TEXT, class TEXT, section TEXT, roll TEXT,
    gender TEXT, category TEXT, religion TEXT, nationality TEXT,
    phone TEXT, whatsapp TEXT, address TEXT, prev_school TEXT,
    blood_group TEXT, status TEXT DEFAULT 'Active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_id TEXT, name TEXT NOT NULL, guardian TEXT, gender TEXT,
    designation TEXT, department TEXT, qualification TEXT, subject TEXT,
    doj TEXT, dol TEXT, dob TEXT, aadhar_no TEXT,
    phone TEXT, whatsapp TEXT, email TEXT, address TEXT,
    salary REAL, status TEXT DEFAULT 'Active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, term TEXT, class TEXT, section TEXT,
    max_marks INTEGER DEFAULT 100, pass_marks INTEGER DEFAULT 33,
    exam_date TEXT, subjects TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL, student_id INTEGER NOT NULL,
    subject TEXT NOT NULL, marks REAL,
    UNIQUE(exam_id, student_id, subject),
    FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL, receipt_no TEXT,
    head TEXT, amount REAL, mode TEXT, months TEXT,
    date TEXT, remark TEXT,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT, category TEXT, description TEXT,
    amount REAL, paid_to TEXT, mode TEXT
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, student_id INTEGER, number TEXT, date TEXT, meta TEXT,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS fee_structure (
    class TEXT PRIMARY KEY, amount REAL
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, student_id INTEGER NOT NULL, status TEXT, remark TEXT,
    UNIQUE(date, student_id),
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS staff_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, staff_id INTEGER NOT NULL, status TEXT,
    UNIQUE(date, staff_id),
    FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class TEXT, section TEXT, day TEXT, period INTEGER, subject TEXT,
    staff_id INTEGER, room TEXT,
    UNIQUE(class, section, day, period)
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT, title TEXT NOT NULL, author TEXT, publisher TEXT,
    category TEXT, copies INTEGER DEFAULT 1, added_on TEXT
  );

  CREATE TABLE IF NOT EXISTS book_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL, member_type TEXT, member_id INTEGER,
    issue_date TEXT, due_date TEXT, return_date TEXT, fine REAL DEFAULT 0,
    FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, vehicle_no TEXT, driver TEXT, driver_phone TEXT,
    fee REAL DEFAULT 0, stops TEXT
  );

  CREATE TABLE IF NOT EXISTS transport_allot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL UNIQUE, route_id INTEGER, stop TEXT, from_date TEXT,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(route_id) REFERENCES routes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block TEXT, room_no TEXT, type TEXT, capacity INTEGER DEFAULT 1, fee REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS hostel_allot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL UNIQUE, room_id INTEGER, from_date TEXT,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT, title TEXT NOT NULL, body TEXT, audience TEXT, priority TEXT, expires TEXT
  );

  CREATE TABLE IF NOT EXISTS homework (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT, class TEXT, section TEXT, subject TEXT, title TEXT,
    details TEXT, due_date TEXT, staff_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT, end_date TEXT, title TEXT NOT NULL, type TEXT, venue TEXT, description TEXT
  );

  CREATE TABLE IF NOT EXISTS payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL, month TEXT, basic REAL, allowances REAL,
    deductions REAL, lop_days REAL, net REAL, paid_date TEXT, mode TEXT, remark TEXT,
    UNIQUE(staff_id, month),
    FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE
  );
  `);

  migrate();
  seedIfEmpty();
  return db;
}

/* ---- migrations (safe for existing databases) ---------------------- */
function migrate() {
  const cols = db.prepare("PRAGMA table_info(students)").all().map((c) => c.name);
  if (!cols.includes("exam_no")) db.exec("ALTER TABLE students ADD COLUMN exam_no TEXT");
  if (!cols.includes("app_id")) db.exec("ALTER TABLE students ADD COLUMN app_id TEXT");
  if (!cols.includes("password")) db.exec("ALTER TABLE students ADD COLUMN password TEXT");
}

/* ---- seed ---------------------------------------------------------- */
function seedIfEmpty() {
  const row = db.prepare("SELECT COUNT(*) c FROM settings").get();
  if (row.c === 0) {
    const school = {
      name: "Sunrise Montessori School",
      line2: "English Medium · Pre-Primary to Senior Secondary",
      address: "Vinay Nagar, Gwalior, Madhya Pradesh 474012",
      affiliation: "MP/2021/00847",
      udise: "23110200781",
      board: "Madhya Pradesh Board of Secondary Education",
      session: "2026-27",
      principal: "Mrs. Kavita Deshmukh",
      phone: "0751-4001234",
      email: "office@sunrisemontessori.edu.in",
      initials: "SMS",
      counters: { receipt: 1001, tc: 101 }
    };
    db.prepare("INSERT INTO settings (id,data) VALUES (1,?)").run(JSON.stringify(school));
  }

  if (db.prepare("SELECT COUNT(*) c FROM fee_structure").get().c === 0) {
    const fee = { Nursery: 900, LKG: 950, UKG: 950, "1": 1100, "2": 1100, "3": 1200, "4": 1200, "5": 1300, "6": 1450, "7": 1450, "8": 1600, "9": 1850, "10": 1950, "11": 2200, "12": 2300 };
    const ins = db.prepare("INSERT INTO fee_structure (class,amount) VALUES (?,?)");
    Object.entries(fee).forEach(([c, a]) => ins.run(c, a));
  }

  if (db.prepare("SELECT COUNT(*) c FROM students").get().c === 0) {
    const ins = db.prepare(`INSERT INTO students
      (adm_no,pen_no,samagra_no,aadhar_no,name,father,mother,dob,doa,class,section,roll,gender,category,religion,nationality,phone,whatsapp,address,prev_school,blood_group,status)
      VALUES (@adm_no,@pen_no,@samagra_no,@aadhar_no,@name,@father,@mother,@dob,@doa,@class,@section,@roll,@gender,@category,@religion,@nationality,@phone,@whatsapp,@address,@prev_school,@blood_group,@status)`);
    const S = (o) => ins.run({
      adm_no: "", pen_no: "", samagra_no: "", aadhar_no: "", name: "", father: "", mother: "",
      dob: "", doa: "2026-04-02", class: "8", section: "A", roll: "", gender: "Male",
      category: "General", religion: "Hindu", nationality: "Indian", phone: "", whatsapp: "",
      address: "", prev_school: "", blood_group: "", status: "Active", ...o
    });
    S({ adm_no: "2020/0142", pen_no: "PEN23110045", samagra_no: "142556789012", aadhar_no: "5623 8890 1122", name: "Aarav Sharma", father: "Rajesh Sharma", mother: "Sunita Sharma", dob: "2012-04-18", class: "8", section: "A", roll: "1", phone: "9826012345", whatsapp: "9826012345", address: "12, Gandhi Nagar, Gwalior" });
    S({ adm_no: "2020/0155", pen_no: "PEN23110061", samagra_no: "142556783341", aadhar_no: "7781 2233 4455", name: "Diya Verma", father: "Manoj Verma", mother: "Rekha Verma", dob: "2012-09-05", class: "8", section: "A", roll: "2", gender: "Female", phone: "9425098761", whatsapp: "9425098761", address: "44, Kampoo, Gwalior" });
    S({ adm_no: "2019/0098", pen_no: "PEN23110018", samagra_no: "142556770021", aadhar_no: "3390 1122 8876", name: "Isha Yadav", father: "Ramesh Yadav", mother: "Kavita Yadav", dob: "2010-02-11", class: "10", section: "A", roll: "3", gender: "Female", category: "OBC", phone: "9977512340", whatsapp: "9977512340", address: "23, Lashkar, Gwalior" });
    S({ adm_no: "2022/0201", pen_no: "PEN23110090", samagra_no: "142556799910", aadhar_no: "1120 5566 3300", name: "Vihaan Gupta", father: "Sanjay Gupta", mother: "Meena Gupta", dob: "2014-07-30", class: "6", section: "A", roll: "11", phone: "9993301122", whatsapp: "9993301122", address: "5, City Centre, Gwalior" });
  }
}

/* ---- settings ------------------------------------------------------ */
export const getSettings = () => JSON.parse(db.prepare("SELECT data FROM settings WHERE id=1").get().data);
const DEFAULT_COUNTERS = { receipt: 1001, tc: 101 };
const writeSettings = (s) => { db.prepare("UPDATE settings SET data=? WHERE id=1").run(JSON.stringify(s)); return s; };
// Counters (receipt / TC numbers) are owned by the database. The Settings screen sends back the
// copy it loaded at startup, so never let that stale copy roll the counters back (duplicate numbers).
export const saveSettings = (s) => writeSettings({ ...s, counters: { ...DEFAULT_COUNTERS, ...(getSettings().counters || {}) } });
function bumpCounter(kind) {
  const s = getSettings();
  s.counters = { ...DEFAULT_COUNTERS, ...(s.counters || {}) };
  const n = Number(s.counters[kind]) || DEFAULT_COUNTERS[kind];
  s.counters[kind] = n + 1;
  writeSettings(s);
  return n;
}

/* ---- students ------------------------------------------------------ */
/* Nursery, LKG, UKG, 1 … 12 — so "10" does not sort before "6" */
const CLASS_SEQ = ",Nursery,LKG,UKG,1,2,3,4,5,6,7,8,9,10,11,12,";
export const listStudents = () => db.prepare(
  `SELECT * FROM students
   ORDER BY CASE WHEN INSTR(?, ',' || class || ',') = 0 THEN 9999
                 ELSE INSTR(?, ',' || class || ',') END,
            section, CAST(roll AS INTEGER), name`).all(CLASS_SEQ, CLASS_SEQ);
export const getStudent = (id) => db.prepare("SELECT * FROM students WHERE id=?").get(id);
export function saveStudent(s) {
  const cols = ["adm_no", "pen_no", "samagra_no", "aadhar_no", "exam_no", "app_id", "name", "father", "mother", "dob", "doa", "class", "section", "roll", "gender", "category", "religion", "nationality", "phone", "whatsapp", "address", "prev_school", "blood_group", "status", "password"];
  if (s.id) {
    db.prepare(`UPDATE students SET ${cols.map((c) => `${c}=@${c}`).join(",")} WHERE id=@id`).run({ id: s.id, ...pick(s, cols) });
    return getStudent(s.id);
  }
  const info = db.prepare(`INSERT INTO students (${cols.join(",")}) VALUES (${cols.map((c) => "@" + c).join(",")})`).run(pick(s, cols));
  return getStudent(info.lastInsertRowid);
}
export const deleteStudent = (id) => db.prepare("DELETE FROM students WHERE id=?").run(id);
function pick(o, cols) { const r = {}; cols.forEach((c) => (r[c] = o[c] ?? "")); return r; }

/* ---- staff / teachers ---------------------------------------------- */
const STAFF_COLS = ["emp_id", "name", "guardian", "gender", "designation", "department", "qualification", "subject", "doj", "dol", "dob", "aadhar_no", "phone", "whatsapp", "email", "address", "salary", "status"];
export const listStaff = () => db.prepare("SELECT * FROM staff ORDER BY status, name").all();
export const getStaff = (id) => db.prepare("SELECT * FROM staff WHERE id=?").get(id);
export function saveStaff(s) {
  if (s.id) {
    db.prepare(`UPDATE staff SET ${STAFF_COLS.map((c) => `${c}=@${c}`).join(",")} WHERE id=@id`).run({ id: s.id, ...pick(s, STAFF_COLS) });
    return getStaff(s.id);
  }
  const info = db.prepare(`INSERT INTO staff (${STAFF_COLS.join(",")}) VALUES (${STAFF_COLS.map((c) => "@" + c).join(",")})`).run(pick(s, STAFF_COLS));
  return getStaff(info.lastInsertRowid);
}
export const deleteStaff = (id) => db.prepare("DELETE FROM staff WHERE id=?").run(id);

/* ---- exams & marks ------------------------------------------------- */
export const listExams = () => db.prepare("SELECT * FROM exams ORDER BY id DESC").all().map((e) => ({ ...e, subjects: JSON.parse(e.subjects) }));
export function saveExam(e) {
  if (e.id) {
    db.prepare("UPDATE exams SET name=?,term=?,class=?,section=?,max_marks=?,pass_marks=?,exam_date=?,subjects=? WHERE id=?")
      .run(e.name, e.term, e.class, e.section, e.max_marks, e.pass_marks, e.exam_date, JSON.stringify(e.subjects), e.id);
    return { ...e };
  }
  const info = db.prepare("INSERT INTO exams (name,term,class,section,max_marks,pass_marks,exam_date,subjects) VALUES (?,?,?,?,?,?,?,?)")
    .run(e.name, e.term, e.class, e.section, e.max_marks, e.pass_marks, e.exam_date, JSON.stringify(e.subjects));
  return { ...e, id: Number(info.lastInsertRowid) };
}
export const deleteExam = (id) => db.prepare("DELETE FROM exams WHERE id=?").run(id);
export const getMarks = (examId) => db.prepare("SELECT student_id,subject,marks FROM marks WHERE exam_id=?").all(examId);
export function setMark(examId, studentId, subject, marks) {
  db.prepare(`INSERT INTO marks (exam_id,student_id,subject,marks) VALUES (?,?,?,?)
    ON CONFLICT(exam_id,student_id,subject) DO UPDATE SET marks=excluded.marks`)
    .run(examId, studentId, subject, marks === "" || marks === null ? null : Number(marks));
  return true;
}

/* ---- fees ---------------------------------------------------------- */
export const listFees = () => db.prepare("SELECT * FROM fees ORDER BY id DESC").all();
export const feesForStudent = (id) => db.prepare("SELECT COALESCE(SUM(amount),0) t FROM fees WHERE student_id=?").get(id).t;
export function addFee(f) {
  const no = "R-" + bumpCounter("receipt");
  const info = db.prepare("INSERT INTO fees (student_id,receipt_no,head,amount,mode,months,date,remark) VALUES (?,?,?,?,?,?,?,?)")
    .run(f.student_id, no, f.head, f.amount, f.mode, f.months, f.date, f.remark);
  return db.prepare("SELECT * FROM fees WHERE id=?").get(info.lastInsertRowid);
}
export const deleteFee = (id) => db.prepare("DELETE FROM fees WHERE id=?").run(id);
export const getFeeStructure = () => Object.fromEntries(db.prepare("SELECT class,amount FROM fee_structure").all().map((r) => [r.class, r.amount]));
export function setFeeStructure(map) {
  const up = db.prepare("INSERT INTO fee_structure (class,amount) VALUES (?,?) ON CONFLICT(class) DO UPDATE SET amount=excluded.amount");
  Object.entries(map).forEach(([c, a]) => up.run(c, Number(a)));
  return getFeeStructure();
}

/* ---- expenses ------------------------------------------------------ */
export const listExpenses = () => db.prepare("SELECT * FROM expenses ORDER BY date DESC, id DESC").all();
export function addExpense(x) {
  const info = db.prepare("INSERT INTO expenses (date,category,description,amount,paid_to,mode) VALUES (?,?,?,?,?,?)")
    .run(x.date, x.category, x.description, x.amount, x.paid_to, x.mode);
  return db.prepare("SELECT * FROM expenses WHERE id=?").get(info.lastInsertRowid);
}
export const deleteExpense = (id) => db.prepare("DELETE FROM expenses WHERE id=?").run(id);

/* ---- certificates log (TC etc.) ------------------------------------ */
export const listCertificates = (type) => db.prepare("SELECT * FROM certificates WHERE type=? ORDER BY id DESC").all(type).map((c) => ({ ...c, meta: JSON.parse(c.meta || "{}") }));
export function issueTC(payload) {
  const no = payload.number || `TC/${getSettings().session}/${bumpCounter("tc")}`;
  const info = db.prepare("INSERT INTO certificates (type,student_id,number,date,meta) VALUES ('tc',?,?,?,?)")
    .run(payload.student_id, no, payload.date, JSON.stringify(payload));
  db.prepare("UPDATE students SET status='Left' WHERE id=?").run(payload.student_id);
  return { ...db.prepare("SELECT * FROM certificates WHERE id=?").get(info.lastInsertRowid), meta: { ...payload, number: no } };
}

/* ---- dashboard aggregate ------------------------------------------- */
export function dashboard() {
  const students = listStudents();
  const active = students.filter((s) => s.status === "Active");
  const feesTotal = db.prepare("SELECT COALESCE(SUM(amount),0) t FROM fees").get().t;
  const expenseTotal = db.prepare("SELECT COALESCE(SUM(amount),0) t FROM expenses").get().t;
  const feeStruct = getFeeStructure();
  const monthlyDemand = active.reduce((a, s) => a + (feeStruct[s.class] || 0), 0);
  const byClass = {};
  active.forEach((s) => (byClass[s.class] = (byClass[s.class] || 0) + 1));
  const recentFees = db.prepare("SELECT f.*, s.name FROM fees f JOIN students s ON s.id=f.student_id ORDER BY f.id DESC LIMIT 6").all();
  const recentAdmissions = [...students].sort((a, b) => (b.doa || "").localeCompare(a.doa || "")).slice(0, 6);
  const tcCount = db.prepare("SELECT COUNT(*) c FROM certificates WHERE type='tc'").get().c;
  return {
    totalStudents: active.length,
    leftStudents: students.length - active.length,
    feesTotal, expenseTotal, netBalance: feesTotal - expenseTotal,
    monthlyDemand, tcCount, receiptCount: db.prepare("SELECT COUNT(*) c FROM fees").get().c,
    byClass, recentFees, recentAdmissions
  };
}

/* ==================================================================== */
/*  Attendance                                                          */
/* ==================================================================== */
const activeIdsFor = (cls, sec) =>
  db.prepare(`SELECT id FROM students WHERE status='Active' AND class=? ${sec ? "AND section=?" : ""}`)
    .all(...(sec ? [cls, sec] : [cls])).map((r) => r.id);

export function attendanceForDay(date, cls, sec) {
  const ids = activeIdsFor(cls, sec);
  if (!ids.length) return [];
  return db.prepare(`SELECT * FROM attendance WHERE date=? AND student_id IN (${ids.map(() => "?").join(",")})`).all(date, ...ids);
}
export function attendanceForMonth(month, cls, sec) {
  const ids = db.prepare(`SELECT id FROM students WHERE class=? ${sec ? "AND section=?" : ""}`)
    .all(...(sec ? [cls, sec] : [cls])).map((r) => r.id);
  if (!ids.length) return [];
  return db.prepare(`SELECT * FROM attendance WHERE date LIKE ? AND student_id IN (${ids.map(() => "?").join(",")})`)
    .all(month + "%", ...ids);
}
export function markAttendance(rows) {
  const up = db.prepare(`INSERT INTO attendance (date,student_id,status,remark) VALUES (?,?,?,?)
    ON CONFLICT(date,student_id) DO UPDATE SET status=excluded.status, remark=excluded.remark`);
  db.transaction((list) => list.forEach((r) => up.run(r.date, r.student_id, r.status, r.remark || "")))(rows);
  return { ok: true, count: rows.length };
}
export function attendanceSummary(month) {
  const rows = db.prepare("SELECT student_id, status, COUNT(*) c FROM attendance WHERE date LIKE ? GROUP BY student_id, status").all(month + "%");
  const out = {};
  rows.forEach((r) => {
    const t = (out[r.student_id] ||= { present: 0, absent: 0, late: 0, leave: 0, total: 0 });
    t.total += r.c;
    if (r.status === "Present") t.present += r.c;
    else if (r.status === "Absent") t.absent += r.c;
    else if (r.status === "Late") { t.late += r.c; t.present += r.c; }
    else t.leave += r.c;
  });
  return out;
}
export const staffAttendanceForDay = (date) => db.prepare("SELECT * FROM staff_attendance WHERE date=?").all(date);
export function markStaffAttendance(rows) {
  const up = db.prepare(`INSERT INTO staff_attendance (date,staff_id,status) VALUES (?,?,?)
    ON CONFLICT(date,staff_id) DO UPDATE SET status=excluded.status`);
  db.transaction((list) => list.forEach((r) => up.run(r.date, r.staff_id, r.status)))(rows);
  return { ok: true };
}
export function staffAttendanceSummary(month) {
  const rows = db.prepare("SELECT staff_id, status, COUNT(*) c FROM staff_attendance WHERE date LIKE ? GROUP BY staff_id, status").all(month + "%");
  const out = {};
  rows.forEach((r) => {
    const t = (out[r.staff_id] ||= { present: 0, absent: 0, total: 0 });
    t.total += r.c;
    if (r.status === "Absent") t.absent += r.c; else t.present += r.c;
  });
  return out;
}

/* ==================================================================== */
/*  Generic CRUD for the simpler module tables                          */
/* ==================================================================== */
function makeCrud(table, cols, orderBy) {
  const list = () => db.prepare(`SELECT * FROM ${table} ${orderBy || ""}`).all();
  const get = (id) => db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id);
  const save = (rec) => {
    if (rec.id) {
      db.prepare(`UPDATE ${table} SET ${cols.map((c) => `${c}=@${c}`).join(",")} WHERE id=@id`).run({ id: rec.id, ...pick(rec, cols) });
      return get(rec.id);
    }
    const info = db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map((c) => "@" + c).join(",")})`).run(pick(rec, cols));
    return get(info.lastInsertRowid);
  };
  const remove = (id) => db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id);
  return { list, get, save, remove };
}

/* ---- timetable ----------------------------------------------------- */
const TT_COLS = ["class", "section", "day", "period", "subject", "staff_id", "room"];
const ttCrud = makeCrud("timetable", TT_COLS, "ORDER BY class, section, day, period");
export const listTimetable = () => ttCrud.list();
export function saveTimetable(row) {
  // one subject per class/section/day/period — replace whatever was there
  db.prepare("DELETE FROM timetable WHERE class=? AND section=? AND day=? AND period=? AND id IS NOT ?")
    .run(row.class, row.section, row.day, row.period, row.id ?? null);
  return ttCrud.save(row);
}
export const deleteTimetable = (id) => ttCrud.remove(id);
export const clearTimetable = (cls, sec) => db.prepare("DELETE FROM timetable WHERE class=? AND section=?").run(cls, sec);

/* ---- library ------------------------------------------------------- */
const bookCrud = makeCrud("books", ["code", "title", "author", "publisher", "category", "copies", "added_on"], "ORDER BY title");
export const listBooks = () => bookCrud.list();
export const saveBook = (b) => bookCrud.save(b);
export const deleteBook = (id) => bookCrud.remove(id);
export const listIssues = () => db.prepare("SELECT * FROM book_issues ORDER BY id DESC").all();
export function issueBook(rec) {
  const info = db.prepare("INSERT INTO book_issues (book_id,member_type,member_id,issue_date,due_date,return_date,fine) VALUES (?,?,?,?,?,'',0)")
    .run(rec.book_id, rec.member_type, rec.member_id, rec.issue_date, rec.due_date);
  return db.prepare("SELECT * FROM book_issues WHERE id=?").get(info.lastInsertRowid);
}
export function returnBook(id, date, fine) {
  db.prepare("UPDATE book_issues SET return_date=?, fine=? WHERE id=?").run(date, Number(fine) || 0, id);
  return db.prepare("SELECT * FROM book_issues WHERE id=?").get(id);
}
export const deleteIssue = (id) => db.prepare("DELETE FROM book_issues WHERE id=?").run(id);

/* ---- transport ----------------------------------------------------- */
const routeCrud = makeCrud("routes", ["name", "vehicle_no", "driver", "driver_phone", "fee", "stops"], "ORDER BY name");
export const listRoutes = () => routeCrud.list();
export const saveRoute = (r) => routeCrud.save(r);
export const deleteRoute = (id) => routeCrud.remove(id);
export const listTransportAllot = () => db.prepare("SELECT * FROM transport_allot").all();
export function allotTransport(a) {
  db.prepare(`INSERT INTO transport_allot (student_id,route_id,stop,from_date) VALUES (?,?,?,?)
    ON CONFLICT(student_id) DO UPDATE SET route_id=excluded.route_id, stop=excluded.stop, from_date=excluded.from_date`)
    .run(a.student_id, a.route_id, a.stop, a.from_date);
  return db.prepare("SELECT * FROM transport_allot WHERE student_id=?").get(a.student_id);
}
export const unallotTransport = (studentId) => db.prepare("DELETE FROM transport_allot WHERE student_id=?").run(studentId);

/* ---- hostel -------------------------------------------------------- */
const roomCrud = makeCrud("rooms", ["block", "room_no", "type", "capacity", "fee"], "ORDER BY block, room_no");
export const listRooms = () => roomCrud.list();
export const saveRoom = (r) => roomCrud.save(r);
export const deleteRoom = (id) => roomCrud.remove(id);
export const listHostelAllot = () => db.prepare("SELECT * FROM hostel_allot").all();
export function allotHostel(a) {
  const room = db.prepare("SELECT * FROM rooms WHERE id=?").get(a.room_id);
  const taken = db.prepare("SELECT COUNT(*) c FROM hostel_allot WHERE room_id=? AND student_id<>?").get(a.room_id, a.student_id).c;
  if (room && taken >= Number(room.capacity)) return { ok: false, error: `Room ${room.room_no} is already full (${room.capacity} beds).` };
  db.prepare(`INSERT INTO hostel_allot (student_id,room_id,from_date) VALUES (?,?,?)
    ON CONFLICT(student_id) DO UPDATE SET room_id=excluded.room_id, from_date=excluded.from_date`)
    .run(a.student_id, a.room_id, a.from_date);
  return { ok: true, row: db.prepare("SELECT * FROM hostel_allot WHERE student_id=?").get(a.student_id) };
}
export const unallotHostel = (studentId) => db.prepare("DELETE FROM hostel_allot WHERE student_id=?").run(studentId);

/* ---- notices / homework / events ----------------------------------- */
const noticeCrud = makeCrud("notices", ["date", "title", "body", "audience", "priority", "expires"], "ORDER BY date DESC, id DESC");
export const listNotices = () => noticeCrud.list();
export const saveNotice = (n) => noticeCrud.save(n);
export const deleteNotice = (id) => noticeCrud.remove(id);

const hwCrud = makeCrud("homework", ["date", "class", "section", "subject", "title", "details", "due_date", "staff_id"], "ORDER BY date DESC, id DESC");
export const listHomework = () => hwCrud.list();
export const saveHomework = (h) => hwCrud.save(h);
export const deleteHomework = (id) => hwCrud.remove(id);

const eventCrud = makeCrud("events", ["date", "end_date", "title", "type", "venue", "description"], "ORDER BY date");
export const listEvents = () => eventCrud.list();
export const saveEvent = (e) => eventCrud.save(e);
export const deleteEvent = (id) => eventCrud.remove(id);

/* ---- payroll ------------------------------------------------------- */
const PAY_COLS = ["staff_id", "month", "basic", "allowances", "deductions", "lop_days", "net", "paid_date", "mode", "remark"];
const payCrud = makeCrud("payroll", PAY_COLS, "ORDER BY month DESC, id DESC");
export const listPayroll = () => payCrud.list();
export function savePayroll(p) {
  const rec = {
    ...p,
    basic: Number(p.basic) || 0, allowances: Number(p.allowances) || 0,
    deductions: Number(p.deductions) || 0, lop_days: Number(p.lop_days) || 0
  };
  rec.net = rec.basic + rec.allowances - rec.deductions;
  db.prepare("DELETE FROM payroll WHERE staff_id=? AND month=? AND id IS NOT ?").run(rec.staff_id, rec.month, rec.id ?? null);
  return payCrud.save(rec);
}
export const deletePayroll = (id) => payCrud.remove(id);
export function generatePayroll(month) {
  const absent = {};
  db.prepare("SELECT staff_id, COUNT(*) c FROM staff_attendance WHERE date LIKE ? AND status='Absent' GROUP BY staff_id")
    .all(month + "%").forEach((r) => (absent[r.staff_id] = r.c));
  const staff = db.prepare("SELECT * FROM staff WHERE status='Active'").all();
  let made = 0;
  db.transaction(() => {
    staff.forEach((st) => {
      const exists = db.prepare("SELECT id FROM payroll WHERE staff_id=? AND month=?").get(st.id, month);
      const basic = Number(st.salary) || 0;
      if (exists || !basic) return;
      const lop = absent[st.id] || 0;
      const allowances = Math.round(basic * 0.1);
      const deductions = Math.round(basic * 0.04) + Math.round((basic / 30) * lop);
      db.prepare("INSERT INTO payroll (staff_id,month,basic,allowances,deductions,lop_days,net,paid_date,mode,remark) VALUES (?,?,?,?,?,?,?,'','Bank transfer','')")
        .run(st.id, month, basic, allowances, deductions, lop, basic + allowances - deductions);
      made++;
    });
  })();
  return { made };
}


/* ==================================================================== */
/*  Student / parent login                                              */
/* ==================================================================== */
/* "2012-04-18" -> "18042012", the default student password */
const dobKey = (dob) => {
  const m = String(dob || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}${m[2]}${m[1]}` : "";
};

/* Returns only the matching student's own record — never the whole roll. */
export function studentLogin(admNo, password) {
  const key = String(admNo || "").trim();
  if (!key) return { ok: false, error: "Enter your admission number." };
  const st = db.prepare("SELECT * FROM students WHERE LOWER(TRIM(adm_no))=LOWER(TRIM(?))").get(key);
  if (!st) return { ok: false, error: "No student found with that admission number." };
  if (st.status !== "Active") return { ok: false, error: "This student is no longer on the roll. Please contact the school office." };
  const given = String(password || "").trim();
  const expected = String(st.password || "").trim() || dobKey(st.dob);
  if (!expected) return { ok: false, error: "No password is set for this student yet. Please contact the school office." };
  if (given !== expected) return { ok: false, error: "Wrong password. The default password is your date of birth as DDMMYYYY." };
  return { ok: true, student: st };
}

export function setStudentPassword(studentId, password) {
  const info = db.prepare("UPDATE students SET password=? WHERE id=?").run(String(password || ""), studentId);
  return info.changes ? { ok: true } : { ok: false, error: "Student not found." };
}
