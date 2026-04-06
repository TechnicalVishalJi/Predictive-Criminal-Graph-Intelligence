import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Cpu } from 'lucide-react'
import axios from 'axios'

const FLASK_API = 'http://127.0.0.1:5000'

const STARTER_MESSAGES = [
  { role: 'ai', text: 'NEXUS AI online. I have full access to the criminal graph data. Ask me anything.' }
]

export default function AICopilot({ onHighlight }) {
  const [messages, setMessages] = useState(STARTER_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)

    try {
      const res = await axios.post(`${FLASK_API}/api/chat`, { message: text })
      const aiResponse = res.data.response || 'No response received.'
      const highlightIds = res.data.highlight_nodes || []
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }])
      if (highlightIds.length > 0) onHighlight(highlightIds)
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '⚠️ Backend AI offline. Connect Flask server at port 5000 to enable intelligence analysis.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <aside className="glass-panel side-panel right" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #00f0ff22, #00f0ff44)',
            border: '1px solid var(--neon-cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cpu size={18} style={{ color: 'var(--neon-cyan)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>AI Co-Pilot</div>
            <div style={{ fontSize: '11px', color: 'var(--neon-cyan)' }}>● GROQ ONLINE</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-container">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}
            style={msg.role === 'user' ? {
              background: 'rgba(255,255,255,0.05)',
              borderLeft: '2px solid rgba(255,255,255,0.2)',
            } : {}}
          >
            {msg.role === 'ai' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--neon-cyan)', fontSize: '11px', fontWeight: 700 }}>
                <Bot size={12} /> NEXUS AI
              </div>
            )}
            <span style={{ fontSize: '13px', lineHeight: 1.6 }}>{msg.text}</span>
          </div>
        ))}

        {loading && (
          <div className="chat-message ai">
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'var(--neon-cyan)',
                  animation: `pulsing 1.2s ${delay}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask about the network..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button onClick={sendMessage} disabled={loading}>
          <Send size={16} />
        </button>
      </div>

      {/* Hints */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {['Who is highest risk?', 'Find all syndicates', 'Map financial flows'].map(hint => (
          <button key={hint} onClick={() => setInput(hint)} style={{
            background: 'rgba(0,240,255,0.05)',
            border: '1px solid rgba(0,240,255,0.15)',
            borderRadius: '20px', padding: '4px 10px',
            color: 'var(--text-muted)', fontSize: '11px',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--neon-cyan)'; e.target.style.color = 'var(--neon-cyan)' }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(0,240,255,0.15)'; e.target.style.color = 'var(--text-muted)' }}
          >
            {hint}
          </button>
        ))}
      </div>
    </aside>
  )
}
