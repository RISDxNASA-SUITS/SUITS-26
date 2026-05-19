# Python Backend

This backend is the Flask service that exposes robust rover navigation control and the debug visualizers used to inspect navigation and lidar behavior.

It does not talk to the simulator directly. The current runtime path is:

`Flask API -> Java backend HTTP -> simulator / TSS`

The Python service is responsible for:
- starting and cancelling robust navigation runs
- maintaining navigation state for the active run
- polling telemetry and lidar through the Java backend
- issuing steering, throttle, and brake commands
- serving debug pages for path and lidar inspection

## Current Structure

Important files:
- [python_server/api.py](C:/Users/kenic/Desktop/SUITS-26/PythonBackend/python_server/api.py): Flask routes
- [python_server/RoverAgents/RobustNavigator.py](C:/Users/kenic/Desktop/SUITS-26/PythonBackend/python_server/RoverAgents/RobustNavigator.py): robust navigation state machine
- [python_server/RoverAgents/robust_navigation_service.py](C:/Users/kenic/Desktop/SUITS-26/PythonBackend/python_server/RoverAgents/robust_navigation_service.py): singleton service wrapper used by Flask
- [python_server/RoverAgents/rover_client.py](C:/Users/kenic/Desktop/SUITS-26/PythonBackend/python_server/RoverAgents/rover_client.py): HTTP client for lidar, telemetry, and rover controls
- [python_server/RoverAgents/helper_functions.py](C:/Users/kenic/Desktop/SUITS-26/PythonBackend/python_server/RoverAgents/helper_functions.py): shared geometry and lidar helpers
- [python_server/templates/navigation_vis_robust.html](C:/Users/kenic/Desktop/SUITS-26/PythonBackend/python_server/templates/navigation_vis_robust.html): path/state debug page
- [python_server/templates/lidar_vis.html](C:/Users/kenic/Desktop/SUITS-26/PythonBackend/python_server/templates/lidar_vis.html): lidar/goal debug page

## Run It

The recommended way to run the full stack is from the repo root:

```bash
docker compose up --build
```

This starts:
- `c-backend` on `14141`
- `java-backend` on `7070`
- `python-backend` on `4000`

Once up, the Python backend is available at:

```text
http://localhost:4000
```

### Run PythonBackend Independently

If JavaBackend is running on another machine, start PythonBackend from the `PythonBackend` directory:

```bash
python start_server.py
```

The launcher will:
- prompt for the JavaBackend IP/host
- fail immediately if the host is invalid or cannot be resolved
- call `http://<host>:7070/telemetry`
- only launch the Flask server on `http://localhost:4000` if JavaBackend responds successfully

## Active Endpoints

Navigation control:
- `POST /navigate_robust`
- `POST /navigate_robust/cancel`
- `GET /navigation_state_robust`

Debug/visualization:
- `GET /navigation_vis_robust`
- `GET /lidar_vis`
- `GET /lidar_debug_state`

## How Robust Navigation Works

The main controller lives in [RobustNavigator.py](C:/Users/kenic/Desktop/SUITS-26/PythonBackend/python_server/RoverAgents/RobustNavigator.py).

At a high level, each control loop does this:

1. Read telemetry and lidar from the Java backend.
2. Record the rover position into the navigation path.
3. Compute the remaining distance to the goal.
4. Convert the goal direction into a steering target.
5. Summarize raw lidar into directional clearances:
   - `front`
   - `front_left`
   - `front_right`
   - `left`
   - `right`
   - `rear`
6. Choose one action:
   - seek the goal
   - avoid obstacles while still moving forward
   - recover by reversing and then turning
   - hold position if no safe action is available

### Phases

The navigator is a phase-based controller. The current phase is reported in the navigation state.

Phases:
- `SEEK`: normal goal tracking
- `AVOID`: moving forward but steering away from nearby obstacles
- `RECOVER_REVERSE`: backing up to create space
- `RECOVER_TURN`: forcing a turn after reversing so the rover does not drive back into the same obstacle
- `HOLD`: rover is intentionally stopped because a safe move is not available
- `COMPLETE`: goal reached
- `FAILED`: cancelled or aborted because of an error/data loss

### Goal Seeking

Goal tracking uses the rover's current position, goal position, and heading to compute a signed heading error. That error is normalized into the steering command range `[-1, 1]`.

When the space ahead is clear, the rover stays in `SEEK` and follows that goal steering value directly.

### Obstacle Avoidance

The navigator does not use every lidar beam independently for decisions. It reduces the raw lidar array into directional buckets so the controller can reason about clearance on each side of the rover.

When the front or sides enter caution ranges:
- the controller switches to `AVOID`
- steering is biased toward the more open side
- if the front is especially tight, the rover makes a sharp turn instead of a soft blended correction

### Stuck and Pinned Detection

Two failure modes are handled separately:

`Stuck`:
- the rover is not making enough progress over time
- if the space is still reasonably open, it re-commits to the goal instead of blindly recovering
- if it is stalled near obstacles, it escalates into recovery

`Pinned`:
- the rover is trying to turn/move forward near obstacles
- speed stays near zero
- this is treated as physically jammed against geometry
- it enters recovery immediately instead of continuing to push into the obstacle

### Recovery Behavior

Recovery has two stages:

1. `RECOVER_REVERSE`
   - reverse for a configured duration
   - steer away from the blocked side
   - create enough space to escape the local trap

2. `RECOVER_TURN`
   - move forward slowly
   - force a turn in the selected escape direction
   - reorient the rover before returning to `SEEK`

This two-stage recovery is important. Reversing alone often just places the rover back into the same geometry, so the forced turn stage helps it leave the deadlock instead of oscillating.

### State Exposed by the API

`GET /navigation_state_robust` returns the navigation snapshot used by the debug views. Important fields:

- `status`: `idle`, `navigating`, `completed`, or `failed`
- `phase`: controller phase such as `SEEK` or `RECOVER_REVERSE`
- `message`: current decision/status explanation
- `goal`: active target position
- `start`: first recorded position of the run
- `path`: rover path recorded during the run
- `distance_to_goal`: live remaining distance
- `recoveries`: number of recoveries entered during the run
- `avoid_side`: currently preferred avoidance/recovery side

## Demo: Start Navigation

Example request:

```bash
curl -X POST http://localhost:4000/navigate_robust ^
  -H "Content-Type: application/json" ^
  -d "{\"x\": -5692.0, \"y\": -10048.0}"
```

PowerShell alternative:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:4000/navigate_robust" `
  -ContentType "application/json" `
  -Body '{"x": -5692.0, "y": -10048.0}'
```

Check live state:

```bash
curl http://localhost:4000/navigation_state_robust
```

Cancel a run:

```bash
curl -X POST http://localhost:4000/navigate_robust/cancel
```

## Verify It Via Visualizers

### 1. Path / Phase View

Open:

```text
http://localhost:4000/navigation_vis_robust
```

This page shows:
- the recorded path
- start point
- goal point
- current status
- current phase/message
- recovery count

Use this view to confirm:
- the rover is moving toward the goal at all
- the path is not stuck oscillating in place
- recovery count is not climbing forever
- the controller is transitioning back to `SEEK` after recovery

### 2. Lidar / Goal Direction View

Open:

```text
http://localhost:4000/lidar_vis
```

This page overlays:
- lidar rays
- rover orientation
- relative goal direction
- navigation state
- current telemetry

Use this view to confirm:
- obstacles that appear ahead actually match the controller's behavior
- the goal arrow is on the side you expect
- sharp turns happen when front clearance gets tight
- pinned/stalled situations match low speed plus close obstacle geometry

### 3. Raw Combined Debug Payload

If you need the exact inputs being used by the debug page:

```bash
curl http://localhost:4000/lidar_debug_state
```

This returns:
- `telemetry`
- `lidar`
- `navigation`

This is the best endpoint to inspect when debugging a run that "looks wrong" in the simulator.

## Practical Verification Flow

Recommended workflow for debugging navigation:

1. Start the stack with `docker compose up --build`.
2. Open [navigation_vis_robust.html](C:/Users/kenic/Desktop/SUITS-26/PythonBackend/python_server/templates/navigation_vis_robust.html) through `http://localhost:4000/navigation_vis_robust`.
3. Open [lidar_vis.html](C:/Users/kenic/Desktop/SUITS-26/PythonBackend/python_server/templates/lidar_vis.html) through `http://localhost:4000/lidar_vis`.
4. Start a goal with `POST /navigate_robust`.
5. Watch whether the phase stays in `SEEK`, enters `AVOID`, or escalates to recovery.
6. If behavior looks wrong, inspect `GET /lidar_debug_state` and compare:
   - `navigation.message`
   - `navigation.phase`
   - `telemetry.speed`
   - front/side lidar values

## Local Development Notes

The backend is tested with:

```bash
python -m unittest python_server.RoverAgents.test_robust_navigator
python -m py_compile python_server/api.py python_server/RoverAgents/rover_client.py python_server/RoverAgents/helper_functions.py python_server/RoverAgents/RobustNavigator.py
```

Run those from the `PythonBackend` directory if you want to validate backend changes without starting the full stack.


## Test Cases
```bash
# Case 1
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/navigate_robust" -ContentType "application/json" -Body '{"x": -5652.0, "y": -10088.0}'

# Case 2
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/navigate_robust" -ContentType "application/json" -Body '{"x": -5692.0, "y": -10048.0}'

# Case 3
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/navigate_robust" -ContentType "application/json" -Body '{"x": -5610.0, "y": -10098.0}'

# Case 4
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/navigate_robust" -ContentType "application/json" -Body '{"x": -5700.0, "y": -10110.0}'
```
