import React, { useState } from 'react';
import { Package, Plus, Pencil, Trash2, X, ImagePlus } from 'lucide-react';
import type { ExhibitorCatalogueProduct } from '../types';
import {
  useExhibitorCatalogue,
  type CatalogueProductInput,
} from '../hooks/useSupabaseData';
import { uploadCatalogueImages } from '../utils/exhibitorStorage';

const formatInr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const emptyForm = (): CatalogueProductInput => ({
  name: '',
  size: '',
  price: 0,
  compareAtPrice: null,
  description: '',
  imageUrls: [],
  sku: '',
  category: '',
  unit: '',
  stockQuantity: null,
  isActive: true,
  sortOrder: 0,
});

export interface ExhibitorCatalogueSectionProps {
  exhibitorId: string;
}

export const ExhibitorCatalogueSection: React.FC<ExhibitorCatalogueSectionProps> = ({ exhibitorId }) => {
  const {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleActive,
    refetch,
  } = useExhibitorCatalogue(exhibitorId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExhibitorCatalogueProduct | null>(null);
  const [form, setForm] = useState<CatalogueProductInput>(emptyForm());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setPendingFiles([]);
    setFormErr('');
    setFormOpen(true);
  };

  const openEdit = (p: ExhibitorCatalogueProduct) => {
    setEditing(p);
    setForm({
      name: p.name,
      size: p.size ?? '',
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      description: p.description ?? '',
      imageUrls: [...p.imageUrls],
      sku: p.sku ?? '',
      category: p.category ?? '',
      unit: p.unit ?? '',
      stockQuantity: p.stockQuantity ?? null,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
    });
    setPendingFiles([]);
    setFormErr('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setPendingFiles([]);
    setFormErr('');
  };

  const removeExistingImage = (url: string) => {
    setForm((f) => ({ ...f, imageUrls: (f.imageUrls ?? []).filter((u) => u !== url) }));
  };

  const handleSave = async () => {
    setFormErr('');
    const name = form.name.trim();
    if (!name) {
      setFormErr('Product name is required.');
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      setFormErr('Enter a valid price (0 or more).');
      return;
    }

    setSaveLoading(true);
    try {
      let imageUrls = [...(form.imageUrls ?? [])];
      if (pendingFiles.length > 0) {
        const uploaded = await uploadCatalogueImages(exhibitorId, pendingFiles);
        imageUrls = [...imageUrls, ...uploaded];
      }

      const payload: CatalogueProductInput = {
        ...form,
        name,
        price,
        size: form.size?.trim() || null,
        description: form.description?.trim() || null,
        sku: form.sku?.trim() || null,
        category: form.category?.trim() || null,
        unit: form.unit?.trim() || null,
        compareAtPrice:
          form.compareAtPrice != null && Number(form.compareAtPrice) >= 0
            ? Number(form.compareAtPrice)
            : null,
        stockQuantity:
          form.stockQuantity != null && !Number.isNaN(Number(form.stockQuantity))
            ? Number(form.stockQuantity)
            : null,
        imageUrls,
      };

      if (editing) {
        await updateProduct(editing.id, payload);
      } else {
        await createProduct(payload);
      }
      closeForm();
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (p: ExhibitorCatalogueProduct) => {
    if (!window.confirm(`Delete "${p.name}" from your catalogue?`)) return;
    setActionId(p.id);
    try {
      await deleteProduct(p.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setActionId(null);
    }
  };

  const handleToggleActive = async (p: ExhibitorCatalogueProduct) => {
    setActionId(p.id);
    try {
      await toggleActive(p.id, !p.isActive);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className="mt-10 pt-8 border-t border-outline-variant/20">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Product catalogue
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Add products customers can browse and purchase on the website (coming soon).
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary"
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading catalogue…</p>
      ) : error ? (
        <div className="text-sm text-red-600">
          {error}{' '}
          <button type="button" onClick={() => refetch()} className="underline font-semibold">
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/25 bg-surface-container-low/40 py-12 px-4 text-center">
          <Package className="h-10 w-10 text-outline-variant mx-auto mb-2 opacity-60" />
          <p className="font-headline font-semibold text-on-surface">No products yet</p>
          <p className="text-sm text-on-surface-variant mt-1 max-w-sm mx-auto">
            Add your first catalogue item with photos, price, and description.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
          >
            <Plus className="h-4 w-4" />
            Add product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-outline-variant/15 bg-surface-container-low/40 overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/10] bg-surface-container-low relative">
                {p.imageUrls[0] ? (
                  <img src={p.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                    <ImagePlus className="h-8 w-8 opacity-40" />
                  </div>
                )}
                {!p.isActive && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold uppercase bg-on-surface/70 text-white px-2 py-0.5 rounded">
                    Hidden
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h4 className="font-headline font-bold text-on-surface line-clamp-2">{p.name}</h4>
                <p className="text-sm font-semibold text-primary mt-1">{formatInr(p.price)}</p>
                <div className="text-xs text-on-surface-variant mt-1 space-y-0.5">
                  {p.size?.trim() && <p>Size: {p.size}</p>}
                  {p.stockQuantity != null && <p>Stock: {p.stockQuantity}</p>}
                  {p.sku?.trim() && <p>SKU: {p.sku}</p>}
                </div>
                <div className="mt-auto pt-3 flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer">
                    <input
                      type="checkbox"
                      checked={p.isActive}
                      disabled={actionId === p.id}
                      onChange={() => handleToggleActive(p)}
                      className="rounded border-outline-variant/40 text-primary focus:ring-primary/30"
                    />
                    For sale
                  </label>
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg border border-outline-variant/20 px-2.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    disabled={actionId === p.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen && (
        <div
          className="fixed inset-0 z-[70] bg-on-surface/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="catalogue-form-title"
        >
          <div
            className="bg-surface-container-lowest rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-outline-variant/20 shadow-2xl my-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-outline-variant/15 bg-surface-container-lowest">
              <h4 id="catalogue-form-title" className="font-headline font-bold text-on-surface">
                {editing ? 'Edit product' : 'Add product'}
              </h4>
              <button type="button" onClick={closeForm} className="p-1.5 rounded-full hover:bg-surface-container-low" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5"
                  placeholder="Product name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                    Price (INR) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.price === 0 ? '' : form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                    Compare-at price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.compareAtPrice ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        compareAtPrice: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5"
                    placeholder="MRP (optional)"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5 min-h-24"
                  placeholder="Describe your product"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                    Size
                  </label>
                  <input
                    value={form.size ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5"
                    placeholder="e.g. M, 500ml"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                    Unit
                  </label>
                  <input
                    value={form.unit ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5"
                    placeholder="piece, set, kg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                    SKU
                  </label>
                  <input
                    value={form.sku ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5"
                    placeholder="Product code"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                    Category
                  </label>
                  <input
                    value={form.category ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5"
                    placeholder="Category"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                  Stock quantity
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.stockQuantity ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      stockQuantity: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-outline-variant/20 px-3 py-2.5"
                  placeholder="Optional"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-on-surface">
                <input
                  type="checkbox"
                  checked={form.isActive !== false}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-outline-variant/40 text-primary"
                />
                Active (visible for sale when shop launches)
              </label>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                  Images
                </label>
                {(form.imageUrls?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.imageUrls!.map((url) => (
                      <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden ring-1 ring-outline-variant/20">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(url)}
                          className="absolute top-0 right-0 p-0.5 bg-on-surface/80 text-white rounded-bl"
                          aria-label="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {pendingFiles.length > 0 && (
                  <p className="text-xs text-on-surface-variant mb-2">
                    {pendingFiles.length} new image(s) selected
                  </p>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={(e) => setPendingFiles(Array.from(e.target.files ?? []))}
                  className="block w-full text-sm text-on-surface-variant file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-on-primary file:font-semibold"
                />
              </div>
              {formErr && <p className="text-sm text-red-600">{formErr}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
                >
                  {saveLoading ? 'Saving…' : editing ? 'Update product' : 'Add product'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-outline-variant/20 px-4 py-2.5 text-sm font-semibold text-on-surface"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
