import pytest
import time
import threading
import json
from unittest.mock import patch, MagicMock
from main import _claim_one_job, _process_job

def test_claim_one_job(client, temp_image_dir):
    """Test that _claim_one_job claims a queued job"""
    # Submit a job
    response = client.post("/jobs/submit", data={
        "op": "generate",
        "prompt": "test prompt",
        "width": 512,
        "height": 512,
        "fmt": "png",
        "n": 1
    })
    assert response.status_code == 200
    job_id = response.json()["id"]
    
    # Claim the job
    claimed_job_id = _claim_one_job()
    assert claimed_job_id == job_id
    
    # Try to claim another job (should return None as there are no more)
    claimed_job_id2 = _claim_one_job()
    assert claimed_job_id2 is None

def test_claim_one_job_no_jobs():
    """Test that _claim_one_job returns None when no jobs are queued"""
    claimed_job_id = _claim_one_job()
    assert claimed_job_id is None

def test_process_job_generate(client, temp_image_dir):
    """Test that _process_job processes a generate job correctly"""
    # Submit a job
    response = client.post("/jobs/submit", data={
        "op": "generate",
        "prompt": "test prompt",
        "width": 512,
        "height": 512,
        "fmt": "png",
        "n": 1
    })
    assert response.status_code == 200
    job_id = response.json()["id"]
    
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
        # Process the job
        _process_job(job_id)
        
        # Check that the job is done
        response = client.get(f"/jobs/{job_id}")
        assert response.status_code == 200
        job_data = response.json()
        assert job_data["status"] == "done"
        assert job_data["result"] is not None
        assert len(job_data["result"]) == 1

def test_process_job_edit(client, temp_image_dir):
    """Test that _process_job processes an edit job correctly"""
    import base64
    from PIL import Image
    import io
    
    # Create test image data
    img = Image.new('RGB', (60, 30), color = 'red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    base_img_data = base64.b64encode(img_bytes.getvalue()).decode()
    
    # Submit a job
    response = client.post("/jobs/submit", data={
        "op": "edit",
        "prompt": "test prompt",
        "mode": "composite",
        "width": 512,
        "height": 512,
        "fmt": "png",
        "n": 1,
        "base": ("base.png", base64.b64decode(base_img_data), "image/png")
    })
    assert response.status_code == 200
    job_id = response.json()["id"]
    
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
        # Process the job
        _process_job(job_id)
        
        # Check that the job is done
        response = client.get(f"/jobs/{job_id}")
        assert response.status_code == 200
        job_data = response.json()
        assert job_data["status"] == "done"
        assert job_data["result"] is not None
        assert len(job_data["result"]) == 1

def test_process_job_with_error(client, temp_image_dir):
    """Test that _process_job handles errors correctly"""
    # Submit a job
    response = client.post("/jobs/submit", data={
        "op": "generate",
        "prompt": "test prompt",
        "width": 512,
        "height": 512,
        "fmt": "png",
        "n": 1
    })
    assert response.status_code == 200
    job_id = response.json()["id"]
    
    # Mock the provider to raise an exception
    with patch('requests.post', side_effect=Exception("Provider error")):
        # Process the job
        _process_job(job_id)
        
        # Check that the job has an error
        response = client.get(f"/jobs/{job_id}")
        assert response.status_code == 200
        job_data = response.json()
        assert job_data["status"] == "error"
        assert job_data["error"] is not None
        assert "Provider error" in job_data["error"]

def test_worker_thread_processing(client, temp_image_dir):
    """Test that worker threads process jobs correctly"""
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
        # Submit multiple jobs
        job_ids = []
        for i in range(3):
            response = client.post("/jobs/submit", data={
                "op": "generate",
                "prompt": f"test prompt {i}",
                "width": 512,
                "height": 512,
                "fmt": "png",
                "n": 1
            })
            assert response.status_code == 200
            job_ids.append(response.json()["id"])
        
        # Start a worker thread
        def worker():
            from main import QUEUE_POLL_SEC
            while True:
                jid = _claim_one_job()
                if jid:
                    _process_job(jid)
                else:
                    # Check if all jobs are done
                    all_done = True
                    for job_id in job_ids:
                        response = client.get(f"/jobs/{job_id}")
                        job_data = response.json()
                        if job_data["status"] not in ["done", "error"]:
                            all_done = False
                            break
                    
                    if all_done:
                        break
                    
                    time.sleep(QUEUE_POLL_SEC)
        
        worker_thread = threading.Thread(target=worker)
        worker_thread.start()
        worker_thread.join(timeout=10)  # Wait up to 10 seconds
        
        # Check that all jobs are processed
        for job_id in job_ids:
            response = client.get(f"/jobs/{job_id}")
            assert response.status_code == 200
            job_data = response.json()
            assert job_data["status"] in ["done", "error"]

def test_worker_thread_with_multiple_workers(client, temp_image_dir):
    """Test that multiple worker threads can process jobs concurrently"""
    # Mock the provider response with a delay to simulate processing time
    def delayed_post(*args, **kwargs):
        time.sleep(0.5)  # Simulate processing time
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
        return mock_response
    
    with patch('requests.post', side_effect=delayed_post):
        # Submit multiple jobs
        job_ids = []
        for i in range(5):
            response = client.post("/jobs/submit", data={
                "op": "generate",
                "prompt": f"test prompt {i}",
                "width": 512,
                "height": 512,
                "fmt": "png",
                "n": 1
            })
            assert response.status_code == 200
            job_ids.append(response.json()["id"])
        
        # Start multiple worker threads
        def worker(worker_id):
            from main import QUEUE_POLL_SEC
            processed_jobs = []
            while True:
                jid = _claim_one_job()
                if jid:
                    _process_job(jid)
                    processed_jobs.append(jid)
                else:
                    # Check if all jobs are done
                    all_done = True
                    for job_id in job_ids:
                        response = client.get(f"/jobs/{job_id}")
                        job_data = response.json()
                        if job_data["status"] not in ["done", "error"]:
                            all_done = False
                            break
                    
                    if all_done:
                        break
                    
                    time.sleep(QUEUE_POLL_SEC)
            
            return processed_jobs
        
        worker_threads = []
        for i in range(3):  # Start 3 workers
            thread = threading.Thread(target=worker, args=(i,))
            worker_threads.append(thread)
            thread.start()
        
        # Wait for all workers to finish
        for thread in worker_threads:
            thread.join(timeout=15)  # Wait up to 15 seconds
        
        # Check that all jobs are processed
        for job_id in job_ids:
            response = client.get(f"/jobs/{job_id}")
            assert response.status_code == 200
            job_data = response.json()
            assert job_data["status"] in ["done", "error"]