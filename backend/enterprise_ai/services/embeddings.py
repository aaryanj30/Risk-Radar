# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
from .documents import build_documents

model = SentenceTransformer("all-MiniLM-L6-v2")


def build_embeddings():

    documents = build_documents()

    vectors = model.encode(documents)

    return documents, vectors