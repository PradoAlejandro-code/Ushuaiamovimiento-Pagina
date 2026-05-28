from django.urls import path
from .views import (
    EncuestaCreateView, 
    EncuestaActiveListView, 
    EncuestaDetailView, 
    RespuestaCreateView,
    RespuestaManualCreateView,
    SeccionListView,
    PreguntaDetailView,
    PreguntaCreateView,
    GrupoCreateView,
    GrupoDetailView,
    EncuestaManagementListView,
    RecentResponseListView,
    SurveyResponseListView,
    RelevamientoDetailView,
    RespuestaUpdateView,
    SurveyRespondentsView,
    MyResponsesListView
)

urlpatterns = [
    path('create/', EncuestaCreateView.as_view(), name='encuesta-create'),
    path('active/', EncuestaActiveListView.as_view(), name='encuesta-list-active'),
    path('all/', EncuestaManagementListView.as_view(), name='encuesta-list-all'),
    path('relevamiento/', RelevamientoDetailView.as_view(), name='relevamiento-detail'),
    path('<int:pk>/', EncuestaDetailView.as_view(), name='encuesta-detail'),
    path('<int:pk>/respond/', RespuestaCreateView.as_view(), name='encuesta-respond'),
    path('<int:pk>/respond/manual/', RespuestaManualCreateView.as_view(), name='encuesta-respond-manual'),
    path('<int:pk>/respondents/', SurveyRespondentsView.as_view(), name='survey-respondents'),
    path('<int:encuesta_id>/respuestas/', SurveyResponseListView.as_view(), name='survey-responses-list'),
    path('locations/', SeccionListView.as_view(), name='location-list'),
    path('responses/recent/', RecentResponseListView.as_view(), name='response-list-recent'),
    path('responses/me/', MyResponsesListView.as_view(), name='my-responses-list'),


    # Endpoints para Preguntas (Edición)
    path('preguntas/create/', PreguntaCreateView.as_view(), name='pregunta-create'),
    path('preguntas/<int:pk>/', PreguntaDetailView.as_view(), name='pregunta-detail'),
    # Endpoints para Grupos
    path('grupos/create/', GrupoCreateView.as_view(), name='grupo-create'),
    path('grupos/<int:pk>/', GrupoDetailView.as_view(), name='grupo-detail'),
    # Endpoints para Respuestas (Edición)
    path('responses/<int:pk>/', RespuestaUpdateView.as_view(), name='respuesta-update'),
]
