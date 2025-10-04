import React from 'react';
import { Palette, Download, Upload } from 'lucide-react';
import { SiteContent } from '../types';

interface Preset {
  id: string;
  name: string;
  description: string;
  preview: string;
  content: Partial<SiteContent>;
}

const PRESETS: Preset[] = [
  {
    id: 'modern-minimal',
    name: 'Moderne Minimaliste',
    description: 'Design épuré avec des couleurs neutres',
    preview: 'bg-gradient-to-br from-slate-50 to-slate-100',
    content: {
      navigation: {
        style: {
          background: { type: 'color', color: '#ffffff', image: null },
          fontFamily: 'Inter',
          fontSize: '16px',
          textColor: '#1f2937',
        },
      },
      hero: {
        style: {
          background: { type: 'color', color: '#f8fafc', image: null },
          fontFamily: 'Inter',
          fontSize: '18px',
          textColor: '#1f2937',
        },
      },
    },
  },
  {
    id: 'warm-vibrant',
    name: 'Chaleureux et Vibrant',
    description: 'Couleurs chaudes et énergiques',
    preview: 'bg-gradient-to-br from-orange-50 to-red-50',
    content: {
      navigation: {
        style: {
          background: { type: 'color', color: '#f97316', image: null },
          fontFamily: 'Poppins',
          fontSize: '16px',
          textColor: '#ffffff',
        },
      },
      hero: {
        style: {
          background: { type: 'color', color: '#fed7aa', image: null },
          fontFamily: 'Poppins',
          fontSize: '18px',
          textColor: '#7c2d12',
        },
      },
    },
  },
  {
    id: 'elegant-dark',
    name: 'Élégant Sombre',
    description: 'Thème sombre sophistiqué',
    preview: 'bg-gradient-to-br from-slate-800 to-slate-900',
    content: {
      navigation: {
        style: {
          background: { type: 'color', color: '#0f172a', image: null },
          fontFamily: 'Inter',
          fontSize: '16px',
          textColor: '#f1f5f9',
        },
      },
      hero: {
        style: {
          background: { type: 'color', color: '#1e293b', image: null },
          fontFamily: 'Inter',
          fontSize: '18px',
          textColor: '#f8fafc',
        },
      },
    },
  },
];

interface PresetSelectorProps {
  onPresetSelect: (preset: Preset) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({
  onPresetSelect,
  onExport,
  onImport,
}) => {
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Thèmes prédéfinis
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="ui-btn-secondary flex items-center gap-2 text-sm"
          >
            <Download className="h-4 w-4" />
            Exporter
          </button>
          <label className="ui-btn-secondary flex items-center gap-2 text-sm cursor-pointer">
            <Upload className="h-4 w-4" />
            Importer
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onPresetSelect(preset)}
            className="text-left p-4 rounded-lg border border-slate-200 hover:border-brand-primary/50 hover:shadow-md transition-all group"
          >
            <div className={`w-full h-20 rounded-md mb-3 ${preset.preview}`} />
            <h4 className="font-medium text-slate-900 group-hover:text-brand-primary transition-colors">
              {preset.name}
            </h4>
            <p className="text-sm text-slate-500 mt-1">{preset.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PresetSelector;