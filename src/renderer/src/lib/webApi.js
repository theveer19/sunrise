// Browser fallback for window.api.
// In the Electron desktop app, window.api is provided by the preload script (SQLite on disk).
// When the renderer is opened in a normal browser (e.g. the Vercel demo), there is no Electron,
// so this module provides the same API backed by localStorage, pre-filled with demo data.

const KEY = "sunrise-erp-demo-v1";

/* ---- tiny persistence layer --------------------------------------- */
let memory = null; // used when localStorage is unavailable (private mode etc.)

function load() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return memory;
}
function persist(db) {
  memory = db;
  try { window.localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ }
}
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const nowIso = () => new Date().toISOString().replace("T", " ").slice(0, 19);

/* local YYYY-MM-DD, offset by n days */
function ymd(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* ---- demo seed ---------------------------------------------------- */
function seed() {
  const db = {
    seq: {
      students: 0, staff: 0, exams: 0, marks: 0, fees: 0, expenses: 0, certificates: 0,
      attendance: 0, staff_attendance: 0, timetable: 0, books: 0, book_issues: 0,
      routes: 0, transport_allot: 0, rooms: 0, hostel_allot: 0,
      notices: 0, homework: 0, events: 0, payroll: 0
    },
    settings: {
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
    },
    feeStructure: { Nursery: 900, LKG: 950, UKG: 950, "1": 1100, "2": 1100, "3": 1200, "4": 1200, "5": 1300, "6": 1450, "7": 1450, "8": 1600, "9": 1850, "10": 1950, "11": 2200, "12": 2300 },
    students: [], staff: [], exams: [], marks: [], fees: [], expenses: [], certificates: [],
    attendance: [], staff_attendance: [], timetable: [], books: [], book_issues: [],
    routes: [], transport_allot: [], rooms: [], hostel_allot: [],
    notices: [], homework: [], events: [], payroll: []
  };
  const next = (t) => ++db.seq[t];

  const S = (o) => db.students.push({
    id: next("students"),
    adm_no: "", pen_no: "", samagra_no: "", aadhar_no: "", exam_no: "", app_id: "", name: "", father: "", mother: "",
    dob: "", doa: "2026-04-02", class: "8", section: "A", roll: "", gender: "Male",
    category: "General", religion: "Hindu", nationality: "Indian", phone: "", whatsapp: "",
    address: "", prev_school: "", blood_group: "", status: "Active", created_at: nowIso(), ...o
  });
  S({ adm_no: "2020/0142", pen_no: "PEN23110045", samagra_no: "142556789012", aadhar_no: "5623 8890 1122", exam_no: "80101", name: "Aarav Sharma", father: "Rajesh Sharma", mother: "Sunita Sharma", dob: "2012-04-18", roll: "1", phone: "9826012345", whatsapp: "9826012345", address: "12, Gandhi Nagar, Gwalior", blood_group: "B+" });
  S({ adm_no: "2020/0155", pen_no: "PEN23110061", samagra_no: "142556783341", aadhar_no: "7781 2233 4455", exam_no: "80102", name: "Diya Verma", father: "Manoj Verma", mother: "Rekha Verma", dob: "2012-09-05", roll: "2", gender: "Female", phone: "9425098761", whatsapp: "9425098761", address: "44, Kampoo, Gwalior", blood_group: "O+" });
  S({ adm_no: "2020/0161", pen_no: "PEN23110066", samagra_no: "142556785520", aadhar_no: "4410 6672 9981", exam_no: "80103", name: "Kabir Singh Tomar", father: "Vikram Singh Tomar", mother: "Anita Tomar", dob: "2012-01-22", roll: "3", category: "General", phone: "9893345678", whatsapp: "9893345678", address: "7, Thatipur, Gwalior" });
  S({ adm_no: "2021/0177", pen_no: "PEN23110072", samagra_no: "142556786634", aadhar_no: "8812 3345 6670", exam_no: "80104", name: "Ananya Jain", father: "Pankaj Jain", mother: "Ritu Jain", dob: "2012-11-14", roll: "4", gender: "Female", religion: "Jain", phone: "9039012233", whatsapp: "9039012233", address: "19, Madhav Nagar, Gwalior", doa: "2021-04-05" });
  S({ adm_no: "2020/0149", pen_no: "PEN23110058", samagra_no: "142556787745", aadhar_no: "2290 4456 7781", exam_no: "80105", name: "Mohd. Ayaan Khan", father: "Imran Khan", mother: "Shabana Khan", dob: "2012-06-30", roll: "5", religion: "Muslim", category: "OBC", phone: "9755123409", whatsapp: "9755123409", address: "3, Hazira, Gwalior" });
  S({ adm_no: "2019/0098", pen_no: "PEN23110018", samagra_no: "142556770021", aadhar_no: "3390 1122 8876", name: "Isha Yadav", father: "Ramesh Yadav", mother: "Kavita Yadav", dob: "2010-02-11", class: "10", roll: "3", gender: "Female", category: "OBC", phone: "9977512340", whatsapp: "9977512340", address: "23, Lashkar, Gwalior" });
  S({ adm_no: "2019/0104", pen_no: "PEN23110022", samagra_no: "142556771132", aadhar_no: "6671 2290 3345", name: "Rohan Kushwah", father: "Dinesh Kushwah", mother: "Poonam Kushwah", dob: "2010-08-19", class: "10", roll: "7", category: "OBC", phone: "9826554321", whatsapp: "9826554321", address: "56, Morar, Gwalior" });
  S({ adm_no: "2022/0201", pen_no: "PEN23110090", samagra_no: "142556799910", aadhar_no: "1120 5566 3300", name: "Vihaan Gupta", father: "Sanjay Gupta", mother: "Meena Gupta", dob: "2014-07-30", class: "6", roll: "11", phone: "9993301122", whatsapp: "9993301122", address: "5, City Centre, Gwalior", doa: "2022-04-04" });
  S({ adm_no: "2022/0214", pen_no: "PEN23110097", samagra_no: "142556790087", aadhar_no: "5530 1178 2264", name: "Saanvi Bhadoria", father: "Arvind Bhadoria", mother: "Neha Bhadoria", dob: "2014-03-12", class: "6", roll: "12", gender: "Female", phone: "9425711223", whatsapp: "9425711223", address: "88, Shinde Ki Chhawni, Gwalior", doa: "2022-04-06" });
  S({ adm_no: "2024/0302", pen_no: "PEN23110140", samagra_no: "142556795561", aadhar_no: "7765 3321 9900", name: "Aditya Rajput", father: "Sunil Rajput", mother: "Kiran Rajput", dob: "2017-05-09", class: "3", roll: "4", phone: "9098776655", whatsapp: "9098776655", address: "14, DD Nagar, Gwalior", doa: "2024-04-03" });
  S({ adm_no: "2026/0411", name: "Myra Agrawal", father: "Nitin Agrawal", mother: "Shweta Agrawal", dob: "2022-10-02", class: "Nursery", roll: "2", gender: "Female", phone: "9109234567", whatsapp: "9109234567", address: "2, Govindpuri, Gwalior", doa: ymd(-20) });
  S({ adm_no: "2026/0409", pen_no: "PEN23110188", samagra_no: "142556799943", aadhar_no: "9981 0023 4478", name: "Arjun Chauhan", father: "Mahesh Chauhan", mother: "Pooja Chauhan", dob: "2011-12-01", class: "9", roll: "9", category: "SC", phone: "9300456781", whatsapp: "9300456781", address: "31, Kila Gate, Gwalior", doa: ymd(-35), prev_school: "Govt. Middle School, Morar" });

  const T = (o) => db.staff.push({
    id: next("staff"), emp_id: "", name: "", guardian: "", gender: "Male", designation: "TGT", department: "Secondary",
    qualification: "", subject: "", doj: "", dol: "", dob: "", aadhar_no: "", phone: "", whatsapp: "", email: "",
    address: "", salary: "", status: "Active", created_at: nowIso(), ...o
  });
  T({ emp_id: "SMS-T01", name: "Kavita Deshmukh", guardian: "W/o Sh. Anil Deshmukh", gender: "Female", designation: "Principal", department: "Administration", qualification: "M.A., M.Ed.", doj: "2015-06-15", phone: "9826100011", whatsapp: "9826100011", email: "principal@sunrisemontessori.edu.in", salary: 55000 });
  T({ emp_id: "SMS-T07", name: "Rahul Mishra", guardian: "S/o Sh. R. K. Mishra", designation: "TGT", department: "Secondary", subject: "Mathematics", qualification: "M.Sc., B.Ed.", doj: "2018-07-01", phone: "9893022334", whatsapp: "9893022334", salary: 32000 });
  T({ emp_id: "SMS-T12", name: "Priya Saxena", guardian: "D/o Sh. Alok Saxena", gender: "Female", designation: "PRT", department: "Primary", subject: "English", qualification: "B.A., D.El.Ed.", doj: "2021-04-01", phone: "9425066778", whatsapp: "9425066778", salary: 24000 });
  T({ emp_id: "SMS-S03", name: "Ramesh Kumar", guardian: "S/o Sh. Shyam Lal", designation: "Accountant", department: "Accounts", qualification: "B.Com.", doj: "2019-01-10", phone: "9755088990", whatsapp: "9755088990", salary: 21000 });

  // exams for 8-A with marks, so marksheets and the final result/rank tab have data
  const subjects = ["English", "Hindi", "Mathematics", "Science", "Social Science"];
  const E = (o) => { const ex = { id: next("exams"), section: "A", class: "8", max_marks: 100, pass_marks: 33, subjects, ...o }; db.exams.push(ex); return ex; };
  const q = E({ name: "Quarterly Examination", term: "Quarterly", exam_date: "2026-07-20" });
  const h = E({ name: "Half Yearly Examination", term: "Half Yearly", exam_date: ymd(-5) });
  const base = { 1: [78, 82, 91, 85, 80], 2: [92, 88, 84, 90, 87], 3: [65, 70, 58, 62, 68], 4: [88, 91, 95, 93, 89], 5: [72, 68, 74, 70, 75] };
  [[q, 0], [h, 3]].forEach(([ex, bump]) => {
    Object.entries(base).forEach(([sid, arr]) => {
      subjects.forEach((sub, i) => db.marks.push({ id: next("marks"), exam_id: ex.id, student_id: Number(sid), subject: sub, marks: Math.min(100, arr[i] + bump - (i % 2)) }));
    });
  });

  // fee receipts & expenses in the current month so the dashboard is populated
  const F = (student_id, amount, head, mode, daysAgo) => db.fees.push({
    id: next("fees"), student_id, receipt_no: "R-" + db.settings.counters.receipt++, head, amount, mode,
    months: head === "Tuition fee" ? "1" : "", date: ymd(-daysAgo), remark: ""
  });
  // three months of monthly tuition for every student, so the books balance like a real school
  const MONTHLY = { Nursery: 900, LKG: 950, UKG: 950, "1": 1100, "2": 1100, "3": 1200, "4": 1200, "5": 1300,
    "6": 1450, "7": 1450, "8": 1600, "9": 1850, "10": 1950, "11": 2200, "12": 2300 };
  const MODES = ["Cash", "UPI", "Bank transfer", "Cheque", "Card"];
  [62, 33, 8].forEach((daysAgo, round) => {
    db.students.forEach((st, i) => {
      // a couple of students skip a month — that is what makes the defaulter report interesting
      if ((st.id + round) % 9 === 0) return;
      F(st.id, MONTHLY[st.class] || 1200, "Tuition fee", MODES[(st.id + round + i) % MODES.length], daysAgo - (st.id % 5));
    });
  });
  F(12, 5000, "Admission fee", "Bank transfer", 30); F(11, 5000, "Admission fee", "UPI", 18);
  F(5, 800, "Examination fee", "Cash", 12); F(3, 800, "Examination fee", "Cash", 11);
  F(6, 700, "Transport fee", "UPI", 9); F(1, 700, "Transport fee", "Cash", 7);
  F(2, 1200, "Books & uniform", "Cash", 25); F(8, 1200, "Books & uniform", "UPI", 24);

  const X = (daysAgo, category, description, amount, paid_to, mode) => db.expenses.push({ id: next("expenses"), date: ymd(-daysAgo), category, description, amount, paid_to, mode });
  X(20, "Electricity & water", "MPEB electricity bill", 6850, "MPMKVVCL", "UPI");
  X(14, "Stationery", "Registers, chalk and printer paper", 2340, "Shree Stationers", "Cash");
  X(9, "Maintenance", "Classroom fan repair", 1500, "Local electrician", "Cash");
  X(3, "Transport & fuel", "Diesel for school van", 4200, "HP Petrol Pump", "Card");
  X(40, "Electricity & water", "MPEB electricity bill", 7100, "MPMKVVCL", "UPI");
  X(38, "Events & functions", "Independence Day function", 5600, "Decor & sweets", "Cash");
  X(64, "Furniture & equipment", "10 classroom benches", 18500, "Sharma Furniture", "Cheque");
  X(55, "Rent", "Building rent", 9000, "Landlord", "Bank transfer");
  X(25, "Rent", "Building rent", 9000, "Landlord", "Bank transfer");

  seedModules(db, next);
  return db;
}

/* ---- demo data for the newer modules ------------------------------ */
function seedModules(db, next) {
  const activeIds = db.students.map((s) => s.id);

  // --- attendance: 45 days back, weekdays only, ~92% present
  const statusFor = (sid, i) => {
    const r = (sid * 7 + i * 13) % 100;
    if (r < 86) return "Present";
    if (r < 93) return "Absent";
    if (r < 97) return "Late";
    return "Leave";
  };
  for (let d = 45; d >= 0; d--) {
    const date = ymd(-d);
    const [yy, mm, dd] = date.split("-").map(Number);
    if (new Date(yy, mm - 1, dd).getDay() === 0) continue; // Sunday
    activeIds.forEach((sid, i) => {
      db.attendance.push({ id: next("attendance"), date, student_id: sid, status: statusFor(sid, d + i), remark: "" });
    });
    db.staff.forEach((st, i) => {
      db.staff_attendance.push({ id: next("staff_attendance"), date, staff_id: st.id, status: (st.id * 5 + d + i) % 23 === 0 ? "Absent" : "Present" });
    });
  }

  // --- timetable for 8-A and 10-A
  const TT = (cls, sec, day, period, subject, staff_id, room) =>
    db.timetable.push({ id: next("timetable"), class: cls, section: sec, day, period, subject, staff_id, room });
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const plan8 = ["Mathematics", "English", "Science", "Hindi", "Social Science", "Computer", "Drawing", "Sanskrit"];
  const plan10 = ["Science", "Mathematics", "English", "Social Science", "Hindi", "Computer", "Sanskrit", "General Knowledge"];
  const teacherFor = (sub) => (sub === "Mathematics" ? 2 : sub === "English" ? 3 : sub === "Computer" ? 4 : 2);
  days.forEach((day, di) => {
    const upto = day === "Saturday" ? 4 : 8;
    for (let p = 1; p <= upto; p++) {
      const s8 = plan8[(p - 1 + di) % plan8.length];
      const s10 = plan10[(p - 1 + di) % plan10.length];
      TT("8", "A", day, p, s8, teacherFor(s8), "Room 8A");
      TT("10", "A", day, p, s10, teacherFor(s10), "Room 10A");
    }
  });

  // --- library
  const B = (code, title, author, publisher, category, copies) =>
    db.books.push({ id: next("books"), code, title, author, publisher, category, copies, added_on: ymd(-200) });
  B("SMS-B001", "Mathematics for Class 8", "R. D. Sharma", "Dhanpat Rai", "Textbook", 25);
  B("SMS-B002", "Science Class 8 — NCERT", "NCERT", "NCERT", "Textbook", 30);
  B("SMS-B003", "Panchtantra ki Kahaniyan", "Vishnu Sharma", "Rajkamal Prakashan", "Story & Fiction", 12);
  B("SMS-B004", "The Jungle Book", "Rudyard Kipling", "Macmillan", "English Literature", 8);
  B("SMS-B005", "Bharat Ek Khoj", "Jawaharlal Nehru", "Penguin", "Biography", 5);
  B("SMS-B006", "General Knowledge 2026", "Manohar Pandey", "Arihant", "General Knowledge", 15);
  B("SMS-B007", "Wings of Fire", "A. P. J. Abdul Kalam", "Universities Press", "Biography", 10);
  B("SMS-B008", "Godan", "Munshi Premchand", "Lokbharti", "Hindi Literature", 7);
  B("SMS-B009", "Atlas of India", "Oxford", "Oxford University Press", "Reference", 6);
  B("SMS-B010", "Computer Fundamentals", "P. K. Sinha", "BPB Publications", "Science", 9);
  const ISS = (book_id, member_type, member_id, daysAgo, returned) => {
    const issue_date = ymd(-daysAgo);
    db.book_issues.push({
      id: next("book_issues"), book_id, member_type, member_id, issue_date,
      due_date: ymd(-daysAgo + 14), return_date: returned ? ymd(-daysAgo + 10) : "", fine: 0
    });
  };
  ISS(3, "student", 1, 20, false); ISS(4, "student", 2, 25, false); ISS(7, "student", 6, 8, false);
  ISS(6, "student", 4, 30, true); ISS(1, "student", 3, 12, false); ISS(8, "staff", 2, 5, false);
  ISS(10, "student", 8, 40, true); ISS(5, "student", 12, 3, false);

  // --- transport
  const R = (name, vehicle_no, driver, driver_phone, fee, stops) =>
    db.routes.push({ id: next("routes"), name, vehicle_no, driver, driver_phone, fee, stops });
  R("Route 1 — Thatipur", "MP07 CA 4412", "Ramesh Yadav", "9826011223", 700, "Thatipur Tiraha, DD Nagar, Gole Ka Mandir, City Centre");
  R("Route 2 — Morar", "MP07 CB 7781", "Devendra Singh", "9425033445", 750, "Morar Bazaar, Jiwaji Ganj, Kila Gate, Hazira");
  R("Route 3 — Lashkar", "MP07 CC 3390", "Sanjay Sharma", "9893055667", 650, "Lashkar, Kampoo, Gandhi Nagar, Madhav Nagar");
  const AL = (student_id, route_id, stop) => db.transport_allot.push({ id: next("transport_allot"), student_id, route_id, stop, from_date: ymd(-150) });
  AL(1, 3, "Gandhi Nagar"); AL(2, 3, "Kampoo"); AL(3, 1, "Thatipur Tiraha");
  AL(6, 3, "Lashkar"); AL(8, 1, "City Centre"); AL(10, 1, "DD Nagar"); AL(12, 2, "Kila Gate");

  // --- hostel
  const RM = (block, room_no, type, capacity, fee) => db.rooms.push({ id: next("rooms"), block, room_no, type, capacity, fee });
  RM("Boys Block A", "101", "4-Seater", 4, 3500); RM("Boys Block A", "102", "4-Seater", 4, 3500);
  RM("Boys Block A", "103", "2-Seater", 2, 4500); RM("Girls Block B", "201", "4-Seater", 4, 3500);
  RM("Girls Block B", "202", "3-Seater", 3, 3800); RM("Girls Block B", "203", "2-Seater", 2, 4500);
  const HA = (student_id, room_id) => db.hostel_allot.push({ id: next("hostel_allot"), student_id, room_id, from_date: ymd(-160) });
  HA(3, 1); HA(5, 1); HA(12, 2); HA(2, 4); HA(6, 4); HA(9, 5);

  // --- notices, homework, events
  const N = (daysAgo, title, audience, priority, body) =>
    db.notices.push({ id: next("notices"), date: ymd(-daysAgo), title, audience, priority, body, expires: ymd(-daysAgo + 30) });
  N(2, "Parent-Teacher Meeting on Saturday", "Students & Parents", "High",
    "The Parent-Teacher Meeting for classes 6 to 10 will be held this Saturday from 10:00 AM to 1:00 PM in the school hall. Parents are requested to collect the term marksheet from the class teacher and meet subject teachers.");
  N(5, "Annual Sports Day — trials begin", "All", "Normal",
    "Trials for the Annual Sports Day will begin next week during the games period. Interested students may give their names to the sports teacher by Friday.");
  N(9, "Half-Yearly examination timetable released", "Students & Parents", "High",
    "The Half-Yearly examination timetable has been put up on the notice board. Examinations begin from the 1st of next month. Students must carry their admit card daily.");
  N(15, "Staff meeting — Monday 3:30 PM", "Teachers", "Normal",
    "All teaching staff are requested to attend the monthly review meeting in the Principal's office on Monday at 3:30 PM.");
  N(22, "School closed for Independence Day", "All", "Normal",
    "The school will remain closed on account of Independence Day. Flag hoisting will take place at 8:00 AM; students participating in the cultural programme must report by 7:30 AM in full uniform.");

  const HW = (daysAgo, cls, sec, subject, title, details, dueIn) =>
    db.homework.push({ id: next("homework"), date: ymd(-daysAgo), class: cls, section: sec, subject, title, details, due_date: ymd(-daysAgo + dueIn), staff_id: 2 });
  HW(1, "8", "A", "Mathematics", "Exercise 8.2 — Linear Equations", "Solve questions 1 to 12 of Exercise 8.2 in the classwork notebook. Show every step.", 2);
  HW(1, "8", "A", "Science", "Chapter 6 — Combustion and Flame", "Read the chapter and answer the intext questions on page 74.", 3);
  HW(2, "10", "A", "Social Science", "Map work — Resources of India", "Mark the major iron ore and coal belts on the outline map of India.", 2);
  HW(3, "8", "A", "English", "Letter writing practice", "Write a formal letter to the Principal requesting leave for three days.", 2);
  HW(4, "10", "A", "Mathematics", "Trigonometry worksheet", "Complete the worksheet handed out in class. Bring doubts to the next period.", 3);

  const EV = (daysFromNow, title, type, venue, description, spanDays) => {
    const date = ymd(daysFromNow);
    db.events.push({ id: next("events"), date, end_date: spanDays ? ymd(daysFromNow + spanDays) : "", title, type, venue, description });
  };
  EV(3, "Parent-Teacher Meeting", "PTM", "School Hall", "Term result discussion for classes 6 to 10.", 0);
  EV(12, "Half-Yearly Examinations", "Examination", "All classrooms", "Half-yearly examinations for all classes.", 9);
  EV(28, "Annual Sports Day", "Sports", "School Ground", "Track events, relay races and prize distribution.", 1);
  EV(45, "Annual Function — Prerna 2026", "Function", "School Auditorium", "Cultural programme, drama and prize distribution.", 0);
  EV(-8, "Teachers' Day Celebration", "Function", "School Hall", "Cultural programme presented by students of classes 9 and 10.", 0);
  EV(60, "Winter Break", "Holiday", "—", "School closed for the winter break.", 10);

  // --- payroll for the previous two months
  const prevMonth = (n) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  [1, 2].forEach((back) => {
    const month = prevMonth(back);
    db.staff.forEach((st) => {
      const basic = Number(st.salary) || 0;
      if (!basic) return;
      const allowances = Math.round(basic * 0.1);
      const deductions = Math.round(basic * 0.04);
      db.payroll.push({
        id: next("payroll"), staff_id: st.id, month, basic, allowances, deductions,
        lop_days: 0, net: basic + allowances - deductions,
        paid_date: `${month}-28`, mode: "Bank transfer", remark: ""
      });
    });
  });
}

/* ---- helpers mirroring the SQL layer ------------------------------ */
function getDb() {
  let db = load();
  if (!db || !db.settings) { db = seed(); persist(db); }
  return db;
}
function tx(fn) { const db = getDb(); const r = fn(db); persist(db); return clone(r); }
function read(fn) { return clone(fn(getDb())); }

const STUDENT_COLS = ["adm_no", "pen_no", "samagra_no", "aadhar_no", "exam_no", "app_id", "name", "father", "mother", "dob", "doa", "class", "section", "roll", "gender", "category", "religion", "nationality", "phone", "whatsapp", "address", "prev_school", "blood_group", "status"];
const STAFF_COLS = ["emp_id", "name", "guardian", "gender", "designation", "department", "qualification", "subject", "doj", "dol", "dob", "aadhar_no", "phone", "whatsapp", "email", "address", "salary", "status"];
const pick = (o, cols) => { const r = {}; cols.forEach((c) => (r[c] = o[c] ?? "")); return r; };
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const rollNum = (r) => { const n = parseInt(r, 10); return Number.isNaN(n) ? 0 : n; };

function upsert(db, table, cols, rec) {
  if (rec.id) {
    const i = db[table].findIndex((r) => r.id === rec.id);
    if (i >= 0) { db[table][i] = { ...db[table][i], ...pick(rec, cols) }; return db[table][i]; }
  }
  const row = { id: ++db.seq[table], ...pick(rec, cols), created_at: nowIso() };
  db[table].push(row);
  return row;
}
function bump(db, kind) {
  db.settings.counters = db.settings.counters || { receipt: 1001, tc: 101 };
  const n = Number(db.settings.counters[kind]) || (kind === "receipt" ? 1001 : 101);
  db.settings.counters[kind] = n + 1;
  return n;
}
const sumFees = (db, sid) => db.fees.filter((f) => sid == null || f.student_id === sid).reduce((a, f) => a + Number(f.amount || 0), 0);

/* ---- printing (browser) ------------------------------------------- */
function pageHtml(inner, title) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${String(title || "Document").replace(/</g, "")}</title>
  <style>@page{size:A4;margin:0} html,body{margin:0;padding:0;background:#fff}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>
  </head><body>${inner}</body></html>`;
}
function printInFrame(html, title) {
  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open(); doc.write(pageHtml(html, title)); doc.close();
    const prevTitle = document.title;
    // the PDF file name offered by the browser comes from the document title
    if (title) document.title = title.replace(/\.pdf$/i, "");
    setTimeout(() => {
      try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch { /* ignore */ }
      setTimeout(() => { document.title = prevTitle; frame.remove(); resolve({ ok: true }); }, 1000);
    }, 400);
  });
}

/* ---- generic collection helpers ----------------------------------- */
function upsertIn(db, table, cols, rec) {
  if (rec.id) {
    const i = db[table].findIndex((r) => r.id === rec.id);
    if (i >= 0) { db[table][i] = { ...db[table][i], ...pick(rec, cols) }; return db[table][i]; }
  }
  const row = { id: ++db.seq[table], ...pick(rec, cols) };
  db[table].push(row);
  return row;
}
const byDateDesc = (a, b) => cmp(b.date || "", a.date || "") || b.id - a.id;

/* ---- the API ------------------------------------------------------ */
export function createWebApi() {
  const later = (fn) => Promise.resolve().then(fn);
  return {
    platform: "web",
    resetDemo: () => later(() => { const db = seed(); persist(db); return true; }),

    settings: {
      get: () => later(() => read((db) => db.settings)),
      // counters are owned by the store; never let a stale copy from the UI roll them back
      save: (s) => later(() => tx((db) => { db.settings = { ...s, counters: db.settings.counters }; return db.settings; }))
    },
    students: {
      list: () => later(() => read((db) => [...db.students].sort((a, b) =>
        cmp(String(a.class), String(b.class)) || cmp(String(a.section), String(b.section)) ||
        rollNum(a.roll) - rollNum(b.roll) || cmp(String(a.name), String(b.name))))),
      save: (s) => later(() => tx((db) => upsert(db, "students", STUDENT_COLS, s))),
      remove: (id) => later(() => tx((db) => {
        db.students = db.students.filter((r) => r.id !== id);
        db.marks = db.marks.filter((r) => r.student_id !== id);
        db.fees = db.fees.filter((r) => r.student_id !== id);
        db.certificates = db.certificates.filter((r) => r.student_id !== id);
        return { changes: 1 };
      }))
    },
    staff: {
      list: () => later(() => read((db) => [...db.staff].sort((a, b) => cmp(a.status, b.status) || cmp(a.name, b.name)))),
      save: (s) => later(() => tx((db) => upsert(db, "staff", STAFF_COLS, s))),
      remove: (id) => later(() => tx((db) => { db.staff = db.staff.filter((r) => r.id !== id); return { changes: 1 }; }))
    },
    exams: {
      list: () => later(() => read((db) => [...db.exams].sort((a, b) => b.id - a.id))),
      save: (e) => later(() => tx((db) => {
        const rec = { name: e.name, term: e.term, class: e.class, section: e.section, max_marks: Number(e.max_marks) || 0, pass_marks: Number(e.pass_marks) || 0, exam_date: e.exam_date, subjects: [...(e.subjects || [])] };
        if (e.id) {
          const i = db.exams.findIndex((x) => x.id === e.id);
          if (i >= 0) { db.exams[i] = { ...db.exams[i], ...rec }; return db.exams[i]; }
        }
        const row = { id: ++db.seq.exams, ...rec };
        db.exams.push(row);
        return row;
      })),
      remove: (id) => later(() => tx((db) => {
        db.exams = db.exams.filter((x) => x.id !== id);
        db.marks = db.marks.filter((m) => m.exam_id !== id);
        return { changes: 1 };
      })),
      marks: (examId) => later(() => read((db) => db.marks.filter((m) => m.exam_id === examId)
        .map(({ student_id, subject, marks }) => ({ student_id, subject, marks })))),
      setMark: (examId, sid, sub, m) => later(() => tx((db) => {
        const val = m === "" || m === null || m === undefined ? null : Number(m);
        const row = db.marks.find((x) => x.exam_id === examId && x.student_id === sid && x.subject === sub);
        if (row) row.marks = val;
        else db.marks.push({ id: ++db.seq.marks, exam_id: examId, student_id: sid, subject: sub, marks: val });
        return true;
      }))
    },
    fees: {
      list: () => later(() => read((db) => [...db.fees].sort((a, b) => b.id - a.id))),
      paidFor: (id) => later(() => read((db) => sumFees(db, id))),
      add: (f) => later(() => tx((db) => {
        const row = {
          id: ++db.seq.fees, student_id: f.student_id, receipt_no: "R-" + bump(db, "receipt"),
          head: f.head, amount: Number(f.amount) || 0, mode: f.mode, months: f.months, date: f.date, remark: f.remark
        };
        db.fees.push(row);
        return row;
      })),
      remove: (id) => later(() => tx((db) => { db.fees = db.fees.filter((r) => r.id !== id); return { changes: 1 }; })),
      getStructure: () => later(() => read((db) => db.feeStructure)),
      setStructure: (m) => later(() => tx((db) => {
        Object.entries(m).forEach(([c, a]) => (db.feeStructure[c] = Number(a) || 0));
        return db.feeStructure;
      }))
    },
    expenses: {
      list: () => later(() => read((db) => [...db.expenses].sort((a, b) => cmp(b.date || "", a.date || "") || b.id - a.id))),
      add: (x) => later(() => tx((db) => {
        const row = { id: ++db.seq.expenses, date: x.date, category: x.category, description: x.description, amount: Number(x.amount) || 0, paid_to: x.paid_to, mode: x.mode };
        db.expenses.push(row);
        return row;
      })),
      remove: (id) => later(() => tx((db) => { db.expenses = db.expenses.filter((r) => r.id !== id); return { changes: 1 }; }))
    },
    cert: {
      list: (type) => later(() => read((db) => db.certificates.filter((c) => c.type === type).sort((a, b) => b.id - a.id))),
      issueTC: (p) => later(() => tx((db) => {
        const number = p.number || `TC/${db.settings.session}/${bump(db, "tc")}`;
        const row = { id: ++db.seq.certificates, type: "tc", student_id: p.student_id, number, date: p.date, meta: { ...p, number } };
        db.certificates.push(row);
        const st = db.students.find((s) => s.id === p.student_id);
        if (st) st.status = "Left";
        return row;
      }))
    },
    dashboard: () => later(() => read((db) => {
      const students = db.students;
      const active = students.filter((s) => s.status === "Active");
      const feesTotal = sumFees(db, null);
      const expenseTotal = db.expenses.reduce((a, x) => a + Number(x.amount || 0), 0);
      const byClass = {};
      active.forEach((s) => (byClass[s.class] = (byClass[s.class] || 0) + 1));
      const byId = Object.fromEntries(students.map((s) => [s.id, s]));
      const recentFees = [...db.fees].sort((a, b) => b.id - a.id).filter((f) => byId[f.student_id]).slice(0, 6)
        .map((f) => ({ ...f, name: byId[f.student_id].name }));
      const recentAdmissions = [...students].sort((a, b) => (b.doa || "").localeCompare(a.doa || "")).slice(0, 6);
      return {
        totalStudents: active.length,
        leftStudents: students.length - active.length,
        feesTotal, expenseTotal, netBalance: feesTotal - expenseTotal,
        monthlyDemand: active.reduce((a, s) => a + (Number(db.feeStructure[s.class]) || 0), 0),
        tcCount: db.certificates.filter((c) => c.type === "tc").length,
        receiptCount: db.fees.length,
        byClass, recentFees, recentAdmissions
      };
    })),
    /* ---- attendance ---------------------------------------------- */
    attendance: {
      // one day for one class/section
      forDay: (date, cls, sec) => later(() => read((db) => {
        const ids = new Set(db.students.filter((s) => s.status === "Active" && s.class === cls && (!sec || s.section === sec)).map((s) => s.id));
        return db.attendance.filter((a) => a.date === date && ids.has(a.student_id));
      })),
      // whole month for one class/section — for the register grid
      forMonth: (month, cls, sec) => later(() => read((db) => {
        const ids = new Set(db.students.filter((s) => s.class === cls && (!sec || s.section === sec)).map((s) => s.id));
        return db.attendance.filter((a) => (a.date || "").startsWith(month) && ids.has(a.student_id));
      })),
      mark: (rows) => later(() => tx((db) => {
        rows.forEach(({ date, student_id, status, remark }) => {
          const found = db.attendance.find((a) => a.date === date && a.student_id === student_id);
          if (found) { found.status = status; found.remark = remark ?? found.remark; }
          else db.attendance.push({ id: ++db.seq.attendance, date, student_id, status, remark: remark || "" });
        });
        return { ok: true, count: rows.length };
      })),
      // per-student totals across a month — used by reports and marksheets
      summary: (month) => later(() => read((db) => {
        const out = {};
        db.attendance.filter((a) => (a.date || "").startsWith(month)).forEach((a) => {
          const t = (out[a.student_id] ||= { present: 0, absent: 0, late: 0, leave: 0, total: 0 });
          t.total++;
          if (a.status === "Present") t.present++;
          else if (a.status === "Absent") t.absent++;
          else if (a.status === "Late") { t.late++; t.present++; }
          else t.leave++;
        });
        return out;
      })),
      staffForDay: (date) => later(() => read((db) => db.staff_attendance.filter((a) => a.date === date))),
      staffMark: (rows) => later(() => tx((db) => {
        rows.forEach(({ date, staff_id, status }) => {
          const found = db.staff_attendance.find((a) => a.date === date && a.staff_id === staff_id);
          if (found) found.status = status;
          else db.staff_attendance.push({ id: ++db.seq.staff_attendance, date, staff_id, status });
        });
        return { ok: true };
      })),
      staffSummary: (month) => later(() => read((db) => {
        const out = {};
        db.staff_attendance.filter((a) => (a.date || "").startsWith(month)).forEach((a) => {
          const t = (out[a.staff_id] ||= { present: 0, absent: 0, total: 0 });
          t.total++;
          if (a.status === "Absent") t.absent++; else t.present++;
        });
        return out;
      }))
    },

    /* ---- timetable ------------------------------------------------ */
    timetable: {
      list: () => later(() => read((db) => db.timetable)),
      forClass: (cls, sec) => later(() => read((db) => db.timetable.filter((t) => t.class === cls && t.section === sec))),
      forTeacher: (staffId) => later(() => read((db) => db.timetable.filter((t) => Number(t.staff_id) === Number(staffId)))),
      save: (row) => later(() => tx((db) => {
        const key = (t) => `${t.class}|${t.section}|${t.day}|${t.period}`;
        const existing = db.timetable.find((t) => key(t) === key(row) && t.id !== row.id);
        if (existing) db.timetable = db.timetable.filter((t) => t.id !== existing.id);
        return upsertIn(db, "timetable", ["class", "section", "day", "period", "subject", "staff_id", "room"], row);
      })),
      remove: (id) => later(() => tx((db) => { db.timetable = db.timetable.filter((t) => t.id !== id); return { changes: 1 }; })),
      clearClass: (cls, sec) => later(() => tx((db) => {
        db.timetable = db.timetable.filter((t) => !(t.class === cls && t.section === sec));
        return { changes: 1 };
      }))
    },

    /* ---- library -------------------------------------------------- */
    library: {
      books: () => later(() => read((db) => [...db.books].sort((a, b) => cmp(a.title, b.title)))),
      saveBook: (b) => later(() => tx((db) => upsertIn(db, "books", ["code", "title", "author", "publisher", "category", "copies", "added_on"], b))),
      removeBook: (id) => later(() => tx((db) => {
        db.books = db.books.filter((b) => b.id !== id);
        db.book_issues = db.book_issues.filter((i) => i.book_id !== id);
        return { changes: 1 };
      })),
      issues: () => later(() => read((db) => [...db.book_issues].sort((a, b) => b.id - a.id))),
      issue: (rec) => later(() => tx((db) => {
        const row = {
          id: ++db.seq.book_issues, book_id: Number(rec.book_id), member_type: rec.member_type,
          member_id: Number(rec.member_id), issue_date: rec.issue_date, due_date: rec.due_date,
          return_date: "", fine: 0
        };
        db.book_issues.push(row);
        return row;
      })),
      returnBook: (id, date, fine) => later(() => tx((db) => {
        const row = db.book_issues.find((i) => i.id === id);
        if (row) { row.return_date = date; row.fine = Number(fine) || 0; }
        return row;
      })),
      removeIssue: (id) => later(() => tx((db) => { db.book_issues = db.book_issues.filter((i) => i.id !== id); return { changes: 1 }; }))
    },

    /* ---- transport ------------------------------------------------ */
    transport: {
      routes: () => later(() => read((db) => [...db.routes].sort((a, b) => cmp(a.name, b.name)))),
      saveRoute: (r) => later(() => tx((db) => upsertIn(db, "routes", ["name", "vehicle_no", "driver", "driver_phone", "fee", "stops"], r))),
      removeRoute: (id) => later(() => tx((db) => {
        db.routes = db.routes.filter((r) => r.id !== id);
        db.transport_allot = db.transport_allot.filter((a) => a.route_id !== id);
        return { changes: 1 };
      })),
      allotments: () => later(() => read((db) => db.transport_allot)),
      allot: (a) => later(() => tx((db) => {
        db.transport_allot = db.transport_allot.filter((x) => x.student_id !== Number(a.student_id));
        const row = { id: ++db.seq.transport_allot, student_id: Number(a.student_id), route_id: Number(a.route_id), stop: a.stop, from_date: a.from_date };
        db.transport_allot.push(row);
        return row;
      })),
      unallot: (studentId) => later(() => tx((db) => {
        db.transport_allot = db.transport_allot.filter((a) => a.student_id !== Number(studentId));
        return { changes: 1 };
      }))
    },

    /* ---- hostel --------------------------------------------------- */
    hostel: {
      rooms: () => later(() => read((db) => [...db.rooms].sort((a, b) => cmp(a.block, b.block) || cmp(a.room_no, b.room_no)))),
      saveRoom: (r) => later(() => tx((db) => upsertIn(db, "rooms", ["block", "room_no", "type", "capacity", "fee"], r))),
      removeRoom: (id) => later(() => tx((db) => {
        db.rooms = db.rooms.filter((r) => r.id !== id);
        db.hostel_allot = db.hostel_allot.filter((a) => a.room_id !== id);
        return { changes: 1 };
      })),
      allotments: () => later(() => read((db) => db.hostel_allot)),
      allot: (a) => later(() => tx((db) => {
        const room = db.rooms.find((r) => r.id === Number(a.room_id));
        const taken = db.hostel_allot.filter((x) => x.room_id === Number(a.room_id) && x.student_id !== Number(a.student_id)).length;
        if (room && taken >= Number(room.capacity)) return { ok: false, error: `Room ${room.room_no} is already full (${room.capacity} beds).` };
        db.hostel_allot = db.hostel_allot.filter((x) => x.student_id !== Number(a.student_id));
        const row = { id: ++db.seq.hostel_allot, student_id: Number(a.student_id), room_id: Number(a.room_id), from_date: a.from_date };
        db.hostel_allot.push(row);
        return { ok: true, row };
      })),
      unallot: (studentId) => later(() => tx((db) => {
        db.hostel_allot = db.hostel_allot.filter((a) => a.student_id !== Number(studentId));
        return { changes: 1 };
      }))
    },

    /* ---- notices, homework, events -------------------------------- */
    comms: {
      notices: () => later(() => read((db) => [...db.notices].sort(byDateDesc))),
      saveNotice: (n) => later(() => tx((db) => upsertIn(db, "notices", ["date", "title", "body", "audience", "priority", "expires"], n))),
      removeNotice: (id) => later(() => tx((db) => { db.notices = db.notices.filter((n) => n.id !== id); return { changes: 1 }; })),
      homework: () => later(() => read((db) => [...db.homework].sort(byDateDesc))),
      saveHomework: (h) => later(() => tx((db) => upsertIn(db, "homework", ["date", "class", "section", "subject", "title", "details", "due_date", "staff_id"], h))),
      removeHomework: (id) => later(() => tx((db) => { db.homework = db.homework.filter((h) => h.id !== id); return { changes: 1 }; })),
      events: () => later(() => read((db) => [...db.events].sort((a, b) => cmp(a.date || "", b.date || "")))),
      saveEvent: (e) => later(() => tx((db) => upsertIn(db, "events", ["date", "end_date", "title", "type", "venue", "description"], e))),
      removeEvent: (id) => later(() => tx((db) => { db.events = db.events.filter((e) => e.id !== id); return { changes: 1 }; }))
    },

    /* ---- payroll -------------------------------------------------- */
    payroll: {
      list: () => later(() => read((db) => [...db.payroll].sort((a, b) => cmp(b.month || "", a.month || "") || b.id - a.id))),
      save: (p) => later(() => tx((db) => {
        const rec = {
          ...p,
          basic: Number(p.basic) || 0, allowances: Number(p.allowances) || 0,
          deductions: Number(p.deductions) || 0, lop_days: Number(p.lop_days) || 0
        };
        rec.net = rec.basic + rec.allowances - rec.deductions;
        const existing = db.payroll.find((x) => x.staff_id === Number(rec.staff_id) && x.month === rec.month && x.id !== rec.id);
        if (existing) db.payroll = db.payroll.filter((x) => x.id !== existing.id);
        return upsertIn(db, "payroll", ["staff_id", "month", "basic", "allowances", "deductions", "lop_days", "net", "paid_date", "mode", "remark"], rec);
      })),
      remove: (id) => later(() => tx((db) => { db.payroll = db.payroll.filter((p) => p.id !== id); return { changes: 1 }; })),
      // build draft slips for every active staff member for a month, using their attendance
      generate: (month) => later(() => tx((db) => {
        const att = {};
        db.staff_attendance.filter((a) => (a.date || "").startsWith(month)).forEach((a) => {
          const t = (att[a.staff_id] ||= { absent: 0 });
          if (a.status === "Absent") t.absent++;
        });
        let made = 0;
        db.staff.filter((s) => s.status === "Active").forEach((st) => {
          if (db.payroll.some((p) => p.staff_id === st.id && p.month === month)) return;
          const basic = Number(st.salary) || 0;
          if (!basic) return;
          const lop = att[st.id]?.absent || 0;
          const allowances = Math.round(basic * 0.1);
          const deductions = Math.round(basic * 0.04) + Math.round((basic / 30) * lop);
          db.payroll.push({
            id: ++db.seq.payroll, staff_id: st.id, month, basic, allowances, deductions,
            lop_days: lop, net: basic + allowances - deductions, paid_date: "", mode: "Bank transfer", remark: ""
          });
          made++;
        });
        return { made };
      }))
    },

    pdf: {
      // browsers cannot write files directly: open the print dialog, where "Save as PDF" is available
      save: (html, name) => printInFrame(html, name),
      print: (html) => printInFrame(html, "")
    },
    wa: {
      status: () => Promise.resolve({ status: "web", qr: null }),
      connect: () => Promise.resolve({ status: "web", qr: null, error: "Automated bulk sending is available in the desktop app. Use Quick send here." }),
      send: () => Promise.resolve({ ok: false, error: "Automated sending is available in the desktop app only." }),
      quick: (num, text) => {
        let n = String(num || "").replace(/\D/g, "");
        if (n.length === 10) n = "91" + n;
        window.open(`https://wa.me/${n}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
        return Promise.resolve({ ok: true });
      },
      disconnect: () => Promise.resolve({ status: "web", qr: null }),
      onEvent: () => () => {}
    }
  };
}

export function installWebApiIfNeeded() {
  if (typeof window !== "undefined" && !window.api) window.api = createWebApi();
}
