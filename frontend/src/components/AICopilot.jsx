import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Cpu } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import axios from 'axios'

const FLASK_API = 'http://127.0.0.1:5000'

const STARTER_MESSAGES = [
  { role: 'ai', text: 'NEXUS AI online. I have full access to the criminal graph data.\n\nYou can ask me things like:\n- **Who is the highest risk suspect?**\n- **Map financial flows between suspects**\n- **Identify kingpins in the network**' }
]

// Markdown component styles injected inline to avoid CSS conflicts
const markdownStyles = {
  p: { margin: '0 0 8px 0', lineHeight: 1.6 },
  ul: { margin: '6px 0', paddingLeft: '18px' },
  ol: { margin: '6px 0', paddingLeft: '18px' },
  li: { margin: '3px 0', lineHeight: 1.5 },
  strong: { color: '#e0e0ff', fontWeight: 700 },
  em: { color: '#a0a0cc', fontStyle: 'italic' },
  h1: { fontSize: '16px', fontWeight: 800, margin: '10px 0 6px 0', color: '#fff' },
  h2: { fontSize: '14px', fontWeight: 700, margin: '8px 0 4px 0', color: '#e0e0ff' },
  h3: { fontSize: '13px', fontWeight: 700, margin: '6px 0 4px 0', color: '#c0c0e0' },
  code: {
    background: 'rgba(0,240,255,0.08)',
    border: '1px solid rgba(0,240,255,0.15)',
    borderRadius: '4px',
    padding: '1px 6px',
    fontSize: '12px',
    color: '#00f0ff',
    fontFamily: 'monospace',
  },
  pre: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '12px',
    margin: '8px 0',
    overflow: 'auto',
    fontSize: '12px',
  },
  blockquote: {
    borderLeft: '3px solid var(--neon-cyan)',
    paddingLeft: '12px',
    margin: '8px 0',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
}

function MarkdownMessage({ text }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p style={markdownStyles.p}>{children}</p>,
        ul: ({ children }) => <ul style={markdownStyles.ul}>{children}</ul>,
        ol: ({ children }) => <ol style={markdownStyles.ol}>{children}</ol>,
        li: ({ children }) => <li style={markdownStyles.li}>{children}</li>,
        strong: ({ children }) => <strong style={markdownStyles.strong}>{children}</strong>,
        em: ({ children }) => <em style={markdownStyles.em}>{children}</em>,
        h1: ({ children }) => <h1 style={markdownStyles.h1}>{children}</h1>,
        h2: ({ children }) => <h2 style={markdownStyles.h2}>{children}</h2>,
        h3: ({ children }) => <h3 style={markdownStyles.h3}>{children}</h3>,
        code: ({ inline, children }) =>
          inline
            ? <code style={markdownStyles.code}>{children}</code>
            : <pre style={markdownStyles.pre}><code style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{children}</code></pre>,
        blockquote: ({ children }) => <blockquote style={markdownStyles.blockquote}>{children}</blockquote>,
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '10px 0' }} />,
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

export default function AICopilot({ onHighlight }) {
  const [messages, setMessages] = useState(STARTER_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const query = (text || input).trim()
    if (!query || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: query }])
    setLoading(true)

    try {
      const res = await axios.post(`${FLASK_API}/api/chat`, { message: query })
      const aiResponse = res.data.response || 'No response received.'
      const highlightIds = res.data.highlight_nodes || []
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }])
      if (highlightIds.length > 0) onHighlight(highlightIds)
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '⚠️ **Backend AI offline.**\n\nMake sure Flask server is running on port 5000:\n```\npython app.py\n```'
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
            background: 'linear-gradient(135deg, rgba(0,240,255,0.1), rgba(0,240,255,0.25))',
            border: '1px solid var(--neon-cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cpu size={18} style={{ color: 'var(--neon-cyan)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>AI Co-Pilot</div>
            <div style={{ fontSize: '11px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)', display: 'inline-block' }} />
              GROQ LLAMA-3.3-70B
            </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--neon-cyan)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                <Bot size={11} /> NEXUS AI
              </div>
            )}
            <div style={{ fontSize: '13px' }}>
              {msg.role === 'ai'
                ? <MarkdownMessage text={msg.text} />
                : msg.text
              }
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message ai">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: 'var(--neon-cyan)',
                    animation: `pulsing 1.2s ${delay}s infinite`,
                  }} />
                ))}
              </div>
              Analyzing criminal network...
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
        <button onClick={() => sendMessage()} disabled={loading} style={{ opacity: loading ? 0.5 : 1 }}>
          <Send size={16} />
        </button>
      </div>

      {/* Quick Hint Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {['Who is highest risk?', 'Find all syndicates', 'Map financial flows'].map(hint => (
          <button key={hint} onClick={() => sendMessage(hint)} style={{
            background: 'rgba(0,240,255,0.05)',
            border: '1px solid rgba(0,240,255,0.15)',
            borderRadius: '20px', padding: '4px 10px',
            color: 'var(--text-muted)', fontSize: '11px',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--neon-cyan)'; e.currentTarget.style.color = 'var(--neon-cyan)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,240,255,0.15)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            {hint}
          </button>
        ))}
      </div>
    </aside>
  )
}
