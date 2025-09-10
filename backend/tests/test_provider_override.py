from unittest.mock import MagicMock
import base64
import io
from PIL import Image


def create_test_image_data():
    """Create a test image as base64 data"""
    img = Image.new("RGB", (60, 30), color="red")
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    return base64.b64encode(img_bytes.getvalue()).decode()


fake_b64_full = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

fake_response = {
    "choices": [{"message": {"images": [{"image_url": {"url": fake_b64_full}}]}}]
}


def test_generate_openrouter(client, temp_image_dir, monkeypatch):
    """POST /images/generate with provider="openrouter" -> call_openrouter_api called"""
    mock_or = MagicMock(return_value=fake_response)
    monkeypatch.setattr("main.call_openrouter_api", mock_or)
    response = client.post(
        "/images/generate",
        data={
            "prompt": "test prompt",
            "width": 512,
            "height": 512,
            "fmt": "png",
            "n": 1,
            "provider": "openrouter",
        },
    )
    assert response.status_code == 200
    assert mock_or.called


def test_generate_gemini(client, temp_image_dir, monkeypatch):
    """POST /images/generate with provider="gemini" -> call_gemini called"""
    mock_gemini = MagicMock(return_value=fake_response)
    monkeypatch.setattr("main.call_gemini", mock_gemini)
    response = client.post(
        "/images/generate",
        data={
            "prompt": "test prompt",
            "width": 512,
            "height": 512,
            "fmt": "png",
            "n": 1,
            "provider": "gemini",
        },
    )
    assert response.status_code == 200
    assert mock_gemini.called


def test_edit_openrouter(client, temp_image_dir, monkeypatch):
    """POST /images/edit with provider="openrouter" -> call_openrouter_api called"""
    mock_or = MagicMock(return_value=fake_response)
    monkeypatch.setattr("main.call_openrouter_api", mock_or)
    base_img_data = create_test_image_data()
    response = client.post(
        "/images/edit",
        data={
            "prompt": "test prompt",
            "mode": "composite",
            "width": 512,
            "height": 512,
            "fmt": "png",
            "n": 1,
            "provider": "openrouter",
        },
        files={"base": ("base.png", base64.b64decode(base_img_data), "image/png")},
    )
    assert response.status_code == 200
    assert mock_or.called


def test_edit_gemini(client, temp_image_dir, monkeypatch):
    """POST /images/edit with provider="gemini" -> call_gemini called"""
    mock_gemini = MagicMock(return_value=fake_response)
    monkeypatch.setattr("main.call_gemini", mock_gemini)
    base_img_data = create_test_image_data()
    response = client.post(
        "/images/edit",
        data={
            "prompt": "test prompt",
            "mode": "composite",
            "width": 512,
            "height": 512,
            "fmt": "png",
            "n": 1,
            "provider": "gemini",
        },
        files={"base": ("base.png", base64.b64decode(base_img_data), "image/png")},
    )
    assert response.status_code == 200
    assert mock_gemini.called


def test_generate_fallback(client, temp_image_dir, monkeypatch):
    """Omit provider -> fallback to env PROVIDER="gemini" -> call_gemini called"""
    monkeypatch.setenv("PROVIDER", "gemini")
    mock_gemini = MagicMock(return_value=fake_response)
    monkeypatch.setattr("main.call_gemini", mock_gemini)
    mock_or = MagicMock()
    monkeypatch.setattr("main.call_openrouter_api", mock_or)
    response = client.post(
        "/images/generate",
        data={
            "prompt": "test prompt",
            "width": 512,
            "height": 512,
            "fmt": "png",
            "n": 1,
        },
    )
    assert response.status_code == 200
    assert mock_gemini.called
    assert not mock_or.called
