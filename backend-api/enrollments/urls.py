from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnrollmentListViewSet, EnrolleeViewSet, PersonViewSet, ListFieldViewSet

router = DefaultRouter()
router.register(r'lists', EnrollmentListViewSet, basename='enrollment-list')
router.register(r'enrollees', EnrolleeViewSet, basename='enrollee')
router.register(r'people', PersonViewSet, basename='person')
router.register(r'fields', ListFieldViewSet, basename='list-field')

urlpatterns = [
    path('', include(router.urls)),
]
