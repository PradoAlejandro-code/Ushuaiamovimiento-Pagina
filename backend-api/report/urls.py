from django.urls import path
from .views import InformeCreateView, GaleriaFotosView, InformeListView, InformeDeleteView

urlpatterns = [
    path('all/', InformeListView.as_view(), name='list-informes'),
    path('create/', InformeCreateView.as_view(), name='create-informe'),
    path('<int:pk>/delete/', InformeDeleteView.as_view(), name='delete-informe'),
    path('gallery/', GaleriaFotosView.as_view(), name='photo-gallery'),
]
