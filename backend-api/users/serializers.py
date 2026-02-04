from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            user_obj = User.objects.filter(email=email).first()
            if not user_obj:
                raise serializers.ValidationError({"detail": "No existe una cuenta con este email."})
            elif not user_obj.check_password(password):
                raise serializers.ValidationError({"detail": "Contraseña incorrecta."})
            elif not user_obj.is_active:
                raise serializers.ValidationError({"detail": "Esta cuenta está desactivada."})

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
        
        if not accesos:
            raise serializers.ValidationError({"detail": "No tienes sectores asignados."})
        
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']
