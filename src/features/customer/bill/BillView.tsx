import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, Wallet, CreditCard, Banknote, DollarSign, Smartphone,
  Loader2, AlertCircle, CheckCircle2, Hash, Percent,
  Receipt, User, MapPin, Clock
} from 'lucide-react'
import { getOrder, processPayment } from '../../../shared/api/orders'
import type { Order, PaymentMethod } from '../../../types'

export default function BillView() {
  const { orderId } = useParams<{ orderId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [tipPercent, setTipPercent] = useState<number>(0)
  const [customTip, setCustomTip] = useState('')
  const [cashGiven, setCashGiven] = useState('')
  const [processing, setProcessing] = useState(false)
  const [paid, setPaid] = useState(false)

  useEffect(() => {
    if (!orderId) { setError('No order ID provided.'); setLoading(false); return }
    const fetchOrder = async () => {
      try {
        const data = await getOrder(orderId)
        if (!data) throw new Error('Order not found')
        setOrder(data)
        if (data.payment_status === 'paid' || data.status === 'paid') {
          setPaid(true)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load bill')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
      <p className="text-text-secondary text-sm">{t('loading')}</p>
    </div>
  )

  if (error || !order) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
      <AlertCircle className="w-10 h-10 text-danger mb-4" />
      <h2 className="text-lg font-bold text-text mb-1">{t('error')}</h2>
      <p className="text-text-secondary text-sm text-center mb-6">{error || 'Order not found'}</p>
      <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors">Go Home</button>
    </div>
  )

  if (paid) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4 animate-scale-in">
        <CheckCircle2 className="w-8 h-8 text-success" />
      </div>
      <h2 className="text-xl font-bold text-text mb-1">Payment Complete!</h2>
      <p className="text-text-muted text-sm text-center mb-2">Thank you for dining with us.</p>
      <div className="flex items-center gap-1.5 mb-6">
        <Hash className="w-4 h-4 text-text-muted" />
        <span className="font-mono text-brand-600 font-bold">#{orderId?.slice(0, 8).toUpperCase()}</span>
      </div>
      <button onClick={() => navigate(`/feedback/${orderId}`)} className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-all mb-2">
        Leave Feedback
      </button>
      <button onClick={() => navigate('/')} className="px-6 py-2.5 text-text-secondary text-sm hover:underline">
        Back to Home
      </button>
    </div>
  )

  const subtotal = order.subtotal
  const tipAmount = tipPercent > 0 ? subtotal * (tipPercent / 100) : customTip ? parseFloat(customTip) || 0 : 0
  const total = subtotal + tipAmount
  const cashValue = parseFloat(cashGiven) || 0
  const changeDue = paymentMethod === 'cash' && cashValue > 0 ? Math.max(0, cashValue - total) : 0

  const payMethods: { method: PaymentMethod; icon: any; label: string; hint: string }[] = [
    { method: 'card', icon: CreditCard, label: t('checkout.card'), hint: 'Credit / Debit' },
    { method: 'phone', icon: Smartphone, label: t('checkout.phone'), hint: 'Apple Pay / Google Pay' },
    { method: 'cash', icon: Banknote, label: t('checkout.cash'), hint: 'Pay at table' },
  ]

  const handlePay = async () => {
    if (paymentMethod === 'cash' && cashValue > 0 && cashValue < total) {
      setError(`Cash given ($${cashValue.toFixed(2)}) is less than total ($${total.toFixed(2)}).`)
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const result = await processPayment({
        order_id: orderId!,
        restaurant_id: order.restaurant_id,
        method: paymentMethod,
        amount: total,
        subtotal,
        tip: tipAmount,
        cash_given: paymentMethod === 'cash' ? cashValue || total : undefined,
        change_due: paymentMethod === 'cash' ? changeDue : undefined,
      })
      if (!result.ok) throw new Error(result.error || 'Payment failed')
      setPaid(true)
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const itemCount = (order.items || []).reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="flex-1 flex flex-col bg-surface">
      <div className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-hover rounded-xl"><ChevronLeft className="w-5 h-5 text-text" /></button>
          <h1 className="flex-1 text-base font-bold text-center mr-6">Your Bill</h1>
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 pb-4 overflow-y-auto space-y-5">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
          </div>
        )}

        <section className="bg-surface-alt rounded-2xl border-2 border-border overflow-hidden">
          <div className="px-4 py-4 border-b border-border text-center">
            <Receipt className="w-6 h-6 text-brand-500 mx-auto mb-1" />
            <h2 className="text-sm font-bold text-text">
              {order.table_id ? `Table #${order.table_id.slice(0, 8).toUpperCase()}` : 'Your Order'}
            </h2>
            <div className="flex items-center justify-center gap-3 mt-1 text-[11px] text-text-muted">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {order.customer_name || 'Guest'}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.order_type === 'dine_in' ? 'Dine In' : order.order_type}</span>
            </div>
          </div>

          <div className="divide-y divide-border-light">
            {(order.items || []).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-surface border border-border flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">{item.quantity}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">{item.name}</p>
                    {item.seat_number && <p className="text-[11px] text-text-muted">Seat {item.seat_number}</p>}
                    {item.notes && <p className="text-[10px] text-text-muted italic">"{item.notes}"</p>}
                  </div>
                </div>
                <span className="text-sm font-semibold text-text shrink-0 ml-2">${(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-border space-y-1.5">
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Subtotal ({itemCount} items)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Tip ({tipPercent > 0 ? `${tipPercent}%` : 'Custom'})</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-text pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-brand-600 text-lg">${total.toFixed(2)}</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5" /> Add a Tip
          </h2>
          <div className="flex gap-2 mb-3">
            {[0, 10, 15, 18, 20, 25].map((pct) => (
              <button key={pct} onClick={() => { setTipPercent(pct); setCustomTip('') }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${tipPercent === pct && !customTip ? 'border-brand-500 bg-brand-500/10 text-brand-600' : 'border-border bg-surface-alt text-text-secondary hover:bg-surface-hover'}`}>
                {pct === 0 ? 'No tip' : `${pct}%`}
              </button>
            ))}
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="number" min="0" step="0.5" value={customTip} onChange={(e) => { setCustomTip(e.target.value); setTipPercent(0) }}
              placeholder="Custom amount" className="w-full pl-9 pr-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text" />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">Payment Method</h2>
          <div className="grid grid-cols-3 gap-2">
            {payMethods.map(({ method, icon: Icon, label, hint }) => (
              <button key={method} onClick={() => setPaymentMethod(method)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold border-2 transition-all ${paymentMethod === method ? 'border-brand-500 bg-brand-500/10 text-brand-600' : 'border-border bg-surface-alt text-text-secondary hover:bg-surface-hover'}`}>
                <Icon className="w-5 h-5" />
                <span>{label}</span>
                <span className="text-[9px] font-normal opacity-70">{hint}</span>
              </button>
            ))}
          </div>
        </section>

        {paymentMethod === 'cash' && (
          <section className="animate-fade-in">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">Cash Given</h2>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="number"
                min="0"
                step="0.5"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                placeholder={`Amount tendered (total $${total.toFixed(2)})`}
                className="w-full pl-9 pr-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text"
              />
            </div>
            {cashValue >= total && cashValue > 0 && (
              <p className="text-sm text-success mt-2 font-medium">Change due: ${changeDue.toFixed(2)}</p>
            )}
          </section>
        )}

        {paymentMethod === 'phone' && (
          <section className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-3 flex items-start gap-2 text-sm text-text-secondary">
            <Wallet className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
            <span>Use Apple Pay, Google Pay, or any wallet already installed on your phone when the terminal prompts.</span>
          </section>
        )}
      </div>

      <div className="sticky bottom-0 bg-surface border-t border-border/50 px-4 py-3 safe-bottom">
        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full flex items-center justify-center gap-2 py-4 bg-brand-500 text-white rounded-xl font-bold text-base shadow-lg hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {processing ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing payment...</>
          ) : (
            <>Pay ${total.toFixed(2)} with {payMethods.find(p => p.method === paymentMethod)?.label}</>
          )}
        </button>
      </div>
    </div>
  )
}
