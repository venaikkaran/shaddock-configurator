import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { yellowThreshold, setYellowThreshold, redThreshold, setRedThreshold } = useApp();

  const [yellowVal, setYellowVal] = useState((yellowThreshold * 100).toString());
  const [redVal, setRedVal] = useState((redThreshold * 100).toString());

  if (!isOpen) return null;

  function handleSave() {
    const y = parseFloat(yellowVal);
    const r = parseFloat(redVal);
    if (!isNaN(y) && y >= 0) setYellowThreshold(y / 100);
    if (!isNaN(r) && r >= 0) setRedThreshold(r / 100);
    onClose();
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-warm-400 hover:text-warm-600 p-1"
          aria-label="Close settings"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-display text-stone-800 mb-4">Budget Settings</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Warning threshold (%)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={yellowVal}
            onChange={e => setYellowVal(e.target.value)}
            className="w-full bg-warm-50 border border-warm-200 rounded-lg px-3 py-2.5 text-lg"
          />
          <p className="text-xs text-warm-500 mt-1">
            Budget bar turns yellow when total exceeds budget by this percentage
          </p>
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Over budget threshold (%)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={redVal}
            onChange={e => setRedVal(e.target.value)}
            className="w-full bg-warm-50 border border-warm-200 rounded-lg px-3 py-2.5 text-lg"
          />
          <p className="text-xs text-warm-500 mt-1">
            Budget bar turns red when total exceeds budget by this percentage
          </p>
        </div>

        <button
          onClick={handleSave}
          className="bg-brand-600 text-white px-6 py-2.5 rounded-lg hover:bg-brand-700 w-full mt-4"
        >
          Save
        </button>
      </div>
    </div>
  );
}
