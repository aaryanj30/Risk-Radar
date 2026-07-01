import os
import pandas as pd
from django.conf import settings

def build_documents():
    base_dir = settings.BASE_DIR
    
    vendor_csv = os.path.join(base_dir, "vendor_summary.csv")
    news_csv = os.path.join(base_dir, "master_news.csv")
    api_csv = os.path.join(base_dir, "api_inventory.csv")
    risk_csv = os.path.join(base_dir, "enterprise_risk.csv")
    
    knowledge_base = []
    
    # Load vendor summary
    if os.path.exists(vendor_csv):
        vendor_df = pd.read_csv(vendor_csv)
        for _, row in vendor_df.iterrows():
            knowledge_base.append(
                f"""
Vendor Name: {row['vendor']}
Vendor Risk Score: {row['risk_score']}
Vendor Risk Level: {row['risk_level']}
Cybersecurity Incidents: {row['Cybersecurity']}
Financial Events: {row['Financial']}
Compliance Events: {row['Compliance']}
Operational Events: {row['Operational']}
"""
            )
            
    # Load API inventory
    if os.path.exists(api_csv):
        api_df = pd.read_csv(api_csv)
        for _, row in api_df.iterrows():
            knowledge_base.append(
                f"""
Vendor: {row['vendor']}
API Name: {row['api_name']}
API Status: {row['status']}
API Risk Score: {row['risk_score']}
Risk Level: {row['risk_level']}
Business Unit: {row['business_unit']}
Authentication: {row['authentication']}
TLS Enabled: {row['tls_enabled']}
Rate Limited: {row['rate_limit']}
Public Exposure: {row['public_exposure']}
"""
            )
            
    # Load master news
    if os.path.exists(news_csv):
        news_df = pd.read_csv(news_csv)
        for _, row in news_df.iterrows():
            title = row['title'] if pd.notna(row['title']) else ""
            knowledge_base.append(
                f"""
Vendor: {row['vendor']}
Category: {row['category']}
Headline:
{title}
"""
            )
            
    # Load enterprise risk (propagated risk)
    if os.path.exists(risk_csv):
        risk_df = pd.read_csv(risk_csv)
        for _, row in risk_df.iterrows():
            knowledge_base.append(
                f"""
Enterprise Node: {row['node']}
Propagated Risk: {row['propagated_risk']}
"""
            )
            
    return knowledge_base