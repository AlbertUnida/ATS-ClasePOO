import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEFAULT_EMAIL = "super@tuempresa.com";
const DEFAULT_PASSWORD = "Super123!";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [correo, setCorreo] = useState(DEFAULT_EMAIL);
  const [clave, setClave] = useState(DEFAULT_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login({ email: correo, password: clave });
      navigate("/panel", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <section className="login-screen__hero">
        <div className="login-screen__mark">
          <span className="login-screen__mark-pill">Talent Flow ats</span>
          <h1>Reclutá desde un panel unificado</h1>
          <p>
            Supervisa cada vacante, entrevista y oferta en tiempo real. Manten a todo el equipo alineado y acelera la
            contratacion de talento clave.
          </p>
        </div>
        <div className="login-screen__badge" aria-hidden>
          <span>Te Conectamos</span>
          <span>con los mejores</span>
        </div>
      </section>

      <section className="login-screen__panel">
        <div className="login-card">
          <h2>Ingresa a Talent Flow ATS</h2>
          <p className="login-card__subtitle">
            Accede con tu usuario corporativo y continua donde dejaste tu trabajo.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Correo electronico
              <input
                type="email"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                required
                autoComplete="username"
              />
            </label>

            <label>
              Contrasena
              <input
                type="password"
                value={clave}
                onChange={(event) => setClave(event.target.value)}
                required
                autoComplete="current-password"
                minLength={8}
              />
            </label>

            <button type="submit" className="button button--primary" disabled={loading}>
              {loading ? "Verificando..." : "Ingresar"}
            </button>
          </form>

          <div className="login-card__footer">
            <a href="#">Olvidaste tu acceso?</a>
            <small>Soporte: talento@tuempresa.com</small>
          </div>

          {error && <div className="alert alert--error">{error}</div>}
        </div>
      </section>
    </div>
  );
}

export default Login;
