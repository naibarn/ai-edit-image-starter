from pathlib import Path
from typing import Union


def ensure_storage(dir_path: Union[str, Path]) -> None:
    Path(dir_path).mkdir(parents=True, exist_ok=True)


def main():
    # Ensure storage directory exists
    storage_dir = Path("storage")
    ensure_storage(storage_dir)
    ensure_storage(storage_dir / "images")
    ensure_storage(storage_dir / "queue")
    ensure_storage("logs")

    # Create requirements.txt if not exists
    if not Path("requirements.txt").exists():
        with open("requirements.txt", "w") as f:
            f.write(
                """fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pillow==10.1.0
requests==2.31.0
pydantic==2.5.0
"""
            )

    # Create .env if not exists
    if not Path(".env").exists():
        with open(".env", "w") as f:
            f.write(
                """STORAGE_DIR=storage
PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
"""
            )

    print("Setup completed successfully!")


if __name__ == "__main__":
    main()
