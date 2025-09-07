# roo-prompts.md — Prompts Pack for VS Code + Roo Code (Backlog-driven QA)

> เวอร์ชัน 1.0 — ใช้ร่วมกับ `backlog.md v2.5` ของโปรเจกต์นี้ เพื่อ **อ่านงาน → รันเทสต์ → อัปเดตสถานะ** อย่างเป็นระบบ
>
> **สถานะที่รองรับ** (ต้องสะกดให้ตรง):
> `Status`: `Planned | InProgress | Blocked | Done`
> `TestStatus`: `NotStarted | InProgress | Passed | Failed`

---

## 0) Bootstrapping (รันเมื่อเริ่มเซสชัน)

```
You are my repository QA/dev assistant working inside VS Code (Roo Code).
Goal: For each story in `backlog.md`, follow this loop:
1) PLAN → Read the row (ID, Title, Deps, TestFiles, TestId). If Deps not Done → mark current story Blocked and stop.
2) IMPLEMENT/TEST → If TestFiles exist, open/complete tests; else scaffold minimal tests at the indicated paths. Use the right runner:
   - Backend: activate venv then `pytest -q` in ./backend
   - Frontend: `npm run test` in ./frontend (Vitest)
3) VERIFY → Parse results → pass/fail per TestId.
4) UPDATE BACKLOG → Edit that row only: set Status & TestStatus accordingly.
5) COMMIT → Create branch `feat/<ID>-short-slug`. Commit tests+code+backlog update.
Rules:
- Always SHOW PLAN and WAIT for my approval before executing shell commands or writing files.
- Do not change any license/SPDX headers yet.
- Keep changes minimal & scoped to the story.
- When editing markdown tables, update only the specific row.
```

---

## 1) เลือก “งานถัดไปตาม Critical Path” อัตโนมัติ

```
Read `backlog.md`. Identify the next story on the Critical Path whose Status != Done and all Deps are Done.
Output a short PLAN:
- Story: <ID> <Title>
- Deps OK?: yes/no (list unmet deps)
- TestFiles: list
- Commands to run (both OS):
  - Backend (macOS/Linux): cd backend && source .venv/bin/activate && pytest -q
  - Backend (Windows):   cd backend && .\.venv\Scripts\activate && pytest -q
  - Frontend:            cd frontend && npm run test -- --reporter=verbose
Then WAIT for my confirmation.
```

---

## 2) ทำงานตาม ID ที่ระบุ (Template)

```
Target story: <ID>
Steps:
1) Open `backlog.md` and locate row ID=<ID>. Show me the row to be edited later (Status/TestStatus).
2) Check Deps. If any is not Done → set Status=Blocked with reason and STOP.
3) If Deps OK → set Status=InProgress and TestStatus=InProgress (preview the diff first).
4) From TestFiles, open or scaffold the tests for TestId. Keep tests fast and mock external providers.
5) Run tests (OS-aware). Collect summary per TestId.
6) If all pass → set Status=Done and TestStatus=Passed; else keep InProgress and TestStatus=Failed, and summarize failing specs.
7) Create branch `feat/<ID>-<kebab-short-title>` and commit changes.
Show PLAN first, then WAIT for approval.
```

---

## 3) รันเทสต์อย่างเดียว (Short Prompts)

### 3.1 Backend (pytest)

```
PLAN ONLY:
- Open terminal and run backend tests:
  - macOS/Linux: cd backend && source .venv/bin/activate && pytest -q
  - Windows:     cd backend && .\.venv\Scripts\activate && pytest -q
- Parse results → passed/failed and failing test names.
WAIT for "approve".
```

### 3.2 Frontend (Vitest)

```
PLAN ONLY:
- Open terminal and run frontend tests:
  - cd frontend && npm run test -- --reporter=verbose
- Parse results → passed/failed and failing test names.
WAIT for "approve".
```

---

## 4) สร้าง/เติม Unit Tests อัตโนมัติจาก `TestFiles`

```
From `backlog.md` row <ID>, read `TestFiles`. For each path:
- If file missing, scaffold a minimal test that asserts the contract.
Backend examples (pytest):
- test_images_generate.py → POST /images/generate (mock provider) → expect 200 + at least one ImageItem saved at frontend/public/output and backend/storage/images.
- test_images_edit.py → POST /images/edit with base (+mask or refs) → 200 + outputs saved.
- test_storage_static.py → GET /images then GET /static/images/<file> → 200.
Frontend examples (Vitest + RTL):
- edit-form.test.tsx → form validation (prompt ≥3, refs ≤7), multipart fields present.
- presets-controls.test.tsx → mode/preset affects payload shape (snapshot of request body).
- ux-feedback-gallery.test.tsx → toast on error, progress visible, download link exists.
After scaffolding, run tests and propose backlog updates (Status/TestStatus). Show diff before applying.
```

---

## 5) อัปเดต `backlog.md` (แก้เฉพาะแถวของสตอรี่)

```
Prepare a patch to update only the row for story <ID> in `backlog.md`:
- If all tests passed → Status=Done, TestStatus=Passed
- If any test failed → Status=InProgress (or Blocked with reason), TestStatus=Failed
Show the exact markdown diff (table row only), WAIT for approval, then apply.
```

---

## 6) สร้างสาขา & Commit มาตรฐาน

```
Branch: feat/<ID>-<short-kebab-title>
Conventional commits:
- tests added:   test(<ID>): add unit tests for <Title>
- code change:   fix(<ID>): satisfy contract for <Title>
- docs/status:   docs(<ID>): update backlog status to <Status>
Show the git commands (branch, add, commit). WAIT for approval before executing.
```

---

## 7) Preset Prompts ต่อสตอรี่หลัก (กรอก <ID> ให้ตรง `backlog.md`)

### 7.1 B2-OR — Endpoints + OpenRouter Adapter

```
Work on story ID=B2-OR.
Goal: Implement/verify POST /images/generate and /images/edit, plus OpenRouter adapter.
Tests:
- backend/tests/test_images_generate.py
- backend/tests/test_images_edit.py
- backend/tests/test_storage_static.py
Steps:
1) Ensure adapter parses data URLs and saves to frontend/public/output and backend/storage/images.
2) Mock provider in tests; avoid external calls.
3) Run pytest; update Status/TestStatus.
4) Branch feat/B2-OR-endpoints-openrouter and commit.
```

### 7.2 H1 — Server Logging Baseline

```
Work on story ID=H1.
Goal: RotatingFileHandler + traceback on error.
Test:
- backend/tests/test_logging_server.py
Steps: trigger a controlled exception and assert log contains traceback. Run pytest; update backlog.
```

### 7.3 E1 — Form & Uploads (Frontend)

```
Work on story ID=E1.
Goal: RHF + zod form; base required; refs ≤7; mask optional.
Tests:
- frontend/tests/edit-form.test.tsx
- frontend/tests/ux-feedback-gallery.test.tsx (basic feedback)
Run vitest; update backlog.
```

### 7.4 D1/D2/E4 — Queue Flow

```
Proceed in order: D1 → D2 → E4.
Tests:
- backend/tests/test_jobs_api.py
- backend/tests/test_workers.py
- frontend/tests/fe-queue-flow.test.tsx
Verify queued→running→done and FE polling renders results.
```

### 7.5 F1 — Frontend‑only Config & Scripts

```
Work on story ID=F1.
Test:
- frontend/tests/fe-only-config.test.ts
Verify .env consumption and API base switching; no local backend assumed.
```

### 7.6 B3 — Provider Override (per‑request)

```
Work on story ID=B3.
Test:
- backend/tests/test_provider_override.py
Verify provider=openrouter|gemini-direct is routed to the correct adapter (mock adapters).
```

---

## 8) Daily Sweep (ตรวจทั้ง backlog ประจำวัน)

```
Daily sweep:
1) Parse all tables in `backlog.md`. For each row with Status != Done:
   - Check Deps; if unmet → set Status=Blocked and add the reason in Notes (if present).
   - If TestFiles exist → plan test runs (pytest/Vitest).
2) Output a RUN PLAN (no execution yet): backend and frontend commands.
3) After approval, run tests, collect pass/fail per TestId, and propose precise backlog updates with diffs.
4) Ask to apply diffs and commit with `docs(<ID>): update backlog status` per row.
```

---

## 9) เมื่อเทสต์ล้ม (Failure Handling)

```
For story <ID> with failing tests:
1) Show failing specs and likely root cause.
2) Propose the minimal code patch (scoped to the story).
3) Show the patch diff for review. WAIT for approval.
4) Apply patch → re-run tests → update backlog row.
5) Commit with `fix(<ID>): <short description>`.
```

---

## 10) Release Readiness (ก่อนตัดรีลีส)

```
Release readiness check:
- List all stories with Status != Done.
- Ensure Done stories have TestStatus=Passed and TestFiles exist in repo.
- Verify artifacts: images at public/output, server logs exist, queue workers running when enabled.
- Output a final checklist and propose doc updates (README/QuickStart) if needed.
```

---

## Notes & Tips

* ให้ Roo Code **แสดงแผน / diff / git commands** ก่อนลงมือทุกครั้ง → ลดความเสี่ยงแก้ไฟล์ผิด
* สลับคำสั่งเปิด venv ตาม OS:
  macOS/Linux → `source .venv/bin/activate`
  Windows → `.\\.venv\\Scripts\\activate`
* เทสต์ฝั่ง Frontend ที่เรียก network → **mock fetch/axios** เพื่อไม่ยิง API จริง
* อัปเดต `backlog.md` ให้แก้เฉพาะแถวของ ID นั้นเท่านั้น
