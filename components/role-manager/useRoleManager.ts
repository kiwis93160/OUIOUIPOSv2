import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { NAV_LINKS, ROLE_HOME_PAGE_META_KEY, ROLES, SITE_CUSTOMIZER_PERMISSION_KEY } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Role } from '../../types';

export type PermissionLevel = Role['permissions'][string];

export interface RoleFormState {
  id?: string;
  name: string;
  pin: string;
  homePage: string;
  permissions: Role['permissions'];
}

interface UseRoleManagerArgs {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_HOME_PAGE = NAV_LINKS[0]?.permissionKey ?? '/dashboard';

const isAdminRoleName = (name?: string | null): boolean => {
  if (!name) {
    return false;
  }

  const normalized = name.trim().toLowerCase();
  return normalized === ROLES.ADMIN || normalized === 'administrateur';
};

const ensureNavPermissions = (
  permissions?: Role['permissions'],
  roleName?: string | null,
): Role['permissions'] => {
  const base: Record<string, PermissionLevel> = { ...(permissions || {}) };
  delete base[ROLE_HOME_PAGE_META_KEY];

  NAV_LINKS.forEach(link => {
    if (!(link.permissionKey in base)) {
      if (link.permissionKey === SITE_CUSTOMIZER_PERMISSION_KEY && isAdminRoleName(roleName)) {
        base[link.permissionKey] = 'editor';
      } else {
        base[link.permissionKey] = 'none';
      }
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

export const isPermissionGranted = (permission?: PermissionLevel) => permission === 'editor' || permission === 'readonly';

export const useRoleManager = ({ isOpen, onClose }: UseRoleManagerArgs) => {
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
        if (key === ROLE_HOME_PAGE_META_KEY) {
          return;
        }
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

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
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
    const permissions = ensureNavPermissions(role.permissions, role.name);
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
      setErrorMessage("Impossible de supprimer le rôle.");
    } finally {
      setDeletingRoleId(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!formState.name.trim() || !formState.pin.trim()) {
      setErrorMessage('Le nom et le code PIN sont obligatoires.');
      return;
    }

    setIsSubmitting(true);

    try {
      const permissions = ensureNavPermissions(formState.permissions, formState.name);
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
        const nextPermissions = ensureNavPermissions(updatedRole.permissions, updatedRole.name);
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
      setErrorMessage("Impossible d'enregistrer le rôle.");
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

  return {
    roles,
    formState,
    mode,
    isFetching,
    isSubmitting,
    deletingRoleId,
    statusMessage,
    errorMessage,
    permissionKeys,
    hasAccessibleHomePage,
    handleInputChange,
    handlePermissionChange,
    handleHomePageChange,
    handleSelectRole,
    handleDeleteRole,
    handleSubmit,
    handleClose,
    resetForm,
    getPermissionLabel,
    isPermissionGranted,
  };
};

export type UseRoleManagerReturn = ReturnType<typeof useRoleManager>;
