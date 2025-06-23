import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import api from '../api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const { register, error: authError, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });

    // Validaciones
    let hasErrors = false;
    const newFieldErrors = {
      name: !name ? 'El nombre es requerido' : '',
      email: !email ? 'El email es requerido' : '',
      password: !password ? 'La contraseña es requerida' : '',
      confirmPassword: !confirmPassword ? 'Confirma tu contraseña' : ''
    };

    if (Object.values(newFieldErrors).some(error => error)) {
      setFieldErrors(newFieldErrors);
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({
        ...newFieldErrors,
        password: 'Las contraseñas no coinciden',
        confirmPassword: 'Las contraseñas no coinciden'
      });
      return;
    }

    if (password.length < 6) {
      setFieldErrors({
        ...newFieldErrors,
        password: 'La contraseña debe tener al menos 6 caracteres'
      });
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        nombre: name,
        email,
        password
      });

      if (response.status === 201 && response.data?.user && response.data?.token) {
        const userData = {
          id: response.data.user.id,
          name: response.data.user.nombre,
          email: response.data.user.email,
          token: response.data.token
        };

        const success = await register(userData);
        
        if (success) {
          navigate('/', { replace: true });
        }
      } else {
        throw new Error('La respuesta del servidor no tiene el formato esperado');
      }
    } catch (err) {
      console.error('Register error:', err);
      
      if (err.response) {
        switch (err.response.status) {
          case 400:
            if (err.response.data?.errors) {
              setFieldErrors({
                ...fieldErrors,
                ...err.response.data.errors
              });
            } else {
              setFormError(err.response.data?.message || 'Datos inválidos');
            }
            break;
          case 409:
            setFieldErrors({
              ...fieldErrors,
              email: 'Este email ya está registrado'
            });
            setFormError('El email ya está registrado');
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
        <h2>Crear Cuenta</h2>
        
        {(formError || authError) && (
          <div className="auth-error">
            {formError || authError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors({ ...fieldErrors, name: '' });
              }}
              placeholder="Tu nombre"
              disabled={authLoading}
              className={fieldErrors.name ? 'input-error' : ''}
              required
            />
            {fieldErrors.name && (
              <span className="field-error">{fieldErrors.name}</span>
            )}
          </div>
          
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
          
          <div className="form-group">
            <label>Confirmar Contraseña:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldErrors({ ...fieldErrors, confirmPassword: '' });
              }}
              placeholder="••••••••"
              disabled={authLoading}
              className={fieldErrors.confirmPassword ? 'input-error' : ''}
              required
              minLength="6"
            />
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={authLoading}
          >
            {authLoading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        
        <div className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;