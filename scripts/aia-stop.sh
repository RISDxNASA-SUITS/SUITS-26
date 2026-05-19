#!/usr/bin/env bash
pkill -f "uvicorn app.main:app" 2>/dev/null || true
echo "Stopped AIA (uvicorn) if it was running."
