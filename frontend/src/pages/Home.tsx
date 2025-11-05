import { Link } from "react-router-dom";

const INSIGHTS = [
  {
    title: "Mapea tu pipeline",
    description: "Identifica etapas criticas, asigna responsables y asegura tiempos de respuesta por rol.",
    icon: "PL",
  },
  {
    title: "Plantillas y checklists",
    description: "Estandariza evaluaciones, feedback y comunicaciones con candidatos.",
    icon: "PC",
  },
  {
    title: "Analitica en tiempo real",
    description: "Comparte metricas de contratacion, rotacion y velocidad con tu organizacion.",
    icon: "AN",
  },
];

const HIGHLIGHTS = [
  {
    label: "Vacantes activas",
    value: "32",
    tone: "verde",
  },
  {
    label: "Candidatos en evaluacion",
    value: "148",
    tone: "azul",
  },
  {
    label: "Ofertas en curso",
    value: "11",
    tone: "naranja",
  },
];

function Home() {
  return (
    <div className="home">
      <section className="home__hero">
        <div>
          <h1>Talent Flow ats</h1>
          <p>
            El centro de mando para coordinar reclutamiento, entrevistas y aprobaciones en organizaciones multi-tenant.
          </p>
          <div className="home__hero-actions">
            <Link to="/vacantes/tenant" className="button button--primary">
              Gestionar vacantes
            </Link>
            <Link to="/vacantes" className="button button--ghost">
              Revisar postulaciones
            </Link>
          </div>
        </div>
        <div className="home__hero-badge" aria-hidden>
          <span>Gestion</span>
          <span>de talento</span>
        </div>
      </section>

      <section className="home__stats">
        {HIGHLIGHTS.map((item) => (
          <article key={item.label} className="home__stat">
            <p>{item.label}</p>
            <strong className={`home__stat-value home__stat-value--${item.tone}`}>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="home__insights">
        {INSIGHTS.map((card) => (
          <article key={card.title} className="home__insight-card">
            <div className="home__insight-icon" aria-hidden>
              {card.icon}
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <button className="home__insight-action" type="button">
              Abrir Modulo
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Home;

