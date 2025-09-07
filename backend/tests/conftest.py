import pytest
import tempfile
import os
import sys
from fastapi.testclient import TestClient

# Add the parent directory to the path so we can import main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
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
        original_storage_dir = app.state.storage_dir if hasattr(app.state, 'storage_dir') else None
        
        app.state.output_dir = temp_dir
        app.state.images_dir = os.path.join(temp_dir, "images")
        app.state.storage_dir = temp_dir
        os.makedirs(app.state.images_dir, exist_ok=True)
        
        yield temp_dir
        
        # Restore original directories
        if original_output_dir:
            app.state.output_dir = original_output_dir
        if original_images_dir:
            app.state.images_dir = original_images_dir
        if original_storage_dir:
            app.state.storage_dir = original_storage_dir

@pytest.fixture
def client_with_temp_dir(temp_image_dir):
    # Create a new app instance for testing with temporary directories
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles
    
    # Create a new test app
    test_app = FastAPI(title="ImageGen Backend Test")
    
    # Add CORS middleware
    test_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Mount static files to the temporary directory
    test_app.mount("/static", StaticFiles(directory=temp_image_dir), name="static")
    
    # Copy the routes from the original app
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'endpoint'):
            if not route.path.startswith("/static"):  # Skip the original static mount
                test_app.add_route(route.path, route.endpoint, methods=route.methods)
    
    return TestClient(test_app)