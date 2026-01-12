#!/bin/bash

PORT=8888
echo "--- Starting Local Portfolio Dev Server on Port $PORT ---"
echo "Includes a built-in proxy to bypass CORS during local development."
echo "Open your browser at: http://localhost:$PORT"
echo "Press Ctrl+C to stop the server."

# Kill any existing process on this port
lsof -ti :$PORT | xargs kill -9 2>/dev/null || true

# Update dev_proxy.py to use this port
sed -i '' "s/PORT = .*/PORT = $PORT/" dev_proxy.py

# Start the Dev Proxy Server
python3 -u dev_proxy.py
