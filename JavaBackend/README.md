# Java Backend

Kotlin/Javalin backend for SUITS-26.

This service exposes:
- POI and audio endpoints backed by SQLite
- Rover control and rover telemetry endpoints backed by TSS `ROVER.json`
- EVA telemetry/state endpoints backed by TSS `EVA.json`
- LTV and LTV error endpoints backed by TSS `LTV.json` and `LTV_ERRORS.json`

The server listens on `http://localhost:7070` by default (override with `JAVA_HTTP_PORT`).

## Configuration

The backend reads TSS over UDP using these environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `JAVA_HTTP_PORT` | `7070` | HTTP port for Javalin (REST + WebSocket). Use another value if `7070` is already in use. |
| `TSS_HOST` | `127.0.0.1` | Hostname or IP of the TSS server |
| `TSS_UDP_PORT` | `14141` | UDP port for TSS |
| `PORT` | `14141` | Fallback if `TSS_UDP_PORT` is unset |
| `TSS_TIMEOUT_MS` | `1500` | UDP socket timeout in milliseconds |
| `TELEMETRY_POLL_INTERVAL_MS` | `1000` | WebSocket live telemetry poll interval |

**Startup host precedence:** first CLI argument, then `TSS_HOST`, then `127.0.0.1`.

```bash
# env only
TSS_HOST=192.168.1.42 mvn exec:java

# CLI overrides env
mvn exec:java -Dexec.args="192.168.1.42"
```

### Live telemetry WebSocket

`WS /telemetry/live` — server polls TSS once per interval and broadcasts JSON to all connected clients.

```json
{
  "timestamp": 1716076800000,
  "tssHost": "127.0.0.1",
  "tssConnected": true,
  "error": null,
  "rover": { "...": "same shape as GET /telemetry" },
  "lidar": [120.0, 250.0]
}
```

When TSS is unreachable, `tssConnected` is `false`, `error` describes the failure, and `rover`/`lidar` contain safe defaults.

Local files created by the backend:
- `sample.db`: SQLite database for POIs and audio metadata
- `uploads/`: uploaded audio files

## API Overview

### POI APIs

Base shape used for POIs:

```json
{
  "id": 1,
  "name": "Sample POI",
  "x": -5839.3,
  "y": -10460.6,
  "tags": ["sample", "ltv"],
  "description": "Example point of interest",
  "type": "marker",
  "audioId": 2,
  "radius": 5.0
}
```

#### `GET /poi`

Returns all POIs.

Response:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Sample POI",
      "x": -5839.3,
      "y": -10460.6,
      "tags": ["sample", "ltv"],
      "description": "Example point of interest",
      "type": "marker",
      "audioId": 2,
      "radius": 5.0
    }
  ]
}
```

#### `POST /poi`

Creates a POI.

Request body:

```json
{
  "id": null,
  "name": "Sample POI",
  "x": -5839.3,
  "y": -10460.6,
  "tags": ["sample", "ltv"],
  "description": "Example point of interest",
  "type": "marker",
  "audioId": null,
  "radius": 5.0
}
```

Returns the created POI.

#### `PUT /poi`

Updates an existing POI.

Request body:

```json
{
  "id": 1,
  "name": "Updated POI",
  "x": -5839.3,
  "y": -10460.6,
  "tags": ["updated"],
  "description": "Updated description",
  "type": "marker",
  "audioId": 2,
  "radius": 10.0
}
```

Response: plain text `"updated"` on success.

#### `DELETE /poi`

Deletes all POIs and audio metadata.

Response: plain text `"Successfully deleted POI"`.

#### `DELETE /poi/{id}`

Deletes a single POI by ID.

Response: plain text like `"Deleted POI with ID: 1"`.

#### `GET /poi/tag/{tag}`

Returns all POIs whose stored tag string contains the provided tag.

#### `GET /poi/area?minLat={v}&maxLat={v}&minLon={v}&maxLon={v}`

Returns POIs inside the requested bounding box.

#### `POST /poi/updateTags/{id}`

Updates only the tag list for a POI.

Request body:

```json
{
  "tags": ["science", "priority"]
}
```

Response: plain text `"updated"`.

### Audio APIs

#### `POST /audio`

Uploads an audio file using multipart form data.

Expected form field:
- `audio`

Successful response:

```json
{
  "filename": "note.wav",
  "id": 2
}
```

#### `GET /audio/{id}`

Streams the uploaded audio file for the given audio ID.

#### `POST /poi/addVoiceNote`

Associates an uploaded audio record with a POI.

Request body:

```json
{
  "poiId": 1,
  "voiceNote": 2
}
```

Response: plain text `"Voice note added"`.

## Rover APIs

These endpoints read or control rover state through TSS.

### `GET /telemetry`

Returns normalized rover telemetry derived from TSS `ROVER.json`.

Example response shape:

```json
{
  "acHeating": false,
  "acCooling": false,
  "co2Scrubber": false,
  "lightsOn": false,
  "internalLightsOn": false,
  "brakes": false,
  "inSunlight": true,
  "throttle": 0.0,
  "steering": 0.0,
  "currentPosX": -5800.0,
  "currentPosY": -10400.0,
  "currentPosAlt": 0.0,
  "heading": 0.0,
  "pitch": 0.0,
  "roll": 0.0,
  "distanceTraveled": 0.0,
  "speed": 0.0,
  "surfaceIncline": 0.0,
  "oxygenTank": 100.0,
  "oxygenPressure": 0.0,
  "oxygenLevels": 100.0,
  "fanPri": true,
  "acFanPri": 0.0,
  "acFanSec": 0.0,
  "cabinPressure": 0.0,
  "cabinTemperature": 0.0,
  "batteryLevel": 100.0,
  "powerConsumptionRate": 0.0,
  "solarPanelEfficiency": 0.0,
  "externalTemp": 0.0,
  "prCoolantLevel": 0.0,
  "prCoolantPressure": 0.0,
  "prCoolantTank": 0.0,
  "radiator": 0.0,
  "motorPowerConsumption": 0.0,
  "terrainCondition": 0.0,
  "solarPanelDustAccum": 0.0,
  "missionElapsedTime": 0.0,
  "missionPlannedTime": 0.0,
  "pointOfNoReturn": 0.0,
  "distanceFromBase": 0.0,
  "switchDest": false,
  "destX": 0.0,
  "destY": 0.0,
  "destZ": 0.0,
  "dustWiper": false,
  "simRunning": false,
  "simPaused": false,
  "simCompleted": false,
  "latitude": -10400.0,
  "longitude": -5800.0
}
```

### `GET /lidar`

Returns the first 17 LIDAR values from rover telemetry.

Response:

```json
{
  "data": [
    120.0,
    250.0,
    -1.0,
    98.0,
    76.0,
    130.0,
    142.0,
    88.0,
    91.0,
    -1.0,
    -1.0,
    165.0,
    143.0,
    111.0,
    104.0,
    97.0,
    89.0
  ]
}
```

### `POST /brakes`

Request body:

```json
{
  "brakeInput": 1.0
}
```

Response:
- `1` for success
- `0` for failure

### `POST /throttle`

Request body:

```json
{
  "throttleInput": 50.0
}
```

Response:
- `1` for success
- `0` for failure

### `POST /steering`

Request body:

```json
{
  "steeringInput": 0.5
}
```

Response:
- `1.0` for success
- `0.0` for failure

### `POST /headlights`

Request body:

```json
{
  "input": 1.0
}
```

Response:
- `1.0` for success
- `0.0` for failure

## EVA APIs

These endpoints read current EVA state from TSS `EVA.json`.

### `GET /dcu/1`
### `GET /dcu/2`

Returns a normalized DCU state:

```json
{
  "battery": "LOCAL",
  "oxygen": "PRI",
  "comms": "A",
  "fan": "PRI",
  "pump": "OPEN",
  "co2": "A"
}
```

### `GET /error`

Response:

```json
{
  "fan_error": false,
  "oxy_error": false,
  "pump_error": false
}
```

Note: `pump_error` is currently sourced from `power_error` in TSS `EVA.json`.

### `GET /imu/1`
### `GET /imu/2`

Response:

```json
{
  "posx": -6775.85,
  "posy": -9927.69,
  "heading": 0.0
}
```

### `GET /uia`

Response:

```json
{
  "eva1_power": false,
  "eva1_oxy": false,
  "eva1_water_supply": false,
  "eva1_water_waste": false,
  "eva2_power": false,
  "eva2_oxy": false,
  "eva2_water_supply": false,
  "eva2_water_waste": false,
  "oxy_vent": false,
  "depress": false
}
```

### `GET /ev-telemetry/1`
### `GET /ev-telemetry/2`

Response shape:

```json
{
  "time": 0.0,
  "batt_time_left": 100.0,
  "oxy_pri_storage": 100.0,
  "oxy_sec_storage": 100.0,
  "oxy_pri_pressure": 0.0,
  "oxy_sec_pressure": 0.0,
  "oxy_time_left": 0,
  "heart_rate": 0.0,
  "oxy_consumption": 0.0,
  "co2_production": 0.0,
  "suit_pressure_oxy": 4.0,
  "suit_pressure_co2": 0.0,
  "suit_pressure_other": 0.0,
  "suit_pressure_total": 0.0,
  "fan_pri_rpm": 30000.0,
  "fan_sec_rpm": 0.0,
  "helmet_pressure_co2": 0.0,
  "scrubber_a_co2_storage": 0.0,
  "scrubber_b_co2_storage": 0.0,
  "temperature": 21.1,
  "coolant_ml": 100.0,
  "coolant_gas_pressure": 0.0,
  "coolant_liquid_pressure": 500.0
}
```

Notes:
- `oxy_time_left` is currently hard-coded to `0`
- EVA 1 `batt_time_left` is derived from the selected primary/secondary battery level

### `GET /evaStates`

Response:

```json
{
  "started": false,
  "paused": false,
  "completed": false,
  "total_time": 0,
  "uia_started": false,
  "uia_completed": false,
  "uia_time": 0,
  "dcu_started": false,
  "dcu_completed": false,
  "dcu_time": 0,
  "rover_started": false,
  "rover_completed": false,
  "rover_time": 0,
  "spec_started": false,
  "spec_completed": false,
  "spec_time": 0
}
```

This is derived from `EVA.json` and currently only reflects EVA mission start/time information.

## LTV APIs

These endpoints read current LTV state from TSS.

### `GET /ltv`

Response:

```json
{
  "location": {
    "last_known_x": -5839.3,
    "last_known_y": -10460.6
  },
  "signal": {
    "strength": 1.0,
    "ping_requested": false,
    "ping_unlimited_requested": false
  }
}
```

### `GET /ltv-errors`

Response:

```json
{
  "error_procedures": [
    {
      "code": "4155",
      "description": "Main Power Bus Error",
      "needs_resolved": true,
      "procedures": [
        "1. Locate the power distribution bus..."
      ]
    }
  ]
}
```

## Notes

- The backend is read-heavy against TSS and expects TSS to be reachable over UDP.
- EVA and LTV routes are read-only adapters over the TSS JSON payloads.
- Rover control routes forward commands back to TSS.
- The backend currently stores breadcrumb POIs automatically from rover position changes.
