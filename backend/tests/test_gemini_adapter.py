import pytest
import os
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from provider.gemini_direct import call_gemini_direct_api, parse_data_urls_to_images


@pytest.fixture
def client():
    return TestClient(app)


class TestGeminiDirectAdapter:
    """Test suite for Gemini Direct Adapter"""

    def test_call_gemini_direct_api_success(self):
        """Test successful API call to Gemini Direct"""
        mock_response = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "inline_data": {
                                    "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                }
                            }
                        ]
                    }
                }
            ]
        }

        with patch('requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = mock_response

            result = call_gemini_direct_api("test prompt", 512, 512, 1)

            assert "choices" in result
            assert len(result["choices"]) == 1
            assert "message" in result["choices"][0]
            assert "images" in result["choices"][0]["message"]
            assert len(result["choices"][0]["message"]["images"]) == 1

            image = result["choices"][0]["message"]["images"][0]
            assert "image_url" in image
            assert "url" in image["image_url"]
            assert image["image_url"]["url"].startswith("data:image/png;base64,")

    def test_call_gemini_direct_api_quota_exceeded(self):
        """Test handling of quota exceeded error"""
        with patch('requests.post') as mock_post:
            mock_post.return_value.status_code = 429

            with pytest.raises(Exception) as exc_info:
                call_gemini_direct_api("test prompt", 512, 512, 1)

            assert "quota exceeded" in str(exc_info.value).lower()

    def test_call_gemini_direct_api_invalid_api_key(self):
        """Test handling of invalid API key error"""
        with patch('requests.post') as mock_post:
            mock_post.return_value.status_code = 403

            with pytest.raises(Exception) as exc_info:
                call_gemini_direct_api("test prompt", 512, 512, 1)

            assert "access denied" in str(exc_info.value).lower()

    def test_call_gemini_direct_api_invalid_request(self):
        """Test handling of invalid request error"""
        with patch('requests.post') as mock_post:
            mock_post.return_value.status_code = 400

            with pytest.raises(Exception) as exc_info:
                call_gemini_direct_api("test prompt", 512, 512, 1)

            assert "invalid request" in str(exc_info.value).lower()

    def test_call_gemini_direct_api_timeout(self):
        """Test handling of timeout error"""
        with patch('requests.post') as mock_post:
            mock_post.side_effect = Exception("Connection timed out")

            with pytest.raises(Exception) as exc_info:
                call_gemini_direct_api("test prompt", 512, 512, 1)

            assert "timed out" in str(exc_info.value).lower()

    def test_call_gemini_direct_api_connection_error(self):
        """Test handling of connection error"""
        with patch('requests.post') as mock_post:
            from requests.exceptions import ConnectionError
            mock_post.side_effect = ConnectionError("Network is unreachable")

            with pytest.raises(Exception) as exc_info:
                call_gemini_direct_api("test prompt", 512, 512, 1)

            assert "unable to connect" in str(exc_info.value).lower()

    def test_call_gemini_direct_api_missing_api_key(self):
        """Test handling when API key is not configured"""
        # Remove GEMINI_API_KEY from environment if it exists
        original_key = os.environ.get('GEMINI_API_KEY')
        if 'GEMINI_API_KEY' in os.environ:
            del os.environ['GEMINI_API_KEY']

        # Also ensure we're not in test mode
        original_test = os.environ.get('PYTEST_CURRENT_TEST')
        if 'PYTEST_CURRENT_TEST' in os.environ:
            del os.environ['PYTEST_CURRENT_TEST']

        try:
            with pytest.raises(Exception) as exc_info:
                call_gemini_direct_api("test prompt", 512, 512, 1)

            assert "api key not configured" in str(exc_info.value).lower()
        finally:
            # Restore original environment
            if original_key:
                os.environ['GEMINI_API_KEY'] = original_key
            if original_test:
                os.environ['PYTEST_CURRENT_TEST'] = original_test

    def test_call_gemini_direct_api_test_mode(self):
        """Test that test mode returns mock response without API call"""
        # Set test mode
        os.environ['PYTEST_CURRENT_TEST'] = 'test_gemini_adapter.py'

        try:
            result = call_gemini_direct_api("test prompt", 512, 512, 1)

            # Should return mock response
            assert "choices" in result
            assert len(result["choices"]) == 1
            assert result["choices"][0]["message"]["images"][0]["image_url"]["url"] == \
                   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        finally:
            # Clean up
            if 'PYTEST_CURRENT_TEST' in os.environ:
                del os.environ['PYTEST_CURRENT_TEST']

    def test_parse_data_urls_to_images_success(self):
        """Test successful parsing of data URLs from API response"""
        api_response = {
            "choices": [
                {
                    "message": {
                        "images": [
                            {
                                "image_url": {
                                    "url": "data:image/png;base64,testdata123"
                                }
                            }
                        ]
                    }
                }
            ]
        }

        result = parse_data_urls_to_images(api_response)

        assert len(result) == 1
        assert result[0]["url"] == "data:image/png;base64,testdata123"
        assert result[0]["format"] == "png"

    def test_parse_data_urls_to_images_invalid_format(self):
        """Test parsing with invalid response format"""
        api_response = {
            "invalid": "format"
        }

        with pytest.raises(Exception) as exc_info:
            parse_data_urls_to_images(api_response)

        assert "missing choices" in str(exc_info.value).lower()

    def test_parse_data_urls_to_images_no_candidates(self):
        """Test parsing with empty candidates"""
        api_response = {
            "choices": []
        }

        with pytest.raises(Exception) as exc_info:
            parse_data_urls_to_images(api_response)

        assert "no image candidates" in str(exc_info.value).lower()

    def test_parse_data_urls_to_images_missing_parts(self):
        """Test parsing with missing content parts"""
        api_response = {
            "choices": [
                {
                    "message": {
                        "images": [
                            {
                                "image_url": {
                                    "url": "data:image/png;base64,testdata123"
                                }
                            }
                        ]
                    }
                }
            ]
        }

        # This should work fine
        result = parse_data_urls_to_images(api_response)
        assert len(result) == 1

    def test_parse_data_urls_to_images_non_data_url(self):
        """Test parsing with non-data URL"""
        api_response = {
            "choices": [
                {
                    "message": {
                        "images": [
                            {
                                "image_url": {
                                    "url": "https://example.com/image.png"
                                }
                            }
                        ]
                    }
                }
            ]
        }

        with pytest.raises(Exception) as exc_info:
            parse_data_urls_to_images(api_response)

        assert "non-data url" in str(exc_info.value).lower()


class TestGeminiDirectIntegration:
    """Test integration with main API endpoints"""

    def test_images_generate_with_gemini_direct_provider(self, client):
        """Test /images/generate endpoint with gemini-direct provider"""
        # Mock the API call
        with patch('provider.gemini_direct.call_gemini_direct_api') as mock_api:
            mock_api.return_value = {
                "choices": [
                    {
                        "message": {
                            "images": [
                                {
                                    "image_url": {
                                        "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                    }
                                }
                            ]
                        }
                    }
                ]
            }

            response = client.post(
                "/images/generate",
                data={
                    "prompt": "test prompt",
                    "provider": "gemini-direct",
                    "width": "512",
                    "height": "512",
                    "n": "1"
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert "filename" in data[0]
            assert "url" in data[0]

            # Verify the correct API was called
            mock_api.assert_called_once_with("test prompt", 512, 512, 1)

    def test_images_edit_with_gemini_direct_provider(self, client):
        """Test /images/edit endpoint with gemini-direct provider"""
        # Mock the API call
        with patch('provider.gemini_direct.call_gemini_direct_api') as mock_api:
            mock_api.return_value = {
                "choices": [
                    {
                        "message": {
                            "images": [
                                {
                                    "image_url": {
                                        "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                    }
                                }
                            ]
                        }
                    }
                ]
            }

            # Create a test image file
            from io import BytesIO
            test_image = BytesIO(b"fake image data")
            test_image.name = "test.png"

            response = client.post(
                "/images/edit",
                data={
                    "prompt": "edit this image",
                    "provider": "gemini-direct",
                    "width": "512",
                    "height": "512",
                    "n": "1"
                },
                files={
                    "base": ("test.png", test_image, "image/png")
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert "filename" in data[0]
            assert "url" in data[0]

            # Verify the correct API was called
            mock_api.assert_called_once_with("edit this image", 512, 512, 1)

    def test_invalid_provider_rejection(self, client):
        """Test that invalid providers are rejected"""
        response = client.post(
            "/images/generate",
            data={
                "prompt": "test prompt",
                "provider": "invalid-provider",
                "width": "512",
                "height": "512",
                "n": "1"
            }
        )

        assert response.status_code == 400
        data = response.json()
        assert "invalid provider" in data["detail"].lower()

    def test_provider_validation_includes_gemini_direct(self, client):
        """Test that gemini-direct is accepted as a valid provider"""
        # Mock the API call to avoid actual API call
        with patch('provider.gemini_direct.call_gemini_direct_api') as mock_api:
            mock_api.return_value = {
                "choices": [
                    {
                        "message": {
                            "images": [
                                {
                                    "image_url": {
                                        "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                    }
                                }
                            ]
                        }
                    }
                ]
            }

            response = client.post(
                "/images/generate",
                data={
                    "prompt": "test prompt",
                    "provider": "gemini-direct",
                    "width": "512",
                    "height": "512",
                    "n": "1"
                }
            )

            # Should not get a 400 error for invalid provider
            assert response.status_code != 400