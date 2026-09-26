# Making the installer for the client

This produces a single `.exe` the client double-clicks to install. After that the
software runs offline, and every record stays on their own computer.

---

## One-time setup on your machine

You need **Node.js 18 or newer** — nodejs.org, the LTS build.

Then, in the project folder:

    npm install

`better-sqlite3` is a native module, so this step compiles it for Electron.
If it fails with an error mentioning `node-gyp`, `MSBuild` or `Visual Studio`,
install the free build tools once and run `npm install` again:

    npm install --global windows-build-tools

or install **Visual Studio Build Tools** and tick the
**"Desktop development with C++"** workload.

---

## Build the installer

    npm run dist:win

It takes three to six minutes the first time (Electron itself is downloaded).
When it finishes you get:

    release\Sunrise-Montessori-ERP-Setup-1.0.0.exe     (~85 MB)

That single file is what you send the client. Nothing else is needed — Node,
npm and the source code are not required on their computer.

### If you would rather send something with no installer

    npm run dist:portable

This gives a single `.exe` in `release\` that runs directly from a folder or a
pen drive, with nothing installed. Useful when the client's computer is locked
down by an IT policy.

---

## What to tell the client before they run it

**Windows will show a blue warning box** the first time: *"Windows protected
your PC"*. This happens to every program that is not code-signed, and a signing
certificate costs roughly ₹15,000–25,000 a year. Tell them in advance:

> Click **More info**, then **Run anyway**.

If you would rather avoid that warning, buy an OV code-signing certificate and
add it to the build. Ask me and I will set that up.

**Installing**: double-click, choose a folder (or accept the default), Install,
Finish. A desktop shortcut and a Start Menu entry are created.

**Antivirus**: some antivirus programs quarantine unsigned installers. If that
happens, ask the client to allow the file, or send it inside a password-
protected zip.

---

## Where the data lives

The database is a single file on the client's computer:

    C:\Users\<their name>\AppData\Roaming\sunrise-montessori-erp\sunrise-erp.db

Nothing is uploaded anywhere. No internet connection is needed to use the
software. It is created automatically the first time the app opens, with the
school profile, a fee structure and a few sample records so every screen has
something in it.

### Backing up — say this to the client

**That one file is the whole school's records.** If the computer is lost or the
disk fails, the data is gone with it. Tell them to copy that file to a pen drive
or Google Drive once a week. Paste this into the address bar of Explorer to
reach the folder:

    %APPDATA%\sunrise-montessori-erp

Closing the app before copying is safest.

To restore on a new computer: install the software, open it once, close it, then
replace `sunrise-erp.db` with the backup copy.

---

## Sending an update later

Change the version in `package.json` (`"version": "1.0.1"`), run
`npm run dist:win` again, and send the new setup file. Installing over the old
version keeps the data — the database is outside the program folder, and the
app adds any new tables by itself when it opens.

---

## The WhatsApp module

Automated bulk WhatsApp needs `whatsapp-web.js`, which bundles a whole Chromium
browser and would push the installer past 400 MB. It is left out of the build,
so the installer stays around 85 MB and is easy to email.

**Quick-send still works** — the button on each row opens WhatsApp with the
message already typed. This is what most schools actually use.

If the client wants automated bulk sending later, run:

    npm install whatsapp-web.js

then delete these two lines from the `build.files` list in `package.json`:

    "!**/node_modules/puppeteer*/**",
    "!**/node_modules/whatsapp-web.js/**",

and build again. The installer will then be roughly 400 MB, so send it on a
pen drive or through Google Drive rather than by email.

---

## If the build fails

**`better-sqlite3` / `node-gyp` / `MSBuild` errors** — the C++ build tools are
missing. See the setup section above.

**`electron-builder` cannot find `build/icon.ico`** — run the command from the
project folder, not from inside `src`.

**The app opens to a white window after installing** — the renderer did not get
built. Run `npm run build` on its own and look for errors, then build the
installer again.

**"Cannot find module 'better-sqlite3'" when the installed app opens** — the
native module was not unpacked. Confirm `asarUnpack` is still in `package.json`,
delete the `release` folder and build again.

Send me the error text and I will sort it out.
