import pytest
import os
import tempfile
from unittest.mock import patch, MagicMock
import logging

def test_server_logging_on_exception(client, temp_image_dir):
    """Test that server logs exceptions with traceback"""
    # Create a temporary log file for testing
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log') as temp_log:
        temp_log_path = temp_log.name
    
    # Mock the logger to use our temporary log file
    original_logger = logging.getLogger("app")
    original_handlers = original_logger.handlers[:]
    
    # Clear existing handlers
    for handler in original_handlers:
        original_logger.removeHandler(handler)
    
    # Add our test handler
    test_handler = logging.FileHandler(temp_log_path)
    test_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    original_logger.addHandler(test_handler)
    
    try:
        # Mock the provider to raise an exception
        with patch('requests.post', side_effect=Exception("Test exception")):
            response = client.post("/images/generate", data={
                "prompt": "test prompt",
                "width": 512,
                "height": 512,
                "fmt": "png",
                "n": 1
            })
            assert response.status_code == 500
        
        # Check that the exception was logged
        with open(temp_log_path, 'r') as f:
            log_content = f.read()
            assert "generate_image failed" in log_content
            assert "Test exception" in log_content
    
    finally:
        # Close the test handler to release the file
        test_handler.close()
        # Restore original handlers
        for handler in original_logger.handlers[:]:
            original_logger.removeHandler(handler)
        for handler in original_handlers:
            original_logger.addHandler(handler)

        # Clean up
        if os.path.exists(temp_log_path):
            os.unlink(temp_log_path)

def test_server_logging_on_client_error(client):
    """Test that server logs client errors"""
    # Create a temporary log file for testing
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log') as temp_log:
        temp_log_path = temp_log.name
    
    # Mock the logger to use our temporary log file
    original_logger = logging.getLogger("app")
    original_handlers = original_logger.handlers[:]
    
    # Clear existing handlers
    for handler in original_handlers:
        original_logger.removeHandler(handler)
    
    # Add our test handler
    test_handler = logging.FileHandler(temp_log_path)
    test_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    original_logger.addHandler(test_handler)
    original_logger.setLevel(logging.INFO)

    try:
        # Send a client error log
        response = client.post("/logs/client", json={
            "message": "Test client error",
            "stack": "Error stack trace",
            "path": "/test"
        })
        assert response.status_code == 200
        
        # Check that the client error was logged
        with open(temp_log_path, 'r') as f:
            log_content = f.read()
            assert "CLIENT_LOG" in log_content
            assert "Test client error" in log_content
    
    finally:
        # Close the test handler to release the file
        test_handler.close()
        # Restore original handlers
        for handler in original_logger.handlers[:]:
            original_logger.removeHandler(handler)
        for handler in original_handlers:
            original_logger.addHandler(handler)

        # Clean up
        if os.path.exists(temp_log_path):
            os.unlink(temp_log_path)

def test_server_logging_malformed_client_error(client):
    """Test that server handles malformed client error logs"""
    # Create a temporary log file for testing
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log') as temp_log:
        temp_log_path = temp_log.name
    
    # Mock the logger to use our temporary log file
    original_logger = logging.getLogger("app")
    original_handlers = original_logger.handlers[:]
    
    # Clear existing handlers
    for handler in original_handlers:
        original_logger.removeHandler(handler)
    
    # Add our test handler
    test_handler = logging.FileHandler(temp_log_path)
    test_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    original_logger.addHandler(test_handler)
    original_logger.setLevel(logging.INFO)
    
    try:
        # Send valid JSON but missing message
        response = client.post("/logs/client", json={})
        assert response.status_code == 200

        # Check that the error was logged
        with open(temp_log_path, 'r') as f:
            log_content = f.read()
            assert "Malformed client error log" in log_content
    
    finally:
        # Close the test handler to release the file
        test_handler.close()
        # Restore original handlers
        for handler in original_logger.handlers[:]:
            original_logger.removeHandler(handler)
        for handler in original_handlers:
            original_logger.addHandler(handler)

        # Clean up
        if os.path.exists(temp_log_path):
            os.unlink(temp_log_path)

def test_server_logging_on_job_processing_failure(client, temp_image_dir):
    """Test that job processing failures are logged"""
    # Create a temporary log file for testing
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log') as temp_log:
        temp_log_path = temp_log.name
    
    # Mock the logger to use our temporary log file
    original_logger = logging.getLogger("app")
    original_handlers = original_logger.handlers[:]
    
    # Clear existing handlers
    for handler in original_handlers:
        original_logger.removeHandler(handler)
    
    # Add our test handler
    test_handler = logging.FileHandler(temp_log_path)
    test_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    original_logger.addHandler(test_handler)
    original_logger.setLevel(logging.INFO)

    try:
        # Mock the provider to raise an exception during job processing
        with patch('requests.post', side_effect=Exception("Job processing exception")):
            # Submit a job
            response = client.post("/jobs/submit", json={
                "op": "generate",
                "prompt": "test prompt",
                "width": 512,
                "height": 512,
                "fmt": "png",
                "n": 1
            })
            assert response.status_code == 200

            # Get the job ID
            job_id = response.json()["id"]
            
            # Wait a bit for the job to be processed
            import time
            time.sleep(1)
            
            # Check that the job processing error was logged
            with open(temp_log_path, 'r') as f:
                log_content = f.read()
                assert f"job {job_id} failed" in log_content
                assert "Job processing exception" in log_content
    
    finally:
        # Close the test handler to release the file
        test_handler.close()
        # Restore original handlers
        for handler in original_logger.handlers[:]:
            original_logger.removeHandler(handler)
        for handler in original_handlers:
            original_logger.addHandler(handler)

        # Clean up
        if os.path.exists(temp_log_path):
            os.unlink(temp_log_path)