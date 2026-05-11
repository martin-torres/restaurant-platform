import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Star, ChevronLeft, Loader2, AlertCircle, Send, CheckCircle2, MessageSquare, Heart, ThumbsUp, Sparkles
} from 'lucide-react'
import { supabase, getRestaurantIdFromUrl } from '../../../lib/supabase'
import type { Order } from '../../../types'

export default function FeedbackView() {
  const { orderId } = useParams<{ orderId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!orderId) { setError('No order ID provided.'); setLoading(false); return }
    const fetchOrder = async () => {
      try {
        const { data, error: fetchErr } = await supabase.from('orders').select('*').eq('id', orderId).single()
        if (fetchErr) throw fetchErr
        if (!data) throw new Error('Order not found')
        setOrder(data as Order)
      } catch (err: any) { setError(err.message || 'Failed to load order') } finally { setLoading(false) }
    }
    fetchOrder()
  }, [orderId])

  const handleSubmit = async () => {
    if (rating === 0) return
    const restaurantId = order?.restaurant_id || getRestaurantIdFromUrl()
    if (!restaurantId) { setError('Could not determine restaurant.'); return }
    setSubmitting(true); setError(null)
    try {
      const { error: submitErr } = await supabase.from('visit_feedback').insert({ restaurant_id: restaurantId, order_id: orderId || null, rating, comment: comment || null })
      if (submitErr) throw submitErr
      setSubmitted(true)
    } catch (err: any) { setError(err.message || 'Failed to submit feedback') } finally { setSubmitting(false) }
  }

  const starLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
      <p className="text-text-secondary text-sm">{t('loading')}</p>
    </div>
  )
  if (error && !order) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt">
      <AlertCircle className="w-10 h-10 text-danger mb-4" />
      <h2 className="text-lg font-bold text-text mb-1">{t('error')}</h2>
      <p className="text-text-secondary text-sm text-center mb-6">{error}</p>
      <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-brand-500 text-white rounded-full font-semibold text-sm hover:bg-brand-600 transition-colors shadow-md">Go Home</button>
    </div>
  )

  if (submitted) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt">
      <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6 animate-scale-in">
        <Heart className="w-12 h-12 text-success" />
      </div>
      <h2 className="text-2xl font-bold text-text mb-1">Thank You!</h2>
      <p className="text-text-secondary text-sm text-center mb-1">Your feedback helps us improve.</p>
      <p className="text-text-muted text-xs text-center mb-8">We hope you enjoyed your visit!</p>
      <button onClick={() => navigate('/')} className="px-8 py-3 bg-brand-500 text-white rounded-full font-bold text-sm hover:bg-brand-600 active:scale-95 transition-all shadow-lg shadow-brand-500/20">Back to Home</button>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-surface-alt pb-[72px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-alt/90 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-hover rounded-xl active:scale-95 transition-colors"><ChevronLeft className="w-5 h-5 text-text" /></button>
          <h1 className="flex-1 text-lg font-bold text-center mr-6">{t('feedback.title')}</h1>
        </div>
      </div>

      <div className="flex-1 px-4 pt-8">
        {error && (
          <div className="flex items-start gap-2 p-3 mb-6 bg-danger/10 border border-danger/20 text-danger rounded-xl text-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
          </div>
        )}

        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-brand-500" />
          </div>
          <h2 className="text-lg font-bold text-text mb-1">How was your experience?</h2>
          <p className="text-text-muted text-sm">Tap a star to rate your visit</p>

          {/* Stars */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= (hoveredStar || rating)
              return (
                <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110 active:scale-90 p-1">
                  <Star className={`w-12 h-12 transition-all ${filled ? 'text-fp-amber fill-fp-amber drop-shadow-sm' : 'text-border-light'}`} />
                </button>
              )
            })}
          </div>
          {rating > 0 && <p className="text-sm font-bold text-text mt-3">{starLabels[rating - 1]}</p>}
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> {t('feedback.comment')}
          </label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..." rows={4}
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text shadow-sm" />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={rating === 0 || submitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><Send className="w-5 h-5" /> {t('feedback.submit')}</>}
        </button>

        {/* Skip */}
        <div className="text-center mt-4 pb-8">
          <button onClick={() => navigate('/')} className="text-xs text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors font-medium">Skip, thanks</button>
        </div>
      </div>
    </div>
  )
}
