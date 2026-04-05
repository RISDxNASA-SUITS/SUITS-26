"""HTTP client helpers for talking to the Java rover backend."""

import json
import os
from typing import Dict, Optional

import requests


BASE_URL = os.getenv("JAVA_BACKEND_URL", "http://localhost:7070")


def get_lidar() -> Optional[Dict[str, object]]:
    """Fetch the latest lidar payload from the Java backend."""
    try:
        response = requests.get(f"{BASE_URL}/lidar")
        if response.status_code == 200:
            return response.json()
    except (requests.exceptions.RequestException, json.JSONDecodeError) as exc:
        print(f"Error getting lidar from server: {exc}")
    return None


def get_telemetry() -> Optional[Dict[str, object]]:
    """Fetch the latest rover telemetry payload from the Java backend."""
    try:
        response = requests.get(f"{BASE_URL}/telemetry")
        if response.status_code == 200:
            return response.json()
    except (requests.exceptions.RequestException, json.JSONDecodeError) as exc:
        print(f"Error getting telemetry from server: {exc}")
    return None


def post_brakes(brake_input: float):
    """Send a brake command to the Java backend."""
    payload = {"brakeInput": brake_input}
    response = requests.post(f"{BASE_URL}/brakes", json=payload)
    return response.status_code, response.text


def post_throttle(throttle_input: float):
    """Send a throttle command to the Java backend."""
    payload = {"throttleInput": throttle_input}
    response = requests.post(f"{BASE_URL}/throttle", json=payload)
    return response.status_code, response.text


def post_steering(steering_input: float):
    """Send a steering command to the Java backend."""
    payload = {"steeringInput": steering_input}
    response = requests.post(f"{BASE_URL}/steering", json=payload)
    return response.status_code, response.text
