import os
import faiss
import numpy as np
import pandas as pd
import networkx as nx
from django.conf import settings
# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
import google.generativeai as genai

from .documents import build_documents

# Lazy initialization variables for thread-safety and performance
_embedding_model = None
_documents = None
_index = None

def get_rag_resources():
    global _embedding_model, _documents, _index
    if _embedding_model is None or _documents is None or _index is None:
        print("Initializing RAG resources (SentenceTransformer & FAISS index)...")
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        _documents = build_documents()
        
        # Build embeddings
        embeddings = _embedding_model.encode(_documents, show_progress_bar=False)
        dimension = embeddings.shape[1]
        
        # Create FAISS index
        _index = faiss.IndexFlatL2(dimension)
        _index.add(np.array(embeddings).astype("float32"))
        print(f"RAG resources initialized successfully. Loaded {_index.ntotal} documents into FAISS.")
        
    return _embedding_model, _documents, _index


def retrieve(query, k=5):
    model, documents, index = get_rag_resources()
    query_embedding = model.encode([query])
    distances, indices = index.search(
        np.array(query_embedding).astype("float32"),
        k
    )
    
    docs = []
    for idx in indices[0]:
        if idx < len(documents):
            docs.append(documents[idx])
    return docs


def extract_vendor(question):
    base_dir = settings.BASE_DIR
    vendor_csv = os.path.join(base_dir, "vendor_summary.csv")
    if os.path.exists(vendor_csv):
        vendor_df = pd.read_csv(vendor_csv)
        vendors = vendor_df["vendor"].tolist()
        question = question.lower()
        for vendor in vendors:
            if vendor.lower() in question:
                return vendor
    return None


def get_enterprise_graph():
    base_dir = settings.BASE_DIR
    graph_csv = os.path.join(base_dir, "enterprise_graph.csv")
    
    enterprise_graph = nx.DiGraph()
    if os.path.exists(graph_csv):
        graph_df = pd.read_csv(graph_csv)
        for _, row in graph_df.iterrows():
            enterprise_graph.add_edge(
                row["source"],
                row["target"],
                weight=row["weight"]
            )
    return enterprise_graph


def get_enterprise_context(vendor, graph=None):
    if graph is None:
        graph = get_enterprise_graph()
        
    context = {}
    if vendor not in graph:
        return {"applications": [], "apis": [], "business_units": []}
        
    apps = list(graph.successors(vendor))
    context["applications"] = apps
    
    apis = []
    business_units = []
    for app in apps:
        app_apis = list(graph.successors(app))
        apis.extend(app_apis)
        for api in app_apis:
            bus = list(graph.successors(api))
            business_units.extend(bus)
            
    context["apis"] = list(set(apis))
    context["business_units"] = list(set(business_units))
    return context


def resolve_graph_context(graph_context):
    base_dir = settings.BASE_DIR
    apps_csv = os.path.join(base_dir, "enterprise_applications.csv")
    api_csv = os.path.join(base_dir, "api_inventory.csv")
    
    app_lookup = {}
    if os.path.exists(apps_csv):
        apps_df = pd.read_csv(apps_csv)
        app_lookup = dict(zip(apps_df["app_id"], apps_df["application"]))
        
    api_lookup = {}
    if os.path.exists(api_csv):
        api_df = pd.read_csv(api_csv)
        api_lookup = dict(zip(api_df["api_id"], api_df["api_name"]))
        
    resolved_apps = []
    for app in graph_context["applications"]:
        resolved_apps.append(app_lookup.get(app, app))
        
    resolved_apis = []
    for api in graph_context["apis"]:
        resolved_apis.append(api_lookup.get(api, api))
        
    return {
        "applications": resolved_apps,
        "apis": resolved_apis,
        "business_units": graph_context["business_units"]
    }


def build_context(question):
    vendor = extract_vendor(question)
    rag_docs = retrieve(question, k=5)
    graph_text = ""
    if vendor:
        graph = get_enterprise_context(vendor)
        graph = resolve_graph_context(graph)
        graph_text = f"""
Vendor:
{vendor}

Connected Applications:
{', '.join(graph['applications'])}

Connected APIs:
{', '.join(graph['apis'])}

Affected Business Units:
{', '.join(graph['business_units'])}
"""
    return graph_text + "\n\n".join(rag_docs)


def detect_intent(question):
    q = question.lower()
    
    # ---------- Analytics ----------
    if any(x in q for x in ["top", "highest", "most", "lowest", "least", "rank", "ranking", "posture", "summary"]):
        return "analytics"
        
    # ---------- Simulation ----------
    elif any(x in q for x in ["simulate", "simulation", "ransomware", "breach", "attack", "what if"]):
        return "simulation"
        
    return "general"


def enterprise_ai(question):
    intent = detect_intent(question)
    vendor = extract_vendor(question)
    
    # Context Builder
    if intent == "analytics":
        from .analytics import analytics_engine
        analytics = analytics_engine(question)
        if analytics is None:
            context = build_context(question)
        elif isinstance(analytics, str):
            context = analytics
        else:
            context = analytics.to_string(index=False)
            # Append downstream graph context for top vendors so AI can fill Risk Propagation
            try:
                top_vendors = []
                for line in context.splitlines()[1:]:  # skip header line
                    parts = line.strip().split()
                    if parts:
                        top_vendors.append(parts[0])
                graph = get_enterprise_graph()
                graph_lines = ["\n\n--- Enterprise Dependency Context ---"]
                for v in list(dict.fromkeys(top_vendors))[:5]:  # top 5 for graph context
                    ctx = get_enterprise_context(v, graph)
                    ctx = resolve_graph_context(ctx)
                    if ctx["applications"] or ctx["apis"] or ctx["business_units"]:
                        graph_lines.append(f"\nVendor: {v}")
                        graph_lines.append(f"  → Applications: {', '.join(ctx['applications']) or 'None'}")
                        graph_lines.append(f"  → APIs at risk: {', '.join(ctx['apis']) or 'None'}")
                        graph_lines.append(f"  → Business Units affected: {', '.join(ctx['business_units']) or 'None'}")
                context += "\n".join(graph_lines)
            except Exception:
                pass  # graph context is best-effort; do not crash
        context += "\n\n" + "\n\n".join(retrieve(question, k=3))
    elif intent == "simulation":
        if vendor is None:
            return "Please specify a vendor to simulate an attack (e.g., 'Simulate ransomware attack on Oracle')."
        from .simulation import simulation_summary
        context = simulation_summary(vendor)
        context += "\n\n" + "\n\n".join(retrieve(question, k=3))
    else:
        context = build_context(question)
        
    # Confidence Score
    confidence = "High"
    if intent == "analytics":
        confidence = "Very High"
    elif intent == "simulation":
        confidence = "Very High"
    elif len(context) < 300:
        confidence = "Low"
    elif len(context) < 1000:
        confidence = "Medium"
        
    # Build Prompt
    from .prompts import get_analyst_prompt
    prompt = get_analyst_prompt(question, context, confidence)
    
    # Call Gemini API
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return "Error: Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable in the backend environment."
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error communicating with Gemini API: {str(e)}"
