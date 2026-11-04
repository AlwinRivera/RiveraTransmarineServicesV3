# Rivera Transmarine Services: demo

A working demo of the vessel scheduling system, built to show the owner how it will work.
It uses made-up sample data that lives only in the browser. Nothing is sent anywhere.

## Run it on your computer

You need Node.js 22 (or 20.19 and newer). Check with `node -v`.

```
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

## Put it on GitHub Pages (free)

1. Create a new **public** repository on GitHub, for example `rivera-demo`.
2. In this folder, run:
   ```
   git init
   git add .
   git commit -m "Rivera Transmarine demo"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/rivera-demo.git
   git push -u origin main
   ```
3. On GitHub, open the repository's **Settings**, then **Pages**, and set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and wait for "Deploy demo to GitHub Pages" to finish (about 1 minute).
   If it ran before step 3 and failed, click it and choose **Re-run all jobs**.
5. The demo is live at `https://YOUR-USERNAME.github.io/rivera-demo/`.

Every later `git push` updates the site automatically.

Free GitHub Pages sites are public, so keep only made-up data in the demo.

## Install it on a phone

- **Android (Chrome):** open the link, tap the menu, then **Install app** or **Add to Home screen**.
- **iPhone (Safari):** open the link, tap **Share**, then **Add to Home Screen**.

## What to show

- **Owner:** the Today screen shows where every vessel is and what needs attention.
- **Fleet calendar:** try booking a vessel on dates it's already taken. The system blocks it.
- **Captain (Capt. Arnel):** answer the readiness check. The warning on the owner's screen clears.
- **Captain (Capt. Nonoy):** mark the delayed trip as arrived.
- **Any booking:** Open the tracking page to see what the client sees.
- **Side panel:** tap any bar on the calendar or any booking in a list. It opens beside the page, so you can change its status without losing your place.
- **Display settings** (the sliders icon at the top): bigger text, dark mode, and for captains, sun mode for reading in bright sunlight.
- **No signal:** turn on airplane mode on the captain's phone and tap Ready. It says the update is saved on the phone, then confirms when it reaches the office.
- **Playbook:** the owner's know-how, written down: clients, pricing, vessels, ports, crew, and his house rules. Notes linked to a client or vessel also show on that page.
- **Interview the owner:** a guided list of 20 questions. Record the conversation on your phone, then type the key points; each answer goes into the Playbook.
- **Handover plan** (owner only): 14 steps across knowledge, people, legal, money and documents, so the business can keep running without him.
- **Settings:** Reset demo data puts everything back.

## How the code is organized

```
src/
  types.ts         the shape of every record (matches the planned Firestore collections)
  data/rules.ts    business rules: statuses, double-booking check, what needs attention
  data/sample.ts   the made-up sample data
  data/continuity.ts  Playbook topics, interview questions, handover checklist
  data/store.tsx   saving and loading; the only file that changes when Firebase is added
  pages/           one file per screen
  components/      shared pieces: layout, status badge, booking side panel, display menu
  lib/prefs.tsx    text size and sun mode, saved on each device
```
