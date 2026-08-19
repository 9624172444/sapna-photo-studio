import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { FramePriceConfig, LaminationOptionConfig } from '../../types';
import {
  Frame,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Layers,
  ShieldCheck,
  Sliders,
} from 'lucide-react';

export const FrameMasterView: React.FC = () => {
  const {
    framePrices,
    addFramePrice,
    updateFramePrice,
    deleteFramePrice,
    laminationOptions,
    updateLaminationOption,
    formatCurrency,
  } = useStudio();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVelPrice, setEditVelPrice] = useState<number>(0);
  const [editRoyalPrice, setEditRoyalPrice] = useState<number>(0);
  const [editSize, setEditSize] = useState<string>('');

  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newSize, setNewSize] = useState<string>('');
  const [newVelPrice, setNewVelPrice] = useState<number>(750);
  const [newRoyalPrice, setNewRoyalPrice] = useState<number>(850);

  const [editingLamId, setEditingLamId] = useState<string | null>(null);
  const [editLamSurcharge, setEditLamSurcharge] = useState<number>(1000);

  const handleStartEdit = (frame: FramePriceConfig) => {
    setEditingId(frame.id);
    setEditSize(frame.size);
    setEditVelPrice(frame.velFramePrice);
    setEditRoyalPrice(frame.royalFramePrice);
  };

  const handleSaveEdit = (frame: FramePriceConfig) => {
    updateFramePrice({
      ...frame,
      size: editSize || frame.size,
      velFramePrice: Number(editVelPrice),
      royalFramePrice: Number(editRoyalPrice),
    });
    setEditingId(null);
  };

  const handleCreateFrame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSize.trim()) return;

    addFramePrice({
      size: newSize,
      velFramePrice: Number(newVelPrice),
      royalFramePrice: Number(newRoyalPrice),
      active: true,
    });

    setIsAddingNew(false);
    setNewSize('');
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Frame className="w-5 h-5 text-purple-500" />
            <span>Frame Master & Lamination Pricing</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin Master: Configure Vel Frame, Royal Frame rates & High-Quality Lamination surcharges
          </p>
        </div>

        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Frame Size</span>
        </button>
      </div>

      {/* Lamination Surcharge Configuration Card */}
      <div className="bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-purple-500/20 p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Lamination Options Master (Archival Finishing)
              </h3>
              <p className="text-xs text-slate-500">
                Applied automatically in Counter Booking & Billing when customer selects High Quality Lamination
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {laminationOptions.map((lam) => (
              <div
                key={lam.id}
                className="flex items-center gap-3 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{lam.name}</span>
                  <span className="text-purple-600 dark:text-purple-400 font-extrabold text-[11px]">
                    {lam.surcharge > 0 ? `+${formatCurrency(lam.surcharge)} Extra` : 'Free (Included)'}
                  </span>
                </div>

                {editingLamId === lam.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={editLamSurcharge}
                      onChange={(e) => setEditLamSurcharge(Number(e.target.value))}
                      className="w-20 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold border border-purple-500"
                    />
                    <button
                      onClick={() => {
                        updateLaminationOption({ ...lam, surcharge: Number(editLamSurcharge) });
                        setEditingLamId(null);
                      }}
                      className="p-1 rounded bg-emerald-600 text-white cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingLamId(lam.id);
                      setEditLamSurcharge(lam.surcharge);
                    }}
                    className="p-1 text-slate-400 hover:text-purple-600 cursor-pointer"
                    title="Change Surcharge Price"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add New Frame Modal */}
      {isAddingNew && (
        <form
          onSubmit={handleCreateFrame}
          className="bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/30 p-5 rounded-2xl space-y-4 animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Add New Frame Size & Pricing</span>
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
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Frame Size (Inch)</label>
              <input
                type="text"
                placeholder="e.g. 14 × 20 inch"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Vel Frame Price (₹)</label>
              <input
                type="number"
                placeholder="Vel Price"
                value={newVelPrice}
                onChange={(e) => setNewVelPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Royal Frame Price (₹)</label>
              <input
                type="number"
                placeholder="Royal Price"
                value={newRoyalPrice}
                onChange={(e) => setNewRoyalPrice(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-500/50 text-xs font-bold text-slate-900 dark:text-white"
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
              className="px-5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Frame Size
            </button>
          </div>
        </form>
      )}

      {/* Frame Price Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Current Frame Price Matrix (Vel vs Royal)
          </h2>
          <span className="text-xs text-slate-400">Total {framePrices.length} Standard Sizes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Size (Inch)</th>
                <th className="px-5 py-3 text-purple-700 dark:text-purple-400">🖼️ Vel Frame Price</th>
                <th className="px-5 py-3 text-amber-600 dark:text-amber-400">👑 Royal Frame Price</th>
                <th className="px-5 py-3">Lamination Option</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {framePrices.map((frame) => {
                const isEditing = editingId === frame.id;

                return (
                  <tr key={frame.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editSize}
                          onChange={(e) => setEditSize(e.target.value)}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold border border-purple-500"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {frame.size}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editVelPrice}
                          onChange={(e) => setEditVelPrice(Number(e.target.value))}
                          className="w-24 px-2 py-1 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-extrabold text-xs border border-purple-500"
                        />
                      ) : frame.velFramePrice > 0 ? (
                        <span className="font-extrabold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-lg">
                          {formatCurrency(frame.velFramePrice)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editRoyalPrice}
                          onChange={(e) => setEditRoyalPrice(Number(e.target.value))}
                          className="w-24 px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-extrabold text-xs border border-amber-500"
                        />
                      ) : (
                        <span className="font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                          {formatCurrency(frame.royalFramePrice)}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-slate-500">
                      {frame.size.includes('24') ? (
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          +HQ Lamination (+₹1,000)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Normal / Standard</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => updateFramePrice({ ...frame, active: !frame.active })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                          frame.active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {frame.active ? '● Active' : '○ Inactive'}
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
                            onClick={() => handleSaveEdit(frame)}
                            className="px-3 py-1 rounded bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleStartEdit(frame)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-500/10 transition cursor-pointer"
                            title="Edit Prices"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete frame size ${frame.size}?`)) {
                                deleteFramePrice(frame.id);
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
