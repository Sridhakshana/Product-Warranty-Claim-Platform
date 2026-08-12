import { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'

const QUICK_QUESTIONS = [
  'How do I check my warranty?',
  'How to submit a claim?',
  'How do I track my claim?',
  'How do I upload my invoice?',
  'What is a QR code used for?',
]

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! 👋 I am your warranty assistant. How can I help you today?' },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [messages, typing, open])

  const send = async (text) => {
    const message = (text || input).trim()
    if (!message || typing) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: message }])
    setTyping(true)
    try {
      const res = await api.ask(message)
      setMessages((m) => [...m, { role: 'bot', text: res.reply }])
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Sorry, I could not reach the server. Please try again.' }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <>
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>🤖 Warranty Assistant</span>
            <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18 }} onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === 'user' ? 'chat-user' : 'chat-bot'}`}>
                {m.text}
              </div>
            ))}
            {typing && <div className="chat-msg chat-bot">Typing…</div>}
            {messages.length <= 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {QUICK_QUESTIONS.map((q) => (
                  <button key={q} className="btn btn-sm btn-outline" onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
          <form
            className="chatbot-input"
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about warranty, claims, invoices…"
            />
            <button type="submit" className="btn btn-primary btn-sm">Send</button>
          </form>
        </div>
      )}
      <button className="chatbot-fab" onClick={() => setOpen(!open)} title="Support Chatbot">
        {open ? '✕' : '💬'}
      </button>
    </>
  )
}
