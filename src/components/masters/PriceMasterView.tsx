import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { ServicePackage, ServiceCategory } from '../../types';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Filter,
  Camera,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const PriceMasterView: React.FC = () => {
  const { packages, addPackage, updatePackage, deletePackage, formatCurrency } = useStudio();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editName, setEditName] = useState<string>('');
  const [editCopies, setEditCopies] = useState<number>(0);
  const [editSize, setEditSize] = useState<string>('');

  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<ServiceCategory>('passport_visa');
  const [newTitle, setNewTitle] = useState<string>('Passport Size Photo');
  const [newName, setNewName] = useState<string>('');
  const [newCopies, setNewCopies] = useState<number>(12);
  const [newSize, setNewSize] = useState<string>('35x45 mm');
  const [newPrice, setNewPrice] = useState<number>(100);

  const filteredPackages = packages.filter((pkg) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'passport') return pkg.name.toLowerCase().includes('passport');
    if (selectedCategory === 'visa') return pkg.name.toLowerCase().includes('visa');
    if (selectedCategory === 'modeling') return pkg.serviceCategory === 'baby_photoshoot' || pkg.name.toLowerCase().includes('modeling') || pkg.name.toLowerCase().includes('child');
    return pkg.serviceCategory === selectedCategory;
  });

  const handleStartEdit = (pkg: ServicePackage) => {
    setEditingId(pkg.id);
    setEditPrice(pkg.price);
    setEditName(pkg.name);
    setEditCopies(pkg.copies);
    setEditSize(pkg.size);
  };

  const handleSaveEdit = (pkg: ServicePackage) => {
    updatePackage({
      ...pkg,
      name: editName || pkg.name,
      price: Number(editPrice) || pkg.price,
      copies: Number(editCopies) || pkg.copies,
      size: editSize || pkg.size,
    });
    setEditingId(null);
  };

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newPrice <= 0) return;

    addPackage({
      serviceCategory: newCategory,
      serviceTitle: newTitle,
      name: newName,
      copies: Number(newCopies) || 1,
      size: newSize,
      price: Number(newPrice),
      active: true,
    });

    setIsAddingNew(false);
    setNewName('');
    setNewPrice(100);
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            <span>Price Master & Service Packages</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin Master: Manage passport copy rates, visa document sizes & photoshoot pricing without code changes
          </p>
        </div>

        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Package</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: `All Packages (${packages.length})` },
          { id: 'passport', label: '📸 Passport Photos' },
          { id: 'visa', label: '🌍 Visa & Document Sizes' },
          { id: 'modeling', label: '👶 Modeling & Child Shoots' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === tab.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add New Package Modal/Form */}
      {isAddingNew && (
        <form
          onSubmit={handleCreatePackage}
          className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-4 animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Create New Service Package</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Service Type</label>
              <select
                value={newCategory}
                onChange={(e) => {
                  const cat = e.target.value as ServiceCategory;
                  setNewCategory(cat);
                  if (cat === 'passport_visa') setNewTitle('Passport Size Photo');
                  else if (cat === 'baby_photoshoot') setNewTitle('Modeling / Child Photography');
                  else setNewTitle('Studio Service');
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="passport_visa">Passport & Visa Photos</option>
                <option value="baby_photoshoot">Modeling / Child Photography</option>
                <option value="family_photoshoot">Family Photography</option>
                <option value="photo_printing">Photo Printing</option>
                <option value="custom_service">Custom Service</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Package Name</label>
              <input
                type="text"
                placeholder="e.g. Passport 24 Copies"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Size / Dimension</label>
              <input
                type="text"
                placeholder="e.g. 35x45 mm, 2x2 inch"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Copies & Price (₹)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Copies"
                  value={newCopies}
                  onChange={(e) => setNewCopies(Number(e.target.value))}
                  className="w-1/2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Price ₹"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  required
                  className="w-1/2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/50 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
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
              className="px-5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Package
            </button>
          </div>
        </form>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPackages.map((pkg) => {
          const isEditing = editingId === pkg.id;

          return (
            <div
              key={pkg.id}
              className={`p-4 rounded-2xl border transition shadow-xs ${
                pkg.active
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
                  : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 opacity-60'
              }`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">Package Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold border border-amber-500/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400">Size</label>
                      <input
                        type="text"
                        value={editSize}
                        onChange={(e) => setEditSize(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400">Copies</label>
                      <input
                        type="number"
                        value={editCopies}
                        onChange={(e) => setEditCopies(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-amber-500">Price (₹)</label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-extrabold border border-amber-500/40"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(pkg)}
                      className="px-4 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {pkg.serviceTitle}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                        {pkg.name}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                        {formatCurrency(pkg.price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-slate-700 dark:text-slate-300">
                      📏 {pkg.size}
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-slate-700 dark:text-slate-300">
                      📄 {pkg.copies} Copies
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => updatePackage({ ...pkg, active: !pkg.active })}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                        pkg.active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {pkg.active ? '● Active' : '○ Inactive'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(pkg)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition cursor-pointer"
                        title="Edit Price & Name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete package "${pkg.name}"?`)) {
                            deletePackage(pkg.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete Package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
