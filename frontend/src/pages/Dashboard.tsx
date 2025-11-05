import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

const RESUMEN_PIPELINE = [
  {
    title: "Pipeline activo",
    description: "Monitorea el avance de cada vacante y detecta cuellos de botella a tiempo.",
    icon: "PA",
    accent: "#00ABE4",
  },
  {
    title: "Agenda de entrevistas",
    description: "Coordina paneles, confirma asistentes y evita solapamientos en la agenda.",
    icon: "IN",
    accent: "#58C6F5",
  },
  {
    title: "Ofertas y aprobaciones",
    description: "Controla propuestas, firmas pendientes y tiempos de respuesta de lideres.",
    icon: "OF",
    accent: "#B5E3FB",
  },
];

const ACCESOS_RAPIDOS = [
  {
    label: "Biblioteca de vacantes",
    description: "Modelos de descripcion, competencias y bandas salariales para publicar rapido.",
    icon: "BV",
  },
  {
    label: "Automatizacion con IA",
    description: "Prioriza candidatos con scoring inteligente y respuestas asistidas.",
    icon: "IA",
  },
  {
    label: "Reportes ejecutivos",
    description: "Visibilidad de tiempos de cobertura, conversiones y performance por tenant.",
    icon: "RE",
  },
];

function Dashboard() {
  const { user } = useAuth();
  const displayName = useMemo(() => user?.email?.split("@")[0] ?? "Equipo Talent Flow", [user]);

  return (
    <div className="dashboard">
      <header className="dashboard__hero">
        <div>
          <h1>Hola, {displayName}</h1>
          <p>
            Haz seguimiento a tu pipeline completo: desde la publicacion hasta la aceptacion de la oferta, con datos en
            tiempo real para decidir mas rapido.
          </p>
          <div className="dashboard__actions">
            <button className="button button--primary">Crear nueva vacante</button>
            <button className="button button--ghost">Ver tableros</button>
          </div>
        </div>
        <div className="dashboard__hero-illustration" aria-hidden>
          <span>Talent Flow</span>
        </div>
      </header>

      <section className="dashboard__widgets">
        {RESUMEN_PIPELINE.map((widget) => (
          <article key={widget.title} className="dashboard__widget">
            <div className="dashboard__widget-icon" style={{ backgroundColor: widget.accent }}>
              {widget.icon}
            </div>
            <h3>{widget.title}</h3>
            <p>{widget.description}</p>
            <button className="dashboard__widget-action" type="button">
              Ver detalles
            </button>
          </article>
        ))}
      </section>

      <section className="dashboard__quick">
        <h2>Accesos rapidos</h2>
        <div className="dashboard__quick-grid">
          {ACCESOS_RAPIDOS.map((item) => (
            <article key={item.label} className="dashboard__quick-card">
              <span aria-hidden>{item.icon}</span>
              <div>
                <h3>{item.label}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;

