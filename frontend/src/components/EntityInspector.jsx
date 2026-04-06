import { User, AlertTriangle, CreditCard, Smartphone, Users } from 'lucide-react'

const riskColor = (score) => score > 75 ? '#ff003c' : score > 40 ? '#ff8c00' : '#00f0ff'
const riskLabel = (score) => score > 75 ? 'CRITICAL THREAT' : score > 40 ? 'ELEVATED THREAT' : 'PERSON OF INTEREST'
const riskDesc  = (score) => score > 75
  ? 'Suspected kingpin or gang leader. High danger to society.'
  : score > 40
  ? 'Known associate with mid-level criminal activity.'
  : 'Fringe connection — under surveillance.'

export default function EntityInspector({ node, graphData }) {
  const isOpen = !!node
  const color = node ? riskColor(node.risk_score) : '#00f0ff'

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

  return (
    <aside className={`glass-panel side-panel left ${isOpen ? 'open' : ''}`}>
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
            {node.risk_score !== undefined && (
              <div className="risk-badge" style={{ color, borderColor: color, background: `${color}15`, marginBottom: '4px' }}>
                <AlertTriangle size={11} style={{ display: 'inline', marginRight: '4px' }} />
                {riskLabel(node.risk_score)}
              </div>
            )}
            {node.risk_score !== undefined && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '6px' }}>
                {riskDesc(node.risk_score)}
              </div>
            )}
          </div>

          {/* Risk Meter */}
          {node.risk_score !== undefined && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>THREAT SCORE TO SOCIETY</span>
                <span style={{ color, fontWeight: 700 }}>{node.risk_score.toFixed(1)} / 100</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', height: '6px' }}>
                <div style={{
                  width: `${node.risk_score}%`, height: '100%',
                  background: `linear-gradient(90deg, ${color}66, ${color})`,
                  borderRadius: '4px', boxShadow: `0 0 8px ${color}`,
                  transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>
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
            // Deduplicate items to fix the double-associate graph data replication bug
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

          <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: 'auto', paddingTop: '12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Ask the AI Co-Pilot for deeper analysis →
          </div>
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
