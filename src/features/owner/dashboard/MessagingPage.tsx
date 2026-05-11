// ============================================================================
// MessagingPage — In-app messaging for platform owner → restaurant owners
// ============================================================================
import { useState, useEffect, useMemo, useRef } from 'react'
import {
  MessageSquare,
  Send,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Check,
  Clock,
  ChevronRight,
  Filter,
  Users,
  AlertCircle,
  Flag,
  X,
  Paperclip,
  ChevronDown,
} from 'lucide-react'
import {
  getMessageThreads,
  getThreadMessages,
  sendMessage,
  createThread,
  markThreadAsRead,
  getRestaurantsExtended,
} from '../../../shared/api/owner'
import type { Message, MessageThread } from '../../../types'
import type { RestaurantExtended } from '../../../shared/api/owner'

const URGENCY_COLORS: Record<string, string> = {
  normal: 'bg-text-muted/20 text-text-muted',
  urgent: 'bg-warning/15 text-warning',
  critical: 'bg-danger/15 text-danger',
}

const QUICK_REPLIES = [
  'Your commission rate has been updated to X%',
  'We noticed an issue with your orders — can you check?',
  'Your restaurant tier has been upgraded/downgraded',
  'Please review and update your menu items',
  'Your restaurant is doing great — keep it up!',
  'We need to discuss your recent performance metrics',
]

interface ThreadWithMeta {
  id: string
  restaurant_id?: string
  subject?: string
  restaurant_name?: string
  last_message?: string
  last_message_at?: string
  unread_count: number
}

export default function MessagingPage() {
  const [threads, setThreads] = useState<ThreadWithMeta[]>([])
  const [restaurants, setRestaurants] = useState<RestaurantExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [composeText, setComposeText] = useState('')
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'critical'>('normal')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newRecipientId, setNewRecipientId] = useState('')
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterHealth, setFilterHealth] = useState<string>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedThreadId) {
      markThreadAsRead(selectedThreadId)
      loadMessages(selectedThreadId)
    }
  }, [selectedThreadId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [threadsData, restaurantsData] = await Promise.all([
        getMessageThreads(),
        getRestaurantsExtended(),
      ])
      setThreads(threadsData)
      setRestaurants(restaurantsData)
      if (threadsData.length > 0 && !selectedThreadId) {
        setSelectedThreadId(threadsData[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(threadId: string) {
    setMessagesLoading(true)
    try {
      const data = await getThreadMessages(threadId)
      setMessages(data)
    } catch {
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  const filteredThreads = useMemo(() => {
    let list = [...threads]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (t) =>
          (t.restaurant_name || '').toLowerCase().includes(q) ||
          (t.subject || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [threads, searchQuery])

  const selectedThread = threads.find((t) => t.id === selectedThreadId)

  async function handleSend() {
    if (!composeText.trim() || !selectedThreadId) return
    setSending(true)
    const success = await sendMessage(
      selectedThreadId,
      composeText.trim(),
      urgency,
      selectedThread?.restaurant_id
    )
    setSending(false)
    if (success) {
      setComposeText('')
      setUrgency('normal')
      await loadMessages(selectedThreadId)
      await loadData()
    }
  }

  async function handleCreateThread() {
    if (!newRecipientId || !newSubject.trim()) return
    const threadId = await createThread(newRecipientId, newSubject.trim())
    if (threadId) {
      setShowCompose(false)
      setNewRecipientId('')
      setNewSubject('')
      await loadData()
      setSelectedThreadId(threadId)
    }
  }

  function handleQuickReply(reply: string) {
    setComposeText(reply)
    setShowQuickReplies(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const filteredRestaurantsForCompose = useMemo(() => {
    let list = [...restaurants]
    if (filterTier !== 'all') list = list.filter((r) => r.tier === filterTier)
    if (filterHealth !== 'all') list = list.filter((r) => r.health_status === filterHealth)
    return list
  }, [restaurants, filterTier, filterHealth])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <span className="text-sm">Loading messages...</span>
        </div>
      </div>
    )
  }

  if (error && threads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-danger" />
          <div>
            <h3 className="text-lg font-semibold text-text mb-1">Failed to Load</h3>
            <p className="text-sm text-text-secondary">{error}</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition text-sm">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-3.5rem)]">
      <div className="flex h-full gap-4">
        {/* Thread List */}
        <div className="w-72 lg:w-80 shrink-0 bg-surface-alt border border-border rounded-xl flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-border space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Messages</h2>
              <button
                onClick={() => setShowCompose(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search threads..."
                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text placeholder-text-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              />
            </div>
          </div>

          {/* Threads */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-sm">
                {searchQuery ? 'No threads match' : 'No messages yet'}
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`
                    w-full text-left px-3 py-3 transition hover:bg-surface-hover
                    ${selectedThreadId === thread.id ? 'bg-brand-600/15 ring-1 ring-brand-500/30' : 'ring-0'}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text truncate">
                          {thread.restaurant_name || 'Unknown'}
                        </span>
                        {thread.unread_count > 0 && (
                          <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                            {thread.unread_count}
                          </span>
                        )}
                      </div>
                      {thread.subject && (
                        <div className="text-[11px] text-text-secondary truncate mt-0.5">
                          {thread.subject}
                        </div>
                      )}
                      {thread.last_message && (
                        <div className="text-[10px] text-text-muted truncate mt-1">
                          {thread.last_message}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-[9px] text-text-muted whitespace-nowrap">
                      {thread.last_message_at
                        ? new Date(thread.last_message_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })
                        : ''}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="px-3 py-2 border-t border-border text-[10px] text-text-muted">
            {threads.length} conversations
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col bg-surface-alt border border-border rounded-xl min-w-0">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <div>
                  <h3 className="text-sm font-semibold text-text">{selectedThread.restaurant_name || 'Conversation'}</h3>
                  {selectedThread.subject && (
                    <p className="text-[11px] text-text-secondary">{selectedThread.subject}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted">
                    {messages.length} messages
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-text-muted text-sm">
                    No messages in this thread. Start the conversation.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwner = msg.sender_role === 'owner'
                    const time = new Date(msg.created_at).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    const date = new Date(msg.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })

                    return (
                      <div key={msg.id} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isOwner
                              ? 'bg-brand-600 text-white rounded-br-md'
                              : 'bg-surface border border-border rounded-bl-md'
                          }`}
                        >
                          {msg.urgency !== 'normal' && (
                            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium mb-1 ${
                              URGENCY_COLORS[msg.urgency]
                            } ${isOwner ? 'bg-white/10 text-white/80' : ''}`}>
                              {msg.urgency === 'urgent' ? <Clock className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                              {msg.urgency}
                            </div>
                          )}
                          <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                          <div className={`flex items-center gap-2 mt-1 ${
                            isOwner ? 'text-white/60' : 'text-text-muted'
                          }`}>
                            <span className="text-[10px]">{time}</span>
                            <span className="text-[10px]">•</span>
                            <span className="text-[10px]">{date}</span>
                            {isOwner && (
                              <span className="text-[10px]">
                                {msg.read_at ? '✓✓ Read' : '✓ Sent'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose */}
              <div className="border-t border-border p-3 shrink-0">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    {showQuickReplies && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-10">
                        <div className="px-3 py-2 text-[10px] text-text-muted font-medium border-b border-border">
                          Quick Replies
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {QUICK_REPLIES.map((reply, i) => (
                            <button
                              key={i}
                              onClick={() => handleQuickReply(reply)}
                              className="w-full text-left px-3 py-2 text-xs text-text hover:bg-surface-hover transition border-b border-border/50 last:border-b-0"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <textarea
                      ref={inputRef}
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                      rows={2}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text placeholder-text-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-500/40 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <button
                        onClick={() => setShowQuickReplies(!showQuickReplies)}
                        className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition"
                        title="Quick Replies"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="bg-surface border border-border rounded-lg px-2 py-2 text-[10px] text-text focus:outline-none"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="critical">Critical</option>
                    </select>
                    <button
                      onClick={handleSend}
                      disabled={sending || !composeText.trim()}
                      className="flex items-center justify-center p-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg transition"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-muted">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a conversation or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose New Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-xl bg-surface-alt border border-border rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                New Message
              </h3>
              <button onClick={() => setShowCompose(false)} className="text-text-muted hover:text-text transition p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none"
                >
                  <option value="all">All Tiers</option>
                  <option value="basic">Basic</option>
                  <option value="growth">Growth</option>
                  <option value="strategic">Strategic</option>
                </select>
                <select
                  value={filterHealth}
                  onChange={(e) => setFilterHealth(e.target.value)}
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none"
                >
                  <option value="all">All Health</option>
                  <option value="healthy">Healthy</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Recipient</label>
                <select
                  value={newRecipientId}
                  onChange={(e) => setNewRecipientId(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none"
                >
                  <option value="">Select a restaurant...</option>
                  {filteredRestaurantsForCompose.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.tier}, {r.health_status})
                    </option>
                  ))}
                </select>
                {filteredRestaurantsForCompose.length === 0 && (
                  <div className="text-xs text-text-muted mt-1">No restaurants match the selected filters</div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Message subject..."
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateThread}
                  disabled={!newRecipientId || !newSubject.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
                >
                  <Send className="w-4 h-4" />
                  Create Thread
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
