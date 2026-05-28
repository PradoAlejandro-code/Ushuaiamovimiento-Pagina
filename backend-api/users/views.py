from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer, UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            serializer = self.get_serializer(data=request.data)
            try:
                serializer.is_valid(raise_exception=True)
                user = serializer.user
                login(request, user) 
            except Exception:
                pass
                
        return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extend_session_view(request):
    return Response({
        "message": "Session extended", 
        "expiry": request.session.get_expiry_age()
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list_view(request):
    users = User.objects.filter(
        is_active=True
    ).exclude(
        username__iexact='admin'
    ).order_by('first_name', 'last_name', 'username').values('id', 'username', 'first_name', 'last_name')
    return Response(list(users))
