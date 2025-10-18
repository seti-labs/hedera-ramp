@echo off
echo ======================================
echo Hedera Ramp Hub - Backend Setup
echo ======================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed. Please install Python 3.9 or higher.
    exit /b 1
)

echo [OK] Python is installed

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo.
    echo Creating virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)

REM Activate virtual environment
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo.
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo.
echo Installing dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed successfully

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo.
    echo Creating .env file from template...
    copy env.template .env
    echo [OK] .env file created
    echo.
    echo WARNING: Please edit the .env file with your configuration:
    echo    - SECRET_KEY
    echo    - JWT_SECRET_KEY
    echo    - HEDERA_OPERATOR_ID
    echo    - HEDERA_OPERATOR_KEY
) else (
    echo [OK] .env file already exists
)

REM Create necessary directories
echo.
echo Creating necessary directories...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
echo [OK] Directories created

REM Initialize database
echo.
echo Initializing database...
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('[OK] Database tables created')"

if errorlevel 1 (
    echo [ERROR] Failed to initialize database
    exit /b 1
)

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Next steps:
echo 1. Edit the .env file with your configuration
echo 2. Activate the virtual environment: venv\Scripts\activate.bat
echo 3. Run the development server: python app.py
echo.
echo The API will be available at: http://localhost:5000
echo API documentation at: http://localhost:5000/
echo.

pause

