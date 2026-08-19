import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { PrintOnlyPriceConfig } from '../../types';
import {
  Printer,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Smartphone,
  Image,
} from 'lucide-react';

export const PrintOnlyMasterView: React.FC = () => {
  const { printOnlyPrices, addPrintOnlyPrice, updatePrintOnlyPrice, deletePrintOnlyPrice, formatCurrency } = useStudio();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editSize, setEditSize] = useState<string>('');

  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newSize, setNewSize] = useState<string>('');
  const [newType, setNewType] = useState<'no_editing' | 'editing'>('editing');
  const [newPrice, setNewPrice] = useState<number>(400);

  const handleStartEdit = (item: PrintOnlyPriceConfig) => {
    setEditingId(item.id);
    setEditPrice(item.price);
    setEditSize(item.size);
  };

  const handleSaveEdit = (item: PrintOnlyPriceConfig) => {
    updatePrintOnlyPrice({
      ...item,
      size: editSize || item.size,
      price: Number(editPrice) || item.price,
    });
    setEditingId(null);
  };

  const handleCreatePrint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSize.trim() || newPrice <= 0) return;

    addPrintOnlyPrice({
      size: newSize,
      editingType: newType,
      price: Number(newPrice),
      active: true,
    });

    setIsAddingNew(false);
    setNewSize('');
    setNewPrice(400);
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-500" />
            <span>Print-Only Price Master (No Frame)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin Master: Manage direct mobile prints, lab enlargement rates & photo editing charges
          </p>
        </div>

        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Print Size</span>
        </button>
      </div>

      {/* Add New Print Price Modal */}
      {isAddingNew && (
        <form
          onSubmit={handleCreatePrint}
          className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/30 p-5 rounded-2xl space-y-4 animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Add Print-Only Size & Rate</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Print Size / Description</label>
              <input
                type="text"
                placeholder="e.g. 24 × 36 inch (With Editing)"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Editing Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="no_editing">Direct Print / No Editing</option>
                <option value="editing">Includes Photo Retouching & Editing</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Price (₹)</label>
              <input
                type="number"
                placeholder="Price ₹"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/50 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Print Size
            </button>
          </div>
        </form>
      )}

      {/* Print Prices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Current Print-Only Price List
          </h2>
          <span className="text-xs text-slate-400">Total {printOnlyPrices.length} Print Options</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Size & Description</th>
                <th className="px-5 py-3">Editing Required</th>
                <th className="px-5 py-3 text-indigo-600 dark:text-indigo-400">Rate / Price (₹)</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {printOnlyPrices.map((item) => {
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editSize}
                          onChange={(e) => setEditSize(e.target.value)}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold border border-indigo-500 w-full max-w-sm"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {item.size}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {item.editingType === 'editing' ? (
                        <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                          🎨 Photo Editing Included
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          ⚡ Direct Print (No Editing)
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className="w-24 px-2 py-1 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs border border-indigo-500"
                        />
                      ) : (
                        <span className="font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg text-sm">
                          {formatCurrency(item.price)}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => updatePrintOnlyPrice({ ...item, active: !item.active })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                          item.active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {item.active ? '● Active' : '○ Inactive'}
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 rounded text-xs font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(item)}
                            className="px-3 py-1 rounded bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 transition cursor-pointer"
                            title="Edit Price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete print size "${item.size}"?`)) {
                                deletePrintOnlyPrice(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete Size"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
