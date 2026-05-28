from django.urls import path
from .views import SurveyMetricsView, GlobalStatsView

urlpatterns = [
    path('surveys/<int:pk>/stats/', SurveyMetricsView.as_view(), name='survey-stats-detail'),
    path('stats/global/', GlobalStatsView.as_view(), name='global-stats'),
]