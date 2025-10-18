#!/bin/bash

echo "Starting Hedera Ramp Hub API..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run ./install.sh first"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Creating from template..."
    cp env.template .env
    echo "Please edit .env with your configuration"
fi

# Run the Flask application
echo "🚀 Starting server on http://localhost:5000"
echo ""
python app.py

