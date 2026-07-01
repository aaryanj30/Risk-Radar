import os
import re
import pandas as pd
from django.conf import settings

def load_dfs():
    base_dir = settings.BASE_DIR
    
    vendor_df = pd.read_csv(os.path.join(base_dir, "vendor_summary.csv"))
    api_df = pd.read_csv(os.path.join(base_dir, "api_inventory.csv"))
    news_df = pd.read_csv(os.path.join(base_dir, "master_news.csv"))
    apps_df = pd.read_csv(os.path.join(base_dir, "enterprise_applications.csv"))
    risk_df = pd.read_csv(os.path.join(base_dir, "enterprise_risk.csv"))
    
    return vendor_df, api_df, news_df, apps_df, risk_df


def _extract_n(question, default=10):
    """Extract a requested number from a question string (e.g., 'top 19' -> 19)."""
    match = re.search(r'\b(\d+)\b', question)
    if match:
        return int(match.group(1))
    return default


def _enrich_vendor_with_graph(vendor_df, apps_df, api_df):
    """Add downstream app/API/BU counts to the vendor dataframe for richer context."""
    app_count = apps_df.groupby("vendor").size().rename("connected_apps")
    api_count = api_df.groupby("vendor_id", observed=True).size().rename("connected_apis") if "vendor_id" in api_df.columns else None
    
    enriched = vendor_df.merge(app_count, left_on="vendor", right_index=True, how="left")
    if api_count is not None:
        enriched = enriched.merge(api_count, left_on="vendor", right_index=True, how="left")
    
    enriched["connected_apps"] = enriched["connected_apps"].fillna(0).astype(int)
    if "connected_apis" in enriched.columns:
        enriched["connected_apis"] = enriched["connected_apis"].fillna(0).astype(int)
    
    return enriched


def analytics_engine(question):
    q = question.lower()
    try:
        vendor_df, api_df, news_df, apps_df, risk_df = load_dfs()
    except Exception as e:
        return f"Error loading CSV files for analytics: {str(e)}"

    # ---------- Vendors ----------
    if ("top" in q or "at risk" in q or "risky" in q) and ("vendor" in q or "at risk" in q):
        n = _extract_n(q, default=len(vendor_df))
        n = min(n, len(vendor_df))  # cap at actual dataset size
        enriched = _enrich_vendor_with_graph(vendor_df, apps_df, api_df)
        result = enriched.sort_values("risk_score", ascending=False).head(n)
        return result
        
    if "cyber" in q and "vendor" in q:
        n = _extract_n(q, default=len(vendor_df))
        n = min(n, len(vendor_df))
        return vendor_df.sort_values("Cybersecurity", ascending=False).head(n)
        
    if "compliance" in q:
        n = _extract_n(q, default=len(vendor_df))
        n = min(n, len(vendor_df))
        return vendor_df.sort_values("Compliance", ascending=False).head(n)
        
    if "financial" in q:
        n = _extract_n(q, default=len(vendor_df))
        n = min(n, len(vendor_df))
        return vendor_df.sort_values("Financial", ascending=False).head(n)
        
    # ---------- APIs ----------
    if "api" in q and "top" in q:
        n = _extract_n(q, default=10)
        n = min(n, len(api_df))
        return api_df.sort_values("risk_score", ascending=False).head(n)
        
    if "zombie" in q:
        return api_df[api_df["status"] == "Zombie"]
        
    if "shadow" in q:
        return api_df[api_df["status"] == "Shadow"]
        
    if "enterprise cyber posture" in q or "cyber posture" in q:
        return vendor_df[["vendor", "risk_score", "risk_level"]].sort_values(
            "risk_score", ascending=False
        )
        
    return None

def executive_summary():
    try:
        vendor_df, api_df, _, _, _ = load_dfs()
    except Exception as e:
        return f"Error loading data for executive summary: {str(e)}"
        
    top_vendor = vendor_df.sort_values(
        "risk_score",
        ascending=False
    ).iloc[0]
    
    zombie = len(
        api_df[api_df["status"] == "Zombie"]
    )
    
    shadow = len(
        api_df[api_df["status"] == "Shadow"]
    )
    
    critical = len(
        vendor_df[vendor_df["risk_level"] == "Critical"]
    )
    
    return f"""
Enterprise Executive Summary

Total Vendors : {len(vendor_df)}
Critical Vendors : {critical}
Zombie APIs : {zombie}
Shadow APIs : {shadow}
Highest Risk Vendor : {top_vendor['vendor']}
Highest Risk Score : {top_vendor['risk_score']}
"""

def system_status(faiss_total=0, knowledge_base_len=0):
    try:
        vendor_df, api_df, news_df, apps_df, risk_df = load_dfs()
    except Exception as e:
        return {"error": f"Error loading CSV files: {str(e)}"}
        
    return {
        "Vendor Records": len(vendor_df),
        "News Articles": len(news_df),
        "APIs": len(api_df),
        "Applications": len(apps_df),
        "Enterprise Nodes": len(risk_df),
        "Knowledge Base": knowledge_base_len,
        "FAISS Documents": faiss_total
    }
