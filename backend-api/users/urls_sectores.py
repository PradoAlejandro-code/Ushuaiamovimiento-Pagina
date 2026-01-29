from django.urls import path, include
from core import urls as main_urls 

urlpatterns = [
    path('', include(main_urls)),
]