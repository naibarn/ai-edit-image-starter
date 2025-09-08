import time
import threading
from unittest.mock import patch, MagicMock
from main import _claim_one_job, _process_job, app


def test_claim_one_job(client, temp_image_dir):
    """Test that _claim_one_job claims a queued job"""
    # Submit a job
    response = client.post(
        "/jobs/submit",
        json={
            "payload": {
                "op": "generate",
                "prompt": "test prompt",
                "width": 512,
                "height": 512,
                "fmt": "png",
                "n": 1,
            }
        },
    )
    assert response.status_code == 200
    job_id = response.json()["job_id"]

    # Claim the job
    claimed_job_id = _claim_one_job(app)
    assert claimed_job_id == job_id

    # Try to claim another job (should return None as there are no more)
    claimed_job_id2 = _claim_one_job(app)
    assert claimed_job_id2 is None


def test_claim_one_job_no_jobs():
    """Test that _claim_one_job returns None when no jobs are queued"""
    claimed_job_id = _claim_one_job(app)
    assert claimed_job_id is None


def test_process_job_generate(client, temp_image_dir):
    """Test that _process_job processes a generate job correctly"""
    # Submit a job
    response = client.post(
        "/jobs/submit",
        json={
            "payload": {
                "op": "generate",
                "prompt": "test prompt",
                "width": 512,
                "height": 512,
                "fmt": "png",
                "n": 1,
            }
        },
    )
    assert response.status_code == 200
    job_id = response.json()["job_id"]

    # Mock the provider response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
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

    with patch("requests.post", return_value=mock_response):
        # Process the job
        _process_job(app, job_id)

        # Check that the job is done
        response = client.get(f"/jobs/{job_id}")
        assert response.status_code == 200
        job_data = response.json()
        assert job_data["status"] == "done"
        assert job_data["result"] is not None


def test_process_job_edit(client, temp_image_dir):
    """Test that _process_job processes an edit job correctly"""
    import base64
    from PIL import Image
    import io

    # Create test image data
    img = Image.new("RGB", (60, 30), color="red")
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    base_img_data = base64.b64encode(img_bytes.getvalue()).decode()

    # Submit a job
    response = client.post(
        "/jobs/submit",
        json={
            "payload": {
                "op": "edit",
                "prompt": "test prompt",
                "mode": "composite",
                "width": 512,
                "height": 512,
                "fmt": "png",
                "n": 1,
                "base": base_img_data,
            }
        },
    )
    assert response.status_code == 200
    job_id = response.json()["job_id"]

    # Mock the provider response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
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

    with patch("requests.post", return_value=mock_response):
        # Process the job
        _process_job(app, job_id)

        # Check that the job is done
        response = client.get(f"/jobs/{job_id}")
        assert response.status_code == 200
        job_data = response.json()
        assert job_data["status"] == "done"
        assert job_data["result"] is not None


def test_process_job_with_error(client, temp_image_dir):
    """Test that _process_job handles errors correctly"""
    # Submit a job
    response = client.post(
        "/jobs/submit",
        json={
            "payload": {
                "op": "generate",
                "prompt": "test prompt",
                "width": 512,
                "height": 512,
                "fmt": "png",
                "n": 1,
            }
        },
    )
    assert response.status_code == 200
    job_id = response.json()["job_id"]

    # Mock the provider to raise an exception
    with patch("requests.post", side_effect=Exception("Provider error")):
        # Process the job (this should not raise an exception)
        try:
            _process_job(app, job_id)
        except Exception:
            pass  # Expected to be caught and handled internally

        # Check that the job has an error
        response = client.get(f"/jobs/{job_id}")
        assert response.status_code == 200
        job_data = response.json()
        assert job_data["status"] == "error"
        assert job_data["error"] is not None
        assert "Provider error" in str(job_data["error"])


def test_worker_thread_processing(client, temp_image_dir):
    """Test that worker threads process jobs correctly"""
    # Mock the provider response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
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

    with patch("requests.post", return_value=mock_response):
        # Submit multiple jobs
        job_ids = []
        for i in range(3):
            response = client.post(
                "/jobs/submit",
                json={
                    "payload": {
                        "op": "generate",
                        "prompt": f"test prompt {i}",
                        "width": 512,
                        "height": 512,
                        "fmt": "png",
                        "n": 1,
                    }
                },
            )
            assert response.status_code == 200
            job_ids.append(response.json()["job_id"])

        # Start a worker thread
        def worker():
            while True:
                jid = _claim_one_job(app)
                if jid:
                    _process_job(app, jid)
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

                    time.sleep(0.2)

        worker_thread = threading.Thread(target=worker)
        worker_thread.start()
        worker_thread.join(timeout=10)  # Wait up to 10 seconds

        # Check that all jobs are processed
        for job_id in job_ids:
            response = client.get(f"/jobs/{job_id}")
            assert response.status_code == 200
            job_data = response.json()
            assert job_data["status"] in ["done", "error"]


def test_normal_flow(client_with_worker, temp_image_dir):
    """Test normal flow: submit → queued → running → done"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
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
        mock_post.return_value = mock_response

        response = client_with_worker.post(
            "/jobs/submit", json={"payload": {"op": "generate", "prompt": "test"}}
        )
        assert response.status_code == 200
        job_id = response.json()["job_id"]

        # Check queued
        response = client_with_worker.get(f"/jobs/{job_id}")
        assert response.json()["status"] == "queued"

        # Wait for worker to process (longer timeout)
        import time

        for _ in range(50):  # Increased from 10 to 50 iterations
            response = client_with_worker.get(f"/jobs/{job_id}")
            if response.json()["status"] == "done":
                break
            time.sleep(0.2)  # Slightly longer sleep

        response = client_with_worker.get(f"/jobs/{job_id}")
        assert response.json()["status"] == "done"


def test_error_path(client_with_worker, temp_image_dir):
    """Test error path: simulate error during processing → 'error' status"""
    with patch("requests.post", side_effect=Exception("Simulated error")):
        response = client_with_worker.post(
            "/jobs/submit", json={"payload": {"op": "generate", "prompt": "test"}}
        )
        assert response.status_code == 200
        job_id = response.json()["job_id"]

        # Wait for worker
        import time

        for _ in range(10):
            response = client_with_worker.get(f"/jobs/{job_id}")
            if response.json()["status"] == "error":
                break
            time.sleep(0.1)

        response = client_with_worker.get(f"/jobs/{job_id}")
        assert response.json()["status"] == "error"


def test_no_shared_state_leak(client_with_worker, temp_image_dir):
    """Test no shared state leak between jobs: run multiple jobs sequentially"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"dummy": "success"}
        mock_post.return_value = mock_response

        job_ids = []
        for i in range(3):
            response = client_with_worker.post(
                "/jobs/submit",
                json={"payload": {"op": "generate", "prompt": f"test {i}"}},
            )
            job_ids.append(response.json()["job_id"])

        # Wait for all to be done
        import time

        for _ in range(20):
            all_done = True
            for job_id in job_ids:
                response = client_with_worker.get(f"/jobs/{job_id}")
                if response.json()["status"] != "done":
                    all_done = False
                    break
            if all_done:
                break
            time.sleep(0.1)

        for job_id in job_ids:
            response = client_with_worker.get(f"/jobs/{job_id}")
            assert response.json()["status"] == "done"


def test_worker_thread_with_multiple_workers(client_with_worker, temp_image_dir):
    """Test that multiple worker threads can process jobs concurrently"""

    # Mock the provider response with a delay to simulate processing time
    def delayed_post(*args, **kwargs):
        time.sleep(0.5)  # Simulate processing time
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
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
        return mock_response

    with patch("requests.post", side_effect=delayed_post):
        # Submit multiple jobs
        job_ids = []
        for i in range(5):
            response = client_with_worker.post(
                "/jobs/submit",
                json={
                    "payload": {
                        "op": "generate",
                        "prompt": f"test prompt {i}",
                        "width": 512,
                        "height": 512,
                        "fmt": "png",
                        "n": 1,
                    }
                },
            )
            assert response.status_code == 200
            job_ids.append(response.json()["job_id"])

        # Start multiple worker threads
        def worker(worker_id):
            processed_jobs = []
            while True:
                jid = _claim_one_job(app)
                if jid:
                    _process_job(app, jid)
                    processed_jobs.append(jid)
                else:
                    # Check if all jobs are done
                    all_done = True
                    for job_id in job_ids:
                        response = client_with_worker.get(f"/jobs/{job_id}")
                        job_data = response.json()
                        if job_data["status"] not in ["done", "error"]:
                            all_done = False
                            break

                    if all_done:
                        break

                    time.sleep(0.2)

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
            response = client_with_worker.get(f"/jobs/{job_id}")
            assert response.status_code == 200
            job_data = response.json()
            assert job_data["status"] in ["done", "error"]
