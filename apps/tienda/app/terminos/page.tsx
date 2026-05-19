import { getSiteContent } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos del Servicio',
  description: 'Condiciones de uso de la plataforma La Obrera y el Zángano.',
};

export default async function TerminosPage() {
  const contentData = await getSiteContent('legal_terminos');
  const item = contentData[0]?.content;
  const title = (item && typeof item === 'object' && 'title' in item ? String(item.title) : null) || 'Términos del Servicio';
  const content = (item && typeof item === 'object' && 'body' in item ? String(item.body) : null) || `
<strong>Última actualización: 19 de mayo de 2026</strong>

<strong>INFORMACIÓN GENERAL</strong>

Este sitio web está a cargo de La Obrera y el Zángano Web Store. En todo el sitio, los términos "nosotros", "nos" y "nuestro" se refieren a La Obrera y el Zángano Web Store.

- Razón social: La Obrera y el Zángano
- Correo electrónico: comunidad@obrerayzangano.com
- Dirección: Pureo rural km 8560, Quellón, Chiloé, Chile
- Teléfono: +56 9 408 31 358

La Obrera y el Zángano Web Store ofrece este sitio web, incluyendo toda la información, herramientas y servicios disponibles en este sitio para usted, el usuario, condicionado a su aceptación de todos los términos, condiciones, políticas y avisos aquí establecidos.

Al visitar nuestro sitio o comprar algo que ofrecemos, usted participa en nuestro "Servicio" y acepta estar sujeto a los siguientes términos y condiciones ("Términos de servicio", "Términos"), incluidos aquellos términos y condiciones y políticas adicionales a las que se hace referencia en este documento o disponibles mediante hipervínculo.

Estos Términos de servicio se aplican a todos los usuarios del sitio, incluidos, entre otros, los usuarios que son navegadores, proveedores, clientes, comerciantes o contribuyentes de contenido.

Consulte atentamente estos Términos de servicio antes de acceder a nuestro sitio web o utilizarlo. Al acceder o utilizar cualquier parte del sitio, usted acepta estar sujeto a estos Términos de servicio. Si no está de acuerdo con todos los términos y condiciones de este acuerdo, no podrá acceder al sitio web ni utilizar ningún servicio.

Si estos Términos de servicio se consideran una oferta, la aceptación se limita expresamente a estos Términos de servicio. Cualquier característica o herramienta nueva que se añada a los servicios actuales también estará sujeta a los Términos de servicio.

Puede revisar la versión más actual de los Términos de servicio en cualquier momento en esta página. Nos reservamos el derecho de actualizar, cambiar o reemplazar cualquier parte de estos Términos de servicio mediante la publicación de actualizaciones o cambios en nuestro sitio web. Es su responsabilidad revisar esta página periódicamente para consultar si hay cambios. El uso continuado del sitio web o el acceso al mismo tras la publicación de cualquier cambio implica la aceptación de dichos cambios.

Nuestra tienda está construida sobre Next.js y se aloja en Hostinger. Los pagos son procesados por Mercado Pago a través de dLocal. Los datos de usuario y autenticación son gestionados mediante Supabase.

<strong>SECCIÓN 1: TÉRMINOS DE LA TIENDA ONLINE</strong>

Al aceptar estos Términos de servicio, usted declara que tiene al menos la mayoría de edad prevista en su jurisdicción de residencia (18 años en Chile), o que tiene la mayoría de edad y nos ha dado su consentimiento para permitir que cualquiera de sus dependientes menores use este sitio.

No puede utilizar nuestros productos para ningún propósito ilegal o no autorizado ni puede, en el uso del servicio, infringir ninguna ley de su jurisdicción (incluidas, entre otras, las leyes de derechos de autor, Ley 17.336 sobre Propiedad Intelectual). No debe transmitir ningún virus, worm o código de naturaleza destructiva.

El incumplimiento o la violación de cualquiera de los Términos dará lugar a la terminación inmediata de sus servicios.

<strong>SECCIÓN 2: CONDICIONES GENERALES</strong>

Nos reservamos el derecho a denegar servicio a cualquier persona por cualquier motivo y en cualquier momento.

Usted entiende que su contenido (sin incluir la información de la tarjeta de crédito), se puede transferir sin cifrar e implicar (a) transmisiones a través de varias redes; y (b) cambios para ajustarse y adaptarse a los requisitos técnicos de las redes o dispositivos de conexión. La información de las tarjetas de crédito siempre se encripta durante la transferencia a través de las redes y es procesada directamente por Mercado Pago/dLocal, sin pasar por nuestros servidores (certificación PCI DSS).

Usted se compromete a no reproducir, duplicar, copiar, vender, revender ni explotar ninguna parte del Servicio, el uso del servicio, o el acceso al servicio o cualquier contacto en el sitio web a través del cual se presta el servicio, sin permiso expreso y por escrito de nuestra parte.

Los títulos utilizados en este acuerdo se incluyen únicamente por conveniencia y no limitarán ni afectarán de otro modo a estos Términos.

<strong>SECCIÓN 3: EXACTITUD, INTEGRIDAD Y ACTUALIDAD DE LA INFORMACIÓN</strong>

No seremos responsables si la información disponible en este sitio no es precisa, completa o actual. El material de este sitio se proporciona únicamente con fines informativos generales y no debe tomarse como incuestionable ni utilizarse como única base para tomar decisiones sin consultar fuentes de información primarias más precisas, completas o más oportunas. La confianza depositada en el material de este sitio queda bajo su propio riesgo.

Este sitio puede contener determinada información histórica. La información histórica, necesariamente, no es actual y se facilita solo como referencia. Nos reservamos el derecho a modificar el contenido de este sitio en cualquier momento, pero no tenemos la obligación de actualizar ninguna información de nuestro sitio. Usted acepta que es su responsabilidad supervisar los cambios en nuestro sitio.

<strong>SECCIÓN 4: MODIFICACIONES AL SERVICIO Y PRECIOS</strong>

Los precios de nuestros productos están sujetos a cambios sin previo aviso. Todos los precios incluyen IVA (19%) conforme a la Ley sobre Impuesto a las Ventas y Servicios. Nos reservamos el derecho a modificar o interrumpir en cualquier momento el servicio (o cualquier parte o contenido del mismo) sin previo aviso. No seremos responsables ante usted ni ante terceros por modificaciones, cambios de precio, suspensiones o interrupciones del servicio.

<strong>SECCIÓN 5: PRODUCTOS O SERVICIOS</strong>

Ciertos productos o servicios pueden estar disponibles exclusivamente online a través del sitio web. Estos productos o servicios pueden tener cantidades limitadas y están sujetos a devolución o cambio sólo de acuerdo con nuestra <a href="/reembolso">Política de Reembolso</a>.

Hemos hecho todo lo posible para mostrar con la mayor precisión posible los colores y las imágenes de nuestros productos que aparecen en la tienda. No podemos garantizar que la visualización de cualquier color en el monitor de su ordenador sea exacta.

Nos reservamos el derecho, pero no estamos obligados, a limitar las ventas de nuestros productos o servicios a cualquier persona, región geográfica o jurisdicción. Podremos ejercer este derecho según el caso. Nos reservamos el derecho a limitar las cantidades de cualquiera de los productos o servicios que ofrecemos.

Las descripciones o los precios de productos están sujetos a cambios en cualquier momento sin previo aviso, a nuestra entera discreción. Nos reservamos el derecho a retirar cualquier producto en cualquier tiempo. Cualquier oferta de cualquier producto o servicio realizada en este sitio no será válida donde esté prohibida.

No garantizamos que la calidad de los productos, los servicios, la información u otro material adquirido que obtenga satisfarán sus expectativas, ni que se corregirán los errores del servicio.

<strong>SECCIÓN 6: EXACTITUD DE LA INFORMACIÓN DE FACTURACIÓN Y CUENTAS</strong>

Nos reservamos el derecho de rechazar cualquier pedido que usted nos presente. Podemos, a nuestra entera discreción, limitar o cancelar las cantidades compradas por persona, hogar o pedido. Estas restricciones pueden incluir pedidos realizados por o con la misma cuenta de cliente, la misma tarjeta de crédito o pedidos que utilicen la misma dirección de facturación o envío.

En caso de que modifiquemos o cancelemos un pedido, intentaremos notificárselo poniéndonos en contacto por correo electrónico o mediante la dirección de facturación o el número de teléfono facilitados en el momento de realizar el pedido. Nos reservamos el derecho a limitar o prohibir pedidos que, a nuestro juicio, parezcan realizados por vendedores, revendedores o distribuidores.

Usted se compromete a proporcionar información de compra y de cuenta actual, completa y precisa para todas las compras realizadas en nuestra tienda. Usted se compromete a actualizar puntualmente su cuenta y demás información, incluso su dirección de correo electrónico y los números y fechas de caducidad de sus tarjetas de crédito, para que podamos completar sus transacciones y ponernos en contacto con usted cuando sea necesario.

Para obtener más detalles, revise nuestra <a href="/reembolso">Política de Reembolso</a>.

<strong>SECCIÓN 7: HERRAMIENTAS OPCIONALES</strong>

Es posible que le proporcionemos acceso a herramientas de terceros que no supervisamos y sobre las que no tenemos ningún control ni colaboración. Usted reconoce y acepta que proporcionamos acceso a dichas herramientas "como están" y "según disponibilidad", sin garantías, declaraciones ni condiciones de ningún tipo y sin ningún tipo de respaldo. No nos hacemos responsables del uso que usted haga de las herramientas opcionales de terceros.

Cualquier uso por su parte de las herramientas opcionales ofrecidas a través del sitio corre enteramente por su cuenta y riesgo, y debe asegurarse de que conoce y aprueba las condiciones en las que los proveedores externos correspondientes proporcionan las herramientas.

También podremos, en el futuro, ofrecer nuevos servicios o funciones a través del sitio web (incluido el lanzamiento de herramientas y recursos nuevos). Las funciones o los servicios nuevos también estarán sujetos a los presentes Términos de servicio.

<strong>SECCIÓN 8: ENLACES DE TERCEROS</strong>

Determinados contenidos, productos y servicios disponibles a través de nuestro servicio pueden incluir materiales de terceros. Los enlaces de terceros en este sitio pueden dirigirlo a sitios web de terceros que no están asociados con nosotros. No nos hacemos responsables de examinar ni evaluar el contenido o la exactitud y no garantizamos ni asumiremos ninguna obligación o responsabilidad por cualquier material de terceros o sitios web, ni por ningún otro material, producto o servicio de terceros.

No nos hacemos responsables por ningún daño o perjuicio relacionado con la compra o el uso de bienes, servicios, recursos o contenidos ni por ninguna otra transacción realizada en relación con sitios web de terceros. Revise detenidamente las políticas y prácticas de los terceros y asegúrese de comprenderlas antes de realizar cualquier transacción. Las quejas, reclamaciones, dudas o preguntas sobre productos de terceros deben dirigirse a estos.

<strong>SECCIÓN 9: COMENTARIOS, OPINIONES Y OTROS ENVÍOS DE LOS USUARIOS</strong>

Si, a petición nuestra, envía determinadas propuestas específicas (por ejemplo, participaciones en concursos) o, sin que se lo pidamos, envía ideas creativas, sugerencias, propuestas, planes u otros materiales, ya sea online, por correo electrónico, por correo postal o de otro modo (colectivamente, "comentarios"), acepta que podremos, en cualquier momento y sin restricciones, editar, copiar, publicar, distribuir, traducir y utilizar de otro modo en cualquier medio cualquier comentario que nos envíe.

No estamos ni estaremos obligados (1) a mantener la confidencialidad de ningún comentario; (2) a pagar una compensación por ningún comentario; ni (3) a responder a ningún comentario.

Podemos, pero no tenemos ninguna obligación de, controlar, editar o eliminar el contenido que determinemos, a nuestra entera discreción, que es ilegal, ofensivo, amenazador, calumnioso, difamatorio, pornográfico, obsceno o de otra manera objetable, o que infrinja la propiedad intelectual de cualquier parte o estos Términos de servicio.

Usted acepta que sus comentarios no vulnerarán ningún derecho de terceros, incluidos los derechos de autor, marca registrada, privacidad, personalidad u otros derechos personales o de propiedad. Asimismo, acepta que sus comentarios no contendrán material difamatorio o ilegal, abusivo u obsceno, ni virus informáticos u otros programas maliciosos que puedan afectar de algún modo al funcionamiento del servicio o de cualquier sitio web relacionado.

No puede utilizar una dirección de correo electrónico falsa, hacerse pasar por otra persona que no sea usted, ni inducirnos a error a nosotros o a terceros sobre el origen de los comentarios. Usted es el único responsable de los comentarios que haga y de su veracidad. No nos hacemos responsables de los comentarios publicados por usted o por terceros.

<strong>SECCIÓN 10: INFORMACIÓN PERSONAL</strong>

El envío, por su parte, de información personal a través de la tienda se rige por nuestra <a href="/privacidad">Política de Privacidad</a>.

<strong>SECCIÓN 11: ERRORES, INEXACTITUDES Y OMISIONES</strong>

De tanto en tanto, puede haber información en nuestro sitio o en el Servicio que contenga errores tipográficos, inexactitudes u omisiones que puedan estar relacionados con descripciones de productos, precios, promociones, ofertas, cargos de envío de productos, tiempos de tránsito y disponibilidad. Nos reservamos el derecho a corregir cualquier error, inexactitud u omisión, y a cambiar o actualizar la información o cancelar los pedidos si cualquier información del servicio o de cualquier sitio web relacionado es inexacta, en cualquier momento y sin previo aviso (incluso después de que usted haya enviado su pedido).

No nos comprometemos a actualizar, modificar ni aclarar la información del servicio o de cualquier sitio web relacionado, incluida, sin limitación, la información sobre precios, salvo que lo exija la ley. Ninguna fecha especificada de actualización aplicada en el servicio se debe tomar para indicar que toda la información en el servicio se ha modificado o actualizado.

<strong>SECCIÓN 12: USOS PROHIBIDOS</strong>

Además de otras prohibiciones establecidas en los Términos de Servicio, se le prohíbe usar el sitio o su contenido: (a) para cualquier propósito ilegal; (b) para solicitar a otros que realicen o participen en cualquier acto ilegal; (c) para infringir cualquier regulación, regla, ley u ordenanza local internacional, federal, provincial o estatal; (d) para infringir o violar nuestros derechos de propiedad intelectual o los de terceros; (e) para acosar, abusar, insultar, dañar, difamar, calumniar, menospreciar, intimidar o discriminar por motivos de género, orientación sexual, religión, etnia, raza, edad, origen nacional o discapacidad; (f) para enviar información falsa o engañosa; (g) para cargar o transmitir virus o cualquier otro tipo de código malicioso; (h) para recopilar o rastrear la información personal de otros; (i) para enviar spam, phishing, pharm, pretexto, spider, crawler o scraper; (j) para cualquier propósito obsceno o inmoral; o (k) para interferir o eludir las características de seguridad del Servicio o cualquier sitio web relacionado.

Nos reservamos el derecho de poner fin al uso, por su parte, del Servicio o de cualquier sitio web relacionado por violar cualquiera de los usos prohibidos.

<strong>SECCIÓN 13: EXENCIÓN DE GARANTÍAS; LIMITACIÓN DE RESPONSABILIDAD</strong>

No garantizamos, representamos ni aseguramos que su uso de nuestro Servicio será ininterrumpido, oportuno o seguro, ni que estará libre de errores. No garantizamos que los resultados que puedan obtenerse del uso del Servicio serán precisos o confiables.

Usted acepta que de vez en cuando podemos eliminar el Servicio por períodos de tiempo indefinidos o cancelar el Servicio en cualquier momento, sin previo aviso. Usted acepta expresamente que el uso del Servicio o la imposibilidad de usarlo, por su parte, se realiza bajo su propio riesgo.

El Servicio y todos los productos y Servicios entregados a usted a través del Servicio se proporcionan (salvo que lo indiquemos expresamente) "tal como están" y "según disponibilidad" para su uso, sin ninguna representación, garantía o condición de ningún tipo, ya sea expresa o implícita, incluidas todas las garantías o condiciones implícitas de comerciabilidad, calidad comercial, idoneidad para un propósito particular, durabilidad, título y no infracción.

En ningún caso La Obrera y el Zángano Web Store, nuestros directores, funcionarios, empleados, afiliados, agentes, contratistas, pasantes, proveedores, proveedores de servicios o licenciantes serán responsables por lesiones, pérdidas, reclamos o daños directos, indirectos, incidentales, punitivos, especiales o consecuentes de tipo alguno, incluidos, entre otros, la pérdida de ganancias, la pérdida de ingresos, la pérdida de ahorros, la pérdida de datos, los costos de reemplazo o cualquier daño similar, ya sea por contrato, agravio (incluida negligencia), responsabilidad estricta o de otro tipo, que surja de su uso de cualquiera de los Servicios o productos adquiridos mediante el Servicio, incluso si se informa de su posibilidad.

Lo anterior no afecta los derechos irrenunciables que la Ley 19.496 otorga al consumidor, incluyendo la garantía legal de 3 meses.

<strong>SECCIÓN 14: INDEMNIZACIÓN</strong>

Usted acepta indemnizar, defender y eximir de responsabilidad a La Obrera y el Zángano Web Store y la empresa matriz, las subsidiarias, las afiliadas, los socios, los funcionarios, los directores, los agentes, los contratistas, los licenciantes, los proveedores de servicios, los subcontratistas, los proveedores, los pasantes y los empleados, por cualquier reclamo o demanda, incluidos los honorarios razonables de abogados, realizados por cualquier tercero debido a, o como resultado de, su incumplimiento de estos Términos de servicio o los documentos que incorporan por referencia, o su violación de cualquier ley o los derechos de un tercero.

<strong>SECCIÓN 15: DIVISIBILIDAD</strong>

En el caso de que se determine que alguna disposición de estos Términos de Servicio es ilegal, nula o inaplicable, dicha disposición será, no obstante, ejecutable en la máxima medida permitida por la ley aplicable, y la parte inaplicable se considerará separada de estos Términos de Servicio; dicha determinación no afectará la validez y aplicabilidad de las demás disposiciones restantes.

<strong>SECCIÓN 16: TERMINACIÓN</strong>

Las obligaciones y responsabilidades de las partes asumidas antes de la fecha de rescisión de este acuerdo seguirán teniendo vigencia después de esta para todos los efectos.

Estos Términos de Servicio entrarán en vigor a menos y hasta que usted o nosotros les pongamos fin. Puede rescindir estos Términos de Servicio en cualquier momento notificándonos que ya no desea utilizar nuestros Servicios o cuando deje de usar nuestro sitio.

Si, a nuestro exclusivo criterio, usted no cumple, o sospechamos que ha incumplido, cualquier término o disposición de estos Términos de Servicio, también podemos rescindir este acuerdo en cualquier momento sin previo aviso y usted seguirá siendo responsable de todos los montos adeudados hasta la fecha de terminación inclusive; o, en consecuencia, podemos negarle el acceso a nuestros Servicios (o cualquier parte de los mismos).

<strong>SECCIÓN 17: ACUERDO COMPLETO</strong>

El hecho de que no ejerzamos o hagamos valer cualquier derecho o disposición de estos Términos de Servicio no constituirá estar exento a dicho derecho o disposición. Estos Términos de Servicio y cualquier política o regla operativa publicada por nosotros en este sitio o con respecto al Servicio constituyen el acuerdo y entendimiento completo entre usted y nosotros, y rigen su uso del Servicio, por lo que reemplazan cualquier acuerdo, comunicación y propuesta anterior o contemporánea, ya sea oral o escrita, entre usted y nosotros (incluidas, entre otras, cualquier versión anterior de los Términos de Servicio). Cualquier ambigüedad en la interpretación de estos Términos de Servicio no se interpretará en contra del grupo redactor.

<strong>SECCIÓN 18: LEY APLICABLE</strong>

Estos Términos de Servicio y cualquier acuerdo por separado mediante el cual le proporcionemos Servicios se regirán e interpretarán de conformidad con las leyes de Chile, incluyendo especialmente:

- Ley 19.496 (Protección al Consumidor): garantías, derechos y prohibiciones de cláusulas abusivas.
- Ley 21.315 (Comercio Electrónico): derecho a retracto, formación electrónica de contratos, información precontractual.
- Ley 19.628 y Ley 21.719 (Protección de Datos Personales): tratamiento de datos personales, derechos ARCO.
- Ley 17.336 (Propiedad Intelectual): derechos de autor y propiedad intelectual.
- Ley 20.393 (Responsabilidad Penal de las Personas Jurídicas): prevención de delitos.

Para cualquier controversia, las partes se someterán a la competencia de los Tribunales Ordinarios de Justicia de Chile.

<strong>SECCIÓN 19: CAMBIOS EN LOS TÉRMINOS DE SERVICIO</strong>

Puede revisar la versión más actual de los Términos de servicio en cualquier momento en esta página. Nos reservamos el derecho de actualizar, cambiar o reemplazar, a nuestra entera discreción, cualquier parte de estos Términos de servicio mediante la publicación de actualizaciones y cambios en nuestro sitio web. Es su responsabilidad revisar nuestro sitio web periódicamente para consultar si hay cambios. El uso continuado del sitio web o el acceso al mismo o al Servicio tras la publicación de cualquier cambio en los Términos de Servicio implica la aceptación de dichos cambios.

<strong>SECCIÓN 20: DERECHO A RETRACTO</strong>

Conforme al artículo 3 bis de la Ley 21.315, usted tiene derecho a retracto dentro de 10 días calendario contados desde la recepción del producto comprado por medios electrónicos, sin necesidad de justificación. Consulte nuestra <a href="/cancelacion">Política de Cancelación</a> y <a href="/reembolso">Política de Reembolso</a> para los detalles del proceso.

<strong>SECCIÓN 21: GARANTÍA LEGAL</strong>

Nuestros productos están amparados por la garantía legal establecida en los artículos 20 a 24 de la Ley 19.496. Consulte nuestra <a href="/garantia">Política de Garantía</a> para conocer los detalles.

<strong>SECCIÓN 22: COMPLIANCE LEY 20.393</strong>

La Obrera y el Zángano cumple con la Ley 20.393 sobre Responsabilidad Penal de las Personas Jurídicas. Contamos con un modelo de prevención de delitos que incluye un canal de denuncia para reportar conductas ilícitas relacionadas con lavado de activos, financiamiento del terrorismo, cohecho y otros delitos contemplados en la ley. Para reportar, escriba a contacto@obrerayzangano.com con referencia "Canal de Integridad".

<strong>SECCIÓN 23: INFORMACIÓN DE CONTACTO</strong>

Las preguntas sobre los Términos de Servicio deben enviarse a comunidad@obrerayzangano.com

La Obrera y el Zángano
comunidad@obrerayzangano.com
Pureo rural km 8560, Quellón, Chiloé, Chile
+56 9 408 31 358

Para reclamos de consumo, puede acudir al SERNAC (www.sernac.cl).

Políticas relacionadas: <a href="/privacidad">Privacidad</a> | <a href="/cookies">Cookies</a> | <a href="/cancelacion">Cancelación</a> | <a href="/envio">Envío</a> | <a href="/reembolso">Reembolso</a> | <a href="/garantia">Garantía</a>
`;

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={(item && typeof item === 'object' && 'updated_at' in item ? String(item.updated_at) : null) || '19 de mayo de 2026'}
    />
  );
}
