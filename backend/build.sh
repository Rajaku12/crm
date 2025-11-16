#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Collect static files (required for WhiteNoise)
python manage.py collectstatic --no-input

# Note: Migrations are run separately via Render Shell or as part of start command
# This prevents build failures if database is not ready during build
