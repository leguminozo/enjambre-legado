import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

interface CalculoImpuestosRequest {
  empresaId: string;
  periodo?: string; // "YYYY-MM"
  ingresosNetos?: number;
  gastosNetos?: number;
  ivaDebito?: number;
  ivaCredito?: number;
}

interface CalculoPPMRequest {
  empresaId: string;
  anio: number;
  ingresosNetosAnuales?: number;
}

interface ProyeccionUtilidadRequest {
  empresaId: string;
  mesesHistoricos?: number;
  factoresExternos?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, parametros } = body;

    if (!tipo || !parametros) {
      return NextResponse.json({ error: 'Tipo y parámetros son requeridos' }, { status: 400 });
    }

    // Crear registro de cálculo IA
    const calculoIA = await db.calculoIA.create({
      data: {
        empresaId: parametros.empresaId,
        tipo,
        parametros: JSON.stringify(parametros),
        estado: 'Procesando'
      }
    });

    // Procesar según el tipo de cálculo
    let resultado;
    let prompt;
    let respuestaIA;

    try {
      const zai = await ZAI.create();

      switch (tipo) {
        case 'ImpuestoMensual':
          resultado = await calcularImpuestosMensuales(zai, parametros as CalculoImpuestosRequest);
          prompt = generarPromptImpuestosMensuales(parametros as CalculoImpuestosRequest);
          break;

        case 'PPM':
          resultado = await calcularPPM(zai, parametros as CalculoPPMRequest);
          prompt = generarPromptPPM(parametros as CalculoPPMRequest);
          break;

        case 'ProyeccionUtilidad':
          resultado = await proyectarUtilidad(zai, parametros as ProyeccionUtilidadRequest);
          prompt = generarPromptProyeccionUtilidad(parametros as ProyeccionUtilidadRequest);
          break;

        case 'OptimizacionFiscal':
          resultado = await optimizacionFiscal(zai, parametros);
          prompt = generarPromptOptimizacionFiscal(parametros);
          break;

        default:
          throw new Error(`Tipo de cálculo no soportado: ${tipo}`);
      }

      // Actualizar registro con resultado
      await db.calculoIA.update({
        where: { id: calculoIA.id },
        data: {
          resultado: JSON.stringify(resultado),
          estado: 'Completado',
          prompt,
          respuestaIA: JSON.stringify(respuestaIA)
        }
      });

      return NextResponse.json({
        id: calculoIA.id,
        tipo,
        resultado,
        estado: 'Completado'
      });

    } catch (error) {
      // Actualizar registro con error
      await db.calculoIA.update({
        where: { id: calculoIA.id },
        data: {
          estado: 'Error',
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      });

      throw error;
    }

  } catch (error) {
    console.error('Error en cálculo IA:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}

async function calcularImpuestosMensuales(zai: any, params: CalculoImpuestosRequest) {
  // Obtener datos reales si no se proporcionan
  let datos = { ...params };
  
  if (!datos.ingresosNetos || !datos.gastosNetos) {
    const periodo = params.periodo || new Date().toISOString().slice(0, 7);
    const [anio, mes] = periodo.split('-').map(Number);
    
    const periodoContable = await db.periodoContable.findFirst({
      where: {
        empresaId: params.empresaId,
        mes,
        anio
      }
    });

    if (periodoContable) {
      datos.ingresosNetos = datos.ingresosNetos || periodoContable.ingresosNetos;
      datos.gastosNetos = datos.gastosNetos || periodoContable.egresosNetos;
      datos.ivaDebito = datos.ivaDebito || periodoContable.ivaDebito;
      datos.ivaCredito = datos.ivaCredito || periodoContable.ivaCredito;
    }
  }

  const prompt = generarPromptImpuestosMensuales(datos);
  
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en contabilidad y tributación chilena, especializado en empresas EIRL PROPYME.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1
  });

  const respuesta = completion.choices[0]?.message?.content;
  
  // Procesar respuesta y extraer cálculos
  const resultado = {
    ivaPagar: Math.max(0, (datos.ivaDebito || 0) - (datos.ivaCredito || 0)),
    utilidadNeta: (datos.ingresosNetos || 0) - (datos.gastosNetos || 0),
    impuestoPrimeraCategoria: 0, // Se calcula anualmente
    retenciones: 0,
    totalImpuestos: Math.max(0, (datos.ivaDebito || 0) - (datos.ivaCredito || 0)),
    observaciones: respuesta || 'Cálculo realizado según normativa tributaria chilena.'
  };

  return resultado;
}

async function calcularPPM(zai: any, params: CalculoPPMRequest) {
  const prompt = generarPromptPPM(params);
  
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en tributación chilena, especializado en Pago Provisional Mensual (PPM) para EIRL PROPYME.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1
  });

  const respuesta = completion.choices[0]?.message?.content;
  
  // Cálculo básico de PPM (1% o 0.5% de los ingresos mensuales promedio)
  const ingresosMensualesPromedio = (params.ingresosNetosAnuales || 0) / 12;
  const ppm = ingresosMensualesPromedio * 0.01; // 1% como tasa base

  const resultado = {
    ppmMensual: ppm,
    ppmAnualProyectado: ppm * 12,
    tasaUtilizada: '1%',
    baseCalculo: ingresosMensualesPromedio,
    observaciones: respuesta || 'PPM calculado según normativa tributaria chilena vigente.'
  };

  return resultado;
}

async function proyectarUtilidad(zai: any, params: ProyeccionUtilidadRequest) {
  const prompt = generarPromptProyeccionUtilidad(params);
  
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en análisis financiero y proyecciones para empresas EIRL PROPYME en Chile.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.2
  });

  const respuesta = completion.choices[0]?.message?.content;
  
  // Obtener datos históricos
  const periodosHistoricos = await db.periodoContable.findMany({
    where: {
      empresaId: params.empresaId
    },
    orderBy: {
      fechaInicio: 'desc'
    },
    take: params.mesesHistoricos || 6
  });

  const ingresosPromedio = periodosHistoricos.reduce((sum, p) => sum + p.ingresosNetos, 0) / periodosHistoricos.length;
  const gastosPromedio = periodosHistoricos.reduce((sum, p) => sum + p.egresosNetos, 0) / periodosHistoricos.length;
  
  const resultado = {
    utilidadProyectadaMensual: ingresosPromedio - gastosPromedio,
    ingresosProyectadosMensual: ingresosPromedio,
    gastosProyectadosMensual: gastosPromedio,
    margenUtilidadProyectado: ingresosPromedio > 0 ? ((ingresosPromedio - gastosPromedio) / ingresosPromedio) * 100 : 0,
    tendencia: ingresosPromedio > gastosPromedio ? 'Positiva' : 'Negativa',
    observaciones: respuesta || 'Proyección basada en datos históricos y análisis de tendencia.'
  };

  return resultado;
}

async function optimizacionFiscal(zai: any, params: any) {
  const prompt = generarPromptOptimizacionFiscal(params);
  
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en optimización fiscal para empresas EIRL PROPYME en Chile, conocedor de todas las deducciones y beneficios tributarios disponibles.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3
  });

  const respuesta = completion.choices[0]?.message?.content;
  
  const resultado = {
    recomendaciones: [
      'Mantener registros detallados de todos los gastos',
      'Clasificar correctamente los gastos para maximizar deducciones',
      'Considerar gastos de representación y marketing',
      'Revisar provisiones y depreciaciones',
      'Evaluar oportunidad de pagos provisionales'
    ],
    ahorroPotencial: 'Variable según estructura de gastos',
    riesgoCumplimiento: 'Bajo si se siguen las recomendaciones',
    observaciones: respuesta || 'Análisis de optimización fiscal basado en normativa vigente.'
  };

  return resultado;
}

// Funciones generadoras de prompts
function generarPromptImpuestosMensuales(params: CalculoImpuestosRequest): string {
  return `
Como experto en contabilidad chilena, calcula los impuestos mensuales para una empresa EIRL PROPYME con los siguientes datos:

- Ingresos netos mensuales: $${params.ingresosNetos || 0}
- Gastos netos mensuales: $${params.gastosNetos || 0}
- IVA débito: $${params.ivaDebito || 0}
- IVA crédito: $${params.ivaCredito || 0}

Calcula:
1. IVA mensual a pagar o recuperar
2. Utilidad neta mensual
3. Cualquier otro impuesto relevante

Considera la normativa tributaria chilena vigente para EIRL PROPYME transparentes.
`;
}

function generarPromptPPM(params: CalculoPPMRequest): string {
  return `
Como experto en tributación chilena, calcula el Pago Provisional Mensual (PPM) para una EIRL PROPYME:

- Año: ${params.anio}
- Ingresos netos anuales estimados: $${params.ingresosNetosAnuales || 0}

Determina:
1. Monto mensual de PPM
2. Tasa aplicable
3. Base de cálculo
4. Consideraciones especiales para EIRL PROPYME

Basado en la Ley de Impuesto a la Renta y normativa SII vigente.
`;
}

function generarPromptProyeccionUtilidad(params: ProyeccionUtilidadRequest): string {
  return `
Como analista financiero especializado en EIRL PROPYME chilenas, proyecta la utilidad para los próximos meses considerando:

- Meses de datos históricos a considerar: ${params.mesesHistoricos || 6}
- Factores externos: ${params.factoresExternos?.join(', ') || 'No especificados'}

Realiza:
1. Proyección de ingresos mensuales
2. Proyección de gastos mensuales
3. Utilidad neta proyectada
4. Margen de utilidad esperado
5. Tendencia identificada

Considera estacionalidad y contexto económico actual.
`;
}

function generarPromptOptimizacionFiscal(params: any): string {
  return `
Como asesor fiscal experto en EIRL PROPYME, proporciona recomendaciones de optimización fiscal:

Analiza oportunidades para:
1. Maximizar deducciones de gastos
2. Optimizar estructura de costos
3. Planificar pagos provisionales
4. Mejorar posición fiscal general

Considera todas las deducciones permitidas por la ley chilena para EIRL PROPYME transparentes.
Proporciona recomendaciones prácticas y específicas.
`;
}