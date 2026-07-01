import React, { useState, useEffect, useRef } from "react";
import ReactFlow, { 
  Background, 
  Controls, 
  Handle, 
  Position,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  Cpu, 
  Briefcase, 
  Laptop, 
  Search, 
  Info, 
  Layers,
  Network,
  HelpCircle
} from "lucide-react";
import api from "../services/api";

// Inject keyframe animation for compromised nodes
if (typeof document !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    @keyframes pulse-breach {
      0% { transform: scale(1); box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); border-color: var(--danger); }
      50% { transform: scale(1.03); box-shadow: 0 0 22px rgba(239, 68, 68, 0.85); border-color: #f87171; }
      100% { transform: scale(1); box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); border-color: var(--danger); }
    }
  `;
  document.head.appendChild(styleTag);
}

const getIconForType = (type) => {
  switch (type) {
    case "Vendor":
      return <ShieldCheck size={18} />;
    case "Application":
      return <Laptop size={18} />;
    case "API":
      return <Cpu size={18} />;
    case "BusinessUnit":
      return <Briefcase size={18} />;
    default:
      return <HelpCircle size={18} />;
  }
};

// Custom Node Component
const CustomNode = ({ data }) => {
  const isDanger = data.riskScore >= 75;
  const isWarning = data.riskScore >= 50 && data.riskScore < 75;
  const isCaution = data.riskScore >= 25 && data.riskScore < 50;
  
  let borderColor = "var(--success)";
  let bgGlow = "rgba(16, 185, 129, 0.05)";
  
  if (isDanger) {
    borderColor = "var(--danger)";
    bgGlow = "rgba(239, 68, 68, 0.1)";
  } else if (isWarning) {
    borderColor = "var(--warning)";
    bgGlow = "rgba(245, 158, 11, 0.1)";
  } else if (isCaution) {
    borderColor = "rgba(245, 158, 11, 0.6)";
    bgGlow = "rgba(245, 158, 11, 0.05)";
  }

  const isBreached = data.isBreached;

  return (
    <div 
      style={{
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        border: `2px solid ${isBreached ? "var(--danger)" : borderColor}`,
        borderRadius: "12px",
        padding: "12px 16px",
        fontSize: "13px",
        fontFamily: "var(--sans)",
        boxShadow: isBreached 
          ? "0 0 15px rgba(239, 68, 68, 0.6), inset 0 0 10px rgba(239, 68, 68, 0.3)" 
          : `0 4px 12px ${bgGlow}`,
        transition: "all 0.3s ease",
        width: 240,
        textAlign: "left",
        position: "relative",
        animation: isBreached ? "pulse-breach 1.5s infinite" : "none"
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: isBreached ? "var(--danger)" : borderColor }} />
      
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ color: isBreached ? "var(--danger)" : borderColor, display: "flex", alignItems: "center" }}>
          {data.icon}
        </div>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <div style={{ fontWeight: "600", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal", wordBreak: "break-word" }}>
            {data.name}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            {data.nodeType}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Risk Score:</span>
        <span className={`badge ${data.riskScore >= 75 ? "badge-danger" : data.riskScore >= 50 ? "badge-warning" : data.riskScore >= 25 ? "badge-warning" : "badge-success"}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
          {data.riskScore.toFixed(1)}
        </span>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: isBreached ? "var(--danger)" : borderColor }} />
    </div>
  );
};

const nodeTypes = {
  customNode: CustomNode
};

function RiskGraph() {
  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [filterType, setFilterType] = useState("Vendor");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectedNode, setInspectedNode] = useState(null);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const baseRiskScores = useRef({});
  const simulationIntervalRef = useRef(null);

  // Unified search and interactive chips state
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Fetch all graph data on mount
  useEffect(() => {
    api.get("/graph/")
      .then((res) => {
        const rawNodes = res.data.nodes || [];
        const rawEdges = res.data.edges || [];
        setAllNodes(rawNodes);
        setAllEdges(rawEdges);
        
        // Find default node to show (e.g. AWS or Check Point or Stripe)
        const defaultNode = rawNodes.find(n => n.node_type === "Vendor" && n.name === "AWS") || 
                            rawNodes.find(n => n.node_type === "Vendor") ||
                            rawNodes[0];
        
        if (defaultNode) {
          setSelectedNodeId(defaultNode.id.toString());
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching graph data:", err);
        setLoading(false);
      });
  }, []);

  // Update subgraph whenever the selected node changes
  useEffect(() => {
    if (allNodes.length === 0 || !selectedNodeId) return;

    resetSimulation();
    
    // Get subgraph
    const { nodes: subNodes, edges: subEdges } = getSubgraph(selectedNodeId, allNodes, allEdges);
    
    // Position nodes
    const layoutedNodes = layoutSubgraph(subNodes);
    
    // Format edges
    const formattedEdges = subEdges.map(e => ({
      id: `e-${e.source}-${e.target}`,
      source: e.source.toString(),
      target: e.target.toString(),
      animated: false,
      style: { stroke: "var(--border-color-hover)", strokeWidth: 1.5 },
      label: e.relationship === "Vendor-App" ? "" : `w: ${e.weight.toFixed(1)}`,
      labelStyle: { fill: "var(--text-muted)", fontSize: 8, fontWeight: 500 }
    }));

    setNodes(layoutedNodes);
    setEdges(formattedEdges);
    
    // Set initially inspected node to the focus node
    const focusNode = allNodes.find(n => n.id.toString() === selectedNodeId.toString());
    setInspectedNode(focusNode);

    // Save base risk scores
    const scores = {};
    subNodes.forEach(n => {
      scores[n.id.toString()] = n.risk_score;
    });
    baseRiskScores.current = scores;

  }, [selectedNodeId, allNodes, allEdges]);

  const getPathNodeIds = (targetId, currentNodes, currentEdges) => {
    if (!targetId) return new Set();
    const ids = new Set([targetId.toString()]);
    
    // Descendants (downstream BFS)
    const queueDown = [targetId.toString()];
    while (queueDown.length > 0) {
      const curr = queueDown.shift();
      currentEdges.forEach(e => {
        if (e.source.toString() === curr) {
          const dest = e.target.toString();
          if (!ids.has(dest)) {
            ids.add(dest);
            queueDown.push(dest);
          }
        }
      });
    }
    
    // Ancestors (upstream BFS)
    const queueUp = [targetId.toString()];
    while (queueUp.length > 0) {
      const curr = queueUp.shift();
      currentEdges.forEach(e => {
        if (e.target.toString() === curr) {
          const src = e.source.toString();
          if (!ids.has(src)) {
            ids.add(src);
            queueUp.push(src);
          }
        }
      });
    }
    return ids;
  };

  // Update node and edge active/highlighted state when inspectedNode changes
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const inspectedIdStr = inspectedNode ? inspectedNode.id.toString() : "";
    const pathNodeIds = getPathNodeIds(inspectedIdStr, nodes, edges);
    
    setNodes(prev => prev.map(n => {
      const isInspected = n.id === inspectedIdStr;
      const isOnPath = inspectedIdStr === "" || pathNodeIds.has(n.id);
      return {
        ...n,
        style: {
          ...n.style,
          opacity: isOnPath ? 1.0 : 0.25,
          borderWidth: isInspected ? "3px" : "2px",
          boxShadow: isInspected ? "0 0 20px var(--primary)" : "none",
          transition: "all 0.3s ease"
        }
      };
    }));

    setEdges(prev => prev.map(e => {
      const isSourceOnPath = pathNodeIds.has(e.source);
      const isTargetOnPath = pathNodeIds.has(e.target);
      const isOnPath = inspectedIdStr === "" || (isSourceOnPath && isTargetOnPath);
      return {
        ...e,
        animated: isOnPath && inspectedIdStr !== "" && !isSimulating,
        style: {
          ...e.style,
          stroke: isOnPath ? (inspectedIdStr !== "" ? "var(--primary)" : "var(--border-color-hover)") : "rgba(255,255,255,0.03)",
          strokeWidth: isOnPath ? (inspectedIdStr !== "" ? 2.5 : 1.5) : 1.0,
          opacity: isOnPath ? 1.0 : 0.15
        }
      };
    }));
  }, [inspectedNode, isSimulating]);

  // Cleanup simulation interval on unmount & expand page-content max-width dynamically
  useEffect(() => {
    const pageContentEl = document.querySelector(".page-content");
    let originalMaxWidth = "";
    if (pageContentEl) {
      originalMaxWidth = pageContentEl.style.maxWidth;
      pageContentEl.style.maxWidth = "1650px";
    }

    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      if (pageContentEl) {
        pageContentEl.style.maxWidth = originalMaxWidth;
      }
    };
  }, []);

  // Helper BFS/DFS traversal to build Subgraph
  const getSubgraph = (rootId, nodesList, edgesList) => {
    const nodeMap = new Map(nodesList.map(n => [n.id.toString(), n]));
    const adj = {};
    const revAdj = {};
    
    edgesList.forEach(e => {
      const s = e.source.toString();
      const t = e.target.toString();
      if (!adj[s]) adj[s] = [];
      adj[s].push(t);
      if (!revAdj[t]) revAdj[t] = [];
      revAdj[t].push(s);
    });

    const visited = new Set();
    const queue = [rootId.toString()];
    visited.add(rootId.toString());

    // Downstream BFS (connected children)
    while (queue.length > 0) {
      const curr = queue.shift();
      if (adj[curr]) {
        adj[curr].forEach(next => {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        });
      }
    }

    // Upstream BFS (connected parents)
    const queueUp = [rootId.toString()];
    while (queueUp.length > 0) {
      const curr = queueUp.shift();
      if (revAdj[curr]) {
        revAdj[curr].forEach(prev => {
          if (!visited.has(prev)) {
            visited.add(prev);
            queueUp.push(prev);
          }
        });
      }
    }

    const subNodes = Array.from(visited).map(id => nodeMap.get(id)).filter(Boolean);
    const subNodeIds = new Set(subNodes.map(n => n.id.toString()));
    const subEdges = edgesList.filter(e => 
      subNodeIds.has(e.source.toString()) && subNodeIds.has(e.target.toString())
    );

    return { nodes: subNodes, edges: subEdges };
  };

  // Lay out the subgraph in columns
  const layoutSubgraph = (subNodes) => {
    const vendors = subNodes.filter(n => n.node_type === "Vendor");
    const apps = subNodes.filter(n => n.node_type === "Application");
    const apis = subNodes.filter(n => n.node_type === "API");
    const bus = subNodes.filter(n => n.node_type === "BusinessUnit");

    const layouted = [];
    
    const setPositions = (nodesList, xCoord) => {
      const totalHeight = (nodesList.length - 1) * 120;
      const startY = -totalHeight / 2;
      nodesList.forEach((n, idx) => {
        layouted.push({
          id: n.id.toString(),
          type: "customNode",
          position: { x: xCoord, y: startY + idx * 120 + 150 },
          data: {
            id: n.id,
            name: n.name,
            nodeType: n.node_type,
            riskScore: n.risk_score,
            isBreached: false,
            icon: getIconForType(n.node_type)
          }
        });
      });
    };

    setPositions(vendors, 50);
    setPositions(apps, 370);
    setPositions(apis, 720);
    setPositions(bus, 1070);

    return layouted;
  };

  const handleNodeClick = (event, node) => {
    const fullNode = allNodes.find(n => n.id.toString() === node.id);
    if (fullNode) {
      setInspectedNode(fullNode);
    }
  };

  // Breach simulation sequence
  const simulateBreach = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const rootIdStr = selectedNodeId.toString();

    // Helper to get children
    const getDirectChildren = (nodeId) => {
      return edges
        .filter(e => e.source.toString() === nodeId.toString())
        .map(e => e.target.toString());
    };

    let step = 0;
    let activeNodes = [rootIdStr];
    const breachedSet = new Set(activeNodes);

    // Initial root breach state update
    setNodes(prev => prev.map(n => {
      if (n.id === rootIdStr) {
        return {
          ...n,
          data: { ...n.data, isBreached: true, riskScore: 100.0 }
        };
      }
      return n;
    }));

    const interval = setInterval(() => {
      // Find children of currently active nodes
      const nextNodes = [];
      activeNodes.forEach(id => {
        getDirectChildren(id).forEach(childId => {
          if (!breachedSet.has(childId)) {
            breachedSet.add(childId);
            nextNodes.push(childId);
          }
        });
      });

      if (nextNodes.length === 0 || step > 4) {
        clearInterval(interval);
        return;
      }

      // Update nodes that are breached in this step
      setNodes(prev => prev.map(n => {
        if (nextNodes.includes(n.id)) {
          const originalScore = baseRiskScores.current[n.id] || n.data.riskScore;
          // Calculate elevated score
          const elevatedScore = Math.min(100.0, originalScore + (100.0 - originalScore) * 0.65);
          
          // Update currently inspected node if it gets breached
          if (inspectedNode && inspectedNode.id.toString() === n.id) {
            setInspectedNode(prevInspect => ({
              ...prevInspect,
              risk_score: elevatedScore,
              is_compromised: true
            }));
          }

          return {
            ...n,
            data: {
              ...n.data,
              isBreached: true,
              riskScore: elevatedScore
            }
          };
        }
        return n;
      }));

      // Update edges connected to these active nodes
      setEdges(prev => prev.map(e => {
        if (activeNodes.includes(e.source.toString()) && nextNodes.includes(e.target.toString())) {
          return {
            ...e,
            animated: true,
            style: { stroke: "var(--danger)", strokeWidth: 3.0 }
          };
        }
        return e;
      }));

      activeNodes = nextNodes;
      step++;
    }, 1200);

    simulationIntervalRef.current = interval;
  };

  const resetSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    setIsSimulating(false);

    // Reset nodes to original score and unbreached state
    setNodes(prev => prev.map(n => {
      const originalScore = baseRiskScores.current[n.id] || n.data.riskScore;
      return {
        ...n,
        data: {
          ...n.data,
          isBreached: false,
          riskScore: originalScore
        }
      };
    }));

    // Reset edges
    setEdges(prev => prev.map(e => ({
      ...e,
      animated: false,
      style: { stroke: "var(--border-color-hover)", strokeWidth: 1.5 }
    })));

    // Reset inspected node
    if (inspectedNode) {
      const originalScore = baseRiskScores.current[inspectedNode.id.toString()];
      if (originalScore !== undefined) {
        setInspectedNode(prev => ({
          ...prev,
          risk_score: originalScore,
          is_compromised: false
        }));
      }
    }
  };

  // Search filter matching nodes across the entire system
  const globalSearchMatches = searchQuery.trim()
    ? allNodes.filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10)
    : [];

  // Top 5 highest risk nodes of focus type
  const topRiskyCategoryNodes = allNodes
    .filter(n => n.node_type === filterType)
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 5);

  // Calculate direct parent and child connections for inspected node
  const getConnections = () => {
    if (!inspectedNode) return { parents: [], children: [] };
    const idStr = inspectedNode.id.toString();
    
    const parents = allEdges
      .filter(e => e.target.toString() === idStr)
      .map(e => allNodes.find(n => n.id.toString() === e.source.toString()))
      .filter(Boolean);

    const children = allEdges
      .filter(e => e.source.toString() === idStr)
      .map(e => allNodes.find(n => n.id.toString() === e.target.toString()))
      .filter(Boolean);

    return { parents, children };
  };

  const { parents: inspectedParents, children: inspectedChildren } = getConnections();

  const getRiskNarrative = (node) => {
    if (!node) return "";
    const name = node.name;
    const type = node.node_type;
    const score = node.risk_score.toFixed(1);
    
    let text = "";
    if (type === "Vendor") {
      text = `This vendor (${name}) hosts critical application infrastructure. A security compromise at this vendor propagates risk to downstream systems, threatening all connected applications and business units. Currently, its propagated risk score is ${score}/100.`;
    } else if (type === "Application") {
      const vendorEdge = allEdges.find(e => e.target.toString() === node.id.toString());
      const resolvedVendor = vendorEdge ? allNodes.find(n => n.id.toString() === vendorEdge.source.toString())?.name : "";
      text = `This application (${name}) is supplied by the vendor "${resolvedVendor || "an external vendor"}". It serves as an operational bridge to organizational APIs. Any compromise of this app automatically compromises downstream APIs.`;
    } else if (type === "API") {
      text = `This API (${name}) is a critical communications pipeline handling data exchanges. Compromising this API disrupts core integration flows and directly impacts dependent Business Units.`;
    } else if (type === "BusinessUnit") {
      text = `This Business Unit (${name}) is the end recipient of organizational risk. It relies on the availability of APIs and vendor software to perform daily tasks. A high risk score here indicates severe threat to business operations.`;
    }
    return text;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div className="pulse-dot" style={{ width: "24px", height: "24px" }}></div>
        <span style={{ marginLeft: "16px", color: "var(--text-secondary)" }}>Mapping service dependency network...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "20px" }}>
      
      {/* Controls Panel */}
      <div className="panel-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", flexGrow: 1 }}>
            
            {/* Unified Search Input with Auto-complete Dropdown */}
            <div style={{ minWidth: "320px", position: "relative" }}>
              <label style={{ marginBottom: "6px", fontSize: "11px" }}>Search Node Network</label>
              <div style={{ position: "relative" }}>
                <input 
                  type="text" 
                  placeholder="Type node name (e.g. AWS, Stripe, API)..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  style={{
                    width: "100%",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    padding: "10px 14px 10px 36px",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
                <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              </div>

              {/* Dropdown suggestions */}
              {showSearchDropdown && searchQuery.trim() && (
                <div 
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    marginTop: "6px",
                    boxShadow: "var(--shadow-lg)",
                    zIndex: 100,
                    maxHeight: "260px",
                    overflowY: "auto"
                  }}
                >
                  {globalSearchMatches.length === 0 ? (
                    <div style={{ padding: "12px", color: "var(--text-muted)", fontSize: "13px" }}>No matching nodes found</div>
                  ) : (
                    globalSearchMatches.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setSelectedNodeId(n.id.toString());
                          setSearchQuery("");
                          setShowSearchDropdown(false);
                        }}
                        style={{
                          padding: "10px 14px",
                          cursor: "pointer",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-pill)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <div>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{n.name}</span>
                          <span className="badge" style={{ fontSize: "9px", padding: "1px 4px", marginLeft: "8px", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>
                            {n.node_type}
                          </span>
                        </div>
                        <span className={`badge ${n.risk_score >= 75 ? "badge-danger" : n.risk_score >= 50 ? "badge-warning" : "badge-success"}`} style={{ fontSize: "10px" }}>
                          {n.risk_score.toFixed(1)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
              {showSearchDropdown && (
                <div 
                  onClick={() => setShowSearchDropdown(false)} 
                  style={{ position: "fixed", inset: 0, zIndex: 90 }}
                />
              )}
            </div>

            {/* Focus Category Filters */}
            <div>
              <label style={{ marginBottom: "6px", fontSize: "11px" }}>Focus Category</label>
              <div style={{ display: "flex", gap: "8px", background: "var(--bg-input)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                {["Vendor", "Application", "API", "BusinessUnit"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setFilterType(cat); }}
                    style={{
                      background: filterType === cat ? "var(--primary)" : "transparent",
                      border: "none",
                      borderRadius: "6px",
                      color: "white",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {cat === "BusinessUnit" ? "Business Unit" : cat}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Simulation Controls */}
          <div style={{ display: "flex", gap: "12px" }}>
            {!isSimulating ? (
              <button className="simulation-btn" onClick={simulateBreach}>
                <Play size={14} /> Simulate Breach Cascade
              </button>
            ) : (
              <button 
                className="simulation-btn" 
                onClick={resetSimulation} 
                style={{ background: "var(--bg-pill)", color: "var(--text-primary)", border: "1px solid var(--border-color)", boxShadow: "none" }}
              >
                <RotateCcw size={14} /> Reset Simulation
              </button>
            )}
          </div>
        </div>

        {/* Quick-Select High Risk Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>
            Top Risks:
          </span>
          {topRiskyCategoryNodes.map(n => (
            <button
              key={n.id}
              onClick={() => setSelectedNodeId(n.id.toString())}
              style={{
                background: selectedNodeId.toString() === n.id.toString() ? "var(--primary-glow)" : "var(--bg-pill)",
                border: selectedNodeId.toString() === n.id.toString() ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "12px",
                color: "var(--text-primary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { if (selectedNodeId.toString() !== n.id.toString()) e.currentTarget.style.borderColor = "var(--border-color-hover)"; }}
              onMouseLeave={(e) => { if (selectedNodeId.toString() !== n.id.toString()) e.currentTarget.style.borderColor = "var(--border-color)"; }}
            >
              <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {n.name}
              </span>
              <span 
                style={{ 
                  fontSize: "10px", 
                  fontWeight: "700", 
                  color: n.risk_score >= 75 ? "var(--danger)" : n.risk_score >= 50 ? "var(--warning)" : "var(--success)" 
                }}
              >
                {n.risk_score.toFixed(0)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Graph Guide Banner */}
      <div 
        style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.03) 100%)",
          border: "1px solid rgba(59, 130, 246, 0.15)",
          borderRadius: "12px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "14px"
        }}
      >
        <div 
          style={{
            background: "rgba(59, 130, 246, 0.1)",
            color: "var(--primary)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <Info size={18} />
        </div>
        <div style={{ fontSize: "13px", lineHeight: "1.5", color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>How to read the risk propagation:</strong> Risk flows from left to right. A breach at a <strong>Vendor</strong> (left) cascades through <strong>Applications</strong> and <strong>APIs</strong>, ultimately impacting organizational <strong>Business Units</strong> (right). Click any node in the network to isolate and highlight its specific path of influence, or click "Simulate Breach Cascade" to watch the threat propagate.
        </div>
      </div>

      {/* Main Workspace: Graph Canvas + Inspector sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 360px", height: "760px", gap: "24px", minHeight: 0 }}>
        
        {/* Canvas panel */}
        <div 
          style={{ 
            background: "var(--bg-sidebar)", 
            borderRadius: "16px", 
            border: "1px solid var(--border-color)", 
            position: "relative",
            overflow: "hidden",
            height: "100%"
          }}
        >
          {/* Column headers for easier orientation */}
          <div 
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              right: "16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "12px",
              pointerEvents: "none",
              zIndex: 10
            }}
          >
            <div style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px", textAlign: "center", color: "var(--text-primary)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              1. Vendors
            </div>
            <div style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px", textAlign: "center", color: "var(--text-primary)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              2. Applications
            </div>
            <div style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px", textAlign: "center", color: "var(--text-primary)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              3. APIs
            </div>
            <div style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px", textAlign: "center", color: "var(--text-primary)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              4. Business Units
            </div>
          </div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
          >
            <Background color="#1e293b" gap={18} size={1} />
            <Controls style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px" }} />
          </ReactFlow>

          {/* Floating Legend Overlay */}
          <div 
            style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "14px 16px",
              zIndex: 10,
              boxShadow: "var(--shadow-md)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              fontSize: "11px",
              color: "var(--text-secondary)"
            }}
          >
            <h4 style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Risk Severity Colors
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--danger)" }}></div>
                <span>Critical Risk (&gt;= 75)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--warning)" }}></div>
                <span>High Risk (&gt;= 50)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.6)" }}></div>
                <span>Medium Risk (&gt;= 25)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--success)" }}></div>
                <span>Low Risk (&lt; 25)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inspector Sidebar */}
        <div className="panel-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto", height: "100%" }}>
          {inspectedNode ? (
            <>
              {/* Header */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--primary)", letterSpacing: "0.5px" }}>
                    {inspectedNode.node_type}
                  </span>
                  {inspectedNode.is_compromised && (
                    <span className="badge badge-danger" style={{ fontSize: "10px", padding: "2px 6px" }}>
                      COMPROMISED
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>{inspectedNode.name}</h3>
              </div>

              {/* Score breakdown card */}
              <div 
                style={{ 
                  background: "var(--bg-pill)", 
                  padding: "16px", 
                  borderRadius: "12px", 
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Propagated Risk Score</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "4px" }}>
                    <span style={{ fontSize: "28px", fontWeight: "700", color: inspectedNode.risk_score >= 75 ? "var(--danger)" : inspectedNode.risk_score >= 50 ? "var(--warning)" : "var(--success)" }}>
                      {inspectedNode.risk_score.toFixed(1)}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>/ 100</span>
                  </div>
                </div>
                <span className={`badge ${inspectedNode.risk_score >= 75 ? "badge-danger" : inspectedNode.risk_score >= 50 ? "badge-warning" : inspectedNode.risk_score >= 25 ? "badge-warning" : "badge-success"}`}>
                  {inspectedNode.risk_score >= 75 ? "Critical" : inspectedNode.risk_score >= 50 ? "High" : inspectedNode.risk_score >= 25 ? "Medium" : "Low"}
                </span>
              </div>

              {/* Plain-English Explanation */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--primary)", letterSpacing: "0.5px" }}>
                  Risk Explanation & Narrative
                </span>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0 }}>
                  {getRiskNarrative(inspectedNode)}
                </p>
              </div>

              {/* Parents / Predecessors list */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Layers size={12} /> Upstream Connections ({inspectedParents.length})
                </h4>
                {inspectedParents.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No upstream parent dependencies.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {inspectedParents.map(parent => (
                      <div 
                        key={parent.id}
                        onClick={() => setSelectedNodeId(parent.id.toString())}
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          background: "rgba(255,255,255,0.01)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontSize: "12px",
                          transition: "border-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border-color-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                      >
                        <span style={{ fontWeight: "500", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
                          {parent.name}
                        </span>
                        <span className={`badge ${parent.risk_score >= 75 ? "badge-danger" : parent.risk_score >= 50 ? "badge-warning" : "badge-success"}`} style={{ fontSize: "9px", padding: "1px 4px" }}>
                          {parent.risk_score.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Children / Successors list */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Network size={12} /> Downstream Connections ({inspectedChildren.length})
                </h4>
                {inspectedChildren.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No downstream child dependencies.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {inspectedChildren.map(child => (
                      <div 
                        key={child.id}
                        onClick={() => setSelectedNodeId(child.id.toString())}
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          background: "rgba(255,255,255,0.01)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontSize: "12px",
                          transition: "border-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border-color-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                      >
                        <span style={{ fontWeight: "500", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
                          {child.name}
                        </span>
                        <span className={`badge ${child.risk_score >= 75 ? "badge-danger" : child.risk_score >= 50 ? "badge-warning" : "badge-success"}`} style={{ fontSize: "9px", padding: "1px 4px" }}>
                          {child.risk_score.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", color: "var(--text-secondary)", gap: "12px" }}>
              <Info size={32} style={{ color: "var(--text-muted)" }} />
              <div>
                <h4 style={{ fontWeight: "600", fontSize: "14px", color: "var(--text-primary)" }}>Select a Node</h4>
                <p style={{ fontSize: "12px", marginTop: "4px" }}>Click on any node in the graph network visualization to inspect its details and dependency paths.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RiskGraph;