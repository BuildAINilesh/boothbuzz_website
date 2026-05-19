import React from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import type { Exhibitor } from '../types';
import { usePublicExhibitorCatalogue } from '../hooks/useSupabaseData';
import { useCart } from '../contexts/CartContext';

const formatInr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const ExhibitorCatalogueShop: React.FC<{
  exhibitor: Pick<Exhibitor, 'id' | 'companyName'>;
  onPlaceOrder: () => void;
  /** When true, omit outer card chrome (used inside exhibitor detail tab). */
  embedded?: boolean;
}> = ({ exhibitor, onPlaceOrder, embedded = false }) => {
  const { products, loading, error } = usePublicExhibitorCatalogue(exhibitor.id);
  const { items, addItem, updateQuantity, exhibitorId, itemCount, subtotal } = useCart();

  const cartForThisExhibitor = exhibitorId === exhibitor.id;
  const cartQty = (productId: string) =>
    items.find((i) => i.productId === productId)?.quantity ?? 0;

  const shellClass = embedded
    ? 'space-y-3'
    : 'rounded-xl bg-surface-container-low/50 p-3 sm:p-3.5 ghost-border border border-outline-variant/15';

  return (
    <div className={shellClass}>
      <div className={`flex flex-wrap items-center gap-2 ${embedded ? 'justify-end' : 'justify-between mb-3'}`}>
        {!embedded && (
          <h3 className="text-xs font-bold font-headline text-primary uppercase tracking-wider">
            Catalogue — products for sale
          </h3>
        )}
        {cartForThisExhibitor && itemCount > 0 && (
          <button
            type="button"
            onClick={onPlaceOrder}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Cart ({itemCount}) · {formatInr(subtotal)}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading products…</p>
      ) : error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : products.length === 0 ? (
        <p className="text-xs text-on-surface-variant">No products listed for sale yet.</p>
      ) : (
        <div className={`grid grid-cols-1 gap-3 ${embedded ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {products.map((p) => {
            const qty = cartQty(p.id);
            return (
              <article
                key={p.id}
                className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-surface-container-low">
                  {p.imageUrls[0] ? (
                    <img src={p.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h4 className="font-headline font-bold text-sm text-on-surface line-clamp-2">{p.name}</h4>
                  <p className="text-sm font-semibold text-primary mt-1">{formatInr(p.price)}</p>
                  {p.size?.trim() && (
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Size: {p.size}</p>
                  )}
                  {p.description?.trim() && (
                    <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">{p.description}</p>
                  )}
                  <div className="mt-auto pt-3 flex items-center gap-2">
                    {qty > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => updateQuantity(p.id, qty - 1)}
                          className="p-1.5 rounded-lg border border-outline-variant/20 hover:bg-surface-container-low"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-semibold min-w-[1.5rem] text-center">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(p.id, qty + 1)}
                          className="p-1.5 rounded-lg border border-outline-variant/20 hover:bg-surface-container-low"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addItem(exhibitor, p, 1)}
                        className="w-full py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold"
                      >
                        Add to cart
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
