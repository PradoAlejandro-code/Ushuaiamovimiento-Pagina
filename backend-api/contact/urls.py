from django.urls import path
from .views import (
    ContactoListCreateView, 
    ContactoDetailView, 
    ContactoImportView, 
    ContactosView, 
    ExportarContactosCSV
)

urlpatterns = [
    # CRUD endpoints
    path('', ContactoListCreateView.as_view(), name='contacto-list-create'),
    path('importar/', ContactoImportView.as_view(), name='contacto-import'),
    path('<int:pk>/', ContactoDetailView.as_view(), name='contacto-detail'),
    
    # Analysis/Export endpoints
    path('all/', ContactosView.as_view(), name='all-contacts'),
    path('all/exportar-csv/', ExportarContactosCSV.as_view(), name='all-contacts-export'),
    
    # Encuesta specific endpoints (moved logic here, might need param handling)
    path('encuesta/<int:encuesta_id>/', ContactosView.as_view(), name='survey-contacts'),
    path('encuesta/<int:encuesta_id>/exportar-csv/', ExportarContactosCSV.as_view(), name='survey-export-csv'),
]
