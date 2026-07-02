# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
from .documents import build_documents

class DummyModel:
    def encode(self, docs, **kwargs):
        import numpy as np
        return np.zeros((len(docs), 384))
model = DummyModel()


def build_embeddings():

    documents = build_documents()

    vectors = model.encode(documents)

    return documents, vectors