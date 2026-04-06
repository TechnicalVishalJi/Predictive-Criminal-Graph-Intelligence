import { Clock, AlertTriangle, CreditCard, Smartphone, Users, FileText } from 'lucide-react'

const EDGE_CONFIG = {
  OWNS_ACCOUNT:    { icon: CreditCard, color: '#f59e0b', label: 'Financial' },
  USES_DEVICE:     { icon: Smartphone, color: '#a78bfa', label: 'Device' },
  ASSOCIATES_WITH: { icon: Users,      color: '#00f0ff', label: 'Contact' },
  INVOLVED_IN:     { icon: AlertTriangle, color: '#ff003c', label: 'FIR' },
}

function groupByMonth(events) {
  const groups = {}
  events.forEach(ev => {
    const d = new Date(ev.date)
    const key = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(ev)
  })
  return Object.entries(groups)
}

export default function ActivityTimeline({ events = [], loading }) {
  if (loading) {
    return (
      <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
        Building timeline...
      </div>
    )
  }

  if (!events.length) {
    return (
      <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
        No activity recorded.
      </div>
    )
  }

  const grouped = groupByMonth(events)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
      {grouped.map(([month, monthEvents]) => (
        <div key={month}>
          {/* Month header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '10px', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '1.5px',
            marginBottom: '8px', marginTop: '10px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span>{month}</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Events in month */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px' }}>
            {monthEvents.map((ev, i) => {
              const cfg = EDGE_CONFIG[ev.edge_type] || { icon: Clock, color: '#7a7a9a', label: ev.edge_type }
              const Icon = cfg.icon
              const day = new Date(ev.date).getDate()
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  position: 'relative',
                }}>
                  {/* Timeline dot + line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                    <div style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: cfg.color,
                      boxShadow: `0 0 6px ${cfg.color}88`,
                      flexShrink: 0, marginTop: '4px',
                    }} />
                    {i < monthEvents.length - 1 && (
                      <div style={{
                        width: '1px', flex: 1, minHeight: '14px',
                        background: 'rgba(255,255,255,0.06)',
                        marginTop: '3px',
                      }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{
                        fontSize: '9px', fontWeight: 700,
                        color: cfg.color, letterSpacing: '0.8px',
                        background: `${cfg.color}18`,
                        padding: '1px 6px', borderRadius: '4px',
                        border: `1px solid ${cfg.color}33`,
                      }}>
                        <Icon size={8} style={{ display: 'inline', marginRight: '3px' }} />
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Day {day}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {ev.note}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
