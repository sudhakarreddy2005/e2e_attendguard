import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ForbiddenPage } from '../../pages/ForbiddenPage';

interface ProtectedPermissionRouteProps {
  permission: string;
  children: React.ReactNode;
}

export const ProtectedPermissionRoute: React.FC<ProtectedPermissionRouteProps> = ({
  permission,
  children,
}) => {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(permission)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
};
