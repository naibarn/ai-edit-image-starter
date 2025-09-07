import pytest
import os
import tempfile
from PIL import Image
import io

def test_list_images_empty(client, temp_image_dir):
    """Test that GET /images returns empty list when no images exist"""
    response = client.get("/images")
    assert response.status_code == 200
    assert response.json() == []

def test_list_images_with_files(client, temp_image_dir):
    """Test that GET /images returns list of images when files exist"""
    # Create a test image
    img = Image.new('RGB', (60, 30), color = 'red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    
    # Save to both output directories
    output_path = os.path.join(temp_image_dir, "test.png")
    with open(output_path, "wb") as f:
        f.write(img_bytes.getvalue())
    
    images_dir = os.path.join(temp_image_dir, "images")
    os.makedirs(images_dir, exist_ok=True)
    storage_path = os.path.join(images_dir, "test.png")
    with open(storage_path, "wb") as f:
        f.write(img_bytes.getvalue())
    
    response = client.get("/images")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["filename"] == "test.png"
    assert data[0]["url"] == "/static/images/test.png"
    assert data[0]["size_bytes"] > 0

def test_static_image_serve(client_with_temp_dir, temp_image_dir):
    """Test that static images are served correctly"""
    # Create a test image
    img = Image.new('RGB', (60, 30), color = 'blue')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    
    # Save to storage directory
    images_dir = os.path.join(temp_image_dir, "images")
    os.makedirs(images_dir, exist_ok=True)
    storage_path = os.path.join(images_dir, "static_test.png")
    with open(storage_path, "wb") as f:
        f.write(img_bytes.getvalue())
    
    response = client_with_temp_dir.get("/static/images/static_test.png")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"

def test_static_image_not_found(client):
    """Test that 404 is returned for non-existent static images"""
    response = client.get("/static/images/nonexistent.png")
    assert response.status_code == 404