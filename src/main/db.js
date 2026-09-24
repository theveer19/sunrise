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
export const saveSettings = (s) => { db.prepare("UPDATE settings SET data=? WHERE id=1").run(JSON.stringify(s)); return s; };
function bumpCounter(kind) {
  const s = getSettings();
  const n = s.counters[kind];
  s.counters[kind] = n + 1;
  saveSettings(s);
  return n;
}

/* ---- students ------------------------------------------------------ */
export const listStudents = () => db.prepare("SELECT * FROM students ORDER BY class, section, CAST(roll AS INTEGER), name").all();
export const getStudent = (id) => db.prepare("SELECT * FROM students WHERE id=?").get(id);
export function saveStudent(s) {
  const cols = ["adm_no", "pen_no", "samagra_no", "aadhar_no", "exam_no", "app_id", "name", "father", "mother", "dob", "doa", "class", "section", "roll", "gender", "category", "religion", "nationality", "phone", "whatsapp", "address", "prev_school", "blood_group", "status"];
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
  return { ...e, id: info.lastInsertRowid };
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