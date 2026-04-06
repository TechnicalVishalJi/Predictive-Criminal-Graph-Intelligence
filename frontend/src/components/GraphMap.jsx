import { useEffect, useRef, useCallback } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import axios from 'axios'

const FLASK_API = 'http://127.0.0.1:5000'

// Color mapping by node type + risk
const getNodeColor = (node) => {
  if (node.type === 'Account') return '#f59e0b'    // amber - financial
  if (node.type === 'Device') return '#a78bfa'      // purple - device
  // Person: risk-based gradient
  const risk = node.risk_score || 0
  if (risk > 75) return '#ff003c'  // neon magenta - high risk
  if (risk > 40) return '#ff8c00'  // orange - medium risk
  return '#00f0ff'                  // neon cyan - low risk
}

const getNodeSize = (node) => {
  if (node.type === 'Account') return 4
  if (node.type === 'Device') return 3
  return 3 + (node.risk_score || 0) / 20  // persons scale with risk
}

export default function GraphMap({ onNodeClick, searchQuery, onDataLoaded, highlightedNodes }) {
  const fgRef = useRef()
  const graphDataRef = useRef({ nodes: [], links: [] })

  useEffect(() => {
    axios.get(`${FLASK_API}/api/network`)
      .then(res => {
        graphDataRef.current = res.data
        onDataLoaded(res.data)
      })
      .catch(() => {
        // Use rich mock data while backend connects
        const mockData = generateMockData()
        graphDataRef.current = mockData
        onDataLoaded(mockData)
      })
  }, [onDataLoaded])

  useEffect(() => {
    if (!searchQuery || !fgRef.current) return
    const node = graphDataRef.current.nodes.find(n =>
      n.label?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (node) {
      fgRef.current.cameraPosition(
        { x: node.x, y: node.y, z: node.z + 150 },
        node,
        1200
      )
    }
  }, [searchQuery])

  const nodeThreeObject = useCallback((node) => {
    const isHighlighted = highlightedNodes.has(node.id)
    const color = isHighlighted ? '#ffffff' : getNodeColor(node)
    const size = getNodeSize(node)

    // Outer glow sphere
    const geometry = new THREE.SphereGeometry(size, 16, 16)
    const material = new THREE.MeshLambertMaterial({
      color,
      emissive: color,
      emissiveIntensity: isHighlighted ? 1.5 : 0.4,
      transparent: true,
      opacity: 0.95,
    })
    const mesh = new THREE.Mesh(geometry, material)

    // Glow halo
    const haloGeo = new THREE.SphereGeometry(size * 1.8, 16, 16)
    const haloMat = new THREE.MeshLambertMaterial({
      color,
      transparent: true,
      opacity: 0.1,
    })
    mesh.add(new THREE.Mesh(haloGeo, haloMat))

    return mesh
  }, [highlightedNodes])

  return (
    <div id="graph-container">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphDataRef.current}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        onNodeClick={onNodeClick}
        linkColor={() => 'rgba(255,255,255,0.1)'}
        linkWidth={0.5}
        linkOpacity={0.5}
        backgroundColor="#07070a"
        showNavInfo={false}
        nodeLabel={node => `
          <div style="background:rgba(7,7,10,0.9);border:1px solid rgba(255,255,255,0.1);
          border-radius:8px;padding:10px 14px;font-family:Inter,sans-serif;color:#e0e0ff">
            <div style="font-size:11px;color:#7a7a9a;text-transform:uppercase;letter-spacing:1px">${node.type}</div>
            <div style="font-size:16px;font-weight:700;margin-top:2px">${node.label}</div>
            ${node.risk_score !== undefined ? `<div style="margin-top:6px;color:${getNodeColor(node)};font-size:12px">⚡ Risk Score: ${node.risk_score.toFixed(1)}</div>` : ''}
          </div>
        `}
        cooldownTicks={100}
        onEngineStop={() => fgRef.current?.zoomToFit(400, 80)}
      />
    </div>
  )
}

function generateMockData() {
  const nodes = []
  const links = []
  const persons = Array.from({ length: 20 }, (_, i) => ({
    id: `person_${i}`, type: 'Person',
    label: ['Arjun Sharma', 'Priya Nair', 'Ravi Kumar', 'Anita Patel', 'Suresh Menon',
      'Deepika Rao', 'Vikram Singh', 'Neha Gupta', 'Karan Mehta', 'Pooja Iyer',
      'Rahul Das', 'Sunita Seth', 'Mohit Verma', 'Kavita Joshi', 'Anil Kapoor',
      'Shreya Pillai', 'Nikhil Bose', 'Meera Nambiar', 'Sanjay Dubey', 'Lakshmi Reddy'][i],
    risk_score: Math.random() * 100,
  }))
  const accounts = Array.from({ length: 15 }, (_, i) => ({
    id: `acc_${i}`, type: 'Account',
    label: `${['HDFC', 'SBI', 'ICICI', 'Axis', 'PNB'][i % 5]} •••${1000 + i}`,
  }))
  const devices = Array.from({ length: 10 }, (_, i) => ({
    id: `dev_${i}`, type: 'Device',
    label: `+91-9${Math.floor(Math.random() * 9)}${Math.floor(10000000 + Math.random() * 89999999)}`,
  }))

  nodes.push(...persons, ...accounts, ...devices)

  persons.forEach(p => {
    // account links
    const acc = accounts[Math.floor(Math.random() * accounts.length)]
    links.push({ source: p.id, target: acc.id })
    // device links
    if (Math.random() > 0.4) {
      const dev = devices[Math.floor(Math.random() * devices.length)]
      links.push({ source: p.id, target: dev.id })
    }
    // associate links
    if (Math.random() > 0.5) {
      const other = persons[Math.floor(Math.random() * persons.length)]
      if (other.id !== p.id) links.push({ source: p.id, target: other.id })
    }
  })

  return { nodes, links }
}
