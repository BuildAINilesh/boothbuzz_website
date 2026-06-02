import React, { useState } from 'react';
import { X, Minus, Plus, CreditCard, CheckCircle } from 'lucide-react';
import type { FulfillmentType } from '../types';
import { useCart } from '../contexts/CartContext';
import { placeCustomerOrder } from '../hooks/useSupabaseData';
import { LegalConsentCheckbox } from './LegalConsentCheckbox';

const formatInr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const CustomerCheckoutModal: React.FC<{
  exhibitorId: string;
  exhibitorName: string;
  onClose: () => void;
}> = ({ exhibitorId, exhibitorName, onClose }) => {
  const { items, updateQuantity, removeItem, subtotal, itemCount, clearCart, exhibitorId: cartExhibitorId } =
    useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('exhibition_pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderNumber: string } | null>(null);
  const [agreeToLegal, setAgreeToLegal] = useState(false);

  const cartMismatch = cartExhibitorId !== exhibitorId || items.length === 0;

  const handlePayAndPlace = async () => {
    setError(null);
    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (fulfillmentType === 'home_delivery') {
      if (!deliveryAddress.trim() || !deliveryCity.trim() || !deliveryPincode.trim()) {
        setError('Please fill in delivery address, city, and pincode.');
        return;
      }
    }

    if (!agreeToLegal) {
      setError('Please accept the Terms of Use and Privacy Policy to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await placeCustomerOrder({
        exhibitorId,
        customerName,
        customerEmail,
        customerPhone,
        fulfillmentType,
        deliveryAddress,
        deliveryCity,
        deliveryState,
        deliveryPincode,
        deliveryNotes,
        customerNotes,
        items,
      });
      clearCart();
      setAgreeToLegal(false);
      setSuccess({ orderNumber: result.orderNumber });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-3 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="bg-surface-container-lowest w-full sm:max-w-lg max-h-[100dvh] sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col border border-outline-variant/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/15 shrink-0">
          <h2 className="text-lg font-headline font-bold text-on-surface">Place order</h2>
          <button type="button" onClick={onClose} disabled={submitting} className="p-2 rounded-lg hover:bg-surface-container-low" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
              <p className="font-headline font-bold text-lg text-on-surface">Order placed!</p>
              <p className="text-sm text-on-surface-variant mt-2">
                Order <span className="font-semibold text-primary">{success.orderNumber}</span> sent to{' '}
                {exhibitorName}. Payment recorded (Razorpay coming soon).
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-on-primary font-semibold"
              >
                Done
              </button>
            </div>
          ) : cartMismatch ? (
            <p className="text-sm text-on-surface-variant">Your cart is empty or is for another exhibitor.</p>
          ) : (
            <>
              <p className="text-xs text-on-surface-variant">
                Ordering from <span className="font-semibold text-on-surface">{exhibitorName}</span> only — one
                exhibitor per order.
              </p>

              <div className="rounded-xl border border-outline-variant/15 divide-y divide-outline-variant/10">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 p-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-surface-container-low shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface line-clamp-2">{item.name}</p>
                      <p className="text-xs text-primary font-semibold mt-0.5">{formatInr(item.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 rounded border border-outline-variant/20"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 rounded border border-outline-variant/20"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="ml-auto text-xs text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold shrink-0">{formatInr(item.price * item.quantity)}</p>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 text-sm font-bold">
                  <span>Total ({itemCount} items)</span>
                  <span className="text-primary">{formatInr(subtotal)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Your details</h3>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name *"
                  className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5 text-sm"
                />
                <input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  type="email"
                  placeholder="Email (optional)"
                  className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5 text-sm"
                />
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  inputMode="numeric"
                  placeholder="Phone (10 digits) *"
                  className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Fulfillment</h3>
                <label className="flex items-start gap-2 cursor-pointer rounded-xl border border-outline-variant/15 p-3 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillmentType === 'exhibition_pickup'}
                    onChange={() => setFulfillmentType('exhibition_pickup')}
                    className="mt-1"
                  />
                  <span>
                    <span className="text-sm font-semibold block">Pick up at exhibition</span>
                    <span className="text-xs text-on-surface-variant">Collect your order from the exhibitor booth.</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer rounded-xl border border-outline-variant/15 p-3 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillmentType === 'home_delivery'}
                    onChange={() => setFulfillmentType('home_delivery')}
                    className="mt-1"
                  />
                  <span>
                    <span className="text-sm font-semibold block">Home delivery</span>
                    <span className="text-xs text-on-surface-variant">We will deliver to your address.</span>
                  </span>
                </label>
              </div>

              {fulfillmentType === 'home_delivery' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Delivery address</h3>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street address *"
                    rows={2}
                    className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      placeholder="City *"
                      className="rounded-xl border border-outline-variant/20 px-3 py-2.5 text-sm"
                    />
                    <input
                      value={deliveryState}
                      onChange={(e) => setDeliveryState(e.target.value)}
                      placeholder="State"
                      className="rounded-xl border border-outline-variant/20 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <input
                    value={deliveryPincode}
                    onChange={(e) => setDeliveryPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Pincode *"
                    className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5 text-sm"
                  />
                  <input
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Delivery instructions (optional)"
                    className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5 text-sm"
                  />
                </div>
              )}

              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Notes for exhibitor (optional)"
                rows={2}
                className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5 text-sm"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}
        </div>

        {!success && !cartMismatch && (
          <div className="p-4 border-t border-outline-variant/15 shrink-0 space-y-3">
            <LegalConsentCheckbox
              id="checkout-agree-legal"
              checked={agreeToLegal}
              onChange={setAgreeToLegal}
            />
            <button
              type="button"
              disabled={submitting || !agreeToLegal}
              onClick={handlePayAndPlace}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-on-primary font-semibold disabled:opacity-60"
            >
              <CreditCard className="h-5 w-5" />
              {submitting ? 'Placing order…' : `Pay ${formatInr(subtotal)} & place order`}
            </button>
            <p className="text-[10px] text-center text-on-surface-variant mt-2">
              Mock payment for now — Razorpay integration coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
