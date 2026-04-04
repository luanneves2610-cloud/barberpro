'use client'

import { useState, useTransition } from 'react'
import { X, Plus, Minus, CreditCard, Banknote, Smartphone, Check, Loader2, ShoppingBag } from 'lucide-react'
import { checkoutAppointment } from '@/lib/actions/checkout'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string | null
}

interface Props {
  appointment: {
    id: string
    clientName: string
    serviceName: string
    price: number
    barberName: string
  }
  products: Product[]
  onClose: () => void
  onSuccess: () => void
}

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'Pix', Icon: Smartphone },
  { value: 'CASH', label: 'Dinheiro', Icon: Banknote },
  { value: 'CREDIT_CARD', label: 'Crédito', Icon: CreditCard },
  { value: 'DEBIT_CARD', label: 'Débito', Icon: CreditCard },
]

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CheckoutModal({ appointment, products, onClose, onSuccess }: Props) {
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX')
  const [discount, setDiscount] = useState(0)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function addToCart(productId: string) {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const currentQty = cart[productId] ?? 0
    if (currentQty >= product.stock) return
    setCart((prev) => ({ ...prev, [productId]: currentQty + 1 }))
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const qty = (prev[productId] ?? 0) - 1
      if (qty <= 0) {
        const next = { ...prev }
        delete next[productId]
        return next
      }
      return { ...prev, [productId]: qty }
    })
  }

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const p = products.find((x) => x.id === id)!
      return { ...p, qty, subtotal: p.price * qty }
    })
    .filter((i) => i.qty > 0)

  const serviceTotal = appointment.price * (1 - discount / 100)
  const productsTotal = cartItems.reduce((s, i) => s + i.subtotal, 0)
  const grandTotal = serviceTotal + productsTotal

  function handleConfirm() {
    setError('')
    startTransition(async () => {
      const fd = new FormData()
      fd.set('appointmentId', appointment.id)
      fd.set('paymentMethod', paymentMethod)
      fd.set('discount', String(discount))
      fd.set(
        'extraProducts',
        JSON.stringify(cartItems.map((i) => ({ productId: i.id, qty: i.qty }))),
      )
      const result = await checkoutAppointment(fd)
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-zinc-100">Finalizar atendimento</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {appointment.clientName} · {appointment.serviceName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Discount */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Serviço</span>
              <span className="text-sm font-bold text-zinc-100">{fmtCurrency(appointment.price)}</span>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Desconto</label>
              <div className="flex gap-2">
                {[0, 5, 10, 15, 20].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiscount(d)}
                    className={[
                      'flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all',
                      discount === d
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-600',
                    ].join(' ')}
                  >
                    {d === 0 ? 'Sem' : `${d}%`}
                  </button>
                ))}
              </div>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Valor com desconto</span>
                <span className="font-semibold text-green-400">{fmtCurrency(serviceTotal)}</span>
              </div>
            )}
          </div>

          {/* Products */}
          {products.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-amber-400" />
                Produtos adicionais
              </h3>
              <div className="space-y-2">
                {products.map((product) => {
                  const qty = cart[product.id] ?? 0
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{product.name}</p>
                        <p className="text-xs text-zinc-500">
                          {fmtCurrency(product.price)} · {product.stock} em estoque
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {qty > 0 && (
                          <>
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="h-7 w-7 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-bold text-zinc-100 min-w-[20px] text-center">{qty}</span>
                          </>
                        )}
                        <button
                          onClick={() => addToCart(product.id)}
                          disabled={qty >= product.stock}
                          className="h-7 w-7 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {cartItems.length > 0 && (
                <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-800/50 p-3 space-y-1.5">
                  {cartItems.map((i) => (
                    <div key={i.id} className="flex justify-between text-xs">
                      <span className="text-zinc-400">{i.name} ×{i.qty}</span>
                      <span className="text-zinc-200 font-medium">{fmtCurrency(i.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payment method */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Forma de pagamento</h3>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setPaymentMethod(value)}
                  className={[
                    'flex items-center gap-2 rounded-xl border p-3 transition-all',
                    paymentMethod === value
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-zinc-800 bg-zinc-800/40 hover:border-zinc-700',
                  ].join(' ')}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${paymentMethod === value ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span className={`text-sm font-medium ${paymentMethod === value ? 'text-amber-400' : 'text-zinc-300'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-5 space-y-3 shrink-0">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Total</span>
            <span className="text-xl font-bold text-zinc-100">{fmtCurrency(grandTotal)}</span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Finalizando...</>
            ) : (
              <><Check className="h-4 w-4" /> Confirmar pagamento</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
