from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.rag import enterprise_ai, detect_intent, get_rag_resources
from .services.prompts import get_suggested_questions
from .services.analytics import system_status

class AskAnalystView(APIView):
    def post(self, request):
        question = request.data.get("question", "")
        if not question:
            return Response(
                {"error": "Question is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            answer = enterprise_ai(question)
            intent = detect_intent(question)
            return Response({
                "question": question,
                "answer": answer,
                "intent": intent
            })
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SuggestedQuestionsView(APIView):
    def get(self, request):
        return Response(get_suggested_questions())

class SystemStatusView(APIView):
    def get(self, request):
        try:
            # Trigger lazy load/retrieval of resources
            _, documents, index = get_rag_resources()
            faiss_total = len(index.get("vectors", [])) if isinstance(index, dict) else 0
            kb_len = len(documents) if documents else 0
            stats = system_status(faiss_total=faiss_total, knowledge_base_len=kb_len)
            return Response(stats)
        except Exception as e:
            return Response(
                {"error": f"Failed to load status: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
