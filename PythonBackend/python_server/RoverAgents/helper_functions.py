

"""Shared geometry and lidar helper functions for rover navigation."""

import math
import os
import sys
from dataclasses import dataclass
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from typing import Tuple, List, Dict

Point = Tuple[float, float]


@dataclass(frozen=True)
class LidarSummary:
    """Directional lidar clearances derived from the raw sensor array."""
    front: float
    front_left: float
    front_right: float
    left: float
    right: float
    rear: float


def euclidean_distance(pos_a : Point, pos_b : Point) -> float:
    """Return the Euclidean distance between two 2D points."""
    return math.sqrt((pos_a[0] - pos_b[0]) ** 2 + (pos_a[1] - pos_b[1])**2)

def clamp(value: float, low: float, high: float) -> float:
    """Clamp a numeric value into the inclusive range [low, high]."""
    return max(low, min(high, value))

def compute_goal_relative_heading_deg(
    position: Point,
    goal: Point,
    heading_deg: float,
) -> float:
    """Compute the signed heading error from rover heading to goal heading."""
    dx = goal[0] - position[0]
    dy = goal[1] - position[1]
    goal_heading_deg = (90.0 - math.degrees(math.atan2(dy, dx)) + 360.0) % 360.0
    heading_now_deg = (heading_deg + 360.0) % 360.0
    return ((goal_heading_deg - heading_now_deg + 540.0) % 360.0) - 180.0


def normalize_lidar(lidar: List[float], default_lidar_cm: float) -> List[float]:
    """Replace invalid lidar readings with a configured default clearance."""
    normalized: List[float] = []
    for raw in lidar:
        try:
            value = float(raw)
        except (TypeError, ValueError):
            normalized.append(default_lidar_cm)
            continue
        normalized.append(default_lidar_cm if value < 1 else value)
    return normalized


def summarize_lidar(lidar: List[float], default_lidar_cm: float) -> LidarSummary:
    """Collapse raw lidar beams into directional clearance buckets."""
    def beam(idx: int) -> float:
        if idx < 0 or idx >= len(lidar):
            return default_lidar_cm
        return float(lidar[idx])

    return LidarSummary(
        front=min(beam(1), beam(2), beam(3)),
        front_left=min(beam(1), beam(5), beam(6)),
        front_right=min(beam(3), beam(8), beam(13)),
        left=min(beam(0), beam(5), beam(6), beam(7)),
        right=min(beam(4), beam(8), beam(13), beam(14)),
        rear=min(beam(9), beam(10), beam(11), beam(12), beam(16)),
    )

def path_function(point_a : Point, point_b : Point) -> float:
    """Return the current point-to-point traversal cost function."""
    return euclidean_distance(point_a, point_b)
def obstacle_path_distance(obstacle : Point, path_start : Point, path_end : Point) -> float:
    """Return the shortest distance from a point obstacle to a line segment."""
    path_vec = (path_end[0] - path_start[0], path_end[1] - path_start[1])
    point_vec = (obstacle[0] - path_start[0], obstacle[1] - path_start[1])
    
    path_len_sq = path_vec[0]**2 + path_vec[1]**2
    if path_len_sq == 0:
        return euclidean_distance(obstacle, path_start)
    
    t = max(0, min(1, (point_vec[0]*path_vec[0] + point_vec[1]*path_vec[1]) / path_len_sq))
    
    closest = (
        path_start[0] + t * path_vec[0],
        path_start[1] + t * path_vec[1]
    )
    
    return euclidean_distance(obstacle, closest)
