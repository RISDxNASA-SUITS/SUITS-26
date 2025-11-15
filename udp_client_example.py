"""
Example UDP client demonstrating how to connect devices and retrieve data via UDP
"""

import socket
import json

# Server configuration - change to your server's IP address if connecting from another device
SERVER_HOST = "localhost"
SERVER_PORT = 8888


def send_udp_message(message: dict) -> dict:
    """Send a UDP message to the server and receive response"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    try:
        # Send message
        message_json = json.dumps(message).encode('utf-8')
        sock.sendto(message_json, (SERVER_HOST, SERVER_PORT))
        
        # Receive response
        sock.settimeout(5)  # 5 second timeout
        data, server_address = sock.recvfrom(4096)
        response = json.loads(data.decode('utf-8'))
        return response
    except socket.timeout:
        return {'status': 'error', 'message': 'Request timeout'}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}
    finally:
        sock.close()


def connect_device(device_id: str, device_name: str = None, device_type: str = None):
    """Connect a device to the UDP server"""
    message = {
        'action': 'connect',
        'device_id': device_id,
        'device_name': device_name,
        'device_type': device_type
    }
    return send_udp_message(message)


def update_data(device_id: str, data: dict):
    """Send data from a device"""
    message = {
        'action': 'update_data',
        'device_id': device_id,
        'data': data
    }
    return send_udp_message(message)


def ping_server():
    """Ping the UDP server"""
    message = {'action': 'ping'}
    return send_udp_message(message)


def get_all_data():
    """Get all device data"""
    message = {'action': 'get_all_data'}
    return send_udp_message(message)


def get_device_data(device_id: str):
    """Get data for a specific device"""
    message = {
        'action': 'get_data',
        'device_id': device_id
    }
    return send_udp_message(message)


if __name__ == "__main__":
    print("=== UDP Device Server Client Example ===\n")
    
    # 1. Ping the server
    print("1. Pinging UDP server...")
    ping_result = ping_server()
    print(json.dumps(ping_result, indent=2))
    print()
    
    # 2. Connect a device
    print("2. Connecting device...")
    device_id = "udp_device_001"
    connect_result = connect_device(
        device_id=device_id,
        device_name="UDP Sensor Device",
        device_type="sensor"
    )
    print(json.dumps(connect_result, indent=2))
    print()
    
    # 3. Send some data
    print("3. Sending data from device...")
    data = {
        "temperature": 24.8,
        "humidity": 58,
        "pressure": 1015.2,
        "status": "active"
    }
    send_result = update_data(device_id, data)
    print(json.dumps(send_result, indent=2))
    print()
    
    # 4. Retrieve all data
    print("4. Retrieving all data...")
    all_data = get_all_data()
    print(json.dumps(all_data, indent=2))
    print()
    
    # 5. Get specific device data
    print("5. Retrieving specific device data...")
    device_data = get_device_data(device_id)
    print(json.dumps(device_data, indent=2))

