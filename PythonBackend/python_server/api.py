"""Flask routes for robust navigation control and debug visualizations."""

import os

import requests
from flask import Flask, jsonify, render_template, request

from RoverAgents.robust_navigation_service import (
    cancel_robust_navigation,
    get_robust_navigation_state,
    start_robust_navigation,
)


app = Flask(__name__)


@app.route('/navigate_robust', methods=['POST'])
def navigate_to_point_robust():
    """Start a new robust navigation run toward the requested world-space goal."""
    try:
        data = request.get_json()
        if not data or 'x' not in data or 'y' not in data:
            return jsonify({'error': 'Missing coordinates'}), 400
        result = start_robust_navigation(float(data['x']), float(data['y']))
        if not result.get('success'):
            return jsonify(result), 409
        return jsonify(result)
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


@app.route('/navigation_state_robust', methods=['GET'])
def navigation_state_robust():
    """Return the current robust navigation state snapshot."""
    try:
        return jsonify(get_robust_navigation_state())
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


@app.route('/lidar_debug_state', methods=['GET'])
def lidar_debug_state():
    """Return combined telemetry, lidar, and navigation state for debug views."""
    base_url = os.getenv("JAVA_BACKEND_URL", "http://localhost:7070")
    try:
        telemetry_resp = requests.get(f"{base_url}/telemetry", timeout=1.0)
        lidar_resp = requests.get(f"{base_url}/lidar", timeout=1.0)
        telemetry = telemetry_resp.json() if telemetry_resp.status_code == 200 else None
        lidar = lidar_resp.json() if lidar_resp.status_code == 200 else None
        nav_state = get_robust_navigation_state()
        return jsonify({
            'telemetry': telemetry,
            'lidar': lidar,
            'navigation': nav_state,
        })
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


@app.route('/navigate_robust/cancel', methods=['POST'])
def navigate_robust_cancel():
    """Cancel the active robust navigation run, if one is in progress."""
    try:
        return jsonify(cancel_robust_navigation())
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


@app.route('/navigation_vis_robust', methods=['GET'])
def navigation_vis_robust():
    """Render the robust navigation path and state debug page."""
    return render_template('navigation_vis_robust.html')


@app.route('/lidar_vis', methods=['GET'])
def lidar_vis():
    """Render the lidar and goal-direction debug page."""
    return render_template('lidar_vis.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, threaded=True)
