import ipaddress
import os
import re
import socket
import subprocess
import sys

DEFAULT_JAVA_PORT = 7071
HOSTNAME_PATTERN = re.compile(r"^(?=.{1,253}$)(?!-)[A-Za-z0-9.-]+(?<!-)$")


def _ensure_dependencies() -> None:
    missing: list[str] = []
    try:
        import flask  # noqa: F401
    except ImportError:
        missing.append("flask")

    try:
        import requests  # noqa: F401
    except ImportError:
        missing.append("requests")

    if missing:
        packages = " ".join(missing)
        print(
            "Error: missing Python dependencies: "
            f"{', '.join(missing)}. Install them with "
            f"'python -m pip install {packages}' and try again."
        )
        sys.exit(1)


def _is_valid_host(value: str) -> bool:
    try:
        ipaddress.ip_address(value)
        return True
    except ValueError:
        return bool(HOSTNAME_PATTERN.fullmatch(value))


def _is_resolvable_host(value: str) -> bool:
    try:
        socket.getaddrinfo(value, None)
        return True
    except socket.gaierror:
        return False


def _prompt_java_host() -> str:
    host = input("Enter JavaBackend IP/host: ").strip()
    if not host:
        print("Error: JavaBackend IP/host is required.")
        sys.exit(1)
    if not _is_valid_host(host):
        print("Error: invalid JavaBackend IP/host format.")
        sys.exit(1)
    if not _is_resolvable_host(host):
        print(f"Error: unable to resolve JavaBackend host '{host}'.")
        sys.exit(1)
    return host


def _prompt_java_port() -> int:
    raw = input(f"Enter JavaBackend HTTP port [{DEFAULT_JAVA_PORT}]: ").strip()
    if not raw:
        return DEFAULT_JAVA_PORT
    try:
        port = int(raw)
    except ValueError:
        print("Error: JavaBackend port must be an integer.")
        sys.exit(1)
    if port < 1 or port > 65535:
        print("Error: JavaBackend port must be between 1 and 65535.")
        sys.exit(1)
    return port


def _verify_java_backend(java_backend_url: str) -> None:
    import requests

    try:
        response = requests.get(f"{java_backend_url}/telemetry", timeout=3)
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f"Error: JavaBackend is not reachable at {java_backend_url}: {exc}")
        sys.exit(1)


def main() -> None:
    _ensure_dependencies()
    host = _prompt_java_host()
    port = _prompt_java_port()
    java_backend_url = f"http://{host}:{port}"
    _verify_java_backend(java_backend_url)
    java_backend_ws_url = f"ws://{host}:{port}/telemetry/live"

    env = os.environ.copy()
    env["JAVA_BACKEND_URL"] = java_backend_url

    print(f"Verified JavaBackend REST endpoint: {java_backend_url}/telemetry")
    print(f"Matching JavaBackend WebSocket endpoint: {java_backend_ws_url}")
    print("Starting PythonBackend on http://127.0.0.1:4000")

    api_path = os.path.join(os.path.dirname(__file__), "python_server", "api.py")
    completed = subprocess.run([sys.executable, api_path], env=env, check=False)
    sys.exit(completed.returncode)


if __name__ == "__main__":
    main()
