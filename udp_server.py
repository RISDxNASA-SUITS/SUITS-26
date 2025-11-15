"""
UDP Server for Device Connections and Data Retrieval
Lightweight UDP-based server for device communication
"""

import socket
import json
import threading
from datetime import datetime
from typing import Dict, List

# In-memory storage for connected devices and data
connected_devices: Dict[str, dict] = {}
device_data: Dict[str, dict] = {}

# Thread lock for thread-safe operations
lock = threading.Lock()


def handle_udp_message(data: bytes, client_address: tuple):
    """
    Handle incoming UDP messages from devices or other servers
    """
    try:
        message = json.loads(data.decode('utf-8'))
        action = message.get('action')
        
        with lock:
            if action == 'connect':
                return handle_connect(message, client_address)
            elif action == 'update_data':
                return handle_update_data(message)
            elif action == 'ping':
                return handle_ping()
            elif action == 'get_data':
                return handle_get_data(message)
            elif action == 'get_all_data':
                return handle_get_all_data()
            else:
                return {
                    'status': 'error',
                    'message': f'Unknown action: {action}'
                }
    except json.JSONDecodeError:
        return {
            'status': 'error',
            'message': 'Invalid JSON format'
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }


def handle_connect(message: dict, client_address: tuple):
    """Handle device connection"""
    device_id = message.get('device_id')
    if not device_id:
        return {'status': 'error', 'message': 'device_id required'}
    
    device_info = {
        'device_id': device_id,
        'device_name': message.get('device_name', f'Device_{device_id}'),
        'device_type': message.get('device_type', 'unknown'),
        'metadata': message.get('metadata', {}),
        'connected_at': datetime.now().isoformat(),
        'last_seen': datetime.now().isoformat(),
        'client_address': f"{client_address[0]}:{client_address[1]}"
    }
    
    connected_devices[device_id] = device_info
    
    return {
        'status': 'success',
        'message': 'Device connected',
        'device': device_info
    }


def handle_update_data(message: dict):
    """Handle device data update"""
    device_id = message.get('device_id')
    if not device_id:
        return {'status': 'error', 'message': 'device_id required'}
    
    if device_id not in connected_devices:
        return {'status': 'error', 'message': 'Device not found. Connect first.'}
    
    data = message.get('data', {})
    device_data[device_id] = {
        'device_id': device_id,
        'data': data,
        'timestamp': message.get('timestamp', datetime.now().isoformat()),
        'updated_at': datetime.now().isoformat()
    }
    
    # Update last_seen
    connected_devices[device_id]['last_seen'] = datetime.now().isoformat()
    
    return {
        'status': 'success',
        'message': 'Data updated',
        'device_id': device_id
    }


def handle_ping():
    """Handle ping request"""
    return {
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'connected_devices': len(connected_devices),
        'server_info': {
            'name': 'UDP Device Server',
            'version': '1.0.0',
            'protocol': 'UDP'
        }
    }


def handle_get_data(message: dict):
    """Handle get specific device data request"""
    device_id = message.get('device_id')
    if not device_id:
        return {'status': 'error', 'message': 'device_id required'}
    
    if device_id not in device_data:
        return {'status': 'error', 'message': 'No data found for this device'}
    
    return {
        'status': 'success',
        'data': device_data[device_id]
    }


def handle_get_all_data():
    """Handle get all data request"""
    return {
        'status': 'success',
        'timestamp': datetime.now().isoformat(),
        'device_count': len(device_data),
        'data': device_data
    }


def start_udp_server(host='0.0.0.0', port=8888):
    """
    Start the UDP server
    """
    # Create UDP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((host, port))
    
    print(f"UDP Server started on {host}:{port}")
    print(f"Waiting for connections...")
    
    try:
        while True:
            # Receive data from client
            data, client_address = sock.recvfrom(4096)  # 4KB buffer
            
            # Handle message in a thread-safe manner
            response = handle_udp_message(data, client_address)
            
            # Send response back to client
            response_json = json.dumps(response).encode('utf-8')
            sock.sendto(response_json, client_address)
            
            print(f"Received from {client_address}: {data.decode('utf-8')[:100]}")
            print(f"Sent response: {response.get('status', 'unknown')}")
            
    except KeyboardInterrupt:
        print("\nShutting down UDP server...")
    finally:
        sock.close()


if __name__ == "__main__":
    # Run the UDP server
    # Accessible on all network interfaces (0.0.0.0) so devices can connect
    start_udp_server(host='0.0.0.0', port=8888)

