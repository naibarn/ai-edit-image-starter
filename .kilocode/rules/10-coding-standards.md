# Coding Standards
- Python: `black`, `ruff`, `pytest -q`
- JS/TS: `pnpm build`, `pnpm test -c`, `eslint --max-warnings=0`
- API: เขียน docstring/tsdoc ทุก public function
- Error handling: หลีกเลี่ยง `print` ตรง ๆ → ใช้ logger ที่โปรเจกต์กำหนด

## JS/TS Standards
- Package manager: เลือกจาก lockfile
  - มี `pnpm-lock.yaml` → ใช้ `pnpm`
  - มี `package-lock.json` → ใช้ `npm`
  - มี `yarn.lock` → ใช้ `yarn`
- Build: `<pm> build`
- Test: `<pm> test` (ใช้ `-c` ถ้ามีในสคริปต์)
- Lint: `eslint --max-warnings=0`
- Node baseline: **v20 LTS** (แนะนำใส่ `.nvmrc`/`.node-version`)

- Python baseline: **3.11**
- `pyproject.toml` → ใส่ `requires-python = ">=3.11,<3.12"` (หรือช่วงที่โปรเจกต์รองรับ)
- Format: `black` (line-length 88), Lint: `ruff` (fail on error), Test: `pytest -q`
