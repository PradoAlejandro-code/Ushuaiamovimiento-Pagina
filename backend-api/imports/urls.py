from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnrollmentImportViewSet

router = DefaultRouter()
router.register(r'', EnrollmentImportViewSet, basename='import')

urlpatterns = [
    path('', include(router.urls)),
]
