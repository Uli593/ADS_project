import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicializar desde localStorage al cargar la app
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('mindmap_user');
        const storedToken = localStorage.getItem('mindmap_jwt');
        
        if (storedUser && storedToken) {
          setUser({
            ...JSON.parse(storedUser),
            token: storedToken
          });
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
        clearAuthData();
        setError('Error al cargar la sesión');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem('mindmap_user');
    localStorage.removeItem('mindmap_jwt');
  };

  const saveAuthData = (userData, token) => {
    localStorage.setItem('mindmap_user', JSON.stringify({
      id: userData.id,
      name: userData.name,
      email: userData.email
    }));
    localStorage.setItem('mindmap_jwt', token);
  };

  const login = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      saveAuthData(userData, userData.token);
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        token: userData.token
      });
      return true;
    } catch (err) {
      console.error("Login error:", err);
      clearAuthData();
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      saveAuthData(userData, userData.token);
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        token: userData.token
      });
      return true;
    } catch (err) {
      console.error("Register error:", err);
      clearAuthData();
      setError(err.message || 'Error al registrar usuario');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
      clearAuthData();
      setUser(null);
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};