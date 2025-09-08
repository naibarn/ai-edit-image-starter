# Workspace Rules — Guardrails

## Scope & Goals
- ใช้กติกานี้กับทุกโหมด (Architect / Code / Debug / Ask)
- โฟกัสตาม `backlog.md`: ทำงานเป็น task ย่อยทีละหัวข้อ พร้อมผลลัพธ์ตรวจสอบได้
- Critical Path: A1 → A2 → B1 → B2-OR → H1 → E1 → E2 → E3 → F1 → D1/D2 → C2 → J
- DoD: Code passes Lint/Build, Unit tests = Passed, Logs/Errors complete, Docs updated

## File Boundaries
- แก้ไขได้: `backend/**`, `frontend/**`, `tests/**`, `e2e/**` (ถ้ามี)
- ห้ามแก้/ลบ: `.env*`, `*.lock`, `package-lock.json`, `poetry.lock`, `node_modules/**`, `dist/**`, `build/**`
- เพิ่มเติมห้าม: `pnpm-lock.yaml`, `yarn.lock`, `Pipfile.lock`, `.next/**`, `.pytest_cache/**`, `__pycache__/**`, `.venv/**`, `coverage/**`
- ถ้าจำเป็นต้องแตะไฟล์ต้องห้าม → ขออนุมัติทุกครั้ง

## Output Contract
- ทุกการเปลี่ยนโค้ดต้องส่ง **patch แบบ unified diff** ต่อไฟล์ + เหตุผลสั้น ๆ
- สร้าง/อัปเดต **เทสต์** เมื่อเพิ่มฟังก์ชันใหม่หรือแก้บั๊ก
- หากต้องรันคำสั่ง: แสดงคำสั่งล่วงหน้าและขออนุมัติ (no destructive commands by default)
- ไม่ commit/push จนกว่าจะยืนยัน

## Output & Cost Guard
- ทุกคำตอบจำกัด ≤ **900 tokens**
- โค้ดอ้างอิงสูงสุด 20 บรรทัดต่อไฟล์; ใช้รูปแบบอ้างอิง `[path:line]` เป็นหลัก
- **การตรวจ backlog ให้แบ่งเป็นรอบ:** **Phase 1 = A1–D2**, **Phase 2 = E1–J**
- ห้ามอ่าน `.env*`, lockfiles, build/cache เว้นแต่ฉันอนุญาต

## Task Execution Guard
- ห้ามสร้าง Subtask แบบ Ask-mode เอง เว้นแต่ฉันสั่ง “สร้าง Subtask”
- ใช้ `@file` / `@folder` จำกัดรัศมีบริบททุกครั้ง
- ถ้างานยาว ให้เสนอแผน ≤10 บรรทัดก่อน และรออนุมัติ

## Package & Command Policy
- ห้ามลบ `node_modules/**` และ **ห้ามลบ lockfiles** (`package-lock.json`, `pnpm-lock.yaml`, `poetry.lock`)
- ถ้าจำเป็นต้องติดตั้งแพ็กเกจ: ใช้ `npm ci --no-audit --no-fund` หรือ `pnpm install --frozen-lockfile`
- ห้ามรัน `rd /s /q`, `rm -rf`, `del` โดยอัตโนมัติ → ต้องขออนุมัติทุกครั้ง
- ให้ Kilo รัน **tests/build เท่านั้น** เว้นแต่ฉันอนุญาตให้ติดตั้ง

## Output/Token Guard
- จำกัดคำตอบ ≤ 900 tokens; โค้ดอ้างอิง ≤ 20 บรรทัด/ไฟล์; อ้างอิงเป็น `[path:line]`

## Testing Commands
- Backend: `cd backend && pytest -q`
- Frontend: ตรวจจาก `frontend/package.json` ก่อน  
  - ถ้ามีสคริปต์ `test`: `cd frontend && npm run test` (หรือ `pnpm test`)  
  - Build: `cd frontend && npm run build` (หรือ `pnpm build`)
- E2E: Optional (Playwright)
- เลือกตัวจัดการแพ็กเกจจาก lockfile:
  - มี `pnpm-lock.yaml` → ใช้ `pnpm`
  - มี `package-lock.json` → ใช้ `npm ci --no-audit --no-fund`
  - มี `yarn.lock` → ใช้ `yarn install --frozen-lockfile`

## Model Guidance
- Long reads (>200k tokens): ใช้ **Sonoma Sky Alpha (2M context)**
- Summary/patch: ใช้ **Grok Code Fast 1**

## Checkpoints & Git
- ใช้ Git แยกสาขา **หนึ่งงาน = หนึ่งสาขา** (เช่น `feature/<task>`)
- อนุญาต Restore Checkpoint เฉพาะไฟล์ (ไม่ย้อนแชต) เว้นแต่ฉันสั่งให้ย้อนทั้ง Task
- รูปแบบ commit: `feat(task): summary` / `fix(task): summary`

## Work Flow
- Phase 1: A1–D2
- Phase 2: E1–J

## Artifacts & Reports
- รายงานรวมให้เขียน/อัปเดตที่ `backlog_audit_report.md` และรายงานรายหัวข้อให้ใช้รูปแบบเดียวกับ `h1_report.md`
- เก็บ log คำสั่ง/ผลเทสต์ไว้ใต้ `.kilocode/logs/` (ถ้ามี)

## Network & Secrets Policy
- ห้ามเรียก production endpoints; ใช้ได้เฉพาะ `localhost` หรือ staging ที่กำหนด
- ห้ามอ่าน/เขียนค่าใน `.env*`; หากจำเป็น ให้ระบุ **ชื่อ ENV** ที่ต้องใช้เท่านั้น (ไม่แสดงค่า)
- ห้ามพิมพ์คีย์/โทเคน/PII ลงแชตหรือไฟล์
- งานที่ต้องดึงไฟล์ใหญ่/โหลดนาน ให้ขออนุมัติและอธิบายเหตุผลก่อน
