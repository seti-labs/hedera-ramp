#!/bin/bash

echo "======================================"
echo "Hedera Ramp Hub - Backend Installation"
echo "======================================"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed."
    echo "Please install Python 3.9 or higher from https://www.python.org"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✅ Found Python $PYTHON_VERSION"

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."
python3 -m venv venv

if [ ! -d "venv" ]; then
    echo "❌ Failed to create virtual environment"
    exit 1
fi

echo "✅ Virtual environment created"

# Activate virtual environment
echo ""
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to install some dependencies"
    echo ""
    echo "Common issues:"
    echo "  1. hedera-sdk-py version not found - trying alternative version"
    
    # Try installing with the latest available hedera-sdk-py
    echo ""
    echo "Retrying with latest hedera-sdk-py..."
    sed -i.bak 's/hedera-sdk-py==.*/hedera-sdk-py==2.50.0/' requirements.txt
    pip install -r requirements.txt
    
    if [ $? -ne 0 ]; then
        echo "❌ Installation failed. Please check the error messages above."
        exit 1
    fi
fi

echo ""
echo "✅ All dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp env.template .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env with your configuration:"
    echo "   - SECRET_KEY (generate a secure random key)"
    echo "   - JWT_SECRET_KEY (generate a secure random key)"
    echo "   - HEDERA_OPERATOR_ID (your Hedera account ID)"
    echo "   - HEDERA_OPERATOR_KEY (your Hedera private key)"
    echo "   - MPESA_* (M-Pesa credentials from Safaricom)"
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo ""
echo "📁 Creating necessary directories..."
mkdir -p logs uploads
echo "✅ Directories created"

# Initialize database
echo ""
echo "🗄️  Initializing database..."
python3 << 'END_PYTHON'
try:
    from app import app, db
    with app.app_context():
        db.create_all()
        print("✅ Database initialized successfully")
except Exception as e:
    print(f"❌ Error initializing database: {e}")
    exit(1)
END_PYTHON

echo ""
echo "======================================"
echo "✅ Installation Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your .env file:"
echo "   nano .env"
echo ""
echo "2. Start the server:"
echo "   source venv/bin/activate"
echo "   python app.py"
echo ""
echo "3. Or use the run script:"
echo "   ./run.sh"
echo ""
echo "The API will be available at: http://localhost:5000"
echo "API documentation: http://localhost:5000/"
echo ""
echo "For M-Pesa integration, see: MPESA_INTEGRATION.md"
echo ""

