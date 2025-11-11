import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  AutomationRule,
  createAutomationRule,
  createEmailTemplate,
  EmailTemplate,
  fetchAutomationRules,
  fetchEmailTemplates,
  updateAutomationRule,
  updateEmailTemplate,
} from "../api/backend";

const TRIGGERS = [
  { value: "postulacion.creada", label: "Postulación creada" },
  { value: "postulacion.estado_cambiado", label: "Cambio de estado" },
];

const ACTIONS = [{ value: "send_email_template", label: "Enviar correo con plantilla" }];

function AutomationsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin;
  const [tenantSlug, setTenantSlug] = useState(user?.tenant ?? "");

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [templateForm, setTemplateForm] = useState({
    name: "",
    code: "",
    subject: "",
    body: "",
  });

  const [ruleForm, setRuleForm] = useState({
    name: "",
    description: "",
    trigger: TRIGGERS[0].value,
    action: ACTIONS[0].value,
    templateCode: "",
    conditions: '{"estado":"postulado"}',
  });

  useEffect(() => {
    if (!tenantSlug) return;
    void loadData();
  }, [tenantSlug]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tpls, rls] = await Promise.all([
        fetchEmailTemplates({ tenant: tenantSlug }),
        fetchAutomationRules({ tenant: tenantSlug }),
      ]);
      setTemplates(tpls);
      setRules(rls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las automatizaciones.");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantSlug) {
      setError("Debes indicar un tenant.");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await createEmailTemplate({
        tenantSlug,
        ...templateForm,
      });
      setTemplateForm({ name: "", code: "", subject: "", body: "" });
      setMessage("Plantilla registrada.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la plantilla.");
    }
  };

  const handleRuleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantSlug) {
      setError("Debes indicar un tenant.");
      return;
    }
    let parsedConditions: Record<string, any> | undefined;
    try {
      parsedConditions = ruleForm.conditions ? JSON.parse(ruleForm.conditions) : undefined;
    } catch {
      setError("Condiciones inválidas. Usa JSON válido.");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await createAutomationRule({
        tenantSlug,
        name: ruleForm.name,
        description: ruleForm.description || undefined,
        trigger: ruleForm.trigger,
        action: ruleForm.action,
        conditionsJson: parsedConditions,
        actionConfigJson: ruleForm.templateCode ? { templateCode: ruleForm.templateCode } : undefined,
      });
      setRuleForm((prev) => ({ ...prev, name: "", description: "", templateCode: "" }));
      setMessage("Regla creada.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la regla.");
    }
  };

  const toggleTemplateActive = async (id: string, current: boolean) => {
    setError(null);
    try {
      await updateEmailTemplate(id, { active: !current, tenantSlug });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la plantilla.");
    }
  };

  const toggleRuleActive = async (id: string, current: boolean) => {
    setError(null);
    try {
      await updateAutomationRule(id, { active: !current, tenantSlug });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la regla.");
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Automatizaciones</p>
          <h1>Automatizar etapas y comunicaciones</h1>
          <p>Configura plantillas de correo y reglas para enviar mensajes en cada etapa del proceso.</p>
        </div>
        {isSuperAdmin && (
          <label className="inline-field">
            Tenant
            <input value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)} placeholder="root" />
          </label>
        )}
      </header>

      {(message || error) && (
        <div className={`alert ${error ? "alert--error" : "alert--success"}`}>{error ?? message}</div>
      )}

      <section className="grid-two">
        <article className="card">
          <header className="card__header">
            <div>
              <h2>Plantillas de correo</h2>
              <p>Define los contenidos que se enviarán automáticamente.</p>
            </div>
          </header>

          {loading ? (
            <p className="muted">Cargando...</p>
          ) : templates.length === 0 ? (
            <p className="muted">Aún no hay plantillas registradas.</p>
          ) : (
            <ul className="template-list">
              {templates.map((template) => (
                <li key={template.id} className="template-list__item">
                  <div>
                    <p className="template-list__name">{template.name}</p>
                    <p className="muted">
                      Código: <code>{template.code}</code>
                    </p>
                    <p className="muted">{template.subject}</p>
                  </div>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => void toggleTemplateActive(template.id, template.active)}
                  >
                    {template.active ? "Desactivar" : "Activar"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card">
          <header className="card__header">
            <h2>Nueva plantilla</h2>
            <p>Personaliza asunto y cuerpo usando variables (ej. {"{{candidato.nombre}}"}, {"{{vacante.cargo}}"}).</p>
          </header>
          <form className="form" onSubmit={handleTemplateSubmit}>
            <label>
              Nombre
              <input
                value={templateForm.name}
                onChange={(event) => setTemplateForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label>
              Código
              <input
                value={templateForm.code}
                onChange={(event) => setTemplateForm((prev) => ({ ...prev, code: event.target.value }))}
                required
              />
            </label>
            <label>
              Asunto
              <input
                value={templateForm.subject}
                onChange={(event) => setTemplateForm((prev) => ({ ...prev, subject: event.target.value }))}
                required
              />
            </label>
            <label>
              Contenido
              <textarea
                rows={4}
                value={templateForm.body}
                onChange={(event) => setTemplateForm((prev) => ({ ...prev, body: event.target.value }))}
                required
              />
            </label>
            <button type="submit" className="button" disabled={loading}>
              Guardar plantilla
            </button>
          </form>
        </article>
      </section>

      <section className="grid-two">
        <article className="card">
          <header className="card__header">
            <div>
              <h2>Reglas configuradas</h2>
              <p>Automatiza correos según disparadores y condiciones.</p>
            </div>
          </header>
          {loading ? (
            <p className="muted">Cargando...</p>
          ) : rules.length === 0 ? (
            <p className="muted">No tienes reglas configuradas aún.</p>
          ) : (
            <ul className="template-list">
              {rules.map((rule) => (
                <li key={rule.id} className="template-list__item">
                  <div>
                    <p className="template-list__name">{rule.name}</p>
                    <p className="muted">{rule.trigger}</p>
                    {rule.actionConfigJson?.templateCode && (
                      <p className="muted">Plantilla: {rule.actionConfigJson.templateCode}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => void toggleRuleActive(rule.id, rule.active)}
                  >
                    {rule.active ? "Desactivar" : "Activar"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card">
          <header className="card__header">
            <h2>Nueva regla</h2>
            <p>Selecciona un disparador y la plantilla que se enviará.</p>
          </header>
          <form className="form" onSubmit={handleRuleSubmit}>
            <label>
              Nombre de la regla
              <input
                value={ruleForm.name}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label>
              Descripción (opcional)
              <input
                value={ruleForm.description}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>
            <label>
              Disparador
              <select
                value={ruleForm.trigger}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, trigger: event.target.value }))}
              >
                {TRIGGERS.map((trigger) => (
                  <option key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Acción
              <select
                value={ruleForm.action}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, action: event.target.value }))}
              >
                {ACTIONS.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Código de plantilla
              <input
                value={ruleForm.templateCode}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, templateCode: event.target.value }))}
                placeholder="ej. bienvenida_postulante"
                required
              />
            </label>
            <label>
              Condiciones (JSON)
              <textarea
                rows={3}
                value={ruleForm.conditions}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, conditions: event.target.value }))}
              />
            </label>
            <button type="submit" className="button" disabled={loading}>
              Guardar regla
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}

export default AutomationsPage;
