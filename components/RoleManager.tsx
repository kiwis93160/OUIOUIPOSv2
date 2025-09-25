import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { api } from '../services/api';
import { NAV_LINKS } from '../constants';
import { Role } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface RoleManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type PermissionLevel = Role['permissions'][string];

interface RoleFormState {
  id?: string;
  name: string;
  pin: string;
  homePage: string;
  permissions: Role['permissions'];
}

const DEFAULT_HOME_PAGE = NAV_LINKS[0]?.permissionKey ?? '/dashboard';
const isPermissionGranted = (permission?: PermissionLevel) => permission === 'editor' || permission === 'readonly';

const ensureNavPermissions = (permissions?: Role['permissions']): Role['permissions'] => {
  const base: Role['permissions'] = { ...(permissions || {}) };
  NAV_LINKS.forEach(link => {
    if (!(link.permissionKey in base)) {
      base[link.permissionKey] = 'none';
    }
  });
  return base;
};

const getDefaultHomePage = (permissions: Role['permissions']): string => {
  const accessibleLink = NAV_LINKS.find(link => isPermissionGranted(permissions[link.permissionKey]));
  return accessibleLink?.permissionKey ?? DEFAULT_HOME_PAGE;
};

const createEmptyFormState = (): RoleFormState => {
  const permissions = ensureNavPermissions();
  return {
    name: '',
    pin: '',
    permissions,
    homePage: getDefaultHomePage(permissions),
  };
};

const RoleManager: React.FC<RoleManagerProps> = ({ isOpen, onClose }) => {
  const { refreshRole, role: currentRole } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [formState, setFormState] = useState<RoleFormState>(createEmptyFormState);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const permissionKeys = useMemo(() => {
    const navKeys = NAV_LINKS.map(link => link.permissionKey);
    const extraKeys = new Set<string>();

    roles.forEach(role => {
      Object.keys(role.permissions).forEach(key => {
        if (!navKeys.includes(key)) {
          extraKeys.add(key);
        }
      });
    });

    return [...navKeys, ...Array.from(extraKeys)];
  }, [roles]);

  const hasAccessibleHomePage = useMemo(
    () => NAV_LINKS.some(link => isPermissionGranted(formState.permissions[link.permissionKey])),
    [formState.permissions],
  );

  const loadRoles = useCallback(async () => {
    setIsFetching(true);
    try {
      const fetchedRoles = await api.getRoles();
      setRoles(fetchedRoles);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to load roles:', error);
      setErrorMessage('Impossible de charger les rôles.');
    } finally {
      setIsFetching(false);
    }
  }, []);

  const resetForm = useCallback(() => {
    setMode('create');
    setFormState(createEmptyFormState());
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setStatusMessage(null);
    setErrorMessage(null);
    resetForm();
    loadRoles();
  }, [isOpen, loadRoles, resetForm]);

  useEffect(() => {
    setFormState(prev => {
      const currentHomePage = prev.homePage;
      if (isPermissionGranted(prev.permissions[currentHomePage])) {
        return prev;
      }

      const fallbackHomePage = getDefaultHomePage(prev.permissions);
      if (fallbackHomePage === currentHomePage) {
        return prev;
      }

      return {
        ...prev,
        homePage: fallbackHomePage,
      };
    });
  }, [formState.permissions]);

  const getPermissionLabel = useCallback((key: string) => {
    const navLink = NAV_LINKS.find(link => link.permissionKey === key);
    return navLink ? navLink.name : key;
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePermissionChange = (key: string, value: PermissionLevel) => {
    setFormState(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: value,
      },
    }));
  };

  const handleHomePageChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      homePage: value,
    }));
  };

  const handleSelectRole = (role: Role) => {
    const permissions = ensureNavPermissions(role.permissions);
    setMode('edit');
    setFormState({
      id: role.id,
      name: role.name,
      pin: role.pin ?? '',
      permissions,
      homePage: role.homePage ?? getDefaultHomePage(permissions),
    });
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Supprimer ce rôle ? Cette action est irréversible.')) {
      return;
    }

    setDeletingRoleId(roleId);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await api.deleteRole(roleId);
      setStatusMessage('Rôle supprimé avec succès.');
      if (mode === 'edit' && formState.id === roleId) {
        resetForm();
      }
      await loadRoles();
      if (currentRole?.id === roleId) {
        await refreshRole();
      }
    } catch (error) {
      console.error('Failed to delete role:', error);
      setErrorMessage('Impossible de supprimer le rôle.');
    } finally {
      setDeletingRoleId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!formState.name.trim() || !formState.pin.trim()) {
      setErrorMessage('Le nom et le code PIN sont obligatoires.');
      return;
    }

    setIsSubmitting(true);

    try {
      const permissions = ensureNavPermissions(formState.permissions);
      const resolvedHomePage = isPermissionGranted(permissions[formState.homePage])
        ? formState.homePage
        : getDefaultHomePage(permissions);

      if (mode === 'create') {
        await api.createRole({
          name: formState.name.trim(),
          pin: formState.pin.trim(),
          permissions,
          homePage: resolvedHomePage,
        });
        setStatusMessage('Rôle créé avec succès.');
        await loadRoles();
        await refreshRole();
        resetForm();
      } else if (formState.id) {
        const updatedRole = await api.updateRole(formState.id, {
          name: formState.name.trim(),
          pin: formState.pin.trim(),
          permissions,
          homePage: resolvedHomePage,
        });
        setStatusMessage('Rôle mis à jour avec succès.');
        const nextPermissions = ensureNavPermissions(updatedRole.permissions);
        setFormState({
          id: updatedRole.id,
          name: updatedRole.name,
          pin: updatedRole.pin ?? '',
          permissions: nextPermissions,
          homePage: updatedRole.homePage ?? getDefaultHomePage(nextPermissions),
        });
        await loadRoles();
        if (currentRole?.id === updatedRole.id) {
          await refreshRole();
        }
      }
    } catch (error) {
      console.error('Failed to save role:', error);
      setErrorMessage('Impossible d\'enregistrer le rôle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setStatusMessage(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Gestion des rôles" size="xl">
      <div className="space-y-6">
        {statusMessage && (
          <div className="rounded-md bg-green-100 px-4 py-2 text-sm text-green-800">
            {statusMessage}
          </div>
        )}
        {errorMessage && (
          <div className="rounded-md bg-red-100 px-4 py-2 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-800">Rôles existants</h4>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center rounded-md border border-brand-primary px-3 py-1.5 text-sm font-medium text-brand-primary hover:bg-brand-primary/10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouveau rôle
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto rounded-md border border-gray-200 p-3 max-h-80">
              {isFetching ? (
                <p className="text-sm text-gray-500">Chargement des rôles...</p>
              ) : roles.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun rôle configuré pour le moment.</p>
              ) : (
                roles.map(role => (
                  <div
                    key={role.id}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                      formState.id === role.id && mode === 'edit' ? 'border-brand-primary bg-brand-primary/10' : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{role.name}</p>
                      <p className="text-xs text-gray-500">PIN : {role.pin ?? '—'}</p>
                      {role.homePage && (
                        <p className="text-xs text-gray-500">Accueil : {getPermissionLabel(role.homePage)}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSelectRole(role)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={deletingRoleId === role.id}
                        className="inline-flex items-center rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-gray-800">
              {mode === 'edit' ? 'Modifier le rôle sélectionné' : 'Créer un nouveau rôle'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="role-name" className="mb-1 block text-sm font-medium text-gray-700">
                  Nom du rôle
                </label>
                <input
                  id="role-name"
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  placeholder="Ex. Manager"
                />
              </div>
              <div>
                <label htmlFor="role-pin" className="mb-1 block text-sm font-medium text-gray-700">
                  Code PIN d'accès
                </label>
                <input
                  id="role-pin"
                  name="pin"
                  value={formState.pin}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  placeholder="Ex. 1234"
                />
              </div>
              <div>
                <label htmlFor="role-home-page" className="mb-1 block text-sm font-medium text-gray-700">
                  Page d'accueil par défaut
                </label>
                <select
                  id="role-home-page"
                  name="homePage"
                  value={formState.homePage}
                  onChange={event => handleHomePageChange(event.target.value)}
                  disabled={!hasAccessibleHomePage}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  {NAV_LINKS.map(link => {
                    const canAccess = isPermissionGranted(formState.permissions[link.permissionKey]);
                    return (
                      <option key={link.permissionKey} value={link.permissionKey} disabled={!canAccess}>
                        {getPermissionLabel(link.permissionKey)}{!canAccess ? ' (accès requis)' : ''}
                      </option>
                    );
                  })}
                </select>
                {hasAccessibleHomePage ? (
                  <p className="mt-1 text-xs text-gray-500">Les pages sans permission sont désactivées.</p>
                ) : (
                  <p className="mt-1 text-xs text-red-600">Accordez au moins une permission pour choisir une page d'accueil.</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-800">Permissions par page</p>
                <div className="space-y-3 rounded-md border border-gray-200 p-3 max-h-60 overflow-y-auto">
                  {permissionKeys.map(key => (
                    <div key={key} className="flex items-center justify-between space-x-4">
                      <span className="text-sm font-medium text-gray-700">{getPermissionLabel(key)}</span>
                      <select
                        value={formState.permissions[key] ?? 'none'}
                        onChange={event => handlePermissionChange(key, event.target.value as PermissionLevel)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      >
                        <option value="editor">Éditeur</option>
                        <option value="readonly">Lecture seule</option>
                        <option value="none">Aucun accès</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Enregistrement...' : mode === 'edit' ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RoleManager;
