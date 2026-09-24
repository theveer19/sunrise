# Sunrise Montessori School — Desktop ERP

A Windows/Mac/Linux desktop application (Electron + React + SQLite) for running a school office:
students, examinations & marksheets, transfer & other certificates, fees, expenses, a live
dashboard, and WhatsApp messaging to parents. All data is stored **locally** in a SQLite
database on the computer — no internet or account needed for day-to-day use.

---

## Features

| Module | What it does |
| --- | --- |
| **Dashboard** | Live totals — students on roll, fees collected, expenses, net balance, monthly demand, TCs issued, strength by class, recent receipts & admissions. |
| **Students** | Full admission register. Mandatory ID columns: **PEN number, Samagra ID, Aadhaar number**, plus admission no., parentage, DOB, class/section/roll, category, contact & address. Search + class filter, edit, delete. |
| **Examinations** | Create any exam (including the **Final**). Enter subject marks per student — **marks save as you type**. Auto total / percentage / grade. One click opens a **colored marksheet** to print or save as PDF. |
| **Certificates & TC** | **Transfer Certificate** (22-point, includes PEN / Samagra / Aadhaar, auto TC number, logs to a record book and marks the student *Left*), plus **Bonafide, Character and Study** certificates. Every certificate is a colored, print-ready A4 document. |
| **Fees** | Collect fees against a per-class fee structure, auto receipt numbers, receipt ledger, reprint any receipt as PDF. |
| **Expenses** | Record salaries, rent, utilities etc.; monthly totals and top-category summary. |
| **WhatsApp** | Two ways to message parents: (1) **Quick-send** — zero setup, opens WhatsApp with the message pre-filled; (2) **Automated** — link the school WhatsApp by scanning a QR, then bulk-send. Built-in templates: fee reminder, absentee alert, result declared, PTM invite, custom. |
| **Settings** | School name, address, affiliation, UDISE, board, session, principal, phone/email, monogram — these appear on every certificate and receipt. |

Every certificate & receipt supports **Print** and **Download PDF** (a real standalone A4 PDF).

---

## Requirements

- **Node.js 18 or newer** (includes npm) — https://nodejs.org
- On Windows, the first `npm install` compiles `better-sqlite3` for Electron; if it fails,
  install the free **“Desktop development with C++”** workload from Visual Studio Build Tools.

## Run in development

```bash
npm install        # installs deps + rebuilds native modules for Electron (postinstall)
npm run dev         # launches the app with hot reload
```

The database file is created automatically at the OS user-data path
(`%APPDATA%/sunrise-montessori-erp` on Windows) and is seeded with the school profile,
a fee structure, and a few sample students so every screen has data on first open.

## Build a distributable

```bash
npm run dist:win    # Windows .exe installer (NSIS) → ./release
npm run dist        # installer for the current OS (dmg on Mac, AppImage on Linux)
```

## WhatsApp notes

- **Quick-send** works immediately and needs nothing installed — it uses `wa.me` links.
- **Automated bulk sending** uses `whatsapp-web.js`, which downloads a headless Chromium on
  first install and requires a one-time QR scan (WhatsApp → Linked devices). If that package
  isn’t available the app still runs — only the automated mode is disabled; quick-send stays on.

## Tech

Electron 31 · electron-vite · React 18 · better-sqlite3 · whatsapp-web.js · PDF via Electron `printToPDF`.

Built by **OneT Digital Solutions**.
