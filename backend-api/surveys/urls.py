from django.urls import path
from .views import (
    EncuestaCreateView, 
    EncuestaActiveListView, 
    EncuestaDetailView, 
    RespuestaCreateView,
    SeccionListView,
    PreguntaDetailView,
    PreguntaCreateView,
    EncuestaManagementListView,
    RecentResponseListView,
    SurveyResponseListView,
    GlobalStatsView,
    ExportarEncuestaCompletaView,
    RelevamientoDetailView,
    RelevamientoDetailView,
    RelevamientoDetailView,
    RespuestaUpdateView
)

urlpatterns = [
    path('create/', EncuestaCreateView.as_view(), name='encuesta-create'),
    path('active/', EncuestaActiveListView.as_view(), name='encuesta-list-active'),
    path('all/', EncuestaManagementListView.as_view(), name='encuesta-list-all'),
    path('relevamiento/', RelevamientoDetailView.as_view(), name='relevamiento-detail'),
    path('<int:pk>/', EncuestaDetailView.as_view(), name='encuesta-detail'),
    path('<int:pk>/respond/', RespuestaCreateView.as_view(), name='encuesta-respond'),
    path('<int:encuesta_id>/respuestas/', SurveyResponseListView.as_view(), name='survey-responses-list'),
    path('stats/global/', GlobalStatsView.as_view(), name='global-stats'),
    path('locations/', SeccionListView.as_view(), name='location-list'),
    path('responses/recent/', RecentResponseListView.as_view(), name='response-list-recent'),


    # Exportación Completa (Zip)
    path('<int:pk>/exportar-completo/', ExportarEncuestaCompletaView.as_view(), name='encuesta-export-full'),

    # Endpoints para Preguntas (Edición)
    path('preguntas/create/', PreguntaCreateView.as_view(), name='pregunta-create'),
    path('preguntas/<int:pk>/', PreguntaDetailView.as_view(), name='pregunta-detail'),
    # Endpoints para Respuestas (Edición)
    path('responses/<int:pk>/', RespuestaUpdateView.as_view(), name='respuesta-update'),
]
