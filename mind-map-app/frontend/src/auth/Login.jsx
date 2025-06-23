import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import api from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  });
  
  const { login, error: authError, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({ email: '', password: '' });

    // Validación básica del cliente
    if (!email || !password) {
      setFieldErrors({
        email: !email ? 'El email es requerido' : '',
        password: !password ? 'La contraseña es requerida' : ''
      });
      return;
    }

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data?.user && response.data?.token) {
        const userData = {
          id: response.data.user.id,
          name: response.data.user.nombre,
          email: response.data.user.email,
          token: response.data.token
        };

        const success = await login(userData);
        
        if (success) {
          navigate(location.state?.from?.pathname || '/', { replace: true });
        }
      } else {
        throw new Error('La respuesta del servidor no tiene el formato esperado');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response) {
        switch (err.response.status) {
          case 400:
            if (err.response.data?.errors) {
              setFieldErrors({
                email: err.response.data.errors.email || '',
                password: err.response.data.errors.password || ''
              });
            } else {
              setFormError(err.response.data?.message || 'Datos inválidos');
            }
            break;
          case 401:
            setFormError('Credenciales incorrectas');
            break;
          case 404:
            setFormError('Usuario no encontrado');
            break;
          default:
            setFormError('Error en el servidor. Por favor, inténtalo más tarde');
        }
      } else {
        setFormError(err.message || 'Error de conexión');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Iniciar Sesión</h2>
        
        {(formError || authError) && (
          <div className="auth-error">
            {formError || authError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors({ ...fieldErrors, email: '' });
              }}
              placeholder="tu@email.com"
              disabled={authLoading}
              className={fieldErrors.email ? 'input-error' : ''}
              required
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>
          
          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors({ ...fieldErrors, password: '' });
              }}
              placeholder="••••••••"
              disabled={authLoading}
              className={fieldErrors.password ? 'input-error' : ''}
              required
              minLength="6"
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={authLoading}
          >
            {authLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        
        <div className="auth-footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          <div className="forgot-password">
            <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;