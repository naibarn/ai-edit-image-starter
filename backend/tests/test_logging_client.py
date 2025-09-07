import pytest
import os
import tempfile
import json

def test_client_logging_endpoint_receives_json(client):
    """Test that client logging endpoint receives and processes JSON data"""
    # Create a temporary log file for testing
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log') as temp_log:
        temp_log_path = temp_log.name
    
    # Mock the logger to use our temporary log file
    import logging
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
        # Send a client error log with JSON data
        client_error_data = {
            "message": "Test client error",
            "stack": "Error stack trace",
            "path": "/test",
            "component": "TestComponent"
        }
        
        response = client.post("/logs/client", json=client_error_data)
        assert response.status_code == 200
        assert response.json() == {"ok": True}
        
        # Check that the client error was logged
        with open(temp_log_path, 'r') as f:
            log_content = f.read()
            assert "CLIENT_LOG" in log_content
            assert "Test client error" in log_content
            assert "Error stack trace" in log_content
            assert "/test" in log_content
    
    finally:
        # Restore original handlers
        for handler in original_logger.handlers[:]:
            original_logger.removeHandler(handler)
        for handler in original_handlers:
            original_logger.addHandler(handler)
        
        # Clean up
        if os.path.exists(temp_log_path):
            os.unlink(temp_log_path)

def test_client_logging_endpoint_handles_empty_data(client):
    """Test that client logging endpoint handles empty/missing data gracefully"""
    # Create a temporary log file for testing
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log') as temp_log:
        temp_log_path = temp_log.name
    
    # Mock the logger to use our temporary log file
    import logging
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
        # Send a client error log with empty JSON
        response = client.post("/logs/client", json={})
        assert response.status_code == 200
        assert response.json() == {"ok": True}
        
        # Check that the empty client error was logged
        with open(temp_log_path, 'r') as f:
            log_content = f.read()
            assert "CLIENT_LOG" in log_content
            assert "{}" in log_content
    
    finally:
        # Restore original handlers
        for handler in original_logger.handlers[:]:
            original_logger.removeHandler(handler)
        for handler in original_handlers:
            original_logger.addHandler(handler)
        
        # Clean up
        if os.path.exists(temp_log_path):
            os.unlink(temp_log_path)

def test_client_logging_endpoint_handles_invalid_json(client):
    """Test that client logging endpoint handles invalid JSON gracefully"""
    # Create a temporary log file for testing
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log') as temp_log:
        temp_log_path = temp_log.name
    
    # Mock the logger to use our temporary log file
    import logging
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
        # Send invalid JSON
        response = client.post(
            "/logs/client", 
            data="invalid json", 
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        assert response.json() == {"ok": True}
        
        # Check that the error was handled gracefully
        with open(temp_log_path, 'r') as f:
            log_content = f.read()
            assert "CLIENT_LOG" in log_content
            # Should log empty dict for invalid JSON
            assert "{}" in log_content
    
    finally:
        # Restore original handlers
        for handler in original_logger.handlers[:]:
            original_logger.removeHandler(handler)
        for handler in original_handlers:
            original_logger.addHandler(handler)
        
        # Clean up
        if os.path.exists(temp_log_path):
            os.unlink(temp_log_path)

def test_client_logging_endpoint_handles_large_data(client):
    """Test that client logging endpoint handles large error data"""
    # Create a temporary log file for testing
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log') as temp_log:
        temp_log_path = temp_log.name
    
    # Mock the logger to use our temporary log file
    import logging
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
        # Send a large client error log
        large_stack_trace = "Error: Large error\n" + "\n".join([f"    at function_{i} (file_{i}.js:{i}:{i})" for i in range(100)])
        
        client_error_data = {
            "message": "Large client error",
            "stack": large_stack_trace,
            "path": "/test/large",
            "component": "LargeComponent"
        }
        
        response = client.post("/logs/client", json=client_error_data)
        assert response.status_code == 200
        assert response.json() == {"ok": True}
        
        # Check that the large client error was logged
        with open(temp_log_path, 'r') as f:
            log_content = f.read()
            assert "CLIENT_LOG" in log_content
            assert "Large client error" in log_content
            assert "function_0" in log_content
            assert "/test/large" in log_content
    
    finally:
        # Restore original handlers
        for handler in original_logger.handlers[:]:
            original_logger.removeHandler(handler)
        for handler in original_handlers:
            original_logger.addHandler(handler)
        
        # Clean up
        if os.path.exists(temp_log_path):
            os.unlink(temp_log_path)

def test_client_logging_endpoint_without_content_type(client):
    """Test that client logging endpoint works without Content-Type header"""
    # Create a temporary log file for testing
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log') as temp_log:
        temp_log_path = temp_log.name
    
    # Mock the logger to use our temporary log file
    import logging
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
        # Send data without Content-Type header
        response = client.post("/logs/client", data=json.dumps({
            "message": "No content type test",
            "path": "/test/no-content-type"
        }))
        assert response.status_code == 200
        assert response.json() == {"ok": True}
        
        # Check that the client error was logged
        with open(temp_log_path, 'r') as f:
            log_content = f.read()
            assert "CLIENT_LOG" in log_content
            # Should log empty dict when JSON parsing fails
            assert "{}" in log_content
    
    finally:
        # Restore original handlers
        for handler in original_logger.handlers[:]:
            original_logger.removeHandler(handler)
        for handler in original_handlers:
            original_logger.addHandler(handler)
        
        # Clean up
        if os.path.exists(temp_log_path):
            os.unlink(temp_log_path)