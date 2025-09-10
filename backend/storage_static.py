from pathlib import Path
from typing import List, Union


def list_images(dir_path: Union[str, Path]) -> List[str]:
    p = Path(dir_path)
    if not p.exists():
        return []
    return [child.name for child in p.iterdir() if child.is_file()]


def save_base64_image(
    b64_data: str, storage_dir: Union[str, Path], format: str = "png"
) -> str:
    from uuid import uuid4
    import base64

    # Remove data URL prefix if present
    if "," in b64_data:
        b64_data = b64_data.split(",", 1)[1]

    image_data = base64.b64decode(b64_data)
    filename = f"{uuid4().hex}.{format}"
    file_path = Path(storage_dir) / filename

    with open(file_path, "wb") as f:
        f.write(image_data)

    return filename
