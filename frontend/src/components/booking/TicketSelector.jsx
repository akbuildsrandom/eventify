import React from 'react';
import { Plus, Minus, Tag, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { Badge } from '../common/Badge';

export const TicketSelector = ({
  ticketTypes = [],
  selectedQuantities = {},
  onQuantityChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      {ticketTypes.map((tier) => {
        const qty = selectedQuantities[tier.id] || 0;
        const isSoldOut = tier.availableQuantity <= 0;
        const price = Number(tier.price);

        return (
          <div
            key={tier.id}
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              qty > 0
                ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/30'
                : 'border-slate-200 bg-white hover:border-slate-300'
            } ${isSoldOut ? 'opacity-60 bg-slate-50' : ''}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-slate-900">{tier.name}</h4>
                  {isSoldOut ? (
                    <Badge variant="danger" size="xs">
                      Sold Out
                    </Badge>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {tier.availableQuantity} available
                    </span>
                  )}
                </div>

                {tier.description && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">
                    {tier.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-extrabold text-slate-900">
                    {formatCurrency(price)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (Max {tier.maxPerOrder} per booking)
                  </span>
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  disabled={qty === 0 || disabled || isSoldOut}
                  onClick={() => onQuantityChange(tier.id, qty - 1)}
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="w-7 text-center font-bold text-sm text-slate-900">
                  {qty}
                </span>

                <button
                  type="button"
                  disabled={
                    qty >= tier.maxPerOrder ||
                    qty >= tier.availableQuantity ||
                    disabled ||
                    isSoldOut
                  }
                  onClick={() => onQuantityChange(tier.id, qty + 1)}
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
