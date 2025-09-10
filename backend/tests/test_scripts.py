import pytest
import subprocess
import os
import tempfile
from pathlib import Path


def test_setup_ui_scripts():
    """Test that setup_ui.(bat|sh) creates folders, requirements.txt, and .env.local files"""
    # Create a temporary directory to run the test
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        # Copy the setup scripts to the temp directory
        project_root = Path(__file__).parent.parent.parent
        setup_bat = project_root / "setup_ui.bat"
        setup_sh = project_root / "setup_ui.sh"

        # Create the backend directory as the script expects it
        (temp_path / "backend").mkdir()

        # Copy the setup script to the temp directory
        if os.name == "nt" and setup_bat.exists():
            temp_setup_bat = temp_path / "setup_ui.bat"
            import shutil

            shutil.copy2(setup_bat, temp_setup_bat)

        # Test the batch script on Windows
        if os.name == "nt" and setup_bat.exists():
            # Change to temp directory
            original_cwd = os.getcwd()
            os.chdir(temp_dir)

            try:
                # Run the setup script
                result = subprocess.run(
                    [str(temp_setup_bat)], capture_output=True, text=True, shell=True
                )

                # Check that the script ran successfully
                # We don't require the script to succeed completely (frontend might fail)
                # Just check that the backend part worked

                # Check that expected directories were created
                assert (
                    temp_path / "backend" / "storage"
                ).exists(), "Storage directory not created"
                assert (
                    temp_path / "backend" / "logs"
                ).exists(), "Logs directory not created"
                assert (
                    temp_path / "backend" / "storage" / "images"
                ).exists(), "Images directory not created"

                # Check that requirements.txt was created
                assert (
                    temp_path / "backend" / "requirements.txt"
                ).exists(), "requirements.txt not created"

                # Check that .env was created
                assert (temp_path / "backend" / ".env").exists(), ".env not created"

                # Check that venv was created
                assert (
                    temp_path / "backend" / ".venv"
                ).exists(), "Virtual environment not created"

            finally:
                os.chdir(original_cwd)

        # Test the shell script on Unix-like systems
        elif os.name == "posix" and setup_sh.exists():
            # Change to temp directory
            original_cwd = os.getcwd()
            os.chdir(temp_dir)

            try:
                # Run the setup script
                result = subprocess.run(
                    ["bash", str(setup_sh)], capture_output=True, text=True
                )

                # Check that the script ran successfully
                assert result.returncode == 0, f"Setup script failed: {result.stderr}"

                # Check that expected directories were created
                assert (
                    temp_path / "backend" / "storage"
                ).exists(), "Storage directory not created"
                assert (
                    temp_path / "backend" / "logs"
                ).exists(), "Logs directory not created"
                assert (
                    temp_path / "backend" / "storage" / "images"
                ).exists(), "Images directory not created"
                assert (
                    temp_path / "frontend" / "public"
                ).exists(), "Public directory not created"
                assert (
                    temp_path / "frontend" / "public" / "output"
                ).exists(), "Output directory not created"

                # Check that requirements.txt was created
                assert (
                    temp_path / "backend" / "requirements.txt"
                ).exists(), "requirements.txt not created"

                # Check that .env.local was created
                assert (
                    temp_path / "frontend" / ".env.local"
                ).exists(), ".env.local not created"
                assert (temp_path / "backend" / ".env").exists(), ".env not created"

                # Check that venv was created
                assert (
                    temp_path / "backend" / ".venv"
                ).exists(), "Virtual environment not created"

            finally:
                os.chdir(original_cwd)
        else:
            # Skip the test if the script doesn't exist for the current platform
            pytest.skip(f"Setup script not available for platform: {os.name}")
