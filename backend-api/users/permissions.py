from rest_framework import permissions

class IsSectorAuthorized(permissions.BasePermission):
    def has_permission(self, request, view):
        host_name = request.host.name

        if host_name in ['api', 'admin', 'www', 'localhost']:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if host_name == 'jefe' and request.user.role == 'jefe':
            return True

        group_name = f"sector_{host_name}"
        
        if request.user.groups.filter(name=group_name).exists():
            return True
            
        if request.user.is_superuser:
            return True

        return False