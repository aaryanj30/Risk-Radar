import json

with open("complete_phasewise_execution.ipynb", "r", encoding="utf-8") as f:
    nb = json.load(f)

print("Number of cells:", len(nb["cells"]))
for i, cell in enumerate(nb["cells"]):
    # Let's search for phase 4 or RAG or FAISS or sentence-transformers
    source_text = "".join(cell.get("source", []))
    if any(keyword in source_text.lower() for keyword in ["phase 4", "phase4", "faiss", "sentence_transformers", "embeddings"]):
        print(f"\n--- Cell {i} ({cell['cell_type']}) ---")
        print(source_text[:500] + ("..." if len(source_text) > 500 else ""))
