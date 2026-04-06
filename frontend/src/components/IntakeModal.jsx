import { useState } from 'react'
import { X, UserPlus, Loader } from 'lucide-react'
import axios from 'axios'

const FLASK_API = 'http://127.0.0.1:5000'

const GANGS = [
  { id: '',              name: 'Unknown / Unaffiliated' },
  { id: 'GANG_ALPHA',   name: 'Bishnoi Crime Syndicate' },
  { id: 'GANG_BRAVO',   name: 'Delhi Auto-Theft Ring' },
  { id: 'GANG_CHARLIE', name: 'Cyber Hawala Network' },
  { id: 'LONE_WOLVES',  name: 'Independent Operators' },
]

export default function IntakeModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    full_name: '',
    risk_score: 30,
    gang_id: '',
    intake_note: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Full name is required.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${FLASK_API}/api/add_target`, form)
      if (res.data.status === 'success') {
        onSuccess(res.data)
      }
    } catch (err) {
      setError('Failed to register target. Backend may be unreachable.')
    }
    setLoading(false)
  }

  const riskColor = form.risk_score > 75 ? '#ff003c' : form.risk_score > 40 ? '#ff8c00' : '#00f0ff'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(14, 14, 22, 0.97)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '32px',
          width: '440px',
          display: 'flex', flexDirection: 'column', gap: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(255,0,60,0.06)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#ff003c', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
              FIR Intelligence Intake
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#e0e0ff', marginTop: '4px' }}>
              Register New Target
            </div>
          </div>
          <button type="button" onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#7a7a9a',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Full Name */}
        <div>
          <label style={labelStyle}>Full Name / Alias</label>
          <input
            type="text"
            required
            placeholder="e.g. Ravi Kumar Singh"
            value={form.full_name}
            onChange={e => handleChange('full_name', e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Risk Score */}
        <div>
          <label style={labelStyle}>
            Initial Threat Score &nbsp;
            <span style={{ color: riskColor, fontWeight: 800 }}>{form.risk_score} / 100</span>
          </label>
          <input
            type="range" min={10} max={99} step={1}
            value={form.risk_score}
            onChange={e => handleChange('risk_score', Number(e.target.value))}
            style={{ width: '100%', accentColor: riskColor, cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>Person of Interest</span><span>CRITICAL THREAT</span>
          </div>
        </div>

        {/* Gang Affiliation */}
        <div>
          <label style={labelStyle}>Suspected Gang Affiliation</label>
          <select
            value={form.gang_id}
            onChange={e => handleChange('gang_id', e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {GANGS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {/* Intake Note / FIR Summary */}
        <div>
          <label style={labelStyle}>Intake Note / FIR Summary</label>
          <textarea
            rows={3}
            placeholder="e.g. Suspect sighted near arms cache. Linked via burner phone to known gang member..."
            value={form.intake_note}
            onChange={e => handleChange('intake_note', e.target.value)}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
          />
        </div>

        {error && (
          <div style={{ fontSize: '12px', color: '#ff003c', background: 'rgba(255,0,60,0.08)',
            border: '1px solid rgba(255,0,60,0.2)', borderRadius: '8px', padding: '10px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          padding: '14px', borderRadius: '10px',
          background: loading ? 'rgba(255,0,60,0.2)' : 'linear-gradient(135deg, #ff003c, #ff4d6d)',
          border: 'none', color: 'white', fontWeight: 800, fontSize: '14px',
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.5px',
          transition: 'all 0.2s',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(255,0,60,0.3)',
        }}>
          {loading
            ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Registering Target...</>
            : <><UserPlus size={16} /> Register Target in Database</>
          }
        </button>
      </form>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '10px', color: '#7a7a9a',
  textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px', fontWeight: 600,
}

const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', color: '#e0e0ff', fontSize: '13px',
  outline: 'none', fontFamily: 'Inter, sans-serif',
  boxSizing: 'border-box',
}
