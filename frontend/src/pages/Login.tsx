import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('super@tuempresa.com');
  const [password, setPassword] = useState('Super123!');
  const [tenantSlug, setTenantSlug] = useState('root');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login({ email, password, tenantSlug });
      navigate('/panel', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Iniciar sesión</h2>
      <p>
        Usa las credenciales del usuario que creaste en el backend. El formulario enviará la petición al endpoint{' '}
        <code>POST /auth/login</code> y guardará la sesión en esta aplicación.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <label>
          Tenant (slug)
          <input value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)} placeholder="ej: tecnoedil" />
        </label>

        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Verificando...' : 'Iniciar sesión'}
        </button>
      </form>

      {error && <div className="alert alert--error">{error}</div>}
    </section>
  );
}

export default Login;
