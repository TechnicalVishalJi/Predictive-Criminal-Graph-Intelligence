import { User, AlertTriangle, CreditCard, Smartphone, Users, Zap, Crosshair, TrendingUp, Download, FileText, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import ActivityTimeline from './ActivityTimeline'

const FLASK_API = 'http://127.0.0.1:5000'

const riskColor = (score) => score > 75 ? '#ff003c' : score > 40 ? '#ff8c00' : '#00f0ff'
const riskLabel = (score) => score > 75 ? 'CRITICAL THREAT' : score > 40 ? 'ELEVATED THREAT' : 'PERSON OF INTEREST'
const riskDesc  = (score) => score > 75
  ? 'Suspected kingpin or gang leader. High danger to society.'
  : score > 40
  ? 'Known associate with mid-level criminal activity.'
  : 'Fringe connection — under surveillance.'

export default function EntityInspector({ 
  node, graphData, 
  onPredictLinks, onSimulateDisruption, onRiskRecalculated 
}) {
  const isOpen = !!node
  const currentRisk = node?.dynamic_risk !== undefined ? node.dynamic_risk : (node?.risk_score || 0)
  const color = node ? riskColor(currentRisk) : '#00f0ff'

  const [loadingAction, setLoadingAction] = useState(null)
  const [disruptionResult, setDisruptionResult] = useState(null)
  const [criminalRecords, setCriminalRecords] = useState([])
  const [timeline, setTimeline] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  // Clear all local state when selected node changes
  useEffect(() => {
    setDisruptionResult(null)
    setCriminalRecords([])
    setTimeline([])

    if (!node || node.type !== 'Person') return

    // Fetch criminal records + 1-hop data
    axios.get(`${FLASK_API}/api/target/${node.id}`)
      .then(res => {
        if (res.data.criminal_records) {
          setCriminalRecords(res.data.criminal_records)
        }
      })
      .catch(() => {})

    // Fetch 12-month activity timeline
    setTimelineLoading(true)
    axios.get(`${FLASK_API}/api/timeline/${node.id}`)
      .then(res => {
        if (res.data.timeline) setTimeline(res.data.timeline)
      })
      .catch(() => {})
      .finally(() => setTimelineLoading(false))
  }, [node])
  
  // Compute 1-hop neighbors from graph data
  const neighbors = { accounts: [], devices: [], associates: [] }
  if (node && graphData?.links && graphData?.nodes) {
    const nodeMap = Object.fromEntries(graphData.nodes.map(n => [n.id, n]))
    graphData.links.forEach(link => {
      const srcId = typeof link.source === 'object' ? link.source.id : link.source
      const tgtId = typeof link.target === 'object' ? link.target.id : link.target
      if (srcId === node.id) {
        const neighbor = nodeMap[tgtId]
        if (!neighbor) return
        if (neighbor.type === 'Account') neighbors.accounts.push(neighbor)
        if (neighbor.type === 'Device') neighbors.devices.push(neighbor)
        if (neighbor.type === 'Person') neighbors.associates.push(neighbor)
      }
      if (tgtId === node.id) {
        const neighbor = nodeMap[srcId]
        if (!neighbor) return
        if (neighbor.type === 'Person' && link.type === 'ASSOCIATES_WITH') neighbors.associates.push(neighbor)
      }
    })
  }

  const handlePredictLinks = async () => {
    setLoadingAction('predict')
    try {
      const res = await axios.get(`${FLASK_API}/api/predict_links/${node.id}`)
      if (res.data.predictions && onPredictLinks) {
        onPredictLinks(res.data.predictions.map(p => ({
          source: node.id,
          target: p.target_id,
          confidence: p.confidence_score
        })))
      }
    } catch (err) {
      console.error('Prediction failed', err)
    }
    setLoadingAction(null)
  }

  const handleRecalculateRisk = async () => {
    setLoadingAction('risk')
    try {
      const res = await axios.get(`${FLASK_API}/api/analyze_risk/${node.id}`)
      if (res.data.data && onRiskRecalculated) {
        onRiskRecalculated(node.id, res.data.data.new_risk_score)
      }
    } catch (err) {
      console.error('Risk update failed', err)
    }
    setLoadingAction(null)
  }

  const handleSimulateArrest = async () => {
    setLoadingAction('arrest')
    try {
      const res = await axios.get(`${FLASK_API}/api/simulate_disruption/${node.id}`)
      if (res.data.data) {
        // Save to local UI to show below the button instead of annoying browser alerts
        setDisruptionResult({
          capacityLoss: res.data.data.capacity_loss_percent,
          isolatedLinks: res.data.data.isolated_nodes.length,
          centrality: res.data.data.betweenness_centrality
        })
        
        // Pass up to 3D graph to visually fracture the network
        if (onSimulateDisruption) {
          onSimulateDisruption({
            arrestedId: node.id,
            isolatedNodes: res.data.data.isolated_nodes,
            capacityLoss: res.data.data.capacity_loss_percent
          })
        }
      }
    } catch (err) {
      console.error('Simulation failed', err)
    }
    setLoadingAction(null)
  }

  const handleDownloadDossier = () => {
    // Triggers direct browser download from Flask API
    window.open(`${FLASK_API}/api/dossier/generate/${node.id}`, '_blank')
  }

  return (
    <aside className={`glass-panel side-panel left ${isOpen ? 'open' : ''}`} style={{ overflowY: 'auto' }}>
      {node ? (
        <>
          {/* Header */}
          <div className="inspector-header">
            <div className="inspector-title">
              {node.type === 'Person' && '🕵️ Suspect Dossier'}
              {node.type === 'Account' && '🏦 Bank Account'}
              {node.type === 'Device' && '📱 Communication Device'}
            </div>
            <div className="inspector-name">{node.label}</div>
            {currentRisk !== undefined && (
              <div className="risk-badge" style={{ color, borderColor: color, background: `${color}15`, marginBottom: '4px' }}>
                <AlertTriangle size={11} style={{ display: 'inline', marginRight: '4px' }} />
                {riskLabel(currentRisk)}
              </div>
            )}
            {currentRisk !== undefined && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '6px' }}>
                {riskDesc(currentRisk)}
              </div>
            )}
          </div>

          {/* Risk Meter */}
          {currentRisk !== undefined && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>THREAT SCORE TO SOCIETY</span>
                <span style={{ color, fontWeight: 700 }}>{currentRisk.toFixed(1)} / 100</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', height: '6px' }}>
                <div style={{
                  width: `${Math.min(100, currentRisk)}%`, height: '100%',
                  background: `linear-gradient(90deg, ${color}66, ${color})`,
                  borderRadius: '4px', boxShadow: `0 0 8px ${color}`,
                  transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1), background 0.8s ease',
                }} />
              </div>
            </div>
          )}

          {/* Criminal Records */}
          {node.type === 'Person' && criminalRecords.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', fontSize: '10px', color: '#ff003c', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={11} /> Criminal Records ({criminalRecords.length})
              </div>
              {criminalRecords.map((rec, i) => (
                <div key={i} style={{
                  padding: '10px 12px', borderRadius: '8px',
                  background: 'rgba(255,0,60,0.05)',
                  border: '1px solid rgba(255,0,60,0.15)',
                  display: 'flex', flexDirection: 'column', gap: '4px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#ff003c', letterSpacing: '0.5px' }}>
                      {rec.crime_type}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rec.date}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    #{rec.fir_number}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {rec.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Node attributes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <InfoRow label="ID" value={node.id} />
            {node.bank_name && <InfoRow label="Bank" value={node.bank_name} icon={<CreditCard size={13} />} />}
            {node.phone_number && <InfoRow label="Phone" value={node.phone_number} icon={<Smartphone size={13} />} />}
          </div>

          {/* 1-hop connections */}
          {node.type === 'Person' && (neighbors.associates.length > 0 || neighbors.accounts.length > 0 || neighbors.devices.length > 0) && (() => {
            const uniqueAssociates = [...new Map(neighbors.associates.map(n => [n.id, n])).values()]
            const uniqueAccounts = [...new Map(neighbors.accounts.map(n => [n.id, n])).values()]
            const uniqueDevices = [...new Map(neighbors.devices.map(n => [n.id, n])).values()]
            
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Known Connections
                </div>

                {uniqueAssociates.length > 0 && (
                  <ConnectionGroup icon={<Users size={13} />} label="Associates" color="#00f0ff" items={uniqueAssociates.map(n => n.label)} />
                )}
                {uniqueAccounts.length > 0 && (
                  <ConnectionGroup icon={<CreditCard size={13} />} label="Bank Accounts" color="#f59e0b" items={uniqueAccounts.map(n => n.label)} />
                )}
                {uniqueDevices.length > 0 && (
                  <ConnectionGroup icon={<Smartphone size={13} />} label="Devices / Phones" color="#a78bfa" items={uniqueDevices.map(n => n.label)} />
                )}
              </div>
            )
          })()}

          {/* 12-Month Activity Timeline */}
          {node.type === 'Person' && (timeline.length > 0 || timelineLoading) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', fontSize: '10px', color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={11} /> 12-Month Activity Intelligence
              </div>
              <ActivityTimeline events={timeline} loading={timelineLoading} />
            </div>
          )}

          {/* ADVANCED ANALYTICS CONTROLS */}
          {node.type === 'Person' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', fontSize: '10px', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '4px' }}>
                Advanced Capabilities
              </div>
              
              <ActionButton 
                icon={<Zap size={14} color="#eab308" />} 
                label={loadingAction === 'predict' ? 'Scanning Graph...' : "Predict Future Links"} 
                onClick={handlePredictLinks} 
                disabled={loadingAction !== null} 
              />
              <ActionButton 
                icon={<TrendingUp size={14} color="#00f0ff" />} 
                label={loadingAction === 'risk' ? 'Calculating...' : "Dynamic Risk Recalculate"} 
                onClick={handleRecalculateRisk} 
                disabled={loadingAction !== null} 
              />
              <ActionButton 
                icon={<Crosshair size={14} color="#ff003c" />} 
                label={loadingAction === 'arrest' ? 'Simulating...' : "Simulate Target Arrest"} 
                onClick={handleSimulateArrest} 
                disabled={loadingAction !== null}
                danger 
              />
              <ActionButton 
                icon={<Download size={14} color="#a78bfa" />} 
                label="Generate Official PDF Dossier" 
                onClick={handleDownloadDossier} 
              />
              
              {/* Injecting DOM UI payload for Disruption Simulator result explicitly here per user request */}
              {disruptionResult !== null && (
                <div style={{
                  marginTop: '8px', padding: '12px', borderRadius: '8px',
                  background: 'rgba(255,0,60,0.1)', border: '1px solid rgba(255,0,60,0.3)',
                  color: '#e0e0ff', fontSize: '12px', lineHeight: 1.5
                }}>
                  <div style={{ color: '#ff003c', fontWeight: 800, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>
                    🚨 ARREST SIMULATION RESULTS
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Target Betweenness:</span> 
                    <span style={{ fontWeight: 700 }}>{disruptionResult.centrality}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Isolated Assets:</span> 
                    <span style={{ fontWeight: 700 }}>{disruptionResult.isolatedLinks}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Syndicate Capacity Drop:</span> 
                    <span style={{ color: '#ff003c', fontWeight: 800 }}>-{disruptionResult.capacityLoss}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-muted)' }}>
          <User size={40} style={{ opacity: 0.3 }} />
          <p style={{ textAlign: 'center', fontSize: '13px', lineHeight: 1.6 }}>
            Click any node in the graph to view their criminal dossier and network connections.
          </p>
        </div>
      )}
    </aside>
  )
}

function ActionButton({ icon, label, onClick, disabled, danger }) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%', padding: '10px 14px',
        background: danger ? 'rgba(255,0,60,0.1)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${danger ? 'rgba(255,0,60,0.3)' : 'var(--glass-border)'}`,
        borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
        color: danger ? '#ff003c' : 'var(--text-primary)',
        fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
        opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={e => { if(!disabled) e.currentTarget.style.background = danger ? 'rgba(255,0,60,0.2)' : 'rgba(255,255,255,0.1)' }}
      onMouseLeave={e => { if(!disabled) e.currentTarget.style.background = danger ? 'rgba(255,0,60,0.1)' : 'rgba(255,255,255,0.05)' }}
    >
      {icon} {label}
    </button>
  )
}

function InfoRow({ label, value, icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '12px', gap: '8px' }}>
      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        {icon}{label}
      </span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all', fontSize: '11px' }}>{value}</span>
    </div>
  )
}

function ConnectionGroup({ icon, label, color, items }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {icon}{label} ({items.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {items.slice(0, 5).map((item, i) => (
          <div key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '8px', borderLeft: `2px solid ${color}44` }}>
            {item}
          </div>
        ))}
        {items.length > 5 && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '8px' }}>+{items.length - 5} more...</div>
        )}
      </div>
    </div>
  )
}
