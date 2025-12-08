#!/bin/bash
# Quick setup script for Django JWT Authentication

echo "🔐 Django JWT Authentication Setup"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo -e "${YELLOW}⚠️  Virtual environment not activated${NC}"
    echo "Run: source venv/bin/activate (or venv\Scripts\activate on Windows)"
    echo ""
fi

# Install dependencies
echo "📦 Installing djangorestframework-simplejwt..."
pip install djangorestframework-simplejwt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo "⚙️  Next steps:"
echo ""
echo "1. Add to INSTALLED_APPS in settings.py:"
echo "   'rest_framework_simplejwt',"
echo ""
echo "2. Configure REST_FRAMEWORK in settings.py:"
echo "   REST_FRAMEWORK = {"
echo "       'DEFAULT_AUTHENTICATION_CLASSES': ["
echo "           'rest_framework_simplejwt.authentication.JWTAuthentication',"
echo "       ],"
echo "       'DEFAULT_PERMISSION_CLASSES': ["
echo "           'rest_framework.permissions.IsAuthenticated',"
echo "       ],"
echo "   }"
echo ""
echo "3. Configure SIMPLE_JWT in settings.py:"
echo "   from datetime import timedelta"
echo "   SIMPLE_JWT = {"
echo "       'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),"
echo "       'REFRESH_TOKEN_LIFETIME': timedelta(days=7),"
echo "       'ROTATE_REFRESH_TOKENS': True,"
echo "       'AUTH_HEADER_TYPES': ('Bearer',),"
echo "   }"
echo ""
echo "4. Add JWT endpoints to urls.py:"
echo "   from rest_framework_simplejwt.views import ("
echo "       TokenObtainPairView, TokenRefreshView, TokenVerifyView"
echo "   )"
echo "   urlpatterns = ["
echo "       path('api/token/', TokenObtainPairView.as_view()),"
echo "       path('api/token/refresh/', TokenRefreshView.as_view()),"
echo "       path('api/token/verify/', TokenVerifyView.as_view()),"
echo "   ]"
echo ""
echo "5. Create a test user:"
echo "   python manage.py createsuperuser"
echo ""
echo "6. Restart Django:"
echo "   python manage.py runserver"
echo ""
echo "7. Test JWT endpoint:"
echo "   curl -X POST http://localhost:8000/api/token/ \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\": \"admin\", \"password\": \"admin123\"}'"
echo ""
echo -e "${GREEN}✅ Setup complete! Follow the steps above.${NC}"
echo ""
echo "📚 Full documentation: JWT-AUTH-SETUP-GUIDE.md"
