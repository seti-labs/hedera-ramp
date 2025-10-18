#!/bin/bash

# Initialize database (optional - will be created automatically)
echo "Starting Hedera Ramp Hub backend..."

# Start the application
exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 120 wsgi:app
