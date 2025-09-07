# Architecture — v2.1

## 1) Overview
- **Frontend**: Next.js (App Router) + shadcn/ui + sonner + RHF + zod
- **Backend**: FastAPI + requests + python-multipart + Pillow(optional) + logging(RotatingFileHandler)
- **Providers**: OpenRouter (รวมโมเดล) หรือ Gemini API (ตรง, เปิดด้วย env)
- **Storage**: `frontend/public/output` (หลัก) + duplicate ที่ `backend/storage/images`
- **Logs**: `backend/logs/app.log` + `/logs/client`
- **Queue**: SQLite job store + in-process workers (ปรับจำนวนด้วย env)
- **Frontend-only**: UI คุยกับ backend ผ่าน `NEXT_PUBLIC_API_BASE`

## 2) Layers & Modules
- Provider Adapters: `call_openrouter`, `call_gemini` (ใช้ direct หรือ fallback ผ่าน OpenRouter)
- Image Service: สร้าง payload จาก prompt/mode/preset/base/mask/refs
- Queue Worker: claim → process → save → update job
- Logging: middleware/try-except → log file + traceback
- CORS: allow localhost:3000 + โดเมนจริงของ UI

## 3) Contracts
- ImageItem: `{ filename, url, size_bytes, created_at }`
- Jobs: `{ id, op, status, result[], error, created_at, updated_at }`

## 4) Flows
- **Edit w/ Mask & Refs**: UI → `/images/edit` หรือ `/jobs/submit` → Adapter → Save → list
- **Frontend-only**: UI (.env.local) → backend ภายนอก → return ImageItem[]

## 5) Config
- Backend `.env`: `PROVIDER=auto|openrouter|gemini|gemini-direct`, keys, `QUEUE_WORKERS`, `CORS_ALLOW_ORIGINS`
- Frontend `.env.local`: `NEXT_PUBLIC_API_BASE`, (optional) `NEXT_PUBLIC_USE_QUEUE`

## 6) Deployment
- แยก frontend/backend อิสระ
- Backend เปิด CORS ให้โดเมน UI
- ซ่อน `.env*`, หมุน log file
