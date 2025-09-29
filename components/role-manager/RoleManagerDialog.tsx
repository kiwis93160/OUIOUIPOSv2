import React from 'react';
import Modal from '../Modal';
import RoleForm from './RoleForm';
import RoleList from './RoleList';
import { useRoleManager } from './useRoleManager';

interface RoleManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoleManagerDialog: React.FC<RoleManagerDialogProps> = ({ isOpen, onClose }) => {
  const {
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
  } = useRoleManager({ isOpen, onClose });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Gestion des rôles" size="xl">
      <div className="space-y-6">
        {statusMessage && (
          <div className="rounded-md bg-green-100 px-4 py-2 text-sm text-green-800">{statusMessage}</div>
        )}
        {errorMessage && (
          <div className="rounded-md bg-red-100 px-4 py-2 text-sm text-red-800">{errorMessage}</div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <RoleList
            roles={roles}
            isFetching={isFetching}
            onCreateRole={resetForm}
            onSelectRole={handleSelectRole}
            onDeleteRole={handleDeleteRole}
            selectedRoleId={formState.id}
            isEditing={mode === 'edit'}
            deletingRoleId={deletingRoleId}
            getPermissionLabel={getPermissionLabel}
          />

          <RoleForm
            mode={mode}
            formState={formState}
            onSubmit={handleSubmit}
            onInputChange={handleInputChange}
            onHomePageChange={handleHomePageChange}
            onPermissionChange={handlePermissionChange}
            onCancel={resetForm}
            isSubmitting={isSubmitting}
            hasAccessibleHomePage={hasAccessibleHomePage}
            permissionKeys={permissionKeys}
            getPermissionLabel={getPermissionLabel}
            isPermissionGranted={isPermissionGranted}
          />
        </div>
      </div>
    </Modal>
  );
};

export default RoleManagerDialog;
