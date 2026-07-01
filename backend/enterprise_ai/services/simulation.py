import os
import pandas as pd
import networkx as nx
from django.conf import settings

def run_simulation(vendor_name):
    base_dir = settings.BASE_DIR
    
    vendor_csv = os.path.join(base_dir, "vendor_summary.csv")
    apps_csv = os.path.join(base_dir, "enterprise_applications.csv")
    api_csv = os.path.join(base_dir, "api_inventory.csv")
    graph_csv = os.path.join(base_dir, "enterprise_graph.csv")
    
    # Load dataframes
    vendor_df = pd.read_csv(vendor_csv)
    apps_df = pd.read_csv(apps_csv)
    api_df = pd.read_csv(api_csv)
    
    # Build dictionaries for resolution
    app_lookup = dict(zip(apps_df["app_id"], apps_df["application"]))
    api_lookup = dict(zip(api_df["api_id"], api_df["api_name"]))
    
    # Initialize graph
    G = nx.DiGraph()
    
    # Add Vendor nodes
    for _, row in vendor_df.iterrows():
        v_name = row["vendor"]
        v_risk = 100.0 if v_name.lower() == vendor_name.lower() else float(row["risk_score"])
        G.add_node(v_name, node_type="Vendor", base_risk=v_risk)
        
    # Add Application nodes
    for _, row in apps_df.iterrows():
        # Look up vendor risk
        v_row = vendor_df[vendor_df["vendor"] == row["vendor"]]
        v_risk = float(v_row.iloc[0]["risk_score"]) if not v_row.empty else 0.0
        # If this application belongs to the simulated vendor, set its base risk to 100
        if row["vendor"].lower() == vendor_name.lower():
            v_risk = 100.0
        
        G.add_node(row["app_id"], node_type="Application", base_risk=v_risk)
        G.add_edge(row["vendor"], row["app_id"], weight=0.8)
        
    # Add API nodes
    for _, row in api_df.iterrows():
        G.add_node(row["api_id"], node_type="API", base_risk=float(row["risk_score"]))
        G.add_edge(row["app_id"], row["api_id"], weight=0.6)
        
    # Add Business Unit nodes
    business_units = api_df["business_unit"].unique()
    for bu in business_units:
        G.add_node(bu, node_type="BusinessUnit", base_risk=30.0)
        
    for _, row in api_df.iterrows():
        G.add_edge(row["api_id"], row["business_unit"], weight=0.4)
        
    # Run propagation exactly as notebook
    propagated_risks = {}
    alpha = 0.3
    
    for node in G.nodes():
        base_risk = G.nodes[node].get("base_risk", 0.0)
        incoming_risk = 0.0
        for parent in G.predecessors(node):
            weight = G[parent][node].get("weight", 1.0)
            parent_risk = G.nodes[parent].get("base_risk", 0.0)
            incoming_risk += weight * parent_risk
            
        propagated_risk = base_risk + alpha * incoming_risk
        propagated_risks[node] = min(100.0, round(propagated_risk, 2))
        
    return propagated_risks, G, app_lookup, api_lookup


def simulation_summary(vendor_name):
    # Find matching vendor name case-insensitively
    base_dir = settings.BASE_DIR
    vendor_csv = os.path.join(base_dir, "vendor_summary.csv")
    
    if os.path.exists(vendor_csv):
        vendor_df = pd.read_csv(vendor_csv)
        vendors = vendor_df["vendor"].tolist()
        matched_vendor = None
        for v in vendors:
            if v.lower() in vendor_name.lower():
                matched_vendor = v
                break
        if matched_vendor:
            vendor_name = matched_vendor

    # Run the simulation
    try:
        propagated_risks, G, app_lookup, api_lookup = run_simulation(vendor_name)
    except Exception as e:
        return f"Error simulating attack on {vendor_name}: {str(e)}"
    
    # Get list of downstream items
    if vendor_name not in G:
        return f"Vendor '{vendor_name}' not found in the enterprise risk graph."
        
    apps = list(G.successors(vendor_name))
    
    apis = []
    for app in apps:
        apis.extend(list(G.successors(app)))
    unique_apis = list(set(apis))
    
    bus = []
    for api in unique_apis:
        bus.extend(list(G.successors(api)))
    resolved_bus = list(set(bus))
    
    # Format the summary text
    text = []
    text.append(f"========== BREACH SIMULATION REPORT: {vendor_name.upper()} ==========")
    text.append(f"Simulating a Ransomware Attack / Breach on Vendor: {vendor_name}")
    text.append(f"Target Vendor Base Risk set to: 100.0 (CRITICAL)")
    text.append("\nDownstream Impacted Applications:")
    for app in apps:
        app_name = app_lookup.get(app, app)
        text.append(f"• {app_name} ({app}) | Propagated Risk: {propagated_risks.get(app, 'Unknown')}")
        
    text.append("\nDownstream Impacted APIs:")
    for api in unique_apis:
        api_name = api_lookup.get(api, api)
        text.append(f"• {api_name} ({api}) | Propagated Risk: {propagated_risks.get(api, 'Unknown')}")
        
    text.append("\nDownstream Affected Business Units:")
    for bu in resolved_bus:
        text.append(f"• {bu} | Propagated Risk: {propagated_risks.get(bu, 'Unknown')}")
        
    text.append("\nDependency Chains:")
    for app in apps:
        app_name = app_lookup.get(app, app)
        for api in G.successors(app):
            api_name = api_lookup.get(api, api)
            for bu in G.successors(api):
                text.append(f"{vendor_name} → {app_name} → {api_name} → {bu}")
                
    return "\n".join(text)
