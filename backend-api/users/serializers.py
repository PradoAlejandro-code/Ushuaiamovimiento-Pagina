from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        user = self.user

        data['role'] = user.role
        data['name'] = user.username
        data['email'] = user.email
        accesos = []

        if user.role == User.JEFE:
            accesos.append('jefe') 
        for group in user.groups.all():
            if group.name.startswith('sector_'):
                nombre_limpio = group.name.replace('sector_', '')
                accesos.append(nombre_limpio)

        data['accesos'] = accesos
        
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']
