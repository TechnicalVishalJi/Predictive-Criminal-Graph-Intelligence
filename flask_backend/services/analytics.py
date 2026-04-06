import networkx as nx
from services.tigergraph_client import get_tg_connection

def build_networkx_graph(conn=None):
    """
    Pulls real graph topology from TigerGraph into a NetworkX undirected graph
    necessary for advanced mathematical analytics.
    """
    if not conn:
        conn = get_tg_connection()
        
    G = nx.Graph()
    
    # We only care about topology here, not attributes
    persons = conn.getVertices("Person")
    for p in persons:
        G.add_node(p["v_id"], type="Person")
        
    accounts = conn.getVertices("Account")
    for a in accounts:
        G.add_node(a["v_id"], type="Account")
        
    devices = conn.getVertices("Device")
    for d in devices:
        G.add_node(d["v_id"], type="Device")
        
    # Iterate all persons to fetch edges 
    for p in persons:
        try:
            edges = conn.getEdges("Person", p["v_id"])
            for e in edges:
                to_id = e.get("to_id")
                etype = e.get("e_type")
                if to_id:
                    G.add_edge(p["v_id"], to_id, type=etype)
        except Exception:
            pass
            
    return G

def predict_future_links(person_id: str):
    """
    Uses Jaccard Similarity and Adamic-Adar to predict high-probability NEW edges
    that do not exist yet. Only predicts Person->Person or Person->Account.
    """
    G = build_networkx_graph()
    
    if person_id not in G:
        raise ValueError(f"Person {person_id} not found in graph topology")
        
    # Calculate Jaccard similarity for all node pairs involving the person
    # that don't already have an edge.
    unconnected_nodes = [n for n in G.nodes() if n != person_id and not G.has_edge(person_id, n)]
    
    predictions = []
    
    # We use Adamic/Adar index for undirected graphs
    # NetworkX requires pairs of nodes
    node_pairs = [(person_id, u) for u in unconnected_nodes]
    
    try:
        preds = nx.jaccard_coefficient(G, node_pairs)
        for u, v, p in preds:
            if p > 0: # Only care about non-zero structural likelihood
                target = v if u == person_id else u
                predictions.append({
                    "target_id": target,
                    "target_type": G.nodes[target].get("type", "Unknown"),
                    "confidence_score": round(p * 100, 2) # convert to percentage
                })
    except Exception as e:
        print(f"Jaccard error: {e}")
        
    # Sort by highest confidence
    predictions = sorted(predictions, key=lambda x: x["confidence_score"], reverse=True)
    return predictions[:5] # Top 5 predicted links

def simulate_arrest_disruption(person_id: str):
    """
    Calculates betweenness centrality to see how critical this node is.
    Then simulates removing them and evaluates the network fracture size.
    """
    G = build_networkx_graph()
    
    if person_id not in G:
        raise ValueError(f"Person {person_id} not found in graph topology")
        
    # Stats before arrest
    initial_components = nx.number_connected_components(G)
    
    # Centrality of target
    bc = nx.betweenness_centrality(G)
    impact_score = bc.get(person_id, 0)
    
    # Simulation: Remove the node (Arrest)
    fractured_nodes = list(G.neighbors(person_id)) # Nodes directly losing a connection
    G.remove_node(person_id)
    
    # Stats after arrest
    final_components = nx.number_connected_components(G)
    fracture_increase = final_components - initial_components
    
    # If the network breaks into more components, operational capacity drops drastically
    capacity_loss = min(100, (impact_score * 300) + (fracture_increase * 10))
    if capacity_loss < 5: capacity_loss = 5 # Minimum disruption
    
    return {
        "arrested_id": person_id,
        "betweenness_centrality": round(impact_score, 4),
        "capacity_loss_percent": round(capacity_loss, 1),
        "network_fractures_created": fracture_increase,
        "isolated_nodes": fractured_nodes
    }

def calculate_dynamic_risk(person_id: str):
    """
    Updates risk score dynamically based on PageRank (network influence) 
    and closeness to known high-risk elements.
    """
    G = build_networkx_graph()
    
    if person_id not in G:
        raise ValueError(f"Person {person_id} not found in graph topology")
        
    # Measure network influence
    pr = nx.pagerank(G, alpha=0.85)
    influence = pr.get(person_id, 0)
    
    # Base calculation
    # Normalized so the max influence loosely scales to 100
    max_inf = max(pr.values()) if pr else 1
    normalized_risk = (influence / max_inf) * 100
    
    # Mathematical threat scaling based exclusively on centrality
    dynamic_risk = min(100, normalized_risk)
    
    return {
        "person_id": person_id,
        "new_risk_score": round(dynamic_risk, 1),
        "pagerank_influence": round(influence, 4)
    }
