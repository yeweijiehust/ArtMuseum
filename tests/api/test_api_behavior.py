import os
import shutil
import socket
import subprocess
import time
import uuid

import pytest
import requests


@pytest.fixture(scope="session")
def api_base_url():
    port = free_port()
    pnpm = shutil.which("pnpm")
    assert pnpm is not None
    env = os.environ.copy()
    env.update(
        {
            "PORT": str(port),
            "HOST": "127.0.0.1",
            "NODE_ENV": "test",
            "DATA_STORE": "memory",
            "STORAGE_DRIVER": "fake",
            "ENABLE_API_DOCS": "true",
            "JWT_SECRET": "test-jwt-secret-test-jwt-secret",
            "COOKIE_SECRET": "test-cookie-secret-test-cookie-secret",
        }
    )
    process = subprocess.Popen(
        [pnpm, "--filter", "@artmuseum/api", "test:server"],
        cwd=repo_root(),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    base_url = f"http://127.0.0.1:{port}"
    try:
        wait_for_server(process, base_url)
        yield base_url
    finally:
        stop_process(process)


def test_register_login_logout_and_duplicate_registration(api_base_url):
    session = requests.Session()
    email = unique_email()
    registered = register(session, api_base_url, email=email)
    assert registered.status_code == 201
    assert registered.json()["user"]["email"] == email
    duplicate = register(requests.Session(), api_base_url, email=email.upper())
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "EMAIL_EXISTS"
    me = session.get(f"{api_base_url}/api/auth/me")
    assert me.status_code == 200
    failed = requests.post(
        f"{api_base_url}/api/auth/login",
        json={"email": email, "password": "wrongpass"},
        timeout=10,
    )
    assert failed.status_code == 401
    assert failed.json()["error"]["code"] == "INVALID_CREDENTIALS"
    logged_in = requests.Session()
    login = logged_in.post(
        f"{api_base_url}/api/auth/login",
        json={"email": email, "password": "password123"},
        timeout=10,
    )
    assert login.status_code == 200
    logout = logged_in.post(f"{api_base_url}/api/auth/logout", timeout=10)
    assert logout.status_code == 204
    after_logout = logged_in.get(f"{api_base_url}/api/auth/me", timeout=10)
    assert after_logout.status_code == 401


def test_upload_boundaries_and_storage_failure(api_base_url):
    anonymous = requests.post(
        f"{api_base_url}/api/images",
        data={"title": "Anonymous"},
        files={"file": ("photo.jpg", b"image", "image/jpeg")},
        timeout=10,
    )
    assert anonymous.status_code == 401
    session = requests.Session()
    register(session, api_base_url)
    missing_file = session.post(f"{api_base_url}/api/images", data={"title": "No file"}, timeout=10)
    assert missing_file.status_code == 400
    assert missing_file.json()["error"]["code"] == "FILE_REQUIRED"
    missing_title = session.post(
        f"{api_base_url}/api/images",
        files={"file": ("photo.jpg", b"image", "image/jpeg")},
        timeout=10,
    )
    assert missing_title.status_code == 400
    assert missing_title.json()["error"]["code"] == "TITLE_REQUIRED"
    invalid_type = session.post(
        f"{api_base_url}/api/images",
        data={"title": "Bad type"},
        files={"file": ("photo.txt", b"text", "text/plain")},
        timeout=10,
    )
    assert invalid_type.status_code == 400
    assert invalid_type.json()["error"]["code"] == "INVALID_FILE_TYPE"
    too_large = session.post(
        f"{api_base_url}/api/images",
        data={"title": "Too large"},
        files={"file": ("large.jpg", b"x" * (10 * 1024 * 1024 + 1), "image/jpeg")},
        timeout=30,
    )
    assert too_large.status_code == 400
    assert too_large.json()["error"]["code"] == "FILE_TOO_LARGE"
    storage_failure = session.post(
        f"{api_base_url}/api/images",
        data={"title": "Storage failure"},
        files={"file": ("fail-storage.jpg", b"image", "image/jpeg")},
        timeout=10,
    )
    assert storage_failure.status_code == 502
    assert storage_failure.json()["error"]["code"] == "STORAGE_FAILURE"


def test_public_gallery_and_owner_only_management(api_base_url):
    owner = requests.Session()
    intruder = requests.Session()
    register(owner, api_base_url, display_name="Owner")
    register(intruder, api_base_url, display_name="Intruder")
    uploaded = upload_image(owner, api_base_url, title="Window Light")
    assert uploaded.status_code == 201
    image_id = uploaded.json()["id"]
    gallery = requests.get(f"{api_base_url}/api/images", timeout=10)
    assert gallery.status_code == 200
    assert any(item["id"] == image_id for item in gallery.json()["items"])
    blocked_patch = intruder.patch(f"{api_base_url}/api/images/{image_id}", json={"title": "Mine"}, timeout=10)
    assert blocked_patch.status_code == 403
    patched = owner.patch(f"{api_base_url}/api/images/{image_id}", json={"title": "Window Light Revised"}, timeout=10)
    assert patched.status_code == 200
    assert patched.json()["title"] == "Window Light Revised"
    blocked_delete = intruder.delete(f"{api_base_url}/api/images/{image_id}", timeout=10)
    assert blocked_delete.status_code == 403
    deleted = owner.delete(f"{api_base_url}/api/images/{image_id}", timeout=10)
    assert deleted.status_code == 204
    missing = requests.get(f"{api_base_url}/api/images/{image_id}", timeout=10)
    assert missing.status_code == 404


def test_malformed_request_and_openapi_json(api_base_url):
    malformed = requests.post(
        f"{api_base_url}/api/auth/register",
        data="{",
        headers={"Content-Type": "application/json", "Accept-Language": "zh"},
        timeout=10,
    )
    assert malformed.status_code == 400
    assert malformed.json()["error"]["code"] in {"BAD_REQUEST", "VALIDATION_ERROR"}
    docs = requests.get(f"{api_base_url}/api/docs/json", timeout=10)
    assert docs.status_code == 200
    body = docs.json()
    assert "/api/images" in body["paths"]
    assert body["paths"]["/api/images"]["post"]["security"] == [{"cookieAuth": []}]


def register(session, base_url, display_name="Ada", email=None):
    return session.post(
        f"{base_url}/api/auth/register",
        json={
            "displayName": display_name,
            "email": email or unique_email(),
            "password": "password123",
        },
        timeout=10,
    )


def upload_image(session, base_url, title):
    return session.post(
        f"{base_url}/api/images",
        data={"title": title, "description": "A frame", "altText": "A photograph"},
        files={"file": ("photo.jpg", b"image", "image/jpeg")},
        timeout=10,
    )


def unique_email():
    return f"user-{uuid.uuid4().hex}@example.com"


def repo_root():
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def wait_for_server(process, base_url):
    deadline = time.time() + 45
    while time.time() < deadline:
        if process.poll() is not None:
            output = process.stdout.read() if process.stdout else ""
            raise RuntimeError("API server exited early:\n" + output)
        try:
            response = requests.get(f"{base_url}/api/health", timeout=1)
            if response.status_code == 200:
                return
        except requests.RequestException:
            pass
        time.sleep(0.2)
    raise RuntimeError("API server did not become ready")


def stop_process(process):
    if process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
