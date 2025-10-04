import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Ctrl + S', description: 'Enregistrer les modifications' },
  { key: 'Ctrl + Z', description: 'Annuler la dernière action' },
  { key: 'Ctrl + Shift + Z', description: 'Refaire la dernière action' },
  { key: 'Ctrl + Y', description: 'Refaire la dernière action' },
  { key: 'Ctrl + R', description: 'Réinitialiser aux valeurs par défaut' },
  { key: 'Échap', description: 'Fermer la modale active' },
];

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Raccourcis clavier
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-3">
            {SHORTCUTS.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 text-slate-700 rounded border">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Ces raccourcis fonctionnent dans toute l'interface de personnalisation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;