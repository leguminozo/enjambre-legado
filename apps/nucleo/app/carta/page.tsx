import Link from 'next/link';

export const metadata = {
  title: 'Carta Constitutiva Apícola Territorial de Chiloé',
  description: 'Infraestructura colectiva, autónoma, verificable y no extractiva para la apicultura de Chiloé. Adhesión voluntaria, consentimiento informado y beneficio recíproco.',
};

interface Bloque {
  tipo: 'parrafo' | 'lista';
  texto?: string;
  items?: string[];
}

interface Articulo {
  numero: string;
  titulo: string;
  bloques: Bloque[];
}

const PREAMBULO: string[] = [
  'Las personas, organizaciones y comunidades vinculadas a la apicultura en Chiloé reconocemos que la salud de las abejas, la continuidad de la flora melífera, la inocuidad de los productos, la calidad ambiental, el conocimiento local y la viabilidad económica de quienes habitan el territorio forman una trama indivisible.',
  'Constituimos esta base común para fortalecer una apicultura territorial, cooperativa, informada y autónoma; para crear capacidades propias de registro, comunicación, trazabilidad, comercialización y cuidado; y para relacionarnos con municipios, SAG, INIA, servicios públicos, propietarios, agricultores, comerciantes y otros actores desde una posición de colaboración exigente, transparencia y dignidad.',
  'No se trata de excluir actividades por su sola condición, sino de hacer visibles sus impactos, facilitar prácticas responsables, prevenir daños, resolver conflictos y distribuir con justicia los beneficios de la cooperación.',
];

const ARTICULOS: Articulo[] = [
  {
    numero: '1',
    titulo: 'Naturaleza',
    bloques: [
      { tipo: 'parrafo', texto: 'La comunidad apícola territorial es una red policéntrica de personas y organizaciones vinculadas a la apicultura, la agricultura, la producción alimentaria, el cuidado ambiental y la economía local. Su organización se estructura en tres escalas complementarias:' },
      { tipo: 'lista', items: ['Núcleo comunal: espacio de deliberación, registro, coordinación y acción situado en cada comuna.', 'Red territorial de Chiloé: articulación federada de los núcleos comunales para materias intercomunales, sanitarias, ecológicas, productivas y comerciales.', 'Infraestructura común: sistema técnico de información, trazabilidad, comunicación y servicios compartidos, sujeto a reglas explícitas de gobernanza de datos.'] },
      { tipo: 'parrafo', texto: 'La Red no sustituye funciones legales de SAG, municipalidades ni tribunales. Produce evidencia, coordinación, prevención, apoyo mutuo y propuestas; las potestades fiscalizadoras y sancionatorias permanecen en los órganos legalmente competentes.' },
    ],
  },
  {
    numero: '2',
    titulo: 'Finalidad',
    bloques: [
      { tipo: 'parrafo', texto: 'La Red tiene por finalidad proteger, fortalecer y proyectar la apicultura de Chiloé mediante:' },
      { tipo: 'lista', items: ['La defensa de la sanidad apícola, la biodiversidad, la flora melífera y las prácticas de manejo responsable.', 'La trazabilidad voluntaria y verificable de apiarios, movimientos, manejo sanitario, productos, lotes y relaciones territoriales.', 'La prevención de conflictos derivados de aplicaciones fitosanitarias, traslados de colmenas, contaminación, enfermedades, saturación territorial y falta de información.', 'La valorización económica, cultural y territorial de la miel y demás productos apícolas de Chiloé.', 'La creación de capacidades económicas propias: servicios, formación, comercialización, certificación, compras conjuntas, infraestructura técnica y proyectos colectivos.', 'La interlocución documentada, autónoma y propositiva con entidades públicas y privadas.'] },
    ],
  },
  {
    numero: '3',
    titulo: 'Principios',
    bloques: [
      { tipo: 'lista', items: ['Autonomía territorial: la organización define sus prioridades, produce sus instrumentos y administra su información sin dependencia estructural de fondos, plataformas o decisiones externas.', 'Reciprocidad: toda persona u organización que aporte información, tiempo, recursos o conocimiento debe recibir un beneficio proporcional, verificable y comprensible.', 'No estigmatización: ningún actor será definido como enemigo por su categoría; será evaluado por sus prácticas, cumplimiento, impactos y disposición colaborativa.', 'Prevención antes que castigo: la información temprana, la advertencia, la mediación y la corrección voluntaria tendrán prioridad.', 'Trazabilidad con propósito: sólo se solicitarán datos necesarios para un fin explícito, legítimo y previamente informado.', 'Proporcionalidad: el nivel de detalle, acceso y conservación de los datos será proporcional al riesgo, finalidad y consentimiento asociado.', 'Transparencia asimétrica legítima: la Red puede publicar información agregada, preventiva o territorial sin exponer datos personales, ubicaciones sensibles, secretos comerciales o saberes locales sin autorización.', 'Interoperabilidad soberana: los datos podrán dialogar con registros públicos, pero la Red conservará control sobre sus bases internas, protocolos y criterios de intercambio.', 'Cuidado del territorio: la actividad apícola debe sostener la vida del archipiélago, no únicamente extraer valor de ella.'] },
    ],
  },
  {
    numero: '4',
    titulo: 'Sujetos y roles',
    bloques: [
      { tipo: 'parrafo', texto: 'La Red reconoce roles iniciales: apicultor/a residente, apicultor/a trashumante, apicultor/a mixto, propietario/a facilitador/a, agricultor/a o usuario/a de fitosanitarios, aplicador/a o asesor/a agrícola, comercializador/a o acopiador/a, inspector/a o profesional técnico, municipio/SAG u otra institución, y consumidor/a o visitante. Una persona puede ejercer más de un rol, pero cada rol tendrá permisos, obligaciones y beneficios específicos dentro de la infraestructura.' },
      { tipo: 'parrafo', texto: 'El registro no convierte a la Red en autoridad pública. Cada rol conserva sus derechos, deberes y responsabilidades legales propios.' },
    ],
  },
  {
    numero: '5',
    titulo: 'Régimen de incorporación',
    bloques: [
      { tipo: 'parrafo', texto: 'La incorporación a la Red será voluntaria, salvo los antecedentes que una ley, reglamento u ordenanza válida obligue a declarar ante la autoridad competente. Toda inscripción deberá informar, antes de solicitar datos:' },
      { tipo: 'lista', items: ['Qué datos se pedirán.', 'Para qué finalidad concreta serán usados.', 'Quién podrá acceder a ellos.', 'Qué parte será privada, compartida, agregada o pública.', 'Cuánto tiempo se conservarán.', 'Cómo se corrigen, descargan, restringen o eliminan.', 'Qué beneficios concretos obtiene la persona inscrita.', 'Qué consecuencias tiene no aportar un dato opcional.'] },
      { tipo: 'parrafo', texto: 'Nadie podrá ser privado de servicios esenciales, estigmatizado ni expuesto públicamente por negarse a participar en funcionalidades voluntarias.' },
    ],
  },
  {
    numero: '6',
    titulo: 'Registro y trazabilidad',
    bloques: [
      { tipo: 'parrafo', texto: 'La Red implementará un Registro Territorial Apícola interoperable, destinado a complementar —nunca falsear ni reemplazar— los registros oficiales que correspondan. El registro podrá contener, con autorización y según rol: identidad y medios de contacto protegidos; condición apícola y categoría de actividad; identificador de apiario, marca, RUP u otro antecedente oficial; ubicación de precisión restringida y representación pública aproximada; número y tipo de colmenas; movimientos programados o realizados; historial sanitario y manejo autorizado; lotes de producción, extracción, transformación y comercialización; eventos territoriales; y acuerdos de uso de predios, cuando las partes lo autoricen.' },
    ],
  },
  {
    numero: '7',
    titulo: 'Mapa territorial',
    bloques: [
      { tipo: 'parrafo', texto: 'El Mapa Apícola de Chiloé tendrá tres niveles de visibilidad:' },
      { tipo: 'lista', items: ['Público: zonas generales, productos, prácticas autorizadas y puntos comerciales. Acceso: toda persona.', 'Comunitario: alertas, contactos consentidos, rangos territoriales y oportunidades. Acceso: miembros autenticados.', 'Restringido: coordenadas precisas, datos sanitarios, movimientos y antecedentes personales. Acceso: titular y personas expresamente autorizadas.'] },
      { tipo: 'parrafo', texto: 'Las coordenadas exactas de apiarios, domicilios, predios, rutas de traslado y datos de contacto no serán públicas por defecto. El mapa no debe convertirse en un inventario para extracción comercial, robo, competencia desleal o exposición de riesgos.' },
    ],
  },
  {
    numero: '8',
    titulo: 'Alertas fitosanitarias y ambientales',
    bloques: [
      { tipo: 'parrafo', texto: 'La Red habilitará un módulo de prevención que permita a agricultores, aplicadores y propietarios informar aplicaciones o riesgos que puedan afectar apiarios cercanos: registrar fecha, rango horario, producto, zona aproximada, método de aplicación, período de resguardo y canal de contacto; identificar apicultores potencialmente expuestos; emitir avisos selectivos; y conservar una constancia temporal de la notificación. Núcleo reduce la fricción de ese cumplimiento mediante un flujo simple y trazable; no puede declarar por una persona, certificar cumplimiento legal sin verificación, ni sustituir a la autoridad sanitaria.' },
    ],
  },
  {
    numero: '9',
    titulo: 'Transhumancia responsable',
    bloques: [
      { tipo: 'parrafo', texto: 'La transhumancia se reconoce como una práctica productiva que requiere condiciones reforzadas de información, coordinación sanitaria y resguardo territorial. Quien ingrese o movilice colmenas podrá acceder a un protocolo de transhumancia responsable que incluya: identificación del origen, destino, período y responsable; documentación sanitaria y administrativa aplicable; declaración de medidas de bioseguridad y manejo; acuerdo de uso de predio, cuando exista; aviso territorial con información proporcional; canal de mediación para conflictos; y reputación basada en cumplimiento verificable, no en prejuicio de origen.' },
      { tipo: 'parrafo', texto: 'Una regla sólo adquiere legitimidad territorial si descansa en evidencia técnica, proporcionalidad y procedimientos justos.' },
    ],
  },
  {
    numero: '10',
    titulo: 'Gobernanza de datos',
    bloques: [
      { tipo: 'parrafo', texto: 'Los datos personales y territoriales son entregados en custodia, no cedidos como propiedad absoluta a la plataforma, a la Asociación Gremial ni a sus administradores. Se establecerán, como mínimo, los siguientes derechos:' },
      { tipo: 'lista', items: ['Derecho a conocer qué datos existen sobre la persona.', 'Derecho a corregir información inexacta.', 'Derecho a descargar sus datos.', 'Derecho a retirar consentimientos opcionales.', 'Derecho a conocer transferencias a terceros.', 'Derecho a solicitar revisión humana de decisiones automatizadas o perfiles.', 'Derecho a reclamar ante un Comité de Datos y Ética.', 'Derecho a que la información sensible sea tratada con reserva reforzada.'] },
      { tipo: 'parrafo', texto: 'La base de datos deberá separar identidad personal, georreferenciación precisa, datos productivos, datos sanitarios y datos de mercado. Ninguna entidad externa recibirá acceso total por defecto.' },
    ],
  },
  {
    numero: '11',
    titulo: 'Comité de Datos, Ética y Territorio',
    bloques: [
      { tipo: 'parrafo', texto: 'Se crea un Comité de Datos, Ética y Territorio, plural y rotativo, encargado de revisar protocolos de información, convenios institucionales, publicación de mapas, resolución de reclamos y evaluación de riesgos. Deberá incluir, al menos, representación de apicultores residentes, apicultores con movilidad, una persona con competencia técnica, una persona vinculada al cuidado ambiental y una representación comunal. Sus decisiones deberán quedar documentadas y ser apelables ante la asamblea correspondiente.' },
    ],
  },
  {
    numero: '12',
    titulo: 'Relación con entidades públicas',
    bloques: [
      { tipo: 'parrafo', texto: 'La Red se relacionará con SAG, municipalidades, INIA, servicios de salud, autoridades ambientales y otras entidades mediante convenios, mesas de trabajo, solicitudes formales de información, informes territoriales y propuestas normativas. Todo convenio deberá establecer, por escrito: finalidad del intercambio, campos de datos transferidos, periodicidad, responsables de tratamiento, restricciones de uso, seguridad y conservación, prohibición de reutilización no consentida, y mecanismo de auditoría y término.' },
      { tipo: 'parrafo', texto: 'La Red podrá entregar reportes agregados, alertas y evidencia sistematizada. La transferencia de datos personales, sanitarios sensibles o georreferenciación exacta requerirá base legal suficiente y protocolo específico.' },
    ],
  },
  {
    numero: '13',
    titulo: 'Autonomía económica',
    bloques: [
      { tipo: 'lista', items: ['Aportes de miembros.', 'Prestaciones tecnológicas y de trazabilidad.', 'Certificaciones o sellos comunitarios con reglas verificables.', 'Comercialización o intermediación transparente.', 'Compras conjuntas.', 'Formación y asesorías.', 'Servicios de información territorial.', 'Convenios con entidades públicas o privadas que no comprometan la soberanía de datos.', 'Fondos concursables como complemento, nunca como única base.'] },
      { tipo: 'parrafo', texto: 'Toda fuente de ingreso deberá declarar sus condiciones, conflictos de interés y distribución de beneficios. La dependencia financiera de una sola institución será considerada un riesgo estratégico.' },
    ],
  },
  {
    numero: '14',
    titulo: 'Debido proceso comunitario',
    bloques: [
      { tipo: 'lista', items: ['Información y advertencia.', 'Acompañamiento técnico.', 'Plan de corrección.', 'Suspensión temporal de beneficios no esenciales.', 'Mediación comunitaria.', 'Derivación a autoridad competente, cuando existan hechos que pudieran constituir infracción legal, sanitaria o ambiental.'] },
      { tipo: 'parrafo', texto: 'La Red no impondrá multas, decomisos, prohibiciones de tránsito ni sanciones propias de la autoridad pública. Podrá documentar hechos, preservar evidencia, acompañar denuncias y emitir informes comunitarios fundados.' },
    ],
  },
];

export default function CartaPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            ← Registro Territorial de Chiloé
          </Link>
          <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground border border-border/50 rounded-full px-3 py-1">
            Versión 0.2 · Documento de trabajo
          </span>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-14 sm:py-20 space-y-12">
        {/* Título */}
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Carta Constitutiva Apícola Territorial
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-foreground leading-tight">
            Infraestructura colectiva, autónoma, verificable y no extractiva
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            La adhesión a esta Carta es voluntaria. Sus disposiciones complementan —nunca sustituyen— las facultades
            de fiscalización, registro, sanción o regulación que correspondan por ley al SAG, municipalidades,
            ministerios y tribunales competentes. Sus disposiciones obligan internamente solo a quienes la suscriben.
          </p>
        </div>

        {/* Preámbulo */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Preámbulo</h2>
          {PREAMBULO.map((p, i) => (
            <p key={i} className="text-[0.95rem] text-foreground/90 leading-relaxed">{p}</p>
          ))}
        </section>

        {/* Artículos */}
        <section className="space-y-10">
          {ARTICULOS.map((a) => (
            <div key={a.numero} className="space-y-3">
              <h2 className="flex items-baseline gap-3">
                <span className="text-xs font-bold text-primary uppercase tracking-widest shrink-0">
                  Art. {a.numero}
                </span>
                <span className="font-serif text-lg font-semibold text-foreground">{a.titulo}</span>
              </h2>
              <div className="space-y-3 pl-0 sm:pl-12">
                {a.bloques.map((b, i) =>
                  b.tipo === 'lista' ? (
                    <ul key={i} className="space-y-1.5">
                      {b.items?.map((item, j) => (
                        <li key={j} className="text-[0.9rem] text-foreground/85 leading-relaxed flex gap-2">
                          <span className="text-primary shrink-0 mt-2">·</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i} className="text-[0.9rem] text-foreground/85 leading-relaxed">{b.texto}</p>
                  )
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Cierre */}
        <footer className="pt-8 border-t border-border/60 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Al inscribirte en el Registro Territorial Apícola de Chiloé aceptas esta Carta y la política de datos y
            privacidad. Tus datos se entregan en custodia, con consentimiento granular, datos mínimos necesarios y
            derecho a retirarlos.
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium text-sm transition-colors"
          >
            Inscribirme en el Registro
          </Link>
        </footer>
      </article>
    </main>
  );
}
