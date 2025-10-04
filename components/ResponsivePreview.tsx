import React, { useState } from 'react';
import { Monitor, Tablet, Smartphone, Maximize2 } from 'lucide-react';
import { SiteContent, Product } from '../types';
import SitePreviewCanvas from './SitePreviewCanvas';

interface ResponsivePreviewProps {
  content: SiteContent;
  bestSellerProducts: Product[];
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const ResponsivePreview: React.FC<ResponsivePreviewProps> = ({
  content,
  bestSellerProducts,
}) => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  const deviceConfig = {
    desktop: {
      width: '100%',
      maxWidth: '1200px',
      icon: Monitor,
      label: 'Desktop',
    },
    tablet: {
      width: '768px',
      maxWidth: '768px',
      icon: Tablet,
      label: 'Tablet',
    },
    mobile: {
      width: '375px',
      maxWidth: '375px',
      icon: Smartphone,
      label: 'Mobile',
    },
  };

  const currentConfig = deviceConfig[deviceType];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Aperçu responsive</h3>
        <div className="flex items-center gap-2">
          {Object.entries(deviceConfig).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={type}
                onClick={() => setDeviceType(type as DeviceType)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  deviceType === type
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className="relative border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden transition-all duration-300"
          style={{
            width: currentConfig.width,
            maxWidth: currentConfig.maxWidth,
          }}
        >
          <div className="p-4">
            <SitePreviewCanvas
              content={content}
              bestSellerProducts={bestSellerProducts}
              onEdit={() => undefined}
              activeZone={null}
              showEditButtons={false}
            />
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-slate-500">
        Aperçu {currentConfig.label} • {currentConfig.width}
      </div>
    </div>
  );
};

export default ResponsivePreview;