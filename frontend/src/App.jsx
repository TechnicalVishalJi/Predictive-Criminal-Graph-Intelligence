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

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node)
  }, [])

  const handleHighlight = useCallback((nodeIds) => {
    setHighlightedNodes(new Set(nodeIds))
  }, [])

  return (
    <div className="dashboard-container">
      {/* Starfield background */}
      <div className="starfield" />

      {/* Top Navigation */}
      <TopNav
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        graphData={graphData}
      />

      {/* Stats Bar */}
      <StatsBar graphData={graphData} />

      {/* Core 3D WebGL Graph */}
      <GraphMap
        onNodeClick={handleNodeClick}
        searchQuery={searchQuery}
        onDataLoaded={setGraphData}
        highlightedNodes={highlightedNodes}
      />

      {/* Left Panel - Entity Inspector */}
      <EntityInspector node={selectedNode} />

      {/* Right Panel - AI Copilot */}
      <AICopilot onHighlight={handleHighlight} />
    </div>
  )
}

export default App
