import { Search, Shield, UserPlus } from 'lucide-react'

export default function TopNav({ searchQuery, setSearchQuery, graphData, onOpenIntake }) {
  const highRisk = graphData.nodes?.filter(n => n.risk_score > 75).length || 0

  return (
    <nav className="glass-panel top-nav">
      <div className="nav-title">
        <div className="pulse" />
        <span>NEXUS</span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '13px', letterSpacing: '1px' }}>
          INTELLIGENCE MATRIX
        </span>
      </div>

      <div className="search-bar" style={{ position: 'relative' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search suspects, accounts..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '40px' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {highRisk > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-magenta)', fontSize: '13px' }}>
            <Shield size={16} />
            <span>{highRisk} HIGH RISK</span>
          </div>
        )}
        <button
          onClick={onOpenIntake}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '20px',
            background: 'rgba(255,0,60,0.1)',
            border: '1px solid rgba(255,0,60,0.4)',
            color: '#ff003c', fontSize: '12px', fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.5px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,0,60,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,0,60,0.1)'}
        >
          <UserPlus size={14} /> Register Target
        </button>
      </div>
    </nav>
  )
}
