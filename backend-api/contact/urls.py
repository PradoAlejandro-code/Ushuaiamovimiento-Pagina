from django.urls import path
from .views import (
    ContactoListCreateView, 
    ContactoDetailView, 
    ContactoImportView, 
    ContactosView, 
)

urlpatterns = [
    # CRUD endpoints
    path('', ContactoListCreateView.as_view(), name='contacto-list-create'),
    path('importar/', ContactoImportView.as_view(), name='contacto-import'),
    path('<int:pk>/', ContactoDetailView.as_view(), name='contacto-detail'),
    
    # Analysis endpoints
    path('all/', ContactosView.as_view(), name='all-contacts'),
    path('encuesta/<int:encuesta_id>/', ContactosView.as_view(), name='survey-contacts'),
]
