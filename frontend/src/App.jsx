import { useState, useCallback } from 'react'
import './index.css'
import GraphMap from './components/GraphMap'
import EntityInspector from './components/EntityInspector'
import AICopilot from './components/AICopilot'
import TopNav from './components/TopNav'
import StatsBar from './components/StatsBar'
import IntakeModal from './components/IntakeModal'

function App() {
  const [selectedNode, setSelectedNode] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [highlightedNodes, setHighlightedNodes] = useState(new Set())
  const [showIntake, setShowIntake] = useState(false)
  const [graphRefreshToken, setGraphRefreshToken] = useState(0)
  
  // Analytics State
  const [predictedLinks, setPredictedLinks] = useState([])
  const [fracturedNodes, setFracturedNodes] = useState(new Set())

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node)
    setPredictedLinks([])
  }, [])

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null)
    setPredictedLinks([])
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

  // Handle new target intake: re-fetch entire graph from TigerGraph and auto-select new node
  const handleIntakeSuccess = useCallback((newNodeData) => {
    setShowIntake(false)
    setGraphRefreshToken(prev => prev + 1)
    setSelectedNode({
      id: newNodeData.id,
      type: 'Person',
      label: newNodeData.full_name,
      risk_score: newNodeData.risk_score,
      intake_note: newNodeData.intake_note || '',
    })
  }, [])

  return (
    <div className="dashboard-container">
      <div className="starfield" />

      <TopNav
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        graphData={graphData}
        onOpenIntake={() => setShowIntake(true)}
      />


      <StatsBar graphData={graphData} />

      <GraphMap
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        searchQuery={searchQuery}
        onDataLoaded={setGraphData}
        highlightedNodes={highlightedNodes}
        predictedLinks={predictedLinks}
        fracturedNodes={fracturedNodes}
        selectedNodeId={selectedNode?.id}
        refreshToken={graphRefreshToken}
      />

      <EntityInspector 
        node={selectedNode} 
        graphData={graphData} 
        onPredictLinks={handlePredictLinks}
        onSimulateDisruption={handleSimulateDisruption}
        onRiskRecalculated={handleRiskRecalculated}
      />

      <AICopilot onHighlight={handleHighlight} />

      {showIntake && (
        <IntakeModal
          onClose={() => setShowIntake(false)}
          onSuccess={handleIntakeSuccess}
        />
      )}
    </div>
  )
}

export default App
