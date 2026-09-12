# Acuerdo de Procesamiento de Datos (DPA) con Cláusulas Contractuales Tipo (CCT)

> **Clase**: INSTRUMENTO LEGAL MODELO EJECUTABLE (CHILE / INTERNACIONAL)  
> **Normativa de Anclaje**:  
> - Ley N° 21.719 sobre Protección de Datos Personales y Creación de la Agencia de Protección de Datos Personales (APD).  
> - Ley N° 19.628 sobre Protección de la Vida Privada.  
> - Estándar de Cláusulas Contractuales Tipo (CCT) para Transferencia Internacional de Datos Personales del Ministerio de Economía, Fomento y Turismo de Chile.  
> - Estándares Internacionales de Seguridad: ISO/IEC 27001, SOC 2 Type II, Cifrado AES-256 y TLS 1.3.

---

El presente **ACUERDO DE PROCESAMIENTO DE DATOS** (*Data Processing Agreement* o **DPA**) se celebra entre:

**EL RESPONSABLE DEL TRATAMIENTO (CONTROLLER)**:  
**OBRERA Y ZÁNGANO SpA**, sociedad constituida bajo las leyes de Chile, RUT **[RUT EMPRESA]**, con domicilio en [Dirección Legal, Comuna, Región de Los Lagos, Chile], en adelante el *"Responsable"*; y

**EL ENCARGADO DEL TRATAMIENTO (PROCESSOR)**:  
**[PROVEEDOR TECNOLÓGICO: Vercel Inc. / Supabase Inc. / Functional Software Inc. (Sentry) / Groq Inc.]**, sociedad constituida bajo las leyes de [Delaware / California, EE.UU.], con domicilio en [Domicilio del Proveedor Extranjero], en adelante el *"Encargado"*.

Ambas Partes acuerdan incorporar las siguientes **Cláusulas Contractuales Tipo (CCT)** para regular el tratamiento y transferencia internacional de datos personales derivado de los servicios contratados:

---

### CLÁUSULA PRIMERA: OBJETO Y ALCANCE DEL TRATAMIENTO
1.1. El Encargado tratará datos personales de clientes, usuarios, apicultores colaboradores y operadores de la plataforma **Enjambre Legado** únicamente por cuenta, instrucción documentada y en beneficio exclusivo del Responsable.  
1.2. La naturaleza y finalidad del tratamiento se limitan estrictamente a:
- Alojamiento de aplicaciones web y entrega de contenido vía red de distribución (CDN).
- Almacenamiento seguro de base de datos relacional y autenticación de usuarios.
- Monitoreo de telemetría y diagnóstico técnico de fallos de software (logs de error sanitizados).
- Procesamiento de audio mediante modelos de reconocimiento de voz (STT) para la transcripción de notas apícolas de campo.

---

### CLÁUSULA SEGUNDA: INSTRUCCIONES VINCULANTES Y PROHIBICIÓN DE REUTILIZACIÓN
2.1. El Encargado se compromete a tratar los datos personales única y exclusivamente conforme a las instrucciones escritas del Responsable, salvo mandato legal o judicial imperativo de autoridad competente, el cual deberá ser notificado inmediatamente al Responsable previo a su ejecución, en la medida que la ley lo permita.  
2.2. **Prohibición de Comercialización y Cesión**: El Encargado no podrá vender, ceder, transferir, cruzar con otras bases de datos ni divulgar los datos personales bajo su custodia a ningún tercero.  
2.3. **Prohibición de Entrenamiento de Inteligencia Artificial**: En lo relativo a grabaciones de audio, transcripciones de voz o bitácoras apícolas (procesadas por proveedores como Groq Inc.), queda **estrictamente prohibido emplear los datos del Responsable para el entrenamiento, refinamiento o ajuste fino (*fine-tuning*) de modelos de lenguaje o algoritmos de inteligencia artificial**, garantizándose el borrado de la memoria volátil inmediatamente tras la entrega de la transcripción técnica.

---

### CLÁUSULA TERCERA: MEDIDAS DE SEGURIDAD TÉCNICAS Y ORGANIZATIVAS
El Encargado declara que cuenta e implementará de forma continua las siguientes salvaguardas técnicas:
1. **Cifrado Robusto**: Cifrado obligatorio de datos en tránsito mediante protocolos **TLS 1.3** (o superior) y cifrado de datos en reposo mediante algoritmo **AES-256**.
2. **Control de Acceso Estricto**: Principio del menor privilegio (*Least Privilege*), autenticación multifactor (MFA) obligatoria para el personal técnico del Encargado y segregación lógica estricta de entornos de clientes.
3. **Certificaciones de Cumplimiento**: Mantenimiento de certificaciones internacionales vigentes de seguridad y confidencialidad, a lo menos **SOC 2 Type II** y/o **ISO/IEC 27001**.
4. **Respaldo y Resiliencia**: Mecanismos de copia de seguridad automatizada y continuidad operativa ante desastres.

---

### CLÁUSULA CUARTA: NOTIFICACIÓN DE INCIDENTES Y BRECHAS DE SEGURIDAD (48 HORAS)
4.1. Ante cualquier acceso no autorizado, vulneración, filtración, destrucción, pérdida o alteración ilícita o accidental de datos personales tratados por el Encargado (en adelante, una *"Brecha de Seguridad"*), el Encargado deberá **notificar al Responsable por escrito en un plazo perentorio no superior a CUARENTA Y OCHO (48) HORAS** desde que tomó conocimiento del hecho.  
4.2. La notificación deberá contener, a lo menos:
- Descripción de la naturaleza del incidente y categorías de datos potencialmente afectados.
- Número aproximado de titulares concernidos.
- Medidas de mitigación inmediatas adoptadas y cursos de acción correctivos.
- Punto de contacto técnico del Encargado (DPO / CISO).  
4.3. Esta obligación resulta esencial para que el Responsable pueda dar cabal cumplimiento a su deber legal de notificar a la **Agencia de Protección de Datos Personales de Chile (APD)** en el plazo legal perentorio de **72 horas** establecido por la Ley N° 21.719.

---

### CLÁUSULA QUINTA: ASISTENCIA EN EL EJERCICIO DE DERECHOS ARCO Y PORTABILIDAD
El Encargado facilitará las interfaces de programación (APIs) y herramientas técnicas necesarias para que el Responsable atienda las solicitudes de **Acceso, Rectificación, Cancelación, Oposición y Portabilidad (ARCO)** de los titulares de datos, garantizando la eliminación efectiva o entrega estructurada (JSON) de la información cuando el Responsable lo instruya a través de sus endpoints administrativos (`/api/arco/export` y `/api/arco/me`).

---

### CLÁUSULA SEXTA: SUBCONTRATISTAS ULTERIORES (SUB-PROCESSORS)
6.1. El Encargado no transferirá datos a terceros subcontratistas sin autorización previa, general o específica, del Responsable.  
6.2. Si el Encargado recurre a proveedores auxiliares de infraestructura (ej. centros de datos físicos de AWS o Google Cloud), deberá imponerles por contrato las mismas o más exigentes obligaciones de protección de datos y seguridad estipuladas en este instrumento.

---

### CLÁUSULA SÉPTIMA: SUPRESIÓN Y DEVOLUCIÓN DE DATOS AL TÉRMINO DEL SERVICIO
Finalizada la prestación de los servicios principales o resuelto el contrato marco por cualquier causa, el Encargado procederá, a elección del Responsable, a **eliminar de forma segura e irrecuperable** la totalidad de los datos personales almacenados en sus sistemas, destruyendo copias lógicas y físicas existentes, salvo que la legislación aplicable imponga la obligación legal de conservar determinados registros técnicos por un plazo acotado.

---

### CLÁUSULA OCTAVA: LEY APLICABLE Y JURISDICCIÓN
8.1. El presente Acuerdo se rige por las leyes de la **República de Chile**, en particular por la Ley N° 21.719 sobre Protección de Datos Personales y las directrices emanadas de la Agencia de Protección de Datos Personales (APD).  
8.2. Para la resolución de controversias emanadas del tratamiento de datos personales de ciudadanos chilenos, las Partes se someten a la competencia de los Tribunales Ordinarios de Justicia de Chile y a la jurisdicción fiscalizadora de la Agencia de Protección de Datos Personales de Chile.

---

Por el Responsable: **OBRERA Y ZÁNGANO SpA**  
Firma: _________________________________________  
Nombre: [Nombre del Representante]  
Cargo: Gerente General / Administrador  
Fecha: [Fecha de Suscripción]  

Por el Encargado: **[NOMBRE DEL PROVEEDOR INTERNACIONAL]**  
Firma: _________________________________________  
Nombre: [Representante Autorizado / DPO]  
Cargo: Authorized Signatory / Compliance Officer  
Fecha: [Fecha de Suscripción]
