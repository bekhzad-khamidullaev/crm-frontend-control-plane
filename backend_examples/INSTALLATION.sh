#!/bin/bash
# Quick installation script for Django WebSocket Backend

echo "🚀 Django WebSocket Backend - Quick Installation"
echo "=================================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi
echo "✅ Python found: $(python3 --version)"

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis not found. Installing Redis..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y redis-server
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install redis
    else
        echo "❌ Please install Redis manually"
        exit 1
    fi
fi
echo "✅ Redis found"

# Start Redis
redis-cli ping > /dev/null 2>&1 || redis-server --daemonize yes
echo "✅ Redis started"

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r backend_examples/requirements.txt

# Create Django apps
echo ""
echo "🔧 Creating Django apps..."
python manage.py startapp chat 2>/dev/null || echo "Chat app already exists"
python manage.py startapp calls 2>/dev/null || echo "Calls app already exists"

# Copy files
echo "📁 Copying files from backend_examples/..."
cp backend_examples/chat_models.py chat/models.py
cp backend_examples/chat_consumers.py chat/consumers.py
cp backend_examples/chat_serializers.py chat/serializers.py
cp backend_examples/chat_views.py chat/views.py
cp backend_examples/chat_urls.py chat/urls.py
cp backend_examples/chat_routing.py chat/routing.py

cp backend_examples/calls_models.py calls/models.py
cp backend_examples/calls_consumers.py calls/consumers.py
cp backend_examples/calls_serializers.py calls/serializers.py
cp backend_examples/calls_views.py calls/views.py
cp backend_examples/calls_urls.py calls/urls.py
cp backend_examples/calls_routing.py calls/routing.py

echo "✅ Files copied"

# Run migrations
echo ""
echo "🗄️  Running migrations..."
python manage.py makemigrations chat calls
python manage.py migrate

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Update settings.py with configurations from backend_examples/settings.py"
echo "  2. Update asgi.py with backend_examples/asgi.py"
echo "  3. Update urls.py with backend_examples/urls.py"
echo "  4. Create superuser: python manage.py createsuperuser"
echo "  5. Run server: daphne -p 8000 your_project.asgi:application"
echo ""
echo "📚 Documentation: DJANGO-WEBSOCKET-SETUP.md"
echo ""
