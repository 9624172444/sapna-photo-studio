import React, { useState } from 'react';
import { StudioOrder, PhotoCountRecord } from '../../types';
import { useStudio } from '../../context/StudioContext';
import {
  Camera,
  Search,
  CheckCircle2,
  Edit2,
  Clock,
  User,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';

export const PhotoshootView: React.FC = () => {
  const { orders, updateOrder, updatePhotoCount, formatCurrency, currentRole } = useStudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<StudioOrder | null>(null);

  // Edit count form state
  const [cameraPhotosTaken, setCameraPhotosTaken] = useState(45);
  const [clientSelected, setClientSelected] = useState(12);
  const [extraPhotoRate, setExtraPhotoRate] = useState(100);
  const [photosEdited, setPhotosEdited] = useState(12);
  const [finalDelivered, setFinalDelivered] = useState(12);
  const [editPhotoNumber, setEditPhotoNumber] = useState('');

  const photoshootOrders = orders.filter((o) => o.photoshootId);

  const filtered = photoshootOrders.filter((o) => {
    return (
      o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.mobileNumber.includes(searchQuery) ||
      (o.photoshootId && o.photoshootId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.photoNumber && o.photoNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const openCountModal = (order: StudioOrder) => {
    setSelectedOrder(order);
    setCameraPhotosTaken(order.photoCount.cameraPhotosTaken || 40);
    setClientSelected(order.photoCount.clientSelected || 10);
    setExtraPhotoRate(order.photoCount.extraPhotoRate || 100);
    setPhotosEdited(order.photoCount.photosEdited || 0);
    setFinalDelivered(order.photoCount.finalDelivered || 0);
    setEditPhotoNumber(order.photoNumber || '');
  };

  const handleSaveCounts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const rejected = Math.max(0, cameraPhotosTaken - clientSelected);
    const extra = Math.max(0, clientSelected - (selectedOrder.pricing.includedPhotos || 10));

    const newCounts: PhotoCountRecord = {
      cameraPhotosTaken,
      clientSelected,
      rejected,
      extraSelected: extra,
      extraPhotoRate,
      photosEdited,
      finalDelivered,
    };

    updatePhotoCount(selectedOrder.id, newCounts, `${currentRole.toUpperCase()} User`);
    if (editPhotoNumber !== selectedOrder.photoNumber) {
      updateOrder({
        ...selectedOrder,
        photoNumber: editPhotoNumber.trim() || undefined,
      });
    }
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-500" />
            <span>Photoshoot Management & Camera Photo Count</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log total camera shots taken, client selection, extra photo calculations & editing counts
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search photoshoot ID, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Photoshoots List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((order) => {
          const rejected = Math.max(0, order.photoCount.cameraPhotosTaken - order.photoCount.clientSelected);
          const extra = Math.max(0, order.photoCount.clientSelected - order.pricing.includedPhotos);

          return (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 hover:border-amber-500/50 transition shadow-xs"
            >
              {/* Top Title & Photoshoot ID */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      {order.photoshootId}
                    </span>
                    {order.photoNumber && (
                      <span className="font-mono text-[11px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        <span>Photo No: {order.photoNumber}</span>
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {order.orderNumber}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                    {order.clientName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {order.mobileNumber} &bull; <span className="capitalize">{order.serviceCategory.replace('_', ' ')}</span>
                  </p>
                </div>

                <button
                  onClick={() => openCountModal(order)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-700 hover:text-slate-950 dark:text-amber-300 text-xs font-bold transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Update Photo Count</span>
                </button>
              </div>

              {/* Photoshoot details */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-[11px] text-slate-400">Photographer:</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{order.photographerName || 'Studio Team'}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Camera Used:</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{order.cameraUsed || 'Sony A7 IV'}</p>
                </div>
              </div>

              {/* Camera Photo Count Stats Grid */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Camera Photo Count & Selection Status:
                </p>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400">Camera Shots</span>
                    <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                      {order.photoCount.cameraPhotosTaken}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400">Client Selected</span>
                    <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      {order.photoCount.clientSelected}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400">Rejected Shots</span>
                    <p className="text-base font-extrabold text-slate-500">
                      {rejected}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400">Extra Photos</span>
                    <p className={`text-base font-extrabold ${extra > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {extra > 0 ? `+${extra}` : '0'}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400">Photos Edited</span>
                    <p className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                      {order.photoCount.photosEdited}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900">
                    <span className="text-[10px] text-slate-400">Final Delivered</span>
                    <p className="text-base font-extrabold text-teal-600 dark:text-teal-400">
                      {order.photoCount.finalDelivered}
                    </p>
                  </div>
                </div>

                {extra > 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold text-center pt-1">
                    ✨ Extra {extra} photos added to bill: +{formatCurrency(extra * (order.photoCount.extraPhotoRate || 100))}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Photo Count Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-left">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Update Camera Photo Count</h3>
                  <p className="text-xs text-slate-400">{selectedOrder.clientName} &bull; {selectedOrder.photoshootId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCounts} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Photo Number / Camera File No. (e.g. DSC_4092)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. DSC_4092, Frame #4, IMG_0192..."
                  value={editPhotoNumber}
                  onChange={(e) => setEditPhotoNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-amber-300 dark:border-slate-700 text-xs font-mono font-bold text-amber-600 dark:text-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Total Photos Taken From Camera *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cameraPhotosTaken}
                    onChange={(e) => setCameraPhotosTaken(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">e.g. 45 shots on SD card</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Photos Selected by Client *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={cameraPhotosTaken}
                    required
                    value={clientSelected}
                    onChange={(e) => setClientSelected(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-emerald-600 dark:text-emerald-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Package includes: {selectedOrder.pricing.includedPhotos}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Extra Rate (₹/photo)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={extraPhotoRate}
                    onChange={(e) => setExtraPhotoRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Photos Edited
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={photosEdited}
                    onChange={(e) => setPhotosEdited(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Delivered
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={finalDelivered}
                    onChange={(e) => setFinalDelivered(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              {/* Live Extra Calculation Preview */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex justify-between items-center">
                <span>
                  Extra Photos: <strong>{Math.max(0, clientSelected - selectedOrder.pricing.includedPhotos)}</strong>
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  Extra Amount: +{formatCurrency(Math.max(0, clientSelected - selectedOrder.pricing.includedPhotos) * extraPhotoRate)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs"
                >
                  Update & Recalculate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
