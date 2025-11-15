# Device Server

A local Python server that allows devices to connect and provides pingable endpoints for data retrieval.

**Two implementations available:**
- **HTTP/TCP Server** (`server.py`) - RESTful API using FastAPI
- **UDP Server** (`udp_server.py`) - Lightweight UDP-based communication

## Features

- **Device Connection**: Devices can connect and register with the server
- **Data Storage**: Devices can send and update their data
- **Ping Endpoints**: Other servers can ping endpoints to retrieve data
- **CORS Enabled** (HTTP only): Allows cross-origin requests from devices
- **Network Accessible**: Server runs on `0.0.0.0` to accept connections from other devices on the network
- **Protocol Support**: Both HTTP/TCP and UDP protocols available

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

### HTTP/TCP Server (FastAPI)
```bash
python server.py
```
The server will start on `http://0.0.0.0:8000` (accessible on all network interfaces).
You can also access it locally at `http://localhost:8000`

### UDP Server
```bash
python udp_server.py
```
The UDP server will start on `0.0.0.0:8888` (accessible on all network interfaces).

**Note:** You can run both servers simultaneously on different ports if needed.

## API Endpoints

### Device Connection
- `POST /devices/connect` - Connect a device to the server
- `GET /devices` - Get list of all connected devices
- `GET /devices/{device_id}` - Get information about a specific device
- `DELETE /devices/{device_id}/disconnect` - Disconnect a device

### Data Management
- `POST /devices/{device_id}/data` - Update/send data from a device
- `GET /data` - Get all device data (pingable from other servers)
- `GET /data/{device_id}` - Get data for a specific device (pingable)

### Ping Endpoints
- `GET /ping` - Ping endpoint to check server status
- `GET /` - Root endpoint (health check)

## Usage Examples

### Connect a Device
```bash
curl -X POST "http://localhost:8000/devices/connect" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "device_001",
    "device_name": "Sensor Device",
    "device_type": "sensor",
    "metadata": {"location": "room_1"}
  }'
```

### Send Data from Device
```bash
curl -X POST "http://localhost:8000/devices/device_001/data" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "device_001",
    "data": {"temperature": 25.5, "humidity": 60}
  }'
```

### Ping from Another Server
```bash
# Check server status
curl "http://localhost:8000/ping"

# Get all data
curl "http://localhost:8000/data"

# Get specific device data
curl "http://localhost:8000/data/device_001"
```

## API Documentation

Once the server is running, you can access interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Network Configuration

The server is configured to accept connections from any device on your local network. To connect from another device:

1. Find your server's IP address (e.g., `192.168.1.100`)
2. Use that IP instead of `localhost` in API calls
3. Ensure both devices are on the same network

## UDP Server Usage

The UDP server uses JSON messages with an `action` field. Available actions:

- `connect` - Connect a device
- `update_data` - Update device data
- `ping` - Ping the server
- `get_data` - Get specific device data
- `get_all_data` - Get all device data

### Example UDP Message Format:
```json
{
  "action": "connect",
  "device_id": "device_001",
  "device_name": "Sensor Device",
  "device_type": "sensor"
}
```

See `udp_client_example.py` for a complete example of UDP client usage.

## Protocol Comparison

| Feature | HTTP/TCP Server | UDP Server |
|---------|----------------|------------|
| Protocol | HTTP over TCP | UDP |
| Connection | Connection-oriented | Connectionless |
| Reliability | Guaranteed delivery | Best-effort delivery |
| Overhead | Higher (HTTP headers) | Lower (lightweight) |
| Speed | Slightly slower | Faster |
| Use Case | RESTful APIs, web clients | IoT devices, real-time data |

## Notes

- Data is stored in-memory and will be lost when the server restarts
- For production use, consider adding:
  - Database persistence
  - Authentication/authorization
  - Rate limiting
  - Specific CORS origins instead of `*` (HTTP only)
  - Message acknowledgment for UDP (if reliability is needed)

