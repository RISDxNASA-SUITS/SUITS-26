"""
Local Python Server for Device Connections and Data Retrieval
Supports device connections and provides a pingable endpoint for data retrieval
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uvicorn

app = FastAPI(title="Device Server", version="1.0.0")

# Enable CORS to allow connections from devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for connected devices and data
connected_devices: List[dict] = []
device_data: dict = {}


class DeviceConnection(BaseModel):
    device_id: str
    device_name: Optional[str] = None
    device_type: Optional[str] = None
    metadata: Optional[dict] = None


class DataUpdate(BaseModel):
    device_id: str
    data: dict
    timestamp: Optional[str] = None


@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "status": "online",
        "message": "Device Server is running",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/devices/connect")
async def connect_device(device: DeviceConnection):
    """
    Endpoint for devices to connect to the server
    Registers a new device connection
    """
    connection_info = {
        "device_id": device.device_id,
        "device_name": device.device_name or f"Device_{device.device_id}",
        "device_type": device.device_type or "unknown",
        "metadata": device.metadata or {},
        "connected_at": datetime.now().isoformat(),
        "last_seen": datetime.now().isoformat()
    }
    
    # Update if device already exists, otherwise add new
    existing_index = next(
        (i for i, d in enumerate(connected_devices) if d["device_id"] == device.device_id),
        None
    )
    
    if existing_index is not None:
        connected_devices[existing_index] = connection_info
        return {"message": "Device reconnected", "device": connection_info}
    else:
        connected_devices.append(connection_info)
        return {"message": "Device connected", "device": connection_info}


@app.get("/devices")
async def get_devices():
    """Get list of all connected devices"""
    return {
        "count": len(connected_devices),
        "devices": connected_devices
    }


@app.get("/devices/{device_id}")
async def get_device(device_id: str):
    """Get information about a specific device"""
    device = next(
        (d for d in connected_devices if d["device_id"] == device_id),
        None
    )
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@app.post("/devices/{device_id}/data")
async def update_device_data(device_id: str, data_update: DataUpdate):
    """
    Endpoint for devices to send/update their data
    """
    # Verify device is connected
    device = next(
        (d for d in connected_devices if d["device_id"] == device_id),
        None
    )
    if not device:
        raise HTTPException(status_code=404, detail="Device not found. Connect first.")
    
    # Update device data
    device_data[device_id] = {
        "device_id": device_id,
        "data": data_update.data,
        "timestamp": data_update.timestamp or datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    # Update last_seen
    device["last_seen"] = datetime.now().isoformat()
    
    return {"message": "Data updated", "device_id": device_id}


@app.get("/ping")
async def ping():
    """
    Ping endpoint - can be called from another server to check status
    Returns basic server information
    """
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "connected_devices": len(connected_devices),
        "server_info": {
            "name": "Device Server",
            "version": "1.0.0"
        }
    }


@app.get("/data")
async def get_all_data():
    """
    Get all device data - pingable endpoint for data retrieval
    Can be called from another server to fetch all available data
    """
    return {
        "timestamp": datetime.now().isoformat(),
        "device_count": len(device_data),
        "data": device_data
    }


@app.get("/data/{device_id}")
async def get_device_data(device_id: str):
    """
    Get data for a specific device - pingable endpoint
    Can be called from another server to fetch specific device data
    """
    if device_id not in device_data:
        raise HTTPException(status_code=404, detail="No data found for this device")
    
    return device_data[device_id]


@app.delete("/devices/{device_id}/disconnect")
async def disconnect_device(device_id: str):
    """Disconnect a device"""
    global connected_devices, device_data
    
    device = next(
        (d for d in connected_devices if d["device_id"] == device_id),
        None
    )
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    connected_devices = [d for d in connected_devices if d["device_id"] != device_id]
    if device_id in device_data:
        del device_data[device_id]
    
    return {"message": "Device disconnected", "device_id": device_id}


if __name__ == "__main__":
    # Run the server
    # Accessible on all network interfaces (0.0.0.0) so devices can connect
    uvicorn.run(
        app,
        host="0.0.0.0",  # Allows connections from other devices on the network
        port=8000,
        log_level="info"
    )

