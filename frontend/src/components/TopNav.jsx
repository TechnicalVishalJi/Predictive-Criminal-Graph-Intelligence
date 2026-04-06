import { Search, Shield } from 'lucide-react'

export default function TopNav({ searchQuery, setSearchQuery, graphData }) {
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

      {highRisk > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-magenta)', fontSize: '13px' }}>
          <Shield size={16} />
          <span>{highRisk} HIGH RISK</span>
        </div>
      )}
    </nav>
  )
}
