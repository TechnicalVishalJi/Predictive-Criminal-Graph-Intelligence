import { useState, useCallback } from 'react'
import './index.css'
import GraphMap from './components/GraphMap'
import EntityInspector from './components/EntityInspector'
import AICopilot from './components/AICopilot'
import TopNav from './components/TopNav'
import StatsBar from './components/StatsBar'

function App() {
  const [selectedNode, setSelectedNode] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [highlightedNodes, setHighlightedNodes] = useState(new Set())
  
  // Analytics State
  const [predictedLinks, setPredictedLinks] = useState([])
  const [fracturedNodes, setFracturedNodes] = useState(new Set())

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node)
    // Clear analytic states on new selection to keep UI clean
    setPredictedLinks([])
    // We intentionally DO NOT clear fracturedNodes here, so the user can inspect the fractured network
  }, [])

  const handleHighlight = useCallback((nodeIds) => {
    setHighlightedNodes(new Set(nodeIds))
  }, [])

  const handlePredictLinks = useCallback((links) => {
    setPredictedLinks(links)
  }, [])

  const handleSimulateDisruption = useCallback(({ arrestedId, isolatedNodes, capacityLoss }) => {
    // Add the arrested node to fractured set
    const fractures = new Set(fracturedNodes)
    fractures.add(arrestedId)
    setFracturedNodes(fractures)
    
    // Alert logic removed, GUI in EntityInspector handles this now smoothly
    // Selection state is maintained so user can read the UI panel breakdown
  }, [fracturedNodes])

  const handleRiskRecalculated = useCallback((personId, newRiskScore) => {
    // We update the graphData iteratively so GraphMap re-renders the nodes sizes/colors
    setGraphData(prev => {
      const newNodes = prev.nodes.map(n => 
        n.id === personId ? { ...n, dynamic_risk: newRiskScore } : n
      )
      return { ...prev, nodes: newNodes }
    })
    
    if (selectedNode && selectedNode.id === personId) {
      setSelectedNode({ ...selectedNode, dynamic_risk: newRiskScore })
    }
  }, [selectedNode])

  return (
    <div className="dashboard-container">
      <div className="starfield" />

      <TopNav
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        graphData={graphData}
      />

      <StatsBar graphData={graphData} />

      <GraphMap
        onNodeClick={handleNodeClick}
        searchQuery={searchQuery}
        onDataLoaded={setGraphData}
        highlightedNodes={highlightedNodes}
        predictedLinks={predictedLinks}
        fracturedNodes={fracturedNodes}
        selectedNodeId={selectedNode?.id}
      />

      <EntityInspector 
        node={selectedNode} 
        graphData={graphData} 
        onPredictLinks={handlePredictLinks}
        onSimulateDisruption={handleSimulateDisruption}
        onRiskRecalculated={handleRiskRecalculated}
      />

      <AICopilot onHighlight={handleHighlight} />
    </div>
  )
}

export default App
