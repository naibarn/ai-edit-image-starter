# Product Requirements Document (PRD) — v2.1

## 1) Product Summary
เว็บแอปสำหรับ **สร้าง/แก้ไขภาพด้วย AI** รองรับทั้งการสร้างจากข้อความและแก้ไขจากภาพอินพุต โดยสามารถ
- อัปโหลด **ภาพหลัก (base image)**
- เพิ่ม **ภาพอ้างอิง (reference) 1–7 รูป** เพื่อผสานสไตล์/องค์ประกอบ
- อัปโหลด **mask (PNG/alpha)** เพื่อกำหนดบริเวณแก้ไขแบบเฉพาะจุด (inpaint)
- เลือก **Preset** ได้: `Blur Background`, `Change Clothes`, `Remove Object`
- เลือก **Mode**: `composite`, `garment_transfer`, `inpaint`
- เลือกผู้ให้บริการโมเดลจาก **config**: `OpenRouter` หรือ `Gemini API` (ตรง) และ override รายคำขอได้
- **UI ครอบด้วย shadcn/ui + sonner** (toast) + **progress bar**
- ผลลัพธ์ภาพถูกบันทึกแบบ **local** ที่ `frontend/public/output` และเสิร์ฟผ่าน Next.js โดยตรง
- **Frontend-only Mode**: ติดตั้งเฉพาะ Frontend แล้วชี้ API ไป backend ภายนอกได้ผ่าน `NEXT_PUBLIC_API_BASE`
- มี **logging เป็นไฟล์** (traceback + timestamp) ที่ `backend/logs/app.log`
- สคริปต์ติดตั้งครั้งแรกทั้ง **Windows (`.bat`)** และ **macOS/Linux (`.sh`)** สร้าง `.venv` แยก

## 2) Goals / Non-goals
**Goals**
- ใช้งานง่าย ตั้งค่าเร็ว ทำงานได้ครบ: generate, edit (base + refs + mask)
- เก็บผลลัพธ์ไว้ local และดาวน์โหลดได้ทันที
- มีระบบ log เพื่อตรวจสอบปัญหาได้สะดวก (server + client)
- รองรับ queue สำหรับหลายเครื่องยิงพร้อมกัน
- รองรับ **Frontend-only** เมื่อมี backend ส่วนกลาง

**Non-goals**
- ยังไม่ทำ auth/role-based, ไม่โฟกัสรีทัชโปรสตูดิโอขั้นสูง

## 3) Personas
- **Creator**: แก้ภาพเร็ว ๆ ด้วย preset
- **Dev/Automation**: ต่อ workflow ง่าย (queue/job)
- **IT Admin**: ให้ทีมใช้ frontend เดียว ยิงไป backend กลาง

## 4) Use Cases
- Generate hero image จาก prompt
- Garment transfer ใส่ชุดจากภาพอ้างอิง
- Inpaint ลบวัตถุ/เบลอพื้นหลังด้วย mask
- Composite หลายอ้างอิงลงภาพหลัก
- ใช้งาน Frontend-only ชี้ backend ภายนอก

## 5) User Stories
- [GEN-01] ใส่ prompt → Generate
- [EDIT-01] อัปโหลด base + refs(≤7) + เลือก mode/preset → Edit
- [EDIT-02] แนบ mask (PNG/alpha) → แก้เฉพาะจุด
- [UI-01] เห็น progress + toast
- [DL-01] โหลดภาพผลลัพธ์จากกริดได้
- [CONF-01] สลับ provider ได้ (env/override)
- [LOG-01] server log ลงไฟล์ app.log พร้อม traceback
- [LOG-02] client error ส่งเข้า `/logs/client`
- [FE-ONLY-01] ใช้งาน Frontend-only ตั้ง `NEXT_PUBLIC_API_BASE` ได้

## 6) Functional Requirements
### 6.1 Endpoints (Backend)
1) `POST /images/generate` — form-data: `prompt,width,height,fmt(n≤4),provider?`
2) `POST /images/edit` — multipart: `prompt,mode,preset?,width,height,fmt,n,base(mask,refs[]≤7),provider?`
   - **Validation**: base required, refs ≤7, mask required only for inpaint mode
   - **Format normalization**: jpeg → jpg, png/webp/jpg supported
3) `GET /images` — รายการ ImageItem ล่าสุด (sorted by mtime desc)
4) `POST /logs/client` — รับ error จาก UI (tolerant to content-type, handles malformed JSON)
5) Queue: `POST /jobs/submit`, `GET /jobs/{id}`, `GET /jobs`
   - **Job processing**: Logs failures with job_id and exception message
   - **Worker lifecycle**: Proper thread management with stop_event and locks

### 6.2 UI (Next.js)
- **Layout Structure**: Root layout (app/layout.tsx) contains only one `<html>/<body>` pair with suppressHydrationWarning
- **Segment Layouts**: app/edit/layout.tsx uses only `<div className="min-h-dvh">{children}</div>` (no nested html/body)
- **Global CSS**: globals.css imported once in root layout, contains Tailwind directives and custom styles
- **Tailwind Config**: darkMode: "class", proper content paths, complete color palette for shadcn/ui
- เพจ `/edit`: Modern grid-based layout with header, sidebar, main panel, and gallery
- **Header**: App title + Dark/Light mode toggle (Radix Switch)
- **Sidebar**: Tabbed interface with Modes (composite/garment_transfer/inpaint) + Settings (presets/providers)
- **Main Panel**: Upload base/ref/mask + prompt/ขนาด/ฟอร์แมต/จำนวน + provider + queue toggle + progress bar
- **Gallery**: Animated cards with hover effects (Framer Motion) + download buttons
- ปุ่ม Generate + progress + toast + responsive design + accessibility (ARIA labels, keyboard navigation)

### 6.3 Storage
- `frontend/public/output/*.{png,webp,jpg}` (เสิร์ฟโดย Next.js)
- duplicate ที่ `backend/storage/images` เพื่อความเข้ากัน

### 6.4 Frontend-only Mode
- `NEXT_PUBLIC_API_BASE` ชี้ backend ภายนอก
- สคริปต์ `setup_frontend_only.*` ติดตั้ง UI อย่างเดียว

## 7) Non-Functional
Security (env + CORS), Reliability (timeout/try-except), Performance (ถึง 2048²), DX (สคริปต์ครบ), Privacy (local-first)

## 8) Risks
แตกต่างรูปแบบผลลัพธ์แต่ละ provider, model ไม่เคารพ mask 100%, rate limit → แจ้งผล + (queue)

## 9) Acceptance
ทุกโหมดทำงาน, provider-switch ใช้ได้, บันทึกไฟล์/output, progress+toast, logging ครบ, frontend-only ใช้ได้, สคริปต์รันได้

## 10) DoD
เอกสารตรงกับโค้ด, smoke test ครบ (generate/edit/mask/preset/provider/queue/logging/frontend-only)
