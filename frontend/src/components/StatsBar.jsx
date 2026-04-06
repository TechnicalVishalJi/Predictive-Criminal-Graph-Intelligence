import { Users, CreditCard, Smartphone, Activity } from 'lucide-react'

export default function StatsBar({ graphData }) {
  const persons = graphData.nodes?.filter(n => n.type === 'Person').length || 0
  const accounts = graphData.nodes?.filter(n => n.type === 'Account').length || 0
  const devices = graphData.nodes?.filter(n => n.type === 'Device').length || 0
  const edges = graphData.links?.length || 0

  const stats = [
    { icon: Users, label: 'Suspects', value: persons, color: '#00f0ff' },
    { icon: CreditCard, label: 'Accounts', value: accounts, color: '#f59e0b' },
    { icon: Smartphone, label: 'Devices', value: devices, color: '#a78bfa' },
    { icon: Activity, label: 'Connections', value: edges, color: '#4ade80' },
  ]

  return (
    <div style={{
      position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: '12px', zIndex: 10,
    }}>
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="glass-panel" style={{
          padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px',
          minWidth: '140px',
        }}>
          <Icon size={20} style={{ color }} />
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', lineHeight: 1, color }}>{value}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
