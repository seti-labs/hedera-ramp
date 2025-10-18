#!/usr/bin/env python3
"""
WSGI entry point for Hedera Ramp Hub backend
"""

import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db

# Initialize database tables on startup
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables initialized successfully!")
    except Exception as e:
        print(f"⚠️ Database initialization error: {e}")

if __name__ == "__main__":
    app.run()
