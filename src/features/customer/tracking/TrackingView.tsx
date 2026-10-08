import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Loader2, AlertCircle, ChevronLeft, Clock, Hash, KeyRound,
  CheckCircle2, Home, MapPin, ShoppingBag, PackageOpen, ChefHat, Bike, ThumbsUp, Receipt
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Order, OrderStatus } from '../../../types'

type RealtimeChannel = { unsubscribe: () => void }

const STATUS_ORDER: OrderStatus[] = ['new', 'in_progress', 'ready', 'picking_up', 'delivered']

const STATUS_META: Record<OrderStatus, { color: string; bg: string; border: string; icon: any }> = {
  new: { color: 'text-fp-blue', bg: 'bg-fp-blue/10', border: 'border-fp-blue', icon: ShoppingBag },
  in_progress: { color: 'text-fp-green', bg: 'bg-fp-green/10', border: 'border-fp-green', icon: ChefHat },
  ready: { color: 'text-fp-red', bg: 'bg-fp-red/10', border: 'border-fp-red', icon: PackageOpen },
  picking_up: { color: 'text-fp-yellow', bg: 'bg-fp-yellow/10', border: 'border-fp-yellow', icon: Bike },
  delivered: { color: 'text-success', bg: 'bg-success/10', border: 'border-success', icon: CheckCircle2 },
  paid: { color: 'text-success', bg: 'bg-success/10', border: 'border-success', icon: Receipt },
  cancelled: { color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger', icon: AlertCircle },
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Order Received', in_progress: 'Preparing', ready: 'Ready for Pickup',
  picking_up: 'On Its Way', delivered: 'Delivered', paid: 'Paid', cancelled: 'Cancelled',
}

function StatusTimeline({ currentIdx }: { currentIdx: number; status: OrderStatus }) {
  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-0 right-0 top-4 h-[3px] bg-border rounded-full" />
      <div className="absolute left-0 top-4 h-[3px] bg-brand-500 rounded-full transition-all duration-700"
        style={{ width: `${Math.min((currentIdx / (STATUS_ORDER.length - 1)) * 100, 100)}%` }} />

      <div className="relative flex justify-between">
        {STATUS_ORDER.map((s, idx) => {
          const isPast = idx < currentIdx
          const isActive = idx === currentIdx
          const meta = STATUS_META[s]
          const Icon = meta.icon
          return (
            <div key={s} className="flex flex-col items-center gap-1.5 min-w-0">
              <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                isPast ? 'bg-brand-500 border-brand-500 text-white shadow-md' :
                isActive ? `bg-surface ${meta.border} border-2 ${meta.color} ring-4 ring-brand-500/15 scale-110 shadow-md` :
                'bg-surface-alt border-border text-text-muted'
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className={`text-[10px] font-semibold text-center leading-tight max-w-[60px] ${
                isPast || isActive ? 'text-text' : 'text-text-muted'
              }`}>{STATUS_LABELS[s]}</p>
              {isActive && (
                <span className="text-[9px] text-brand-500 font-medium animate-pulse-dot whitespace-nowrap">In progress</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TrackingView() {
  const { orderId } = useParams<{ orderId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!orderId) { setError('No order ID provided.'); setLoading(false); return }
    const fetchAndSubscribe = async () => {
      try {
        const { data, error: fetchErr } = await supabase.from('orders').select('*, items:order_items(*)').eq('id', orderId).single()
        if (fetchErr) throw fetchErr
        if (!data) throw new Error('Order not found')
        const orderData = data as unknown as Order
        setOrder(orderData)
        setElapsed(Math.floor((Date.now() - new Date(orderData.created_at).getTime()) / 60000))
        const channelName = `order-${orderId}-${Date.now()}`
        const channel = supabase.channel(channelName)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
            const updated = payload.new as Order; setOrder((prev) => (prev ? { ...prev, ...updated } : updated))
          }).subscribe()
        channelRef.current = channel
      } catch (err: any) { setError(err.message || 'Failed to load order') } finally { setLoading(false) }
    }
    fetchAndSubscribe()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [orderId])

  useEffect(() => {
    const interval = setInterval(() => { if (order?.created_at) setElapsed(Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)) }, 30000)
    return () => clearInterval(interval)
  }, [order?.created_at])

  const currentStatus = order?.status || 'new'
  const currentIdx = STATUS_ORDER.indexOf(currentStatus as OrderStatus)
  const isDelivered = currentStatus === 'delivered' || currentStatus === 'paid'
  const isPaid = currentStatus === 'paid' || order?.payment_status === 'paid'
  const isCancelled = currentStatus === 'cancelled'
  const orderNumber = orderId ? orderId.slice(0, 8).toUpperCase() : ''
  const statusMeta = STATUS_META[currentStatus as OrderStatus] || STATUS_META.new

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
      <p className="text-text-secondary text-sm">{t('loading')}</p>
    </div>
  )
  if (error || !order) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt">
      <AlertCircle className="w-10 h-10 text-danger mb-4" />
      <h2 className="text-lg font-bold text-text mb-1">{t('error')}</h2>
      <p className="text-text-secondary text-sm text-center mb-6">{error || 'Order not found'}</p>
      <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-brand-500 text-white rounded-full font-semibold text-sm hover:bg-brand-600 transition-colors shadow-md">Go Home</button>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-surface-alt pb-[72px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-alt/90 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-surface-hover rounded-xl active:scale-95 transition-colors"><ChevronLeft className="w-5 h-5 text-text" /></button>
          <h1 className="flex-1 text-lg font-bold text-center mr-6">{t('order.tracking')}</h1>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 overflow-y-auto">
        {/* Order header card */}
        <div className="flex items-center justify-between mb-5 bg-surface rounded-2xl p-4 border border-border shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4 text-text-muted" />
              <span className="text-xl font-bold tracking-wider text-text">#{orderNumber}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {elapsed < 1 ? 'Just now' : `${elapsed}m ago`}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.order_type === 'dine_in' ? 'Dine In' : order.order_type === 'to_go' ? 'To Go' : 'Delivery'}</span>
            </div>
          </div>
          {/* Status badge */}
          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${statusMeta.bg} ${statusMeta.border} border ${statusMeta.color} shadow-sm`}>
            {STATUS_LABELS[currentStatus]}
          </div>
        </div>

        {/* Pickup PIN */}
        {order.order_type === 'to_go' && order.pickup_verification_pin && (
          <div className="flex items-center gap-3 px-4 py-3 mb-5 bg-brand-500/10 border border-brand-500/20 rounded-2xl shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-brand-500/15 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <p className="text-[11px] text-brand-600 font-bold uppercase tracking-wider">Pickup PIN</p>
              <p className="text-lg font-bold text-brand-700 font-mono tracking-widest">{order.pickup_verification_pin}</p>
            </div>
          </div>
        )}

        {/* Cancelled */}
        {isCancelled && (
          <div className="flex items-center gap-2 p-4 mb-5 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-sm font-bold shadow-sm">
            <AlertCircle className="w-5 h-5" /> This order has been cancelled.
          </div>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <div className="mb-6 bg-surface rounded-2xl p-5 border border-border shadow-sm">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Status</h3>
            <StatusTimeline currentIdx={currentIdx} status={currentStatus} />
          </div>
        )}

        {/* Delivered */}
        {isDelivered && (
          <div className="text-center mb-6 bg-success/5 rounded-2xl p-6 border border-success/20 shadow-sm animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-text mb-1">Order Delivered!</h2>
            <p className="text-text-secondary text-sm mb-6">Enjoy your meal! How was everything?</p>
            <div className="flex flex-col gap-2">
              {!isPaid && (
                <button onClick={() => navigate(`/bill/${orderId}`)} className="w-full px-6 py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm hover:bg-brand-600 active:scale-95 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2">
                  <Receipt className="w-4 h-4" /> Request Bill & Pay
                </button>
              )}
              <button onClick={() => navigate(`/feedback/${orderId}`)} className="w-full px-6 py-3 bg-surface border border-border rounded-2xl font-bold text-sm text-text-secondary hover:bg-surface-hover transition-colors flex items-center justify-center gap-2">
                <ThumbsUp className="w-4 h-4" /> Leave Feedback
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        <section className="mb-6">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Items</h3>
          <div className="bg-surface rounded-2xl border border-border shadow-sm divide-y divide-border-light overflow-hidden">
            {(order.items || []).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-surface-alt border border-border flex items-center justify-center text-xs font-bold text-text-secondary">{item.quantity}</span>
                  <div>
                    <p className="text-sm font-semibold text-text">{item.name}</p>
                    {item.seat_number && <p className="text-[11px] text-text-muted">Seat {item.seat_number}</p>}
                  </div>
                </div>
                <span className="text-sm font-bold text-text">${(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Estimated time */}
        {!isDelivered && !isCancelled && (
          <div className="flex items-center justify-center gap-2 p-4 bg-surface rounded-2xl border border-border shadow-sm mb-6">
            <Clock className="w-5 h-5 text-brand-500" />
            <span className="text-sm text-text-secondary font-medium">Estimated 15-25 min</span>
          </div>
        )}

        {/* Home */}
        <div className="flex items-center justify-center gap-3 pb-8">
          {isDelivered && !isPaid && (
            <button onClick={() => navigate(`/bill/${orderId}`)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-2xl text-sm font-bold hover:bg-brand-600 active:scale-95 transition-all shadow-md shadow-brand-500/20">
              <Receipt className="w-4 h-4" /> View Bill & Pay
            </button>
          )}
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-2xl text-sm font-bold text-text-secondary hover:bg-surface-hover transition-colors shadow-sm">
            <Home className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
