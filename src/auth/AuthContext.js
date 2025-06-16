import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicializar desde localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('mindmap_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        localStorage.removeItem('mindmap_user');
        setError('Error al cargar la sesión');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 500));
      const userInfo = {
        ...userData,
        token: `mock-token-${Math.random().toString(36).substr(2)}`
      };
      localStorage.setItem('mindmap_user', JSON.stringify(userInfo));
      setUser(userInfo);
      return true; // Éxito
    } catch (err) {
      setError('Credenciales incorrectas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar si el usuario ya existe
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      if (users.some(u => u.email === userData.email)) {
        throw new Error('El email ya está registrado');
      }
      
      const userInfo = {
        ...userData,
        token: `mock-token-${Math.random().toString(36).substr(2)}`
      };
      
      localStorage.setItem('mindmap_user', JSON.stringify(userInfo));
      localStorage.setItem('registeredUsers', JSON.stringify([...users, userInfo]));
      setUser(userInfo);
      return true; // Éxito
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('mindmap_user');
    setUser(null);
  }, []);

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