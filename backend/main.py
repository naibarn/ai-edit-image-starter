import os
import re
import uuid
import json
import time
import base64
import sqlite3
import pathlib
import threading
import logging
from logging.handlers import RotatingFileHandler
from typing import List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import requests
from dotenv import load_dotenv

# ----------------- Load env & paths -----------------
load_dotenv()
BASE_DIR = pathlib.Path(__file__).parent
REPO_ROOT = BASE_DIR.parent
FRONTEND_PUBLIC = REPO_ROOT / "frontend" / "public"
OUTPUT_DIR = pathlib.Path(os.getenv("OUTPUT_DIR") or (FRONTEND_PUBLIC / "output"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

STORAGE_DIR = BASE_DIR / "storage"
IMAGES_DIR = STORAGE_DIR / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = BASE_DIR / "jobs.db"

# Provider config
PROVIDER = os.getenv("PROVIDER", "openrouter")  # openrouter | gemini-direct | auto
IMAGE_MODEL = os.getenv("IMAGE_MODEL", "google/gemini-2.5-flash-image-preview")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# Queue config
QUEUE_WORKERS = int(os.getenv("QUEUE_WORKERS", "1"))
QUEUE_POLL_SEC = float(os.getenv("QUEUE_POLL_SEC", "1.0"))

# CORS
CORS_ALLOW = [o.strip() for o in os.getenv("CORS_ALLOW_ORIGINS", "*").split(",") if o.strip()]

# ----------------- Logging -----------------
logger = logging.getLogger("app")
logger.setLevel(logging.INFO)
fh = RotatingFileHandler(LOGS_DIR / "app.log", maxBytes=5_000_000, backupCount=3)
fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
fh.setFormatter(fmt)
logger.addHandler(fh)

# ----------------- FastAPI -----------------
app = FastAPI(title="ImageGen Backend + Queue + Providers")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW if CORS_ALLOW != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize app state with default directories
app.state.output_dir = OUTPUT_DIR
app.state.images_dir = IMAGES_DIR
app.state.storage_dir = STORAGE_DIR

# Function to update static mount (used in tests)
def update_static_mount():
    app.router.routes = [route for route in app.router.routes if not isinstance(route, StaticFiles)]
    app.mount("/static", StaticFiles(directory=str(app.state.storage_dir)), name="static")

# Initial static mount
update_static_mount()

# ----------------- Models -----------------
class ImageItem(BaseModel):
    filename: str
    url: str
    size_bytes: int
    created_at: float

class JobItem(BaseModel):
    id: str
    op: str        # generate | edit
    status: str    # queued | running | done | error
    result: Optional[List[ImageItem]] = None
    error: Optional[str] = None
    created_at: float
    updated_at: float

# ----------------- Utilities -----------------
DATA_URL_RE = re.compile(r"^data:image/[^;]+;base64,(?P<b64>.+)$")

def _now() -> float:
    return time.time()

def _save_bytes(raw: bytes, fmt: str = "png") -> ImageItem:
    name = f"{uuid.uuid4().hex}.{fmt}"
    # 1) Save to frontend/public/output
    out1 = OUTPUT_DIR / name
    with open(out1, "wb") as f:
        f.write(raw)
    # 2) Duplicate to backend/storage/images
    out2 = IMAGES_DIR / name
    with open(out2, "wb") as f:
        f.write(raw)
    st = out2.stat()
    return ImageItem(filename=name, url=f"/static/images/{name}", size_bytes=st.st_size, created_at=st.st_mtime)

def _save_data_url(data_url: str, fmt: str = "png") -> ImageItem:
    m = DATA_URL_RE.match(data_url)
    if not m:
        raise ValueError("Invalid data URL")
    raw = base64.b64decode(m.group("b64"))
    return _save_bytes(raw, fmt)

def _db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def _db_init():
    with _db() as c:
        c.execute("""
          CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            op TEXT NOT NULL,
            params TEXT NOT NULL,
            status TEXT NOT NULL,
            result TEXT,
            error TEXT,
            created_at REAL NOT NULL,
            updated_at REAL NOT NULL
          )
        """)
        c.commit()

# ----------------- Providers -----------------
def call_openrouter(contents: List[dict], fmt: str) -> List[ImageItem]:
    if not OPENROUTER_API_KEY:
        raise HTTPException(500, "Missing OPENROUTER_API_KEY")
    payload = {
        "model": IMAGE_MODEL,
        "messages": [{"role": "user", "content": contents}],
        "modalities": ["image", "text"],
    }
    headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
    r = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=180)
    if r.status_code >= 400:
        logger.error("OpenRouter error %s: %s", r.status_code, r.text)
        raise HTTPException(r.status_code, r.text)
    data = r.json()
    images = (data.get("choices", [{}])[0].get("message", {}).get("images") or [])
    items: List[ImageItem] = []
    for img in images:
        data_url = (img.get("image_url") or {}).get("url")
        if data_url:
            try:
                items.append(_save_data_url(data_url, fmt))
            except Exception as e:
                logger.exception("save image failed: %s", e)
    if not items:
        raise HTTPException(500, f"No images parsed: {data}")
    return items

def call_gemini_direct(contents: List[dict], fmt: str) -> List[ImageItem]:
    """
    Gemini direct (experimental). ต้องการ GEMINI_API_KEY.
    หมายเหตุ: endpoint/โครงสร้างอาจเปลี่ยนได้ ให้ปรับตามเวอร์ชัน API จริงของคุณ
    """
    if not GEMINI_API_KEY:
        raise HTTPException(500, "Missing GEMINI_API_KEY")
    # แปลง contents เป็นโครงสร้าง parts ของ Gemini (text + inline_data)
    parts = []
    for c in contents:
        if c.get("type") == "text":
            parts.append({"text": c["text"]})
        elif c.get("type") == "image_url":
            url = c["image_url"]["url"]
            m = DATA_URL_RE.match(url)
            if not m:
                raise HTTPException(400, "Gemini direct requires data URL for images")
            img_bytes = base64.b64decode(m.group("b64"))
            parts.append({"inline_data": {"mime_type": "image/png", "data": base64.b64encode(img_bytes).decode()}})
    body = {"contents": [{"parts": parts}]}
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    r = requests.post(endpoint, json=body, timeout=180)
    if r.status_code >= 400:
        logger.error("Gemini error %s: %s", r.status_code, r.text)
        raise HTTPException(r.status_code, r.text)
    data = r.json()
    # ขึ้นกับ model: ที่นี่สมมติ response เป็น data URL ใน text (กรณีรุ่นที่คืนรูปเป็น base64 ให้ปรับ parser)
    items: List[ImageItem] = []
    try:
        candidates = data.get("candidates") or []
        # หา data URL ในข้อความผลลัพธ์ (กรณีโมเดลคืนลิงก์/บีส64ใน text)
        for cand in candidates:
            for p in cand.get("content", {}).get("parts", []):
                txt = p.get("text", "")
                if "data:image" in txt:
                    # หยิบเฉพาะ data URL ตัวแรก
                    match = re.search(r"(data:image/[^;]+;base64,[A-Za-z0-9+/=]+)", txt)
                    if match:
                        items.append(_save_data_url(match.group(1), fmt))
    except Exception as e:
        logger.exception("parse gemini response failed: %s", e)
    if not items:
        raise HTTPException(500, f"No images parsed from Gemini: {data}")
    return items

def call_provider(contents: List[dict], fmt: str, provider_override: Optional[str]) -> List[ImageItem]:
    p = (provider_override or PROVIDER or "openrouter").lower()
    if p in ("openrouter", "auto"):
        return call_openrouter(contents, fmt)
    elif p in ("gemini", "gemini-direct"):
        return call_gemini_direct(contents, fmt)
    else:
        return call_openrouter(contents, fmt)

# ----------------- Helpers for prompts -----------------
def compose_instruction(prompt: str, mode: str, preset: Optional[str], width: int, height: int, fmt: str) -> str:
    preset_note = ""
    if preset == "blur_bg":
        preset_note = "Apply a natural, depth-aware background blur while keeping the subject sharp."
    elif preset == "change_clothes":
        preset_note = "Use garments from the reference images and put them on the subject in the base image."
    elif preset == "remove_object":
        preset_note = "Remove the specified object(s) cleanly and inpaint the region to match surroundings."

    if mode == "garment_transfer":
        task = "Garment/clothing style transfer using the reference image(s); preserve identity, pose, and lighting."
    elif mode == "inpaint":
        task = "Inpaint the masked region while preserving context and lighting consistency."
    else:
        task = "Composite relevant elements from the reference image(s) onto the base image naturally."

    lines = [
        task,
        f"Preset: {preset or 'none'} - {preset_note}" if preset_note else f"Preset: {preset or 'none'}",
        f"Prompt: {prompt}",
        f"Target size: {width}x{height}, output: {fmt}."
    ]
    return "\n".join(lines)

# ----------------- API: Images -----------------
@app.get("/images", response_model=List[ImageItem])
def list_images():
    items: List[ImageItem] = []
    images_dir = app.state.images_dir
    for p in sorted(pathlib.Path(images_dir).glob("*"), key=lambda x: x.stat().st_mtime, reverse=True):
        if p.is_file():
            st = p.stat()
            items.append(ImageItem(filename=p.name, url=f"/static/images/{p.name}", size_bytes=st.st_size, created_at=st.st_mtime))
    return items

@app.post("/images/generate", response_model=List[ImageItem])
async def generate_image(
    prompt: str = Form(...),
    width: int = Form(1024),
    height: int = Form(1024),
    fmt: str = Form("png"),
    n: int = Form(1),
    provider: Optional[str] = Form(None),
):
    try:
        instruction = compose_instruction(prompt, "composite", None, width, height, fmt)
        contents = [{"type": "text", "text": instruction}]
        items = call_provider(contents, fmt, provider)
        return items[: n]
    except Exception as e:
        logger.exception("generate_image failed: %s", e)
        raise

@app.post("/images/edit", response_model=List[ImageItem])
async def edit_image(
    prompt: str = Form(...),
    mode: str = Form("composite"),          # composite | garment_transfer | inpaint
    preset: Optional[str] = Form(None),     # blur_bg | change_clothes | remove_object | none
    width: int = Form(1024),
    height: int = Form(1024),
    fmt: str = Form("png"),
    n: int = Form(1),
    base: UploadFile = File(...),
    mask: Optional[UploadFile] = File(None),
    refs: Optional[List[UploadFile]] = File(None),
    provider: Optional[str] = Form(None),
):
    try:
        base_b = await base.read()
        base_url = f"data:{base.content_type};base64," + base64.b64encode(base_b).decode()

        ref_urls: List[str] = []
        if refs:
            for rf in refs[:7]:
                rb = await rf.read()
                ref_urls.append(f"data:{rf.content_type};base64," + base64.b64encode(rb).decode())

        mask_url = None
        if mask is not None:
            mb = await mask.read()
            mime = mask.content_type or "image/png"
            mask_url = f"data:{mime};base64," + base64.b64encode(mb).decode()

        instruction = compose_instruction(prompt, mode, preset, width, height, fmt)
        contents: List[dict] = [{"type": "text", "text": instruction},
                                {"type": "image_url", "image_url": {"url": base_url}}]
        if mask_url:
            contents.append({"type": "image_url", "image_url": {"url": mask_url}})
        for u in ref_urls:
            contents.append({"type": "image_url", "image_url": {"url": u}})

        items = call_provider(contents, fmt, provider)
        return items[: n]
    except Exception as e:
        logger.exception("edit_image failed: %s", e)
        raise

# ----------------- API: Client logging -----------------
@app.post("/logs/client")
async def client_log(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    logger.error("CLIENT_LOG %s", json.dumps(data))
    return {"ok": True}

# ----------------- Queue APIs -----------------
@app.post("/jobs/submit", response_model=JobItem)
async def submit_job(
    op: str = Form(...),                    # generate | edit
    prompt: str = Form(...),
    width: int = Form(1024),
    height: int = Form(1024),
    fmt: str = Form("png"),
    n: int = Form(1),
    mode: Optional[str] = Form("composite"),
    preset: Optional[str] = Form(None),
    base: Optional[UploadFile] = File(None),
    mask: Optional[UploadFile] = File(None),
    refs: Optional[List[UploadFile]] = File(None),
    provider: Optional[str] = Form(None),
):
    jid = uuid.uuid4().hex
    created = _now()
    job_dir = STORAGE_DIR / "queue" / jid
    job_dir.mkdir(parents=True, exist_ok=True)
    params = {
        "op": op, "prompt": prompt, "width": width, "height": height, "fmt": fmt, "n": n,
        "mode": mode, "preset": preset, "provider": provider,
        "base_path": None, "mask_path": None, "ref_paths": [],
    }

    if op == "edit":
        if base is None:
            raise HTTPException(400, "base image required for edit")
        bbytes = await base.read()
        bpath = job_dir / f"base_{uuid.uuid4().hex}.png"
        with open(bpath, "wb") as f:
            f.write(bbytes)
        params["base_path"] = str(bpath)
        if mask is not None:
            mbytes = await mask.read()
            mpath = job_dir / f"mask_{uuid.uuid4().hex}.png"
            with open(mpath, "wb") as f:
                f.write(mbytes)
            params["mask_path"] = str(mpath)
        if refs:
            for rf in refs[:7]:
                rbytes = await rf.read()
                rpath = job_dir / f"ref_{uuid.uuid4().hex}.png"
                with open(rpath, "wb") as f:
                    f.write(rbytes)
                params["ref_paths"].append(str(rpath))

    with _db() as c:
        c.execute(
            "INSERT INTO jobs (id, op, params, status, result, error, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)",
            (jid, op, json.dumps(params), "queued", None, None, created, created),
        )
        c.commit()

    return JobItem(id=jid, op=op, status="queued", created_at=created, updated_at=created)

@app.get("/jobs/{jid}", response_model=JobItem)
def get_job(jid: str):
    with _db() as c:
        row = c.execute("SELECT * FROM jobs WHERE id=?", (jid,)).fetchone()
        if not row:
            raise HTTPException(404, "job not found")
        return JobItem(
            id=row["id"], op=row["op"], status=row["status"],
            result=json.loads(row["result"]) if row["result"] else None,
            error=row["error"], created_at=row["created_at"], updated_at=row["updated_at"],
        )

@app.get("/jobs", response_model=List[JobItem])
def list_jobs():
    with _db() as c:
        rows = c.execute("SELECT * FROM jobs ORDER BY created_at DESC LIMIT 100").fetchall()
        return [JobItem(
            id=r["id"], op=r["op"], status=r["status"],
            result=json.loads(r["result"]) if r["result"] else None,
            error=r["error"], created_at=r["created_at"], updated_at=r["updated_at"]) for r in rows]

# ----------------- Worker -----------------
def _claim_one_job() -> Optional[str]:
    with _db() as c:
        c.execute("BEGIN IMMEDIATE")
        row = c.execute("SELECT id FROM jobs WHERE status='queued' ORDER BY created_at ASC LIMIT 1").fetchone()
        if not row:
            c.commit()
            return None
        jid = row[0]
        c.execute("UPDATE jobs SET status=?, updated_at=? WHERE id=? AND status='queued'", ("running", _now(), jid))
        c.commit()
        return jid

def _process_job(jid: str):
    try:
        with _db() as c:
            row = c.execute("SELECT * FROM jobs WHERE id=?", (jid,)).fetchone()
        if not row:
            return
        params = json.loads(row["params"])
        op = params["op"]
        fmt = params["fmt"]
        n = int(params.get("n", 1))

        if op == "generate":
            instruction = compose_instruction(params["prompt"], "composite", None, params["width"], params["height"], fmt)
            contents = [{"type": "text", "text": instruction}]
            items = call_provider(contents, fmt, params.get("provider"))
        else:
            # edit
            with open(params["base_path"], "rb") as f:
                base_url = "data:image/png;base64," + base64.b64encode(f.read()).decode()
            mask_url = None
            if params.get("mask_path"):
                with open(params["mask_path"], "rb") as f:
                    mask_url = "data:image/png;base64," + base64.b64encode(f.read()).decode()
            ref_urls = []
            for rp in (params.get("ref_paths") or [])[:7]:
                with open(rp, "rb") as f:
                    ref_urls.append("data:image/png;base64," + base64.b64encode(f.read()).decode())

            instruction = compose_instruction(params["prompt"], params.get("mode") or "composite",
                                              params.get("preset"), params["width"], params["height"], fmt)
            contents = [{"type": "text", "text": instruction},
                        {"type": "image_url", "image_url": {"url": base_url}}]
            if mask_url:
                contents.append({"type": "image_url", "image_url": {"url": mask_url}})
            for u in ref_urls:
                contents.append({"type": "image_url", "image_url": {"url": u}})
            items = call_provider(contents, fmt, params.get("provider"))

        items = items[: n]
        with _db() as c:
            c.execute("UPDATE jobs SET status=?, result=?, error=?, updated_at=? WHERE id=?",
                      ("done", json.dumps([i.dict() for i in items]), None, _now(), jid))
            c.commit()
    except Exception as e:
        logger.exception("job %s failed: %s", jid, e)
        with _db() as c:
            c.execute("UPDATE jobs SET status=?, error=?, updated_at=? WHERE id=?",
                      ("error", str(e), _now(), jid))
            c.commit()

def _worker_loop(idx: int):
    while True:
        jid = _claim_one_job()
        if jid:
            _process_job(jid)
        else:
            time.sleep(QUEUE_POLL_SEC)

# ----------------- Lifecycle -----------------
@app.on_event("startup")
def on_startup():
    _db_init()
    for i in range(max(1, QUEUE_WORKERS)):
        t = threading.Thread(target=_worker_loop, args=(i,), daemon=True)
        t.start()
    logger.info("App started with %s worker(s).", QUEUE_WORKERS)

@app.get("/")
def root():
    return {"status": "ok", "queue_workers": QUEUE_WORKERS, "provider": PROVIDER}
