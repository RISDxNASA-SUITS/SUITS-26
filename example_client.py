"""
Example client script demonstrating how to connect devices and retrieve data
This can be run from another machine/server to interact with the device server
"""

import requests
import json
import time

# Server URL - change this to your server's IP address if connecting from another device
SERVER_URL = "http://localhost:8000"

def connect_device(device_id, device_name=None, device_type=None):
    """Connect a device to the server"""
    url = f"{SERVER_URL}/devices/connect"
    payload = {
        "device_id": device_id,
        "device_name": device_name,
        "device_type": device_type
    }
    response = requests.post(url, json=payload)
    return response.json()

def send_data(device_id, data):
    """Send data from a device"""
    url = f"{SERVER_URL}/devices/{device_id}/data"
    payload = {
        "device_id": device_id,
        "data": data
    }
    response = requests.post(url, json=payload)
    return response.json()

def ping_server():
    """Ping the server to check status"""
    url = f"{SERVER_URL}/ping"
    response = requests.get(url)
    return response.json()

def get_all_data():
    """Get all device data (pingable endpoint)"""
    url = f"{SERVER_URL}/data"
    response = requests.get(url)
    return response.json()

def get_device_data(device_id):
    """Get data for a specific device"""
    url = f"{SERVER_URL}/data/{device_id}"
    response = requests.get(url)
    return response.json()

if __name__ == "__main__":
    print("=== Device Server Client Example ===\n")
    
    # 1. Ping the server
    print("1. Pinging server...")
    ping_result = ping_server()
    print(json.dumps(ping_result, indent=2))
    print()
    
    # 2. Connect a device
    print("2. Connecting device...")
    device_id = "example_device_001"
    connect_result = connect_device(
        device_id=device_id,
        device_name="Example Sensor",
        device_type="sensor"
    )
    print(json.dumps(connect_result, indent=2))
    print()
    
    # 3. Send some data
    print("3. Sending data from device...")
    data = {
        "temperature": 23.5,
        "humidity": 65,
        "pressure": 1013.25,
        "status": "active"
    }
    send_result = send_data(device_id, data)
    print(json.dumps(send_result, indent=2))
    print()
    
    # 4. Retrieve data (pingable endpoint)
    print("4. Retrieving all data (pingable endpoint)...")
    all_data = get_all_data()
    print(json.dumps(all_data, indent=2))
    print()
    
    # 5. Get specific device data
    print("5. Retrieving specific device data...")
    device_data = get_device_data(device_id)
    print(json.dumps(device_data, indent=2))

