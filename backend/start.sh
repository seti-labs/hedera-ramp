#!/bin/bash

# Initialize database
python -c "
from app import app, db
with app.app_context():
    try:
        db.create_all()
        print('Database tables created successfully')
    except Exception as e:
        print(f'Database initialization error: {e}')
"

# Start the application
exec gunicorn --bind 0.0.0.0:$PORT wsgi:app
