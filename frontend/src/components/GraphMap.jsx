import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import axios from 'axios'

const FLASK_API = 'http://127.0.0.1:5000'

const getNodeColor = (node, isFractured) => {
  if (isFractured) return '#101015'
  if (node.type === 'Account') return '#f59e0b'
  if (node.type === 'Device') return '#a78bfa'
  const risk = node.dynamic_risk !== undefined ? node.dynamic_risk : (node.risk_score || 0)
  if (risk > 75) return '#ff003c'
  if (risk > 40) return '#ff8c00'
  return '#00f0ff'
}

const getNodeSize = (node, isFractured) => {
  if (isFractured) return 2
  if (node.type === 'Account') return 4
  if (node.type === 'Device') return 3
  const risk = node.dynamic_risk !== undefined ? node.dynamic_risk : (node.risk_score || 0)
  return 3 + risk / 20
}

// BFS up to 2 hops from selectedNodeId — returns map of { nodeId -> hopDistance }
function buildHopMap(selectedNodeId, links) {
  if (!selectedNodeId) return {}
  const adj = {}
  links.forEach(link => {
    const s = typeof link.source === 'object' ? link.source.id : link.source
    const t = typeof link.target === 'object' ? link.target.id : link.target
    if (!adj[s]) adj[s] = []
    if (!adj[t]) adj[t] = []
    adj[s].push(t)
    adj[t].push(s)
  })
  const hopMap = { [selectedNodeId]: 0 }
  const queue = [selectedNodeId]
  while (queue.length) {
    const cur = queue.shift()
    if (hopMap[cur] >= 2) continue
    for (const neighbor of (adj[cur] || [])) {
      if (hopMap[neighbor] === undefined) {
        hopMap[neighbor] = hopMap[cur] + 1
        queue.push(neighbor)
      }
    }
  }
  return hopMap
}

export default function GraphMap({ 
  onNodeClick, onBackgroundClick, searchQuery, onDataLoaded, highlightedNodes,
  predictedLinks = [], fracturedNodes = new Set(), selectedNodeId, refreshToken = 0
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
  }, [onDataLoaded, refreshToken])  // refreshToken increment triggers a re-fetch

  // Tune d3-force simulation once data loads:
  // Remove center gravity and amplify repulsion so isolated clusters spread apart
  useEffect(() => {
    if (!fgRef.current || graphData.nodes.length === 0) return
    const fg = fgRef.current
    fg.d3Force('center', null)
    fg.d3Force('charge').strength(-250)
    if (fg.d3Force('link')) {
      fg.d3Force('link').distance(70).strength(0.4)
    }
    fg.d3ReheatSimulation()
  }, [graphData])

  // Search: fly camera to matching node
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

  // Memoize combined graph (real + predicted links)
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

  const predictedNodesSet = useMemo(() => {
    const s = new Set()
    predictedLinks.forEach(p => { s.add(p.source); s.add(p.target) })
    return s
  }, [predictedLinks])

  // BFS hop map — recalculated whenever selected node or links change
  const hopMap = useMemo(() => {
    return buildHopMap(selectedNodeId, combinedGraphData.links)
  }, [selectedNodeId, combinedGraphData.links])

  const nodeFocusActive = selectedNodeId && Object.keys(hopMap).length > 0

  const nodeThreeObject = useCallback((node) => {
    const isFractured = fracturedNodes.has(node.id)
    const isHighlighted = highlightedNodes.has(node.id) && !isFractured
    const isPredicted = predictedNodesSet.has(node.id)
    const isSelected = selectedNodeId === node.id

    // Focus mode: derive opacity/dim based on hop distance
    const hop = hopMap[node.id]
    const inFocus = nodeFocusActive && hop !== undefined
    const isFaded = nodeFocusActive && hop === undefined  // >2 hops away

    let color = isHighlighted ? '#ffffff' : getNodeColor(node, isFractured)
    if (isPredicted) color = '#eab308'
    if (isSelected) color = '#ffffff'
    if (isFaded) color = '#23232e'  // Nearly black when out of focus

    let size = getNodeSize(node, isFractured)
    if (isPredicted) size *= 1.6
    if (isSelected && !isPredicted) size *= 1.3

    let opacity = isFractured ? 0.3 : 0.95
    if (isFaded) opacity = 0.15
    else if (inFocus && hop === 2) opacity = 0.55

    const geometry = new THREE.SphereGeometry(size, 16, 16)
    const isEmissive = isSelected || isPredicted || isHighlighted
    const material = new THREE.MeshLambertMaterial({
      color,
      emissive: color,
      emissiveIntensity: isFractured ? 0.1 : isFaded ? 0.05 : (isEmissive ? 2 : 0.5),
      transparent: true,
      opacity,
      wireframe: isFractured
    })
    const mesh = new THREE.Mesh(geometry, material)

    if (!isFractured && !isFaded) {
      const haloGeo = new THREE.SphereGeometry(size * 1.8, 16, 16)
      const haloMat = new THREE.MeshLambertMaterial({
        color,
        transparent: true,
        opacity: isSelected ? 0.4 : (isPredicted ? 0.3 : 0.12)
      })
      mesh.add(new THREE.Mesh(haloGeo, haloMat))
    }

    return mesh
  }, [highlightedNodes, fracturedNodes, predictedNodesSet, selectedNodeId, hopMap, nodeFocusActive])

  // Fix zoom-on-click: capture camera position before react-force-graph-3d
  // auto-zooms, then restore it immediately after
  const handleNodeClickInternal = useCallback((node) => {
    if (fgRef.current) {
      const cam = fgRef.current.cameraPosition()
      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.cameraPosition(
            { x: cam.x, y: cam.y, z: cam.z },
            undefined,
            0   // instant, no animation
          )
        }
      }, 20)
    }
    onNodeClick(node)
  }, [onNodeClick])

  const getTooltip = (node) => {
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
        onNodeClick={handleNodeClickInternal}
        onBackgroundClick={onBackgroundClick}

        linkColor={(link) => {
          const srcId = typeof link.source === 'object' ? link.source.id : link.source
          const tgtId = typeof link.target === 'object' ? link.target.id : link.target
          if (fracturedNodes.has(srcId) || fracturedNodes.has(tgtId)) return 'rgba(0,0,0,0)'

          // Focus mode: dim edges not in 1-hop
          if (nodeFocusActive) {
            const srcHop = hopMap[srcId]
            const tgtHop = hopMap[tgtId]
            if (srcHop === undefined || tgtHop === undefined) return 'rgba(255,255,255,0.03)'
          }

          if (link.type === 'PREDICTED') return '#eab308'
          if (link.type === 'OWNS_ACCOUNT') return 'rgba(245,158,11,0.4)'
          if (link.type === 'USES_DEVICE') return 'rgba(167,139,250,0.4)'
          return 'rgba(255,255,255,0.15)'
        }}
        linkWidth={(link) => {
          if (link.type === 'PREDICTED') return 2.5
          if (!nodeFocusActive) return 0.8
          const srcId = typeof link.source === 'object' ? link.source.id : link.source
          const tgtId = typeof link.target === 'object' ? link.target.id : link.target
          const srcHop = hopMap[srcId]
          const tgtHop = hopMap[tgtId]
          if (srcHop === undefined || tgtHop === undefined) return 0.2
          return 1.2
        }}
        linkOpacity={(link) => link.type === 'PREDICTED' ? 1.0 : 0.7}
        linkLineDash={(link) => link.type === 'PREDICTED' ? [3, 2] : null}

        linkDirectionalParticles={(link) => link.type === 'PREDICTED' ? 5 : 0}
        linkDirectionalParticleWidth={(link) => link.type === 'PREDICTED' ? 3 : 0}
        linkDirectionalParticleColor={() => '#ffffff'}
        linkDirectionalParticleSpeed={(link) => link.type === 'PREDICTED' ? 0.015 : 0}

        backgroundColor="#07070a"
        showNavInfo={false}
        nodeLabel={getTooltip}
        warmupTicks={120}
        cooldownTicks={200}
      />
    </div>
  )
}
