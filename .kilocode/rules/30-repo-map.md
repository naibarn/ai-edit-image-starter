# Repo Map (High-level)
- Entry points: `backend/main.py`, `frontend/src/app/page.tsx`
- Critical paths: auth, provider override, payments
- Test strategy: unit → integration → e2e (playwright)
- Known pitfalls: อย่าแตะ `*.lock`, หลีกเลี่ยงแก้ schema โดยไม่เขียน migration
