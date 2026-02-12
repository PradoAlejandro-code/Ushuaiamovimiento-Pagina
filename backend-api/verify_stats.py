import os
import django
from django.test import RequestFactory
from django.conf import settings

# Configure Django settings if not already configured
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_api.settings')  # Adjust 'backend_api' to your project name if needed
try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    # Fallback/Debug: try to find settings module
    import sys
    sys.path.append('/home/bell/Documentos/trabajo pagina/backend-api')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings') # Trying common name
    try: 
        django.setup() 
    except:
        pass

from surveys.views import GlobalStatsView
from django.contrib.auth import get_user_model

User = get_user_model()

def test_global_stats():
    factory = RequestFactory()
    
    # Test case 1: group_by=user (what the frontend sends)
    request = factory.get('/api/surveys/stats/global/', {'period': 'day', 'group_by': 'user'})
    
    # Mock a user and force authentication (since view requires it)
    # create a dummy user if needed or just mock request.user
    if not User.objects.filter(username='testadmin').exists():
        user = User.objects.create_superuser('testadmin', 'test@example.com', 'password')
    else:
        user = User.objects.get(username='testadmin')
        
    request.user = user
    
    view = GlobalStatsView.as_view()
    response = view(request)
    
    print(f"Status Code: {response.status_code}")
    print("Response Data Keys:", response.data.keys() if hasattr(response, 'data') and isinstance(response.data, dict) else "List/Not a dict")
    
    if hasattr(response, 'data') and isinstance(response.data, dict):
        if 'summary' in response.data:
            print("SUCCESS: 'summary' key found.")
            print("Summary content:", response.data['summary'])
        else:
            print("FAILURE: 'summary' key MISSING.")
            
        if 'chart_data' in response.data:
            print("SUCCESS: 'chart_data' key found.")
        else:
             # Current implementation returns a list directly, so response.data might be a list
             pass
    elif isinstance(response.data, list):
         print("FAILURE: Response is a list, expected a dictionary with 'summary' and 'chart_data'.")
         print("First item sample:", response.data[0] if response.data else "Empty list")

if __name__ == "__main__":
    test_global_stats()
