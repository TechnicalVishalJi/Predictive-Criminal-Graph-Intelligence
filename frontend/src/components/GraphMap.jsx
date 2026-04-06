import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import axios from 'axios'

const FLASK_API = 'http://127.0.0.1:5000'

const getNodeColor = (node, isFractured) => {
  if (isFractured) return '#101015' // Arrested nodes turn stark dark
  if (node.type === 'Account') return '#f59e0b'
  if (node.type === 'Device') return '#a78bfa'
  
  // Use dynamic_risk first if algorithm updated it, else fallback to standard risk
  const risk = node.dynamic_risk !== undefined ? node.dynamic_risk : (node.risk_score || 0)
  if (risk > 75) return '#ff003c'
  if (risk > 40) return '#ff8c00'
  return '#00f0ff'
}

const getNodeSize = (node, isFractured) => {
  if (isFractured) return 2 // Shrink fractured nodes
  if (node.type === 'Account') return 4
  if (node.type === 'Device') return 3
  const risk = node.dynamic_risk !== undefined ? node.dynamic_risk : (node.risk_score || 0)
  return 3 + risk / 20
}

export default function GraphMap({ 
  onNodeClick, searchQuery, onDataLoaded, highlightedNodes,
  predictedLinks = [], fracturedNodes = new Set(), selectedNodeId
}) {
  const fgRef = useRef()
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    axios.get(`${FLASK_API}/api/network`, { timeout: 10000 })
      .then(res => {
        const data = res.data
        if (data && data.nodes && data.nodes.length > 0) {
          setGraphData(data)
          onDataLoaded(data)
          setError(null)
        } else {
          setError('Graph returned empty data from TigerGraph.')
        }
      })
      .catch(err => {
        setError(`Flask API unreachable: ${err.message}. Make sure python app.py is running on port 5000.`)
      })
      .finally(() => setLoading(false))
  }, [onDataLoaded])

  // Search effect
  useEffect(() => {
    if (!searchQuery || !fgRef.current || graphData.nodes.length === 0) return
    const node = graphData.nodes.find(n =>
      n.label?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (node) {
      fgRef.current.cameraPosition(
        { x: node.x || 0, y: node.y || 0, z: (node.z || 0) + 150 },
        node,
        1200
      )
    }
  }, [searchQuery, graphData])

  // Memoize the combined graph topology including temporal algorithmic predictions
  const combinedGraphData = useMemo(() => {
    const virtualLinks = predictedLinks.map(p => ({
      source: p.source,
      target: p.target,
      type: 'PREDICTED',
      confidence: p.confidence
    }))
    return {
      nodes: graphData.nodes,
      links: [...graphData.links, ...virtualLinks]
    }
  }, [graphData, predictedLinks])

  // Derive which nodes are involved in a prediction right now
  const predictedNodesSet = useMemo(() => {
    const s = new Set()
    predictedLinks.forEach(p => { s.add(p.source); s.add(p.target) })
    return s
  }, [predictedLinks])


  const nodeThreeObject = useCallback((node) => {
    const isFractured = fracturedNodes.has(node.id)
    const isHighlighted = highlightedNodes.has(node.id) && !isFractured
    const isPredicted = predictedNodesSet.has(node.id)
    const isSelected = selectedNodeId === node.id
    
    let color = isHighlighted ? '#ffffff' : getNodeColor(node, isFractured)
    if (isPredicted) color = '#eab308' 
    if (isSelected) color = '#ffffff' // Override with Bright White if actively clicked/selected

    let size = getNodeSize(node, isFractured)
    if (isPredicted) size *= 1.6 
    if (isSelected && !isPredicted) size *= 1.3 // Ensure clicked nodes stand out slightly

    const geometry = new THREE.SphereGeometry(size, 16, 16)
    
    // Tactically intensify the materials 
    const isEmissive = isSelected || isPredicted || isHighlighted
    const material = new THREE.MeshLambertMaterial({
      color,
      emissive: color,
      emissiveIntensity: isFractured ? 0.1 : (isEmissive ? 2 : 0.5),
      transparent: true,
      opacity: isFractured ? 0.3 : 0.95,
      wireframe: isFractured // cool shattered effect
    })
    const mesh = new THREE.Mesh(geometry, material)

    // Intense tracker Halo for active selections
    if (!isFractured) {
      const haloGeo = new THREE.SphereGeometry(size * 1.8, 16, 16)
      const haloMat = new THREE.MeshLambertMaterial({ 
        color, 
        transparent: true, 
        opacity: isSelected ? 0.4 : (isPredicted ? 0.3 : 0.12)
      })
      mesh.add(new THREE.Mesh(haloGeo, haloMat))
    }
    
    return mesh
  }, [highlightedNodes, fracturedNodes, predictedNodesSet, selectedNodeId])

  const getTooltip = (node) => {
    // Hide tooltips for arrested nodes simulating disruption
    if (fracturedNodes.has(node.id)) return `<div style="color:#ff003c;font-family:monospace">NODE DISRUPTED (ARRESTED)</div>`
    
    const typeLabel = {
      Person: '🕵️ Suspect',
      Account: '🏦 Bank Account',
      Device: '📱 Communication Device (Phone/IMEI)',
    }[node.type] || node.type

    const risk = node.dynamic_risk !== undefined ? node.dynamic_risk : (node.risk_score || 0)

    return `
      <div style="background:rgba(7,7,10,0.95);border:1px solid rgba(255,255,255,0.12);
      border-radius:10px;padding:12px 16px;font-family:Inter,sans-serif;color:#e0e0ff;min-width:200px">
        <div style="font-size:10px;color:#7a7a9a;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">${typeLabel}</div>
        <div style="font-size:16px;font-weight:700">${node.label}</div>
        ${predictedNodesSet.has(node.id) ? `<div style="color:#eab308;font-size:11px;font-weight:700;margin-top:4px">⚠️ TARGET IDENTIFIED IN TEMPORAL PREDICTION</div>` : ''}
        ${risk !== undefined ? `
          <div style="margin-top:8px;font-size:12px;color:${getNodeColor(node, false)}">
            ⚡ Threat Level: ${risk > 75 ? 'CRITICAL' : risk > 40 ? 'ELEVATED' : 'LOW'}
            &nbsp;(${risk.toFixed(1)}/100) ${node.dynamic_risk !== undefined ? '(Dynamically Updated)' : ''}
          </div>
          <div style="margin-top:4px;font-size:11px;color:#7a7a9a">
            ${risk > 75 ? 'High criminal threat — suspected kingpin/gang leader' :
              risk > 40 ? 'Known associate — mid-level criminal activity' :
              'Person of interest — fringe connection'}
          </div>
        ` : ''}
        ${node.bank_name ? `<div style="margin-top:6px;font-size:12px;color:#f59e0b">🏦 ${node.bank_name}</div>` : ''}
        ${node.phone_number ? `<div style="margin-top:6px;font-size:12px;color:#a78bfa">📞 ${node.phone_number}</div>` : ''}
      </div>
    `
  }

  return (
    <div id="graph-container">
      {loading && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 20, textAlign: 'center', color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: '13px', marginTop: '12px', letterSpacing: '2px' }}>
            CONNECTING TO TIGERGRAPH...
          </div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, background: 'rgba(255,0,60,0.1)', border: '1px solid rgba(255,0,60,0.3)',
          borderRadius: '10px', padding: '12px 20px', color: '#ff003c',
          fontSize: '13px', maxWidth: '500px', textAlign: 'center',
        }}>
          ⚠️ {error}
        </div>
      )}

      <ForceGraph3D
        ref={fgRef}
        graphData={combinedGraphData}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        onNodeClick={onNodeClick}
        
        // Link styling logic
        linkColor={(link) => {
          // Hide links connected to fractured nodes
          const srcId = typeof link.source === 'object' ? link.source.id : link.source
          const tgtId = typeof link.target === 'object' ? link.target.id : link.target
          if (fracturedNodes.has(srcId) || fracturedNodes.has(tgtId)) return 'rgba(0,0,0,0)'
          
          if (link.type === 'PREDICTED') return '#eab308' // Solid vibrant Yellow
          if (link.type === 'OWNS_ACCOUNT') return 'rgba(245,158,11,0.3)'
          if (link.type === 'USES_DEVICE') return 'rgba(167,139,250,0.3)'
          return 'rgba(255,255,255,0.1)'
        }}
        linkWidth={(link) => link.type === 'PREDICTED' ? 2.5 : 0.8}
        linkOpacity={(link) => link.type === 'PREDICTED' ? 1.0 : 0.6}
        linkLineDash={(link) => link.type === 'PREDICTED' ? [3, 2] : null}
        
        // Flow simulation for predictive algorithms
        linkDirectionalParticles={(link) => link.type === 'PREDICTED' ? 5 : 0}
        linkDirectionalParticleWidth={(link) => link.type === 'PREDICTED' ? 3 : 0}
        linkDirectionalParticleColor={() => '#ffffff'}
        linkDirectionalParticleSpeed={(link) => link.type === 'PREDICTED' ? 0.015 : 0}
        
        backgroundColor="#07070a"
        showNavInfo={false}
        nodeLabel={getTooltip}
        cooldownTicks={120}
        // Removed onEngineStop which explicitly hijacked the camera's zoom scale
      />
    </div>
  )
}
