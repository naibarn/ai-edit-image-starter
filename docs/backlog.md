# Backlog — v2.5 (Prioritized + Owners + SP/Hrs + Status + Unit Tests)

> ฟอร์แมตนี้ **compatible กับ Roo Code**: ใช้ตารางที่มีคอลัมน์ `Status` ชัดเจน (`Planned|InProgress|Blocked|Done`), ระบุ `Owner`, `SP`, `EstHrs`, และ **TestId/TestFiles/TestStatus** ต่อสตอรี่ เพื่อ track “เสร็จจริงหรือยัง” จากผลทดสอบ

## 🔖 Legend
- **MoSCoW**: M=Must, S=Should, C=Could, W=Won't  
- **Priority**: P1 (สูงสุด) → P4  
- **Statuses**: `Planned`, `InProgress`, `Blocked`, `Done`  
- **Owners (ตัวอย่าง)**: `DevOps`, `BE`, `FE`, `QA`  
- **SP**: Story Points, **EstHrs**: ชั่วโมงประมาณการ  
- **TestStatus**: `NotStarted | InProgress | Passed | Failed`

---

## 🧭 Critical Path (ทำตามลำดับนี้)
1) A1 → 2) A2 → 3) B1 → 4) B2-OR → 5) H1 → 6) E1 → 7) E2 → 8) E3 → 9) F1 → 10) D1/D2 → 11) C2 → 12) J

---

## 📦 Epics & Stories (พร้อมช่องสถานะ + ยูนิตเทสต์ต่อสตอรี่)

### Epic A — Project Scaffolding & Tooling
| ID | Title                      | MoSCoW | Priority | SP | EstHrs | Owner  | Status     | Deps | TestId | TestFiles                                                | TestStatus |
|----|----------------------------|--------|----------|----|--------|--------|------------|------|--------|----------------------------------------------------------|------------|
| A1 | Repo Structure & Init      | M      | P1       | 2  | 4      | DevOps | Planned    | —    | T-A1   | n/a (ตรวจด้วย lint/build)                               | NotStarted |
| A2 | Scripts & Envs (setup/run) - Baseline Green | M      | P1       | 3  | 6      | DevOps | Done       | A1   | T-A2   | backend/tests/test_scripts.py                            | Passed     |

**Unit Test Spec**
- **T-A2**: ตรวจว่า `setup_ui.(bat|sh)` สร้างโฟลเดอร์, ไฟล์ `requirements.txt`, `.env.local` ได้ (mock/parse stdout)  

---

### Epic B — Backend Core APIs (FastAPI)
| ID    | Title                                  | MoSCoW | Priority | SP | EstHrs | Owner | Status     | Deps | TestId | TestFiles                                                                         | TestStatus |
|-------|----------------------------------------|--------|----------|----|--------|------|------------|------|--------|-----------------------------------------------------------------------------------|------------|
| B1    | Storage & Static Mount                 | M      | P1       | 2  | 4      | BE   | Planned    | A2   | T-B1   | backend/tests/test_storage_static.py                                              | NotStarted |
| B2-OR | Endpoints + OpenRouter Adapter         | M      | P1       | 5  | 12     | BE   | Planned    | B1   | T-B2   | backend/tests/test_images_generate.py, backend/tests/test_images_edit.py          | NotStarted |
| B3    | Provider Override (per-request)        | S      | P2       | 2  | 4      | BE   | Planned    | B2-OR| T-B3   | backend/tests/test_provider_override.py                                           | NotStarted |

**Unit Test Spec**
- **T-B1**: `GET /images` คืนลิสต์ไฟล์เรียงล่าสุด, เส้นทาง `/static/images/<file>` ตอบ 200
- **T-B2**: 
  - `POST /images/generate` (mock provider) → ได้ 1 รูป, ฟอร์แมต/ขนาดถูก, เขียนไฟล์จริง
  - `POST /images/edit` (base + refs 2 รูป) → ได้ผลลัพธ์, บันทึกไฟล์สำเร็จ
  - `POST /images/edit` (base + mask) → ได้ผลลัพธ์
  - validation: มากกว่า 7 refs → 400, ไม่มี base ใน edit → 400
- **T-B3**: ใส่ `provider=openrouter`/`gemini-direct` แล้ว router เรียก adapter ที่ถูกต้อง (spy/mock)

---

### Epic H — Logging & Error Handling
| ID | Title                         | MoSCoW | Priority | SP | EstHrs | Owner | Status  | Deps | TestId | TestFiles                               | TestStatus |
|----|-------------------------------|--------|----------|----|--------|-------|---------|------|--------|-----------------------------------------|------------|
| H1 | Server Logging Baseline       | M      | P1       | 2  | 4      | BE    | Planned | B2-OR| T-H1   | backend/tests/test_logging_server.py    | NotStarted |
| H2 | Client → Server Logs Endpoint | S      | P2       | 1  | 2      | FE    | Planned | E3   | T-H2   | backend/tests/test_logging_client.py    | NotStarted |

**Unit Test Spec**
- **T-H1**: เมื่อเกิด exception ใน handler → มีบรรทัด `TRACEBACK` ใน `logs/app.log` (mock logger หรืออ่านไฟล์ชั่วคราว)
- **T-H2**: `POST /logs/client` รับ JSON และ append ลงไฟล์ log ได้จริง

---

### Epic E — Frontend UI (Next.js + shadcn/ui + sonner)
| ID | Title                 | MoSCoW | Priority | SP | EstHrs | Owner | Status     | Deps | TestId | TestFiles                                              | TestStatus |
|----|-----------------------|--------|----------|----|--------|-------|------------|------|--------|--------------------------------------------------------|------------|
| E1 | Form & Uploads        | M      | P1       | 5  | 12     | FE    | Planned    | A2,B2-OR | T-E1 | frontend/tests/edit-form.test.tsx                     | NotStarted |
| E2 | Presets/Controls      | M      | P1       | 2  | 6      | FE    | Planned    | E1   | T-E2   | frontend/tests/presets-controls.test.tsx              | NotStarted |
| E3 | UX Feedback & Gallery | M      | P1       | 2  | 6      | FE    | Planned    | E1   | T-E3   | frontend/tests/ux-feedback-gallery.test.tsx           | NotStarted |

**Unit Test Spec (Vitest + Testing Library)**
- **T-E1**: 
  - อัปโหลด base + refs ≤7 ผ่าน, >7 ปฏิเสธ  
  - validate prompt ≥3 ตัวอักษร  
  - ส่ง `multipart/form-data` มีฟิลด์ครบ
- **T-E2**: เปลี่ยน `mode/preset` แล้ว compose payload ตามที่ UI/BE คาด (snapshot props/requests)
- **T-E3**: แสดง toast/error เมื่อ API ล้มเหลว, progress bar ทำงาน, กริดผลลัพธ์ render และปุ่ม Download มี `href`

---

### Epic F — Frontend‑only Mode
| ID | Title                    | MoSCoW | Priority | SP | EstHrs | Owner | Status  | Deps | TestId | TestFiles                                | TestStatus |
|----|--------------------------|--------|----------|----|--------|-------|---------|------|--------|------------------------------------------|------------|
| F1 | FE-only Config & Scripts | S      | P2       | 2  | 6      | FE    | Planned | A2,B2-OR | T-F1 | frontend/tests/fe-only-config.test.ts   | NotStarted |

**Unit Test Spec**
- **T-F1**: อ่านค่า `NEXT_PUBLIC_API_BASE` จาก `.env.local` แล้วเรียก API ไปยัง URL ดังกล่าว (mock fetch) + สคริปต์ FE-only สร้างโฟลเดอร์ `public/output`

---

### Epic D — Queue (SQLite + Workers)
| ID | Title          | MoSCoW | Priority | SP | EstHrs | Owner | Status  | Deps     | TestId | TestFiles                                          | TestStatus |
|----|----------------|--------|----------|----|--------|-------|---------|----------|--------|----------------------------------------------------|------------|
| D1 | Job APIs       | S      | P2       | 3  | 10     | BE    | Planned | B2-OR,H1 | T-D1   | backend/tests/test_jobs_api.py                     | NotStarted |
| D2 | Worker Threads | S      | P2       | 3  | 10     | BE    | Planned | D1       | T-D2   | backend/tests/test_workers.py                      | NotStarted |
| E4 | FE Queue Flow  | S      | P2       | 2  | 6      | FE    | Planned | D1,D2    | T-E4   | frontend/tests/fe-queue-flow.test.tsx              | NotStarted |

**Unit Test Spec**
- **T-D1**: `POST /jobs/submit` สร้าง job สถานะ `queued`, `GET /jobs/{id}` แสดงสถานะ, ตรวจ schema ของ `result`
- **T-D2**: worker เปลี่ยนสถานะ `queued→running→done/error`, รองรับหลายงาน (mock provider ให้เร็ว)
- **T-E4**: toggle `useQueue` → submit → โพลสถานะจน `done` แล้วแสดงภาพ

---

### Epic C — Gemini‑direct Adapter (Optional)
| ID | Title                 | MoSCoW | Priority | SP | EstHrs | Owner | Status  | Deps  | TestId | TestFiles                                   | TestStatus |
|----|-----------------------|--------|----------|----|--------|-------|---------|-------|--------|---------------------------------------------|------------|
| C2 | Gemini Direct Adapter | C      | P3       | 5  | 12     | BE    | Planned | B2-OR | T-C2   | backend/tests/test_gemini_adapter.py        | NotStarted |

**Unit Test Spec**
- **T-C2**: mock response ของ Gemini → parser ดึง data URL ถูกต้อง, error-handling เมื่อไม่มีภาพ/โควต้าไม่พอ

---

### Epic J — Testing & Quality
| ID | Title                      | MoSCoW | Priority | SP | EstHrs | Owner | Status  | Deps   | TestId | TestFiles                       | TestStatus |
|----|----------------------------|--------|----------|----|--------|-------|---------|--------|--------|---------------------------------|------------|
| J1 | Unit Tests Infra (BE/FE)   | S      | P2       | 3  | 8      | QA    | Planned | A2     | T-J1   | backend/tests/conftest.py, frontend/vitest.config.ts | NotStarted |
| J2 | E2E Smoke (happy paths)    | S      | P2       | 3  | 10     | QA    | Planned | E3,B2-OR| T-J2  | e2e/smoke/*.spec.(ts|py)        | NotStarted |

**Unit Test Spec**
- **T-J1**: ติดตั้ง **pytest** ฝั่ง BE และ **Vitest + Testing Library** ฝั่ง FE, รันผ่าน CI script ได้  
- **T-J2**: สคริปต์สโม้ค: generate 1 รูป, edit+refs, edit+mask, provider override—ผ่านครบ

---

## 🧪 Testing Setup (คำสั่งมาตรฐาน)
- **Backend (pytest)**
  - เพิ่ม dev deps: `pip install pytest pytest-asyncio httpx`  
  - โครงโฟลเดอร์: `backend/tests/`  
  - รัน: `cd backend && .venv/Scripts/activate (หรือ source .venv/bin/activate) && pytest -q`
- **Frontend (Vitest + RTL)**
  - ติดตั้ง: `npm i -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`  
  - เพิ่มสคริปต์ใน `frontend/package.json`: `{ "test": "vitest run" }`  
  - โครงโฟลเดอร์: `frontend/tests/`  
- **E2E (ตัวเลือก)**: Playwright หรือ Cypress (ภายหลัง)

---

## ✅ DoR / DoD มาตรฐาน (อัปเดตเพิ่มข้อทดสอบ)
- **DoR**: Story/AC ชัดเจน, Deps ครบ, มี TestSpec/TestFiles ระบุไว้  
- **DoD**: โค้ดผ่าน Lint/Build, **Unit tests ของสตอรี่ = Passed**, Log/Errors ครบ, เอกสารถูกอัปเดต

---

## 📊 Summary Report (รวม)
- **Total SP**: 47  
- **Total Est. Hours**: 122h  
- **By Epic (SP/Hrs)**: A 5/10h · B 9/20h · H 3/6h · E 9/24h · F 2/6h · D 8/26h · C 5/12h · J 6/18h

> อัปเดตสถานะงานได้โดยแก้คอลัมน์ `Status` และ `TestStatus` ของแต่ละสตอรี่ให้เป็น `InProgress/Done` เมื่อยูนิตเทสต์ผ่านครบ