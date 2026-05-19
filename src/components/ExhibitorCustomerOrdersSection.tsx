import React, { useState } from 'react';
import { Package, Truck, MapPin } from 'lucide-react';
import { useExhibitorCustomerOrders } from '../hooks/useSupabaseData';
import { supabase } from '../supabase';

const formatInr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const ORDER_STATUSES = ['placed', 'confirmed', 'ready', 'completed', 'cancelled'] as const;

export const ExhibitorCustomerOrdersSection: React.FC<{ exhibitorId: string }> = ({ exhibitorId }) => {
  const { orders, loading, error, refetch } = useExhibitorCustomerOrders(exhibitorId);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateStatus = async (orderId: string, orderStatus: string) => {
    setUpdatingId(orderId);
    await supabase.from('exhibitor_customer_orders').update({ order_status: orderStatus }).eq('id', orderId);
    await refetch();
    setUpdatingId(null);
  };

  if (loading) return <p className="text-sm text-on-surface-variant">Loading orders…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (orders.length === 0) {
    return <p className="text-sm text-on-surface-variant">No customer orders yet.</p>;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article
          key={order.id}
          className="rounded-2xl border border-outline-variant/15 p-4 bg-surface-container-low/40"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-headline font-bold text-on-surface">{order.orderNumber}</p>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {new Date(order.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{formatInr(order.total)}</p>
              <p className="text-xs text-emerald-700 capitalize">{order.paymentStatus}</p>
            </div>
          </div>

          <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
            <p>
              <span className="text-on-surface-variant">Customer: </span>
              <span className="font-medium">{order.customerName}</span>
            </p>
            <p>
              <span className="text-on-surface-variant">Phone: </span>
              <a href={`tel:${order.customerPhone}`} className="text-primary">
                {order.customerPhone}
              </a>
            </p>
            {order.customerEmail && (
              <p className="sm:col-span-2">
                <span className="text-on-surface-variant">Email: </span>
                {order.customerEmail}
              </p>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm">
            {order.fulfillmentType === 'home_delivery' ? (
              <Truck className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Package className="h-4 w-4 text-primary shrink-0" />
            )}
            <span className="font-medium capitalize">
              {order.fulfillmentType === 'home_delivery' ? 'Home delivery' : 'Exhibition pickup'}
            </span>
          </div>

          {order.fulfillmentType === 'home_delivery' && order.deliveryAddress && (
            <p className="mt-2 text-sm text-on-surface-variant flex gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {order.deliveryAddress}
                {order.deliveryCity ? `, ${order.deliveryCity}` : ''}
                {order.deliveryState ? `, ${order.deliveryState}` : ''}
                {order.deliveryPincode ? ` — ${order.deliveryPincode}` : ''}
                {order.deliveryNotes ? ` (${order.deliveryNotes})` : ''}
              </span>
            </p>
          )}

          {order.customerNotes && (
            <p className="mt-2 text-sm text-on-surface-variant">
              <span className="font-semibold">Note: </span>
              {order.customerNotes}
            </p>
          )}

          <ul className="mt-3 space-y-1 border-t border-outline-variant/10 pt-3">
            {(order.items ?? []).map((line) => (
              <li key={line.id} className="flex justify-between text-sm">
                <span>
                  {line.productName}
                  {line.productSize ? ` (${line.productSize})` : ''} × {line.quantity}
                </span>
                <span className="font-medium">{formatInr(line.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold uppercase text-on-surface-variant">Status</label>
            <select
              value={order.orderStatus}
              disabled={updatingId === order.id}
              onChange={(e) => updateStatus(order.id, e.target.value)}
              className="rounded-lg border border-outline-variant/20 px-2 py-1 text-sm"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </article>
      ))}
    </div>
  );
};
