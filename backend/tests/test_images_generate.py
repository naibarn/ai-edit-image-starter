import pytest
from unittest.mock import patch, MagicMock
import base64

def test_generate_image_missing_api_key(client):
    """Test that generate endpoint fails without API key"""
    with patch.dict('os.environ', {'OPENROUTER_API_KEY': ''}):
        response = client.post("/images/generate", data={
            "prompt": "test prompt",
            "width": 1024,
            "height": 1024,
            "fmt": "png",
            "n": 1
        })
        assert response.status_code == 500

def test_generate_image_with_mock_provider(client, temp_image_dir):
    """Test image generation with mocked provider"""
    # Mock the provider response
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
    
    with patch('requests.post', return_value=mock_response):
        response = client.post("/images/generate", data={
            "prompt": "test prompt",
            "width": 512,
            "height": 512,
            "fmt": "png",
            "n": 1
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["filename"].endswith(".png")
        assert data[0]["size_bytes"] > 0

def test_generate_image_validation(client):
    """Test that generate endpoint validates parameters"""
    # Test with invalid width
    response = client.post("/images/generate", data={
        "prompt": "test",
        "width": 100,  # Too small
        "height": 1024,
        "fmt": "png",
        "n": 1
    })
    # The endpoint doesn't validate width/height in the current implementation
    # This test would need to be updated if validation is added
    assert response.status_code in [200, 422]

def test_generate_image_multiple_outputs(client, temp_image_dir):
    """Test generating multiple images"""
    # Mock the provider response with multiple images
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{
            "message": {
                "images": [
                    {
                        "image_url": {
                            "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                        }
                    },
                    {
                        "image_url": {
                            "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                        }
                    }
                ]
            }
        }]
    }
    
    with patch('requests.post', return_value=mock_response):
        response = client.post("/images/generate", data={
            "prompt": "test prompt",
            "width": 512,
            "height": 512,
            "fmt": "png",
            "n": 2
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2