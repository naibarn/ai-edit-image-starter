import pytest
from unittest.mock import patch, MagicMock
import base64
import io
from PIL import Image

def create_test_image_data():
    """Create a test image as base64 data"""
    img = Image.new('RGB', (60, 30), color = 'red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    return base64.b64encode(img_bytes.getvalue()).decode()

def test_provider_override_openrouter(client, temp_image_dir):
    """Test that provider override works for OpenRouter"""
    # Mock the OpenRouter response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{
            "message": {
                "images": [{
                    "image_url": {
                        "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                    }
                }]
            }
        }]
    }
    
    with patch('requests.post', return_value=mock_response) as mock_post:
        response = client.post("/images/generate", data={
            "prompt": "test prompt",
            "width": 512,
            "height": 512,
            "fmt": "png",
            "n": 1,
            "provider": "openrouter"
        })
        assert response.status_code == 200
        
        # Verify that OpenRouter was called
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert "openrouter.ai" in call_args[1]['headers']['Authorization']

def test_provider_override_gemini_direct(client, temp_image_dir):
    """Test that provider override works for Gemini direct"""
    # Mock the Gemini response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{
                    "text": "Here's your image: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                }]
            }
        }]
    }
    
    with patch('requests.post', return_value=mock_response) as mock_post:
        response = client.post("/images/generate", data={
            "prompt": "test prompt",
            "width": 512,
            "height": 512,
            "fmt": "png",
            "n": 1,
            "provider": "gemini-direct"
        })
        assert response.status_code == 200
        
        # Verify that Gemini was called
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert "generativelanguage.googleapis.com" in call_args[0][0]

def test_provider_override_auto(client, temp_image_dir):
    """Test that provider override works for auto (defaults to OpenRouter)"""
    # Mock the OpenRouter response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{
            "message": {
                "images": [{
                    "image_url": {
                        "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                    }
                }]
            }
        }]
    }
    
    with patch('requests.post', return_value=mock_response) as mock_post:
        response = client.post("/images/generate", data={
            "prompt": "test prompt",
            "width": 512,
            "height": 512,
            "fmt": "png",
            "n": 1,
            "provider": "auto"
        })
        assert response.status_code == 200
        
        # Verify that OpenRouter was called (auto defaults to OpenRouter)
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert "openrouter.ai" in call_args[1]['headers']['Authorization']

def test_provider_override_with_edit(client, temp_image_dir):
    """Test that provider override works with edit endpoint"""
    # Create test image data
    base_img_data = create_test_image_data()
    
    # Mock the Gemini response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{
                    "text": "Here's your image: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                }]
            }
        }]
    }
    
    with patch('requests.post', return_value=mock_response) as mock_post:
        response = client.post("/images/edit", data={
            "prompt": "test prompt",
            "mode": "composite",
            "width": 512,
            "height": 512,
            "fmt": "png",
            "n": 1,
            "provider": "gemini-direct",
            "base": ("base.png", base64.b64decode(base_img_data), "image/png")
        })
        assert response.status_code == 200
        
        # Verify that Gemini was called
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert "generativelanguage.googleapis.com" in call_args[0][0]

def test_provider_override_invalid_provider(client, temp_image_dir):
    """Test that invalid provider defaults to OpenRouter"""
    # Mock the OpenRouter response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{
            "message": {
                "images": [{
                    "image_url": {
                        "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                    }
                }]
            }
        }]
    }
    
    with patch('requests.post', return_value=mock_response) as mock_post:
        response = client.post("/images/generate", data={
            "prompt": "test prompt",
            "width": 512,
            "height": 512,
            "fmt": "png",
            "n": 1,
            "provider": "invalid-provider"
        })
        assert response.status_code == 200
        
        # Verify that OpenRouter was called as fallback
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert "openrouter.ai" in call_args[1]['headers']['Authorization']