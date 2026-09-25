/* ==================================================================== */
/*  Who can see which screens                                           */
/* ==================================================================== */
/* A staff member's role comes from their designation on the staff record,
   so the office never has to maintain a separate list of users.        */

export const ROLES = {
  admin: {
    label: "Administrator",
    note: "Full access to every screen",
    allow: "*",
  },
  accounts: {
    label: "Accounts",
    note: "Fees, expenses, payroll and reports",
    allow: ["dash", "students", "fees", "expenses", "payroll", "transport", "hostel", "reports"],
  },
  teacher: {
    label: "Teacher",
    note: "Classes, attendance, marks and homework",
    allow: ["dash", "students", "attendance", "timetable", "exams", "certs", "idcards", "library", "comms"],
  },
  office: {
    label: "Office",
    note: "Admissions, certificates and communication",
    allow: ["dash", "students", "staff", "certs", "idcards", "library", "transport", "hostel",
      "comms", "whatsapp", "letterhead"],
  },
};

const BY_DESIGNATION = {
  "Principal": "admin",
  "Vice Principal": "admin",
  "Accountant": "accounts",
  "Office Clerk": "office",
  "Receptionist": "office",
  "Librarian": "office",
};

/* Everything else — PGT, TGT, PRT, subject and activity teachers — teaches. */
export const roleOf = (staff) => {
  if (!staff) return "teacher";
  if (staff.role && ROLES[staff.role]) return staff.role;
  return BY_DESIGNATION[staff.designation] || "teacher";
};

export const canSee = (role, key) => {
  const r = ROLES[role] || ROLES.teacher;
  return r.allow === "*" || r.allow.includes(key);
};
