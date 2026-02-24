'use client'

import React, { useState, useEffect, useRef } from 'react'
import { UserState } from '@/types'

interface Message {
  role: 'user' | 'ai'
  text: string
}

export const AICoach: React.FC<{ userState: UserState }> = ({ userState }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initAI = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userState }),
        })
        const data = await res.json()
        setMessages([
          {
            role: 'ai',
            text: data.text || 'مرحباً! كيف يمكنني مساعدتك في رحلة تطورك اليوم؟',
          },
        ])
      } catch {
        setMessages([{ role: 'ai', text: 'عذراً، حدث خطأ في الاتصال بالمدرب الذكي.' }])
      } finally {
        setLoading(false)
      }
    }
    initAI()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userState, prompt: userMsg }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: data.text || 'لم أتمكن من فهم ذلك.' },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'حدث خطأ ما، يرجى المحاولة لاحقاً.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border overflow-hidden">
      <div className="bg-indigo-600 p-6 text-white flex items-center gap-3">
        <span className="text-3xl">🤖</span>
        <div>
          <h2 className="text-xl font-bold">المدرب الذكي</h2>
          <p className="text-xs text-indigo-100 opacity-80">تحليل، محاسبة، وتشجيع مستمر</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 shadow-sm border rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اسأل مدربك الذكي عن تقدمك..."
          className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
        >
          إرسال
        </button>
      </form>
    </div>
  )
}
