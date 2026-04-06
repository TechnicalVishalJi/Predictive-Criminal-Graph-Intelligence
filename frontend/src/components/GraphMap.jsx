import { useEffect, useRef, useState, useCallback } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import axios from 'axios'

const FLASK_API = 'http://127.0.0.1:5000'

// Risk score = how dangerous/threatening this person IS to society
// High (>75) = Suspected kingpin / gang leader
// Medium (40-75) = Known associate / mid-level criminal
// Low (<40) = Person of interest / fringe connection
const getNodeColor = (node) => {
  if (node.type === 'Account') return '#f59e0b'   // amber = financial node
  if (node.type === 'Device') return '#a78bfa'     // purple = communication device (phone/IMEI)
  const risk = node.risk_score || 0
  if (risk > 75) return '#ff003c'   // red = high threat to society
  if (risk > 40) return '#ff8c00'   // orange = medium threat
  return '#00f0ff'                   // cyan = low threat / person of interest
}

const getNodeSize = (node) => {
  if (node.type === 'Account') return 4
  if (node.type === 'Device') return 3
  return 3 + (node.risk_score || 0) / 20
}

export default function GraphMap({ onNodeClick, searchQuery, onDataLoaded, highlightedNodes }) {
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

  const nodeThreeObject = useCallback((node) => {
    const isHighlighted = highlightedNodes.has(node.id)
    const color = isHighlighted ? '#ffffff' : getNodeColor(node)
    const size = getNodeSize(node)

    const geometry = new THREE.SphereGeometry(size, 16, 16)
    const material = new THREE.MeshLambertMaterial({
      color,
      emissive: color,
      emissiveIntensity: isHighlighted ? 1.5 : 0.5,
      transparent: true,
      opacity: 0.95,
    })
    const mesh = new THREE.Mesh(geometry, material)

    // Glow halo
    const haloGeo = new THREE.SphereGeometry(size * 1.8, 16, 16)
    const haloMat = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.12 })
    mesh.add(new THREE.Mesh(haloGeo, haloMat))
    return mesh
  }, [highlightedNodes])

  const getTooltip = (node) => {
    const typeLabel = {
      Person: '🕵️ Suspect',
      Account: '🏦 Bank Account',
      Device: '📱 Communication Device (Phone/IMEI)',
    }[node.type] || node.type

    return `
      <div style="background:rgba(7,7,10,0.95);border:1px solid rgba(255,255,255,0.12);
      border-radius:10px;padding:12px 16px;font-family:Inter,sans-serif;color:#e0e0ff;min-width:200px">
        <div style="font-size:10px;color:#7a7a9a;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">${typeLabel}</div>
        <div style="font-size:16px;font-weight:700">${node.label}</div>
        ${node.risk_score !== undefined ? `
          <div style="margin-top:8px;font-size:12px;color:${getNodeColor(node)}">
            ⚡ Threat Level: ${node.risk_score > 75 ? 'CRITICAL' : node.risk_score > 40 ? 'ELEVATED' : 'LOW'}
            &nbsp;(${node.risk_score.toFixed(1)}/100)
          </div>
          <div style="margin-top:4px;font-size:11px;color:#7a7a9a">
            ${node.risk_score > 75 ? 'High criminal threat — suspected kingpin/gang leader' :
              node.risk_score > 40 ? 'Known associate — mid-level criminal activity' :
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
        graphData={graphData}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        onNodeClick={onNodeClick}
        linkColor={(link) => {
          if (link.type === 'OWNS_ACCOUNT') return 'rgba(245,158,11,0.3)'
          if (link.type === 'USES_DEVICE') return 'rgba(167,139,250,0.3)'
          return 'rgba(255,255,255,0.1)'  // ASSOCIATES_WITH
        }}
        linkWidth={0.8}
        linkOpacity={0.6}
        backgroundColor="#07070a"
        showNavInfo={false}
        nodeLabel={getTooltip}
        cooldownTicks={120}
        onEngineStop={() => fgRef.current?.zoomToFit(600, 120)}
      />
    </div>
  )
}
