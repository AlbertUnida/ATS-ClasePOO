# UNIDAD 1 – Relevamiento de datos inicial.
## Comprensión del dominio (Descripción de la empresa/organización o área de la cual se va a realizar el sistema)
El proyecto se centra en la creación de un sistema de reclutamiento (ATS) para la automatización de procesos de gestión de talentos humanos dentro de empresas medianas y grandes. La organización ficticia sobre la cual se realiza el diseño de una compañía multinacional de servicios, con un área de Recursos Humanos consolidada.
## Organigrama de la empresa/organización
Una vez realicemos las siguientes unidades, se presentará un organigrama simplificado que refleje la estructura organizacional.
(Figura 1: Organigrama)
## Descripción del área a automatizar (Disponibilidad de hardware y software)
El área de recursos humanos cuenta con personal administrativo, reclutadores, analistas y un jefe de área. Actualmente los procesos se realizan mediante hojas de cálculo y correo electrónico, con limitaciones en trazabilidad. El departamento dispone de computadoras con conexión a internet y un servidor local con posibilidad de migrar a la nube.
## Funciones del Departamento de Recursos Humanos.
Publicación de vacantes.
Recepción de postulaciones.
Selección de candidatos.
Gestión de entrevistas.
Reportes por indicadores.

## Lista de requerimientos del cliente (Especificación de requerimientos del software)
### Requerimientos funcionales:
Debe permitir gestionar roles de usuario. (Administrador, reclutador, gerente de área, candidato) con niveles de acceso.
Debe permitir publicar ofertas laborales o puestos vacantes.
Debe contar con un portal para postulantes, donde puedan registrarse, cargar su CV, actualizar y postular a vacantes disponibles.
Debe disponer de un módulo de gestión de candidatos, que permita al reclutador visualizar, filtrar y organizar aplicaciones recibidas.
Debe permitir automatizar las etapas del proceso de selección (Screening inicial, envío de correos automáticos, recordatorios de entrevistas.)
Debe ofrecer un módulo de entrevistas, con la posibilidad de agendarlas, integrarse a calendarios corporativos y realizar entrevistas virtuales.
Debe incluir un flujo de evaluación de candidatos, donde los entrevistadores puedan cargar puntajes, comentario y recomendaciones.
Debe generar reportes y estadísticas sobre el proceso de reclutamiento (tiempo promedio de contratación, fuentes de candidatos más efectivas, tasa de éxito de contrataciones).
Debe integrarse con el módulo de gestión de empleados del área de RRHH para dar de alta automáticamente a los candidatos seleccionados.
### Requerimientos No Funcionales:
Debe ser escalable, soportando el crecimiento en el número de vacantes y postulantes
Debe contar con seguridad en el manejo de datos personales, cumpliendo normativas de protección de datos.
Debe garantizar un tiempo de respuesta menor a 3 segundos en consultas estándar.
Debe tener alta disponibilidad, con un tiempo de actividad mínimo del 90% mensual.
Debe contar con soporte técnico y actualizaciones recurrentes.
Debe ofrecer una interfaz intuitiva y de fácil uso, con diseño adaptable (responsive).
## Entrevista a los futuros usuarios del sistema ( simular una entrevista, especificar las técnicas de recolección de datos)
Se realizarán entrevistas con los reclutadores y jefes de RRHH utilizando técnicas de recolección de datos como cuestionarios estructurados y observación de procesos actuales.
## Objetivos (General y específicos)
### 7.1.1 GENERAL
Diseñar e implementar un Sistema de Reclutamiento (ATS) para la gestión integral del talento humano, que sea viable, escalable y comercializable para empresas medianas y grandes, contribuyendo a la optimización de sus procesos de selección de personal.
### ESPECIFICOS:
Analizar el estado actual de los procesos de reclutamiento en empresas medianas y grandes.
Identificar los requerimientos funcionales y no funcionales necesarios para el desarrollo del sistema ATS.
Evaluar la viabilidad técnica, económica y operativa del proyecto.
Proponer un modelo de negocio sostenible y escalable en el tiempo.
Desarrollar un prototipo del sistema que valide su funcionalidad y pertinencia.
## Presentación de la propuesta (Alcance y limitaciones del proyecto)
El proyecto propone desarrollar un ATS modular con acceso web y móvil. Alcance: gestión de vacantes, postulaciones, entrevistas y reportes. Limitaciones: no incluye gestión de nómina ni evaluación de desempeño.