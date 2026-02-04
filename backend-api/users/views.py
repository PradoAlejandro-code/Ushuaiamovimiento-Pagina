from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    # Use our custom serializer if needed, or default
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # 1. Standard JWT generation
        response = super().post(request, *args, **kwargs)
        
        # 2. If JWT login succeeded (200 OK), create Django Session
        if response.status_code == 200:
            # Re-validate to get the user instance safely
            serializer = self.get_serializer(data=request.data)
            try:
                serializer.is_valid(raise_exception=True)
                user = serializer.user
                login(request, user) # Sets 'sessionid' cookie
            except Exception:
                pass
                
        return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extend_session_view(request):
    """
    Heartbeat endpoint. 
    Just calling this creates/updates the session due to SESSION_SAVE_EVERY_REQUEST=True.
    Returns the new expiry time for debugging.
    """
    return Response({
        "message": "Session extended", 
        "expiry": request.session.get_expiry_age()
    })
