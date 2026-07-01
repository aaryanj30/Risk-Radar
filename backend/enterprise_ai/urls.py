from django.urls import path
from .views import AskAnalystView, SuggestedQuestionsView, SystemStatusView

urlpatterns = [
    path('ask/', AskAnalystView.as_view(), name='ask_analyst'),
    path('suggested/', SuggestedQuestionsView.as_view(), name='suggested_questions'),
    path('status/', SystemStatusView.as_view(), name='system_status'),
]
