# QuickStart — AI Image Edit Starter (Next.js + FastAPI + shadcn/ui)

> คู่มือเริ่มเร็วแบบ **Step‑by‑Step** สำหรับติดตั้ง/รัน/ตรวจสอบโปรเจกต์นี้บนเครื่องคุณ ทั้งโหมด **Full‑stack (Frontend + Backend)** และ **Frontend‑only**

---

## 1) เช็กลิสต์ก่อนเริ่ม (Prerequisites)

ต้องมีในเครื่อง (แนะนำเวอร์ชันเท่ากับหรือล่าสุดกว่า):

* **Node.js LTS ≥ 18** → ตรวจ `node -v`
* **npm** → ตรวจ `npm -v`
* **Python ≥ 3.10** → ตรวจ `python --version` หรือ `python3 --version`
* **Git** (ถ้าจะโคลน repo)
* พื้นที่ว่าง \~ **2–3GB**

> ถ้ายังไม่มี ให้ติดตั้ง Node.js LTS + Python ตามระบบปฏิบัติการของคุณก่อน

---

## 2) โครงโปรเจกต์ (Directory Layout)

คาดหวังโครงสร้างเริ่มต้นประมาณนี้:

```
my-app/
├─ backend/
│  ├─ main.py
│  ├─ requirements.txt
│  ├─ .env.example            # ตัวอย่างค่าแวดล้อม (คัดลอกไปเป็น .env)
│  ├─ logs/                   # ถูกสร้างอัตโนมัติเมื่อรัน
│  └─ storage/
│     └─ images/              # ที่เก็บไฟล์ผลลัพธ์ฝั่ง backend
└─ frontend/
   ├─ app/
   │  └─ edit/page.tsx        # เพจหลักสำหรับแก้/สร้างภาพ
   ├─ components/ui/          # คอมโพเนนต์ shadcn/ui + sonner
   ├─ public/
   │  └─ output/              # ไฟล์ผลลัพธ์ (เสิร์ฟโดย Next.js)
   └─ .env.local.example      # ตัวอย่างค่าแวดล้อมของ UI

setup_ui.bat                  # ติดตั้งครั้งแรก (Windows) — Frontend + Backend
setup_ui.sh                   # ติดตั้งครั้งแรก (macOS/Linux)
setup_frontend_only.bat       # ติดตั้งเฉพาะ Frontend (Windows)
setup_frontend_only.sh        # ติดตั้งเฉพาะ Frontend (macOS/Linux)
run_backend.bat               # สั่งรัน Backend (Windows)
run_frontend.bat              # สั่งรัน Frontend (Windows)
```

> ถ้าโครงไม่ตรงทั้งหมดไม่เป็นไร แต่ควรมีโฟลเดอร์ `backend/` และ `frontend/` ตามหลัก

---

## 3) เลือกโหมดการติดตั้ง

คุณมี 2 ทางเลือก (เลือกทางใดทางหนึ่ง):

### ทางเลือก A — **Full‑stack (ติดตั้ง Frontend + Backend บนเครื่องเดียว)**

เหมาะสำหรับนักพัฒนาที่จะรันครบทั้งสองฝั่งในเครื่องตัวเอง

### ทางเลือก B — **Frontend‑only (ติดตั้งเฉพาะ UI และชี้ไป Backend ภายนอก)**\นเหมาะสำหรับทีมที่มี Backend ส่วนกลางอยู่แล้ว/ไม่อยากติดตั้ง Python ในเครื่อง

---

## 4) ตั้งค่า Environment

### 4.1 Backend (`backend/.env`)

คัดลอกตัวอย่างจาก `.env.example` เป็น `.env` แล้วเติมค่า **API keys**:

```env
# Provider selection
PROVIDER=openrouter          # openrouter | gemini-direct | auto
IMAGE_MODEL=google/gemini-2.5-flash-image-preview

# OpenRouter
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxx

# Gemini direct (ถ้าใช้)
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-1.5-flash

# Queue (ตัวเลือก)
QUEUE_WORKERS=1
QUEUE_POLL_SEC=1.0

# CORS
CORS_ALLOW_ORIGINS=http://localhost:3000
```

> ขั้นแรกแนะนำใช้ `PROVIDER=openrouter` และใส่ `OPENROUTER_API_KEY`

### 4.2 Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_USE_QUEUE=false
```

* ค่า `NEXT_PUBLIC_API_BASE` คือ URL ของ Backend ที่ UI จะเรียก
* ถ้าเป็น **Frontend‑only** ให้เปลี่ยนเป็น URL ของ Backend ส่วนกลาง เช่น `https://api.example.com`

---

## 5) ติดตั้งครั้งแรก (One‑time Setup)

> รันคำสั่งจาก **โฟลเดอร์ราก** ของโปรเจกต์ (`my-app/`)

### Windows

```bat
:: ติดตั้ง Frontend + Backend
./setup_ui.bat
```

หรือ **ติดตั้งเฉพาะ Frontend** (Frontend‑only):

```bat
./setup_frontend_only.bat https://your-backend.example.com
```

### macOS / Linux

```bash
# ให้สิทธิ์สคริปต์และรันติดตั้ง Frontend + Backend
chmod +x ./setup_ui.sh
./setup_ui.sh
```

หรือ **ติดตั้งเฉพาะ Frontend** (Frontend‑only):

```bash
chmod +x ./setup_frontend_only.sh
./setup_frontend_only.sh https://your-backend.example.com
```

> สคริปต์จะสร้าง `.venv` สำหรับ Python, ติดตั้ง dependencies, เตรียมคอมโพเนนต์ shadcn/ui และโฟลเดอร์ `public/output`

---

## 6) รันเซิร์ฟเวอร์ (Development)

เปิดเทอร์มินัล 2 อัน (Backend กับ Frontend)

### 6.1 Backend (FastAPI)

**Windows**

```bat
cd backend
./.venv/Scripts/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**macOS/Linux**

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 6.2 Frontend (Next.js)

```bash
cd frontend
npm run dev
# เปิดเบราว์เซอร์: http://localhost:3000/edit
```

---

## 7) Smoke Test (ทดสอบเร็ว 3 นาทีรู้เรื่อง)

### 7.1 ตรวจสุขภาพ Backend

* เปิด `http://localhost:8000/` → ควรได้ JSON สเตตัส
* ดึงรายการรูปว่าง ๆ:

  ```bash
  curl http://localhost:8000/images
  # คาดว่าจะได้ [] ถ้ายังไม่มีไฟล์
  ```

### 7.2 ทดสอบ UI

1. เปิด `http://localhost:3000/edit`
2. อัปโหลด **Base Image** 1 รูป
3. (ตัวเลือก) อัปโหลด **References** 1–7 รูป และ/หรือ **Mask (PNG/alpha)**
4. ตั้งค่า Mode/Preset/ขนาด/ฟอร์แมต/จำนวน
5. กด **Generate / Edit**
6. รอ Toast + Progress จากนั้นรูปจะไปแสดงในกริด และกด **Download** ได้

### 7.3 ตรวจไฟล์ผลลัพธ์

* ฝั่ง Frontend: `frontend/public/output/*.png|webp|jpg`
* ฝั่ง Backend: `backend/storage/images/*.png|webp|jpg`
* URL เสิร์ฟโดย backend: `http://localhost:8000/static/images/<filename>`

---

## 8) โหมด Frontend‑only (ไม่มี Backend ในเครื่อง)

1. รันสคริปต์ `setup_frontend_only.(bat|sh)` พร้อม URL Backend ส่วนกลาง
2. ตั้งค่า `frontend/.env.local` → `NEXT_PUBLIC_API_BASE=https://your-backend.example.com`
3. รัน `npm run dev` ในโฟลเดอร์ `frontend`
4. ให้ Backend ปลายทาง **อนุญาต CORS** สำหรับโดเมน UI ของคุณ

---

## 9) Troubleshooting (อาการยอดฮิต)

| อาการ                        | สาเหตุพบบ่อย                          | วิธีแก้เร็ว                                                                      |
| ---------------------------- | ------------------------------------- | -------------------------------------------------------------------------------- |
| **CORS error** ใน Console    | `CORS_ALLOW_ORIGINS` ไม่ครอบโดเมน UI  | เติม `http://localhost:3000` หรือโดเมนจริงใน `backend/.env` แล้วรีสตาร์ต backend |
| สร้างรูปไม่ขึ้น / 401/403    | API key ของ provider ไม่ถูก/หมดสิทธิ์ | ตรวจ `OPENROUTER_API_KEY` / `GEMINI_API_KEY` ใน `backend/.env`                   |
| 404 ที่ `/static/images/...` | ยังไม่มีไฟล์หรือ path ไม่ตรง          | ลอง Generate ใหม่ และเช็คว่า mount `/static` และโฟลเดอร์ `storage/images` มีไฟล์ |
| UI ไม่เห็นผลลัพธ์            | `NEXT_PUBLIC_API_BASE` ชี้ผิด         | ตรวจค่าใน `frontend/.env.local` ให้ถูกต้อง                                       |
| คิวงานช้า                    | workers น้อย / โควต้าโมเดลจำกัด       | เพิ่ม `QUEUE_WORKERS` หรือทดสอบลด `width/height` และ `n`                         |

> ถ้ายังไม่ได้ ให้ดู `backend/logs/app.log` (ถ้ามี) และ Network tab ของเบราว์เซอร์เพื่อดูรายละเอียด error

---

## 10) Testing (ทางเลือก แนะนำหลังรันได้แล้ว)

### Backend — Pytest

```bash
pip install pytest pytest-asyncio httpx
cd backend && pytest -q
```

* โฟลเดอร์ตัวอย่าง: `backend/tests/`
* ทดสอบหลัก: `/images/generate`, `/images/edit`, `/images`, logging, queue (ถ้าเปิดใช้)

### Frontend — Vitest + Testing Library

```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
cd frontend && npm run test
```

* โฟลเดอร์ตัวอย่าง: `frontend/tests/`
* ทดสอบหลัก: ฟอร์มอัปโหลด/validation, preset/controls, toasts/progress/galleries

---

## 11) คำสั่งที่ใช้บ่อย (Cheat‑sheet)

```bash
# Backend
cd backend
source .venv/bin/activate        # Windows: ./.venv/Scripts/activate
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm run dev

# เปลี่ยนพอร์ต Frontend ชั่วคราว
PORT=3001 npm run dev
```

---

## 12) ความปลอดภัย & การตั้งค่า (Security & Config)

* เก็บ **API keys** ในไฟล์ `.env` เท่านั้น ห้าม commit
* ปรับ **CORS** เฉพาะโดเมนที่จำเป็นก่อนดีพลอยจริง
* พิจารณาตั้งค่า **timeout/size limit** ของอัปโหลดภาพตามสภาพแวดล้อม

---

## 13) License & SPDX

* โปรเจกต์ใช้ **MIT License** → ดูไฟล์ [`LICENSE`](./LICENSE)
* แผนการเติมหัวไฟล์แบบ SPDX (เพื่อเครื่องมืออ่านได้): `SPDX-License-Identifier: MIT`
  *(จะดำเนินการในอนาคต — ติดตามใน README/Backlog)*

---

## 14) Next Steps (แนะนำหลังจากรันขึ้นแล้ว)

* ลอง **Presets** (Blur Background / Change Clothes / Remove Object)
* ทดลอง **Mask (PNG/alpha)** เพื่อแก้เฉพาะจุด (Inpaint)
* เปิดใช้ **Queue** เมื่อมีการสั่งงานพร้อมกันหลายเครื่อง
* เพิ่ม/สลับ **Provider** ผ่าน `.env` หรือส่งพารามิเตอร์ `provider`
* อ่านรายละเอียดงานทั้งหมดใน [`backlog.md`](./backlog.md) และสถาปัตยกรรมใน [`architecture.md`](./architecture.md)

---

## 15) ภาคผนวก: ตัวอย่างไฟล์ .env (อ้างอิง)

**`backend/.env`**

```env
PROVIDER=openrouter
IMAGE_MODEL=google/gemini-2.5-flash-image-preview
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxx
CORS_ALLOW_ORIGINS=http://localhost:3000
QUEUE_WORKERS=1
QUEUE_POLL_SEC=1.0
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_USE_QUEUE=false
```

---

> เสร็จแล้ว! หากต้องการคู่มือเชิงลึกเพิ่มเติม ดู `README.md` (ภาพรวมโปรเจกต์), `prd.md` (ความต้องการ), `architecture.md` (โครงสร้าง) และ `backlog.md` (แผนงาน/สถานะ)
