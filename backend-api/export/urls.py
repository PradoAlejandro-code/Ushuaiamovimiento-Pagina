from django.urls import path
from .views import ExportarEncuestaCompletaView, ExportarContactosView, ExportarInformeDocxView, ExportarContactosExcelView

urlpatterns = [
    path('surveys/<int:pk>/', ExportarEncuestaCompletaView.as_view(), name='encuesta-export-full'),
    path('contacts/', ExportarContactosView.as_view(), name='contacto-export'),
    path('contacts/excel/', ExportarContactosExcelView.as_view(), name='contacto-export-excel'),
    path('reports/<int:pk>/', ExportarInformeDocxView.as_view(), name='informe-export'),
]
