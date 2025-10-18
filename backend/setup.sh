#!/bin/bash

echo "======================================"
echo "Hedera Ramp Hub - Backend Setup"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✓ Found Python version: $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo ""
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "✗ Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "Creating .env file from template..."
    cp env.template .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit the .env file with your configuration:"
    echo "   - SECRET_KEY"
    echo "   - JWT_SECRET_KEY"
    echo "   - HEDERA_OPERATOR_ID"
    echo "   - HEDERA_OPERATOR_KEY"
else
    echo "✓ .env file already exists"
fi

# Create necessary directories
echo ""
echo "Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
echo "✓ Directories created"

# Initialize database
echo ""
echo "Initializing database..."
python3 << END
from app import app, db
with app.app_context():
    db.create_all()
    print("✓ Database tables created successfully")
END

if [ $? -eq 0 ]; then
    echo "✓ Database initialized"
else
    echo "✗ Failed to initialize database"
    exit 1
fi

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your configuration"
echo "2. Activate the virtual environment: source venv/bin/activate"
echo "3. Run the development server: python app.py"
echo ""
echo "The API will be available at: http://localhost:5000"
echo "API documentation at: http://localhost:5000/"
echo ""

