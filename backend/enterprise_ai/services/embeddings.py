# pyrefly: ignore [missing-import]
from .documents import build_documents
import numpy as np


class DummyModel:
    """Lightweight replacement for SentenceTransformer to avoid loading torch."""
    def encode(self, docs, **kwargs):
        return np.zeros((len(docs), 384))

model = DummyModel()


def build_embeddings():

    documents = build_documents()

    vectors = model.encode(documents)

    return documents, vectors