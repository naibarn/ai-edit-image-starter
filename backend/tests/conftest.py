import pytest
import tempfile
import os
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def temp_image_dir():
    with tempfile.TemporaryDirectory() as temp_dir:
        # Override the OUTPUT_DIR and IMAGES_DIR for testing
        original_output_dir = app.state.output_dir if hasattr(app.state, 'output_dir') else None
        original_images_dir = app.state.images_dir if hasattr(app.state, 'images_dir') else None
        
        app.state.output_dir = temp_dir
        app.state.images_dir = os.path.join(temp_dir, "images")
        os.makedirs(app.state.images_dir, exist_ok=True)
        
        yield temp_dir
        
        # Restore original directories
        if original_output_dir:
            app.state.output_dir = original_output_dir
        if original_images_dir:
            app.state.images_dir = original_images_dir