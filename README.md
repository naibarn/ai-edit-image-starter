[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

# AI Image Edit Starter — Next.js + FastAPI + shadcn/ui

> โมนอเรโป **Next.js (Frontend)** + **FastAPI (Backend)** สำหรับ **สร้าง/แก้ไขรูปภาพด้วย AI** รองรับอัปโหลด **ภาพหลัก**, ภาพ **อ้างอิง 1–7 รูป**, **อัปโหลด mask (PNG/alpha)**, **Presets** (Blur Background / Change Clothes / Remove Object), **เลือกผู้ให้บริการโมเดล** (OpenRouter / Gemini-direct), **ระบบคิวงาน**, **Frontend-only mode**, และ **UI สวยงามด้วย shadcn/ui + sonner**

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Tests](https://img.shields.io/badge/tests-Ready-brightgreen)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## สารบัญ

- [เดโม่ / สกรีนช็อต](#เดโม่--สกรีนช็อต)
- [คุณสมบัติเด่น (Features)](#คุณสมบัติเด่น-features)
- [สถาปัตยกรรม & เทคโนโลยี](#สถาปัตยกรรม--เทคโนโลยี)
- [โครงสร้างไดเรกทอรี (File Structure)](#โครงสร้างไดเรกทอรี-file-structure)
- [เริ่มต้นใช้งานอย่างเร็ว (TL;DR)](#เริ่มต้นใช้งานอย่างเร็ว-tldr)
- [ติดตั้ง (Installation)](#ติดตั้ง-installation)
- [การตั้งค่า (Configuration)](#การตั้งค่า-configuration)
- [ใช้งาน (Usage)](#ใช้งาน-usage)
- [สคริปต์พัฒนางาน (Development)](#สคริปต์พัฒนางาน-development)
- [ทดสอบ (Testing)](#ทดสอบ-testing)
- [ดีพลอย (Deployment)](#ดีพลอย-deployment)
- [การพัฒนาต่อ & Best Practices](#การพัฒนาต่อ--best-practices)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)
- [ผู้ดูแล (Maintainers) & ติดต่อ](#ผู้ดูแล-maintainers--ติดต่อ)

---

## เดโม่ / สกรีนช็อต

- URL (ถ้ามี): 
- สกรีนช็อต:

> เก็บรูปทั้งหมดไว้ใน `docs/assets/*` (เช่น `docs/assets/screenshot.png`)

---

## คุณสมบัติเด่น (Features)

- ✅ **Image Edit & Generation**: สร้าง/แก้ไขรูปภาพด้วย prompt
- 🖼️ **Upload หลายประเภท**: Base image + Reference 1–7 รูป + Mask (PNG/alpha)  
- 🧰 **Presets**: Blur Background / Change Clothes / Remove Object
- 🔀 **Provider Switch**: `auto | openrouter | gemini-direct` (สลับได้ใน `.env` หรือรายคำขอ)
- 🧱 **shadcn/ui + sonner**: Toast/Progress/Layouts สวยงาม ทันสมัย
- 💾 **Local-first Storage**: เซฟผลลัพธ์ที่ `frontend/public/output` และเสิร์ฟได้ทันที
- 📜 **Logging ครบ**: Server log (traceback) + Client error log endpoint
- 🧵 **Queue Jobs**: รองรับการส่งงานพร้อมกันจากหลายเครื่อง (SQLite job store + workers)
- 🧩 **Frontend-only Mode**: ติดตั้งเฉพาะ UI แล้วชี้ไป Backend กลางด้วย `NEXT_PUBLIC_API_BASE`
- 🛠️ **สคริปต์ติดตั้งพร้อม**: `setup_ui.(bat|sh)`, `setup_frontend_only.(bat|sh)`, `run_backend.bat`, `run_frontend.bat`

---

## สถาปัตยกรรม & เทคโนโลยี

```text
[Next.js Frontend :3000]  →  [FastAPI Backend :8000]  →  [Provider Adapter: OpenRouter | Gemini-direct]
                               ↘ local files: frontend/public/output, backend/storage/images
mermaid
คัดลอกโค้ด
flowchart LR
  A[Next.js (shadcn/ui + sonner)] -- REST --> B(FastAPI)
  B -- adapters --> C[(OpenRouter)]
  B -- adapters --> D[(Gemini-direct)]
  B --> E[(SQLite Jobs)]
  B --> F[/frontend/public/output/]
Frontend: Next.js (App Router), shadcn/ui, sonner, react-hook-form, zod
Backend: FastAPI, Uvicorn, python-multipart, requests, Pillow (optional), RotatingFileHandler
Testing: Vitest (FE), Pytest (BE), (E2E optional)
Docs: prd.md, architecture.md, backlog.md

โครงสร้างไดเรกทอรี (File Structure)
text
คัดลอกโค้ด
my-app/
├─ prd.md
├─ architecture.md
├─ backlog.md
├─ setup_ui.bat
├─ setup_ui.sh
├─ setup_frontend_only.bat
├─ setup_frontend_only.sh
├─ run_backend.bat
├─ run_frontend.bat
├─ backend/
│  ├─ main.py
│  ├─ requirements.txt
│  ├─ .env.example
│  ├─ logs/
│  ├─ jobs.db
│  └─ storage/
│     └─ images/
└─ frontend/
   ├─ .env.local.example
   ├─ app/
   │  ├─ layout.tsx
   │  └─ edit/page.tsx
   ├─ components/ui/sonner.tsx
   └─ public/
      └─ output/
เริ่มต้นใช้งานอย่างเร็ว (TL;DR)
<details> <summary><b>โหมดปกติ (ติดตั้ง Frontend + Backend บนเครื่องเดียว)</b></summary>
bash
คัดลอกโค้ด
# 1) ตั้งค่า API keys
cp backend/.env.example backend/.env  # แล้วแก้ค่า OPENROUTER_API_KEY และ/หรือ GEMINI_API_KEY

# 2) ติดตั้งครบชุด (Windows)
./setup_ui.bat

# 2) ติดตั้งครบชุด (macOS/Linux)
chmod +x ./setup_ui.sh && ./setup_ui.sh

# 3) รัน Backend
cd backend
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 4) รัน Frontend
cd ../frontend
npm run dev

# เปิด http://localhost:3000/edit
</details> <details> <summary><b>Frontend-only Mode (ติดตั้งเฉพาะ UI แล้วชี้ไป Backend ภายนอก)</b></summary>
bash
คัดลอกโค้ด
# Windows
./setup_frontend_only.bat https://your-backend.example.com

# macOS/Linux
chmod +x ./setup_frontend_only.sh && ./setup_frontend_only.sh https://your-backend.example.com

# รัน UI
cd frontend && npm run dev
# ตั้งค่า .env.local → NEXT_PUBLIC_API_BASE=https://your-backend.example.com
</details>
ติดตั้ง (Installation)
ข้อกำหนดพื้นฐาน: Node.js (LTS), Python 3.10+, git

Windows: ใช้ setup_ui.bat

macOS/Linux: ใช้ setup_ui.sh (อย่าลืม chmod +x)

สำหรับ Frontend-only ใช้ setup_frontend_only.(bat|sh)

การตั้งค่า (Configuration)
Backend — backend/.env
env
คัดลอกโค้ด
PROVIDER=openrouter         # openrouter | gemini-direct | auto
IMAGE_MODEL=google/gemini-2.5-flash-image-preview
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxx

# (ถ้าใช้ Gemini-direct)
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-1.5-flash

# Queue
QUEUE_WORKERS=1
QUEUE_POLL_SEC=1.0

# CORS (comma-separated)
CORS_ALLOW_ORIGINS=http://localhost:3000
Frontend — frontend/.env.local
env
คัดลอกโค้ด
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_USE_QUEUE=false
ใช้งาน (Usage)
เปิดหน้า /edit

อัปโหลด Base, (ตัวเลือก) Mask (PNG/alpha), และ References (0–7)

เลือก Mode (composite | garment_transfer | inpaint) และ Preset (ถ้าต้องการ)

ตั้งค่า ขนาด/ฟอร์แมต/จำนวนผลลัพธ์, เลือก Provider

(ตัวเลือก) เปิด Use Queue เพื่อส่งงานเข้าคิว

กด Generate / Edit → ดูความคืบหน้าบน Progress + Toast

ผลลัพธ์จะแสดงในกริด และเซฟไว้ที่ frontend/public/output (ดาวน์โหลดได้ทันที)

สคริปต์พัฒนางาน (Development)
Backend

สร้าง venv และติดตั้ง: ใช้ setup_ui.(bat|sh) หรือทำเองด้วย python -m venv .venv && pip install -r backend/requirements.txt

รันเซิร์ฟเวอร์: uvicorn main:app --reload --port 8000

สคริปต์ Windows: run_backend.bat

Frontend

ติดตั้งแพ็กเกจ: npm i

รัน Dev: npm run dev

สคริปต์ Windows: run_frontend.bat

ทดสอบ (Testing)
Backend (pytest)

ติดตั้ง dev deps: pip install pytest pytest-asyncio httpx

โฟลเดอร์: backend/tests/

ตัวอย่างไฟล์ทดสอบ:

backend/tests/test_images_generate.py

backend/tests/test_images_edit.py

backend/tests/test_storage_static.py

backend/tests/test_jobs_api.py

backend/tests/test_workers.py

รัน: cd backend && pytest -q

Frontend (Vitest + Testing Library)

ติดตั้ง: npm i -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

โฟลเดอร์: frontend/tests/

ตัวอย่างไฟล์ทดสอบ:

frontend/tests/edit-form.test.tsx

frontend/tests/presets-controls.test.tsx

frontend/tests/ux-feedback-gallery.test.tsx

frontend/tests/fe-queue-flow.test.tsx

รัน: cd frontend && npm run test

E2E (ตัวเลือก)

เลือก Playwright/Cypress ตามสะดวก

โครง: e2e/smoke/*.spec.(ts|py)

รายละเอียด Test Specs ตรงกับ backlog.md (v2.5) ซึ่งกำหนด TestId/TestFiles/TestStatus ของแต่ละสตอรี่ไว้แล้ว

ดีพลอย (Deployment)
Frontend / Backend แยกดีพลอยได้อิสระ

ตั้งค่า CORS ของ Backend ให้ครอบโดเมน Frontend (Prod)

ซ่อน .env* และจัดการ secret ด้วยวิธีที่ปลอดภัย

(ถ้ามี) Docker/Compose:

การพัฒนาต่อ & Best Practices
ใช้ Provider Adapter เพื่อรองรับผู้ให้บริการ/โมเดลใหม่ได้ง่าย

เพิ่ม Preset ใหม่ด้วยการปรับ compose instruction ใน backend

ควบคุมขนาดไฟล์อัปโหลด / timeout / retry ตามสภาพแวดล้อม

หมุนไฟล์ log (RotatingFileHandler) และติดตั้งระบบสังเกตการณ์เพิ่มเติมตามต้องการ

Troubleshooting & FAQ
CORS Error: ตรวจ CORS_ALLOW_ORIGINS ใน backend/.env ให้ตรงโดเมน Frontend

รูปไม่โชว์: ตรวจว่าไฟล์อยู่ที่ frontend/public/output และ URL อ้าง /static/images/... ถูกต้อง

คิวงานช้า: ปรับ QUEUE_WORKERS และตรวจภาระงาน/โควต้า provider

mask ไม่ถูกใจ: ให้ใช้ mask ที่มี alpha ชัดเจน และเพิ่มรายละเอียดใน prompt/preset

Security
เก็บ API keys ใน .env เท่านั้น ห้าม commit

จำกัด CORS ให้โดเมนที่จำเป็น

พิจารณา rate limit และตรวจสอบ log ผิดปกติ

Roadmap
 Draw-mask บน UI

 Queue แยกโปรเซส (Celery/RQ)

 Metadata DB & ค้นหา

 Docker/Compose ตัวเต็ม

 CI/CD (lint/test/build/deploy)

Contributing
เปิด PR/Issue ได้ตามสะดวก

กรุณาอ้างอิง backlog.md และยึด DoR/DoD ที่กำหนดไว้

Changelog
ดูไฟล์ CHANGELOG.md (จะเพิ่มภายหลัง)

License
MIT — ดูไฟล์ LICENSE

ผู้ดูแล (Maintainers) & ติดต่อ
Maintainer:

Email:

Website: