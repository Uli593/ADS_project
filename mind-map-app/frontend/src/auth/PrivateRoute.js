import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loader">Cargando...</div>;
  }

  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;