import pytest
import time
from unittest.mock import patch, MagicMock


def test_submit_job_generate(client, temp_image_dir):
    """Test submitting a generate job"""
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

    data = response.json()
    assert "job_id" in data
    assert data["status"] == "queued"


def test_submit_job_edit(client, temp_image_dir):
    """Test submitting an edit job"""
    import base64
    from PIL import Image
    import io

    # Create test image data
    img = Image.new("RGB", (60, 30), color="red")
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    base_img_data = base64.b64encode(img_bytes.getvalue()).decode()

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

    data = response.json()
    assert "job_id" in data
    assert data["status"] == "queued"


def test_submit_job_edit_without_base(client):
    """Test that submitting an edit job without base image succeeds (validation happens at processing)"""
    response = client.post(
        "/jobs/submit",
        json={
            "payload": {
                "op": "edit",
                "prompt": "test prompt",
                "width": 512,
                "height": 512,
                "fmt": "png",
                "n": 1,
            }
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "queued"


def test_get_job(client, temp_image_dir):
    """Test getting a job by ID"""
    # First submit a job
    submit_response = client.post(
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
    assert submit_response.status_code == 200
    job_id = submit_response.json()["job_id"]

    # Now get the job
    response = client.get(f"/jobs/{job_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["job_id"] == job_id
    assert data["status"] in ["queued", "running", "done", "error"]


def test_get_nonexistent_job(client):
    """Test getting a non-existent job"""
    response = client.get("/jobs/nonexistent-job-id")
    assert response.status_code == 404


# Removed test_list_jobs as there's no GET /jobs endpoint


def test_job_processing_with_mock_provider(client, temp_image_dir):
    """Test that jobs are processed correctly with mocked provider"""
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
        # Submit a job
        submit_response = client.post(
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
        assert submit_response.status_code == 200
        job_id = submit_response.json()["job_id"]

        # Wait for the job to be processed
        for _ in range(10):  # Wait up to 10 seconds
            response = client.get(f"/jobs/{job_id}")
            assert response.status_code == 200
            job_data = response.json()

            if job_data["status"] == "done":
                break
            elif job_data["status"] == "error":
                pytest.fail(f"Job failed with error: {job_data['error']}")

            time.sleep(1)
        else:
            pytest.fail("Job did not complete within 10 seconds")

        # Verify the job result
        assert job_data["status"] == "done"
        assert job_data["result"] is not None
        assert isinstance(job_data["result"], dict)


def test_job_processing_with_error(client, temp_image_dir):
    """Test that job errors are handled correctly"""
    # Mock the provider to raise an exception
    with patch("requests.post", side_effect=Exception("Provider error")):
        # Submit a job
        submit_response = client.post(
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
        assert submit_response.status_code == 200
        job_id = submit_response.json()["job_id"]

        # Wait for the job to fail
        for _ in range(10):  # Wait up to 10 seconds
            response = client.get(f"/jobs/{job_id}")
            assert response.status_code == 200
            job_data = response.json()

            if job_data["status"] == "error":
                break
            elif job_data["status"] == "done":
                pytest.fail("Job should have failed but succeeded")

            time.sleep(1)
        else:
            pytest.fail("Job did not fail within 10 seconds")

        # Verify the job error
        assert job_data["status"] == "error"
        assert job_data["error"] is not None
        assert "Provider error" in str(job_data["error"])


def test_get_job_after_submit(client):
    """Test submitting a job then GET it, checking statuses"""
    # Submit a job
    submit_response = client.post("/jobs/submit", json={"payload": {}})
    assert submit_response.status_code == 200
    job_id = submit_response.json()["job_id"]

    # GET the job
    response = client.get(f"/jobs/{job_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["job_id"] == job_id
    assert data["status"] in ["queued", "running", "done", "error"]
    assert "result" in data
    assert "error" in data


def test_get_nonexistent_job_404(client):
    """Test GET a non-existent job returns 404"""
    response = client.get("/jobs/invalid-job-id")
    assert response.status_code == 404


def test_worker_happy_path(client_with_worker):
    """Test worker processes job successfully"""
    submit_response = client_with_worker.post(
        "/jobs/submit", json={"payload": {"test": "data"}}
    )
    assert submit_response.status_code == 200
    job_id = submit_response.json()["job_id"]

    # Wait for completion
    for _ in range(5):
        response = client_with_worker.get(f"/jobs/{job_id}")
        if response.json()["status"] == "done":
            break
        time.sleep(0.1)
    else:
        pytest.fail("Job not done")

    data = response.json()
    assert data["status"] == "done"
    assert data["result"] is not None


def test_worker_error_path(client_with_worker):
    """Test worker handles job error"""
    with patch("requests.post", side_effect=Exception("Test error")):
        submit_response = client_with_worker.post(
            "/jobs/submit", json={"payload": {"test": "data"}}
        )
        assert submit_response.status_code == 200
        job_id = submit_response.json()["job_id"]

        # Wait for error
        for _ in range(5):
            response = client_with_worker.get(f"/jobs/{job_id}")
            if response.json()["status"] == "error":
                break
            time.sleep(0.1)
        else:
            pytest.fail("Job not error")

        data = response.json()
        assert data["status"] == "error"
        assert data["error"] is not None
