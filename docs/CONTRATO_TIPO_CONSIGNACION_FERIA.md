# Contrato Marco de Consignación Mercantil y Prestación de Servicios a Honorarios para Operadores de Feria

> **Clase**: INSTRUMENTO LEGAL MODELO EJECUTABLE (CHILE)  
> **Normativa de Anclaje**:  
> - Código de Comercio: Arts. 233 y siguientes (De la Comisión y Consignación Mercantil).  
> - Código del Trabajo: Arts. 7° y 8° (Desvirtuación expresa de subordinación y dependencia).  
> - Ley sobre Impuesto a la Renta: Art. 42 N° 2 y D.L. 3.500 / Ley 21.133 (Régimen de Boletas de Honorarios y Cotizaciones Previsionales).  
> - Ley N° 19.496 sobre Protección de los Derechos de los Consumidores: Arts. 20, 21 y 43 (Deslinde de garantías).  
> - Decreto Supremo N° 977/1996 del Ministerio de Salud: Reglamento Sanitario de los Alimentos.

---

En [Ciudad / Comuna], República de Chile, a [Día] de [Mes] de 2026, entre:

**PARTE A (LA EMPRESA / EL CONSIGNANTE)**:  
**OBRERA Y ZÁNGANO SpA**, sociedad por acciones legalmente constituida bajo las leyes de la República de Chile, Rol Único Tributario N° **[RUT EMPRESA]**, representada legalmente por don/doña [Nombre Representante], cédula de identidad N° [RUT Representante], ambos domiciliados para estos efectos en [Dirección Legal], Comuna de [Comuna], Región de Los Lagos; y

**PARTE B (EL OPERADOR / EL CONSIGNATARIO / PRESTADOR INDEPENDIENTE)**:  
Don/Doña **[NOMBRE COMPLETO DEL OPERADOR]**, de nacionalidad [Nacionalidad], estado civil [Estado Civil], profesión u oficio [Profesión/Comerciante], titular de la Cédula Nacional de Identidad N° **[RUT OPERADOR]**, con domicilio en [Dirección Operador], Comuna de [Comuna], Región de [Región], correo electrónico [Correo Electrónico], teléfono [Teléfono];

Las Partes han convenido en celebrar el siguiente **CONTRATO MARCO DE CONSIGNACIÓN MERCANTIL Y PRESTACIÓN DE SERVICIOS INDEPENDIENTES**, sujeto a las siguientes estipulaciones:

---

### CLÁUSULA PRIMERA: ANTECEDENTES Y CONTEXTO BIOCULTURAL
1.1. **Obrera y Zángano SpA** es una empresa dedicada a la regeneración biocultural, recolección sustentable, envasado y comercialización de mieles crudas monoflorales y multiflorales, polen y derivados apícolas del bosque nativo del Archipiélago de Chiloé, contando con resoluciones sanitarias y registros de trazabilidad territorial.  
1.2. El **Operador** es una persona natural o jurídica independiente, con experiencia comercial, que participa en ferias costumbristas, mercados campesinos, exposiciones gastronómicas y puntos de comercialización presencial en diversas localidades del país.  
1.3. La Empresa pone a disposición del Operador productos envasados de alta gama para su colocación comercial presencial, facilitándole la aplicación móvil oficial de punto de venta (`apps/campo`) para el registro de inventario, ventas y emisión de comprobantes.

---

### CLÁUSULA SEGUNDA: OBJETO DEL CONTRATO
Por el presente instrumento, la Empresa entrega al Operador, quien acepta y recibe, existencias de productos apícolas bajo la modalidad de **Consignación Mercantil** (Artículos 233 y siguientes del Código de Comercio), facultándolo para comercializarlos a su nombre o por cuenta de la Empresa a consumidores finales que asistan a los eventos feriales acordados, a cambio de una retribución económica variable por comisiones e incentivos comerciales por cumplimiento de metas.

---

### CLÁUSULA TERCERA: CONDICIONES DE LA CONSIGNACIÓN DE EXISTENCIAS
3.1. **Recepción y Registro Digital**: La entrega material del stock se formalizará mediante Guía de Despacho Electrónica o comprobante de entrega ferial suscrito por el Operador, registrándose de manera atómica en el sistema digital (`participante_consignacion`).  
3.2. **Propiedad de los Productos**: Los productos entregados en consignación continúan siendo de propiedad exclusiva de la Empresa hasta el momento exacto en que se perfecciona su venta a un consumidor final o son reintegrados materialmente a la bodega de origen.  
3.3. **Cuidado y Deber de Custodia**: El Operador se obliga a custodiar diligentemente los productos, manteniéndolos en condiciones idóneas de temperatura, humedad, sombra y pulcritud conforme a las normas higiénicas del Reglamento Sanitario de los Alimentos (DTO 977/96), respondiendo de su pérdida, deterioro o merma culpable.  
3.4. **Devolución de Remanentes**: Concluido cada evento ferial o temporada, el Operador devolverá a la Empresa la totalidad de los productos no comercializados. La devolución se procesa digitalmente mediante la función de conciliación de inventario (`registrar_devolucion_consignacion_feria`), reintegrándose el stock al almacén central de la Empresa.

---

### CLÁUSULA CUARTA: INDEPENDENCIA Y DESVIRTUACIÓN CATEGÓRICA DE SUBORDINACIÓN LABORAL
4.1. **Inexistencia de Vínculo Laboral**: Las Partes declaran expresa e irrevocablemente que el presente contrato reviste naturaleza estrictamente mercantil y civil. Entre la Empresa y el Operador **NO EXISTE relación alguna de subordinación ni dependencia laboral** en los términos descritos por los Artículos 7° y 8° del Código del Trabajo.  
4.2. **Manifestaciones de Autonomía Operativa**:
- **Sin Control Horario**: El Operador no está sujeto a jornada de trabajo, cumplimiento de horarios, turnos fijos, marcaje de asistencia ni fiscalización de jornada.
- **Sin Órdenes Jerárquicas ni Potestad Disciplinaria**: La Empresa no ejerce mando jerárquico, ni imparte órdenes imperativas de conducta, ni cuenta con facultades disciplinarias o sancionatorias sobre el Operador. La guía de objeciones comerciales y argumentario de cata son materiales de consulta técnica facultativa.
- **Libertad de Métodos**: El Operador organiza libremente su tiempo, concurrencia y tácticas de comercialización en los espacios feriales.
- **No Exclusividad**: El Operador mantiene plena libertad para prestar servicios comerciales, de consultoría o comercialización a favor de terceros, personas naturales o jurídicas, sin requerir autorización previa de la Empresa.

---

### CLÁUSULA QUINTA: ESQUEMA DE REMUNERACIÓN, COMISIONES E INCENTIVOS
5.1. **Retribución por Resultado Puro**: El Operador no percibirá sueldo, remuneración fija periódica ni viático garantizado. Su retribución económica se calculará exclusivamente sobre ventas efectivamente concluidas y pagadas durante las sesiones de feria, conforme a las reglas parametrizadas en la base de datos (`commission_rules` y `calcular_comision_venta`):
- **Comisión Base Ferial**: Un [10%] (o porcentaje pactado para el canal) del monto bruto de las ventas realizadas.
- **Multiplicador por Volumen**: Incremento porcentual al superar los umbrales de ventas diarias pactados para el evento.
- **Bonos Logísticos de Evento**: Asignación de incentivos feriales objetivos por montaje, apertura oportuna y cumplimiento de metas globales de la feria, acreditados en el libro mayor de incentivos (`incentivo_ledger`).
5.2. **Liquidación y Deducciones de Caja**: El Operador liquidará sus comisiones e incentivos mediante el saldo registrado en el ledger de la plataforma, pudiendo deducir su honorario de la recaudación en efectivo de la sesión de caja tras el cierre y cuadratura respectiva (`POST /api/sii/honorarios/desde-ledger`), emitiendo el documento tributario correspondiente.

---

### CLÁUSULA SEXTA: OBLIGACIONES TRIBUTARIAS Y PREVISIONALES (LEY 21.133)
6.1. **Emisión de Documentos Tributarios**: Por cada liquidación de honorarios o comisiones, el Operador emitirá a favor de la Empresa la correspondiente **Boleta de Honorarios Electrónica (BHE)** a través del portal del Servicio de Impuestos Internos (SII), o en su defecto, la respectiva Factura Electrónica si tributare en Primera Categoría.  
6.2. **Retención de Segunda Categoría**: De conformidad con el Artículo 42 N° 2 de la Ley sobre Impuesto a la Renta y la Ley 21.133, la Empresa practicará la retención legal obligatoria correspondiente al año calendario en curso (**15,25%** para el año tributario 2026), enterándola en arcas fiscales a través del Formulario 29 (Línea 61, Código 151).  
6.3. **Cobertura Previsional y Protección Social**: Las cotizaciones para pensiones, salud (Fonasa/Isapre), ley de accidentes del trabajo (Ley 16.744) y seguro de acompañamiento de niños (SANNA) se determinarán y pagarán de forma anual e individual por el propio Operador en su declaración de Operación Renta (Formulario 22), conforme al Artículo 89 del Decreto Ley N° 3.500. La Empresa no asume responsabilidad alguna por obligaciones previsionales directas.

---

### CLÁUSULA SÉPTIMA: PROTECCIÓN AL CONSUMIDOR Y DESLINDE DE RESPONSABILIDADES (LEY 19.496)
7.1. **Garantía Legal del Fabricante**: La Empresa, en su calidad de productora y envasadora, garantiza que los productos apícolas cumplen con todos los estándares organolépticos, fisicoquímicos e higiénicos oficiales, respondiendo directamente de la **Garantía Legal de 6 meses** (Artículos 20 y 21 de la Ley 19.496, reformada por Ley 21.398) respecto de cualquier vicio de origen, contaminación biológica o defecto de hermeticidad en el envasado.  
7.2. **Responsabilidad Exclusiva del Operador**: El Operador responderá de forma directa, exclusiva y personal frente a los consumidores y autoridades por:
- La custodia física y exactitud en la entrega del dinero en efectivo y vueltos en feria.
- La veracidad en la información verbal de precios otorgada al público (debiendo respetar los precios de lista parametrizados en la app).
- Las mermas, pérdidas o hurtos de productos bajo su tenencia que no obedezcan a caso fortuito o fuerza mayor debidamente acreditada.
- Cualquier extralimitación verbal, promesa de curación milagrosa o claim terapéutico prohibido por el Reglamento Sanitario de los Alimentos que hubiere formulado al cliente.

---

### CLÁUSULA OCTAVA: CONFIDENCIALIDAD, DATOS PERSONALES Y CANAL DE INTEGRIDAD
8.1. **Datos de Clientes**: En caso de que el Operador registre datos de clientes feriales (nombre, correo o teléfono para envío de comprobantes electrónicos), tratará dicha información con estricta reserva conforme a la Ley N° 19.628 y la nueva Ley N° 21.719, prohibiéndose su uso para fines distintos a la emisión del comprobante ferial.  
8.2. **Canal de Integridad y Compliance (Ley 21.595)**: El Operador declara conocer que la Empresa dispone de un **Canal de Integridad** oficial (`obrerayzangano@gmail.com`), obligándose a reportar cualquier práctica reñida con la ética mercantil, delitos ambientales o económicos previstos en la Ley N° 21.595, gozando de reserva absoluta de su identidad y protección contra represalias.

---

### CLÁUSULA NOVENA: VIGENCIA, TERMINACIÓN Y RESOLUCIÓN DE CONFLICTOS
9.1. **Vigencia**: El presente contrato entrará en vigor a contar de su suscripción y se mantendrá vigente por la temporada ferial [Año 2026/2027], pudiendo ser prorrogado por acuerdo expreso de las Partes.  
9.2. **Terminación Anticipada**: Cualquiera de las Partes podrá poner término anticipado al contrato, en cualquier momento y sin expresión de causa, mediante aviso escrito o electrónico enviado con a lo menos 7 días corridos de anticipación, previa restitución de las existencias consignadas y rendición de cuentas del saldo de caja.  
9.3. **Jurisdicción y Domicilio**: Para todos los efectos legales derivados del presente contrato, las Partes fijan su domicilio en la ciudad de [Castro / Puerto Montt / Santiago] y se someten a la competencia de sus Tribunales Ordinarios de Justicia.

---

En comprobante de conformidad y previa lectura íntegra, las Partes suscriben el presente instrumento en dos ejemplares de idéntico tenor y fecha, quedando uno en poder de cada parte.

<br><br><br>

______________________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ______________________________________  
**OBRERA Y ZÁNGANO SpA** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **[NOMBRE DEL OPERADOR]**  
RUT: [RUT EMPRESA] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; RUT: [RUT OPERADOR]  
*Por la Empresa (Consignante)* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; *El Operador Independiente (Consignatario)*
