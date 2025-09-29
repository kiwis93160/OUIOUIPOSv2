import React from 'react';
import { Role } from '../../types';
import { PermissionLevel } from './useRoleManager';

interface PermissionMatrixProps {
  permissionKeys: string[];
  permissions: Role['permissions'];
  onChange: (key: string, value: PermissionLevel) => void;
  getPermissionLabel: (key: string) => string;
}

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  permissionKeys,
  permissions,
  onChange,
  getPermissionLabel,
}) => (
  <div className="max-h-60 space-y-3 overflow-y-auto rounded-md border border-gray-200 p-3">
    {permissionKeys.map(key => (
      <div key={key} className="flex items-center justify-between space-x-4">
        <span className="text-sm font-medium text-gray-700">{getPermissionLabel(key)}</span>
        <select
          value={permissions[key] ?? 'none'}
          onChange={event => onChange(key, event.target.value as PermissionLevel)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
        >
          <option value="editor">Éditeur</option>
          <option value="readonly">Lecture seule</option>
          <option value="none">Aucun accès</option>
        </select>
      </div>
    ))}
  </div>
);

export default PermissionMatrix;
