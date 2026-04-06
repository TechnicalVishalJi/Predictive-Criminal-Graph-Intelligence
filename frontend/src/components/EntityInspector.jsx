import { X, User, CreditCard, Smartphone, AlertTriangle } from 'lucide-react'

const riskColor = (score) => {
  if (score > 75) return '#ff003c'
  if (score > 40) return '#ff8c00'
  return '#00f0ff'
}

const riskLabel = (score) => {
  if (score > 75) return 'CRITICAL'
  if (score > 40) return 'ELEVATED'
  return 'LOW'
}

export default function EntityInspector({ node }) {
  const isOpen = !!node
  const color = node ? riskColor(node.risk_score) : '#00f0ff'

  return (
    <aside className={`glass-panel side-panel left ${isOpen ? 'open' : ''}`}>
      {node ? (
        <>
          <div className="inspector-header">
            <div className="inspector-title">
              {node.type === 'Person' && '👤 Suspect Dossier'}
              {node.type === 'Account' && '🏦 Financial Account'}
              {node.type === 'Device' && '📱 Registered Device'}
            </div>
            <div className="inspector-name">{node.label}</div>
            {node.risk_score !== undefined && (
              <div className="risk-badge" style={{
                color,
                borderColor: color,
                background: `${color}15`,
              }}>
                <AlertTriangle size={11} style={{ display: 'inline', marginRight: '4px' }} />
                {riskLabel(node.risk_score)} THREAT · {node.risk_score?.toFixed(1)}
              </div>
            )}
          </div>

          {/* Risk Meter */}
          {node.risk_score !== undefined && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span>RISK SCORE</span>
                <span style={{ color }}>{node.risk_score.toFixed(1)} / 100</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', height: '6px' }}>
                <div style={{
                  width: `${node.risk_score}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                  borderRadius: '4px',
                  boxShadow: `0 0 8px ${color}`,
                  transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>
            </div>
          )}

          {/* Node Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <InfoRow label="ID" value={node.id} />
            <InfoRow label="Type" value={node.type} />
            {node.bank_name && <InfoRow label="Bank" value={node.bank_name} icon={<CreditCard size={14} />} />}
            {node.phone_number && <InfoRow label="Phone" value={node.phone_number} icon={<Smartphone size={14} />} />}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }} />

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Ask the AI Co-Pilot for deeper analysis
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-muted)' }}>
          <User size={40} style={{ opacity: 0.3 }} />
          <p style={{ textAlign: 'center', fontSize: '14px' }}>Click any node on the graph to inspect its dossier</p>
        </div>
      )}
    </aside>
  )
}

function InfoRow({ label, value, icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon}{label}
      </span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}
