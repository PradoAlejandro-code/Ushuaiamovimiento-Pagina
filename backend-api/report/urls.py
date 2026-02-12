from django.urls import path
from .views import InformeCreateView, GaleriaFotosView

urlpatterns = [
    path('create/', InformeCreateView.as_view(), name='create-informe'),
    path('gallery/', GaleriaFotosView.as_view(), name='photo-gallery'),
]
