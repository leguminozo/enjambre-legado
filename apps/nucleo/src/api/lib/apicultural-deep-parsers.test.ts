import { describe, expect, it } from 'vitest';
import {
  parseApiculturalOntology,
  reconcileWithLlm,
} from './apicultural-reconciler';
import { normalizeApiculturalText } from './apicultural-normalizer';
import { parseVoiceTranscription } from '@/components/apicultor/cuaderno/voice-parse';

describe('Ontología Apícola Profunda (Meta 99% Cero Fallo)', () => {
  it('1. Deduce presencia de reina activa a partir de postura fresca aunque no se la haya avistado', () => {
    const res = parseApiculturalOntology(
      'Colmena 4. No vi la reina pero hay postura del día y cinco marcos de cría y dos de miel.',
    );
    expect(res.colmenaIdentificador).toBe('4');
    expect(res.reina.vista).toBe(false);
    expect(res.reina.presente).toBe(true);
    expect(res.reina.posturaFrescaPresente).toBe(true);
    expect(res.reina.estado).toBe('CI');
    expect(res.cuadrosTotales.marcosCriaTotal).toBe(5);
    expect(res.cuadrosTotales.marcosMiel).toBe(2);
  });

  it('2. Detecta celdas reales y riesgo de enjambrazón', () => {
    const res = parseApiculturalOntology(
      'Colmena 7, levantando tres realeras operculadas para enjambrazón, muy poblada.',
    );
    expect(res.colmenaIdentificador).toBe('7');
    expect(res.reina.realerasDetectadas).toBeDefined();
    expect(res.reina.realerasDetectadas?.cantidad).toBe(3);
    expect(res.reina.realerasDetectadas?.tipo).toBe('enjambrazon');
    expect(res.poblacion.nivel).toBe('Alta');
    expect(res.accionesSugeridas).toContain('Revisar enjambrazón o emergencia de reina');
  });

  it('3. Detecta colonia zanganera y orfandad', () => {
    const res = parseApiculturalOntology(
      'Está huérfana, cría zanganera salteada en 3 marcos, sin reservas.',
    );
    expect(res.reina.presente).toBe(false);
    expect(res.reina.vista).toBe(false);
    expect(res.reina.zanganera).toBe(true);
    expect(res.reina.estado).toBe('SR');
    expect(res.cuadrosTotales.marcosCriaTotal).toBe(3);
    expect(res.accionesSugeridas).toContain('Intervenir colmena zanganera o fusionar');
  });

  it('4. Corrige automáticamente ruido fonético y deslices de transcripción (barroa, perculada, realezas)', () => {
    const normalizado = normalizeApiculturalText(
      'Colmena 8, barroa al dos por ciento, perculada en cuatro marcos y dos realezas.',
    );
    expect(normalizado).toContain('varroa');
    expect(normalizado).toContain('operculada');
    expect(normalizado).toContain('realeras');

    const res = parseApiculturalOntology(
      'Colmena 8, barroa al dos por ciento, perculada en cuatro marcos y dos realezas.',
    );
    expect(res.colmenaIdentificador).toBe('8');
    expect(res.sanidad.varroaDetectada).toContain('2%');
    expect(res.cuadrosTotales.marcosCriaTotal).toBe(4);
    expect(res.reina.realerasDetectadas?.cantidad).toBe(2);
  });

  it('5. Interpreta lenguaje numérico coloquial ("un par", "medio cajón", "a reventar")', () => {
    const res = parseApiculturalOntology(
      'Tiene un par de marcos de miel y como cuatro de cría.',
    );
    expect(res.cuadrosTotales.marcosMiel).toBe(2);
    expect(res.cuadrosTotales.marcosCriaTotal).toBe(4);
  });

  it('6. Detecta temperamento defensivo/picador y fuerza por calles de abejas', () => {
    const res = parseApiculturalOntology(
      'Colmena muy picadora y defensiva, 8 calles de abejas cubiertas.',
    );
    expect(res.poblacion.temperamento).toBe('Defensiva');
    expect(res.poblacion.callesAbejas).toBe(8);
    expect(res.poblacion.nivel).toBe('Alta');
  });

  it('7. Parsea con precisión la frase exacta de terreno del usuario', () => {
    const res = parseApiculturalOntology('cinco Marcos de cría y cuadro de miel');
    expect(res.cuadrosTotales.marcosCriaTotal).toBe(5);
    expect(res.cuadrosTotales.marcosMiel).toBe(1);
  });

  it('8. Aplica invariantes físicos Langstroth (>10 marcos)', () => {
    const res = parseApiculturalOntology(
      'Colmena 2. Seis marcos de cría, seis marcos de miel y dos de polen.',
    );
    expect(res.cuadrosTotales.marcosCriaTotal).toBe(6);
    expect(res.cuadrosTotales.marcosMiel).toBe(6);
    expect(res.cuadrosTotales.marcosPolen).toBe(2);
    expect(res.invariantesFisicos.excedeCapacidadCamara).toBe(true);
    expect(res.accionesSugeridas).toContain('Colocar alza melaria por bloqueo de espacio');
  });

  it('9. Identifica tratamientos fitosanitarios y activa alerta sanitaria ante varroa crítica', () => {
    const res = parseApiculturalOntology(
      'Varroa al 4 por ciento con alas deformadas, se aplicó timol en el cajón.',
    );
    expect(res.sanidad.varroaNivelEstimado).toBe(4);
    expect(res.sanidad.alertaSanitaria).toBe(true);
    expect(res.sanidad.sintomas).toContain('Alas deformadas (posible virus DWV / alta varroa)');
    expect(res.sanidad.tratamientoMencionado).toBe('timol');
    expect(res.accionesSugeridas).toContain('Tratar varroa orgánicamente (oxálico/timol)');
  });

  it('10. Reconoce distinción entre miel operculada y néctar verde', () => {
    const res = parseApiculturalOntology(
      'Cuatro cuadros con miel operculada y dos con néctar fresco.',
    );
    expect(res.cuadrosTotales.marcosMiel).toBe(4);
    expect(res.cuadrosTotales.marcosNectar).toBe(2);
  });

  it('11. Reconoce cera estampada vs labrada', () => {
    const res = parseApiculturalOntology(
      'Metí tres cuadros con cera estampada y dos con cera labrada.',
    );
    expect(res.cuadrosTotales.marcosCeraEstampada).toBe(3);
    expect(res.cuadrosTotales.marcosCeraLabrada).toBe(2);
  });

  it('12. Conciliador con LLM enriquece campos manteniendo invariantes biológicos', () => {
    const det = parseApiculturalOntology('Colmena 10, no vi la reina, pero hay huevitos frescos.');
    const reconciled = reconcileWithLlm(det, {
      colmenaQuery: '10',
      reinaVista: false,
      marcosCria: 3,
      poblacion: 'Media',
      temperamento: 'Mansa',
    });
    expect(reconciled.colmenaIdentificador).toBe('10');
    expect(reconciled.reina.vista).toBe(false);
    expect(reconciled.reina.presente).toBe(true); // Se conserva la regla biológica
    expect(reconciled.poblacion.temperamento).toBe('Mansa');
    expect(reconciled.cuadrosTotales.marcosCriaTotal).toBe(3);
  });

  it('13. Integración en parseVoiceTranscription (consumido por UI)', () => {
    const parsed = parseVoiceTranscription(
      'Colmena 12, reina vista, 6 marcos de cría abierta y 3 de miel, sin varroa, mansa.',
    );
    expect(parsed.colmenaQuery).toBe('12');
    expect(parsed.reinaVista).toBe(true);
    expect(parsed.reinaPresente).toBe(true);
    expect(parsed.marcosCria).toBe(6);
    expect(parsed.marcosMiel).toBe(3);
    expect(parsed.varroa).toBe('0');
    expect(parsed.temperamento).toBe('Mansa');
  });

  it('14. Frase concisa "una reina" detecta reina vista sin generar marcos fantasmas en cero', () => {
    const parsed = parseVoiceTranscription('una reina');
    expect(parsed.reinaVista).toBe(true);
    expect(parsed.reinaPresente).toBe(true);
    expect(parsed.marcosCria).toBeUndefined();
    expect(parsed.marcosMiel).toBeUndefined();

    const res = parseApiculturalOntology('una reina');
    expect(res.reina.vista).toBe(true);
    expect(res.reina.presente).toBe(true);
    expect(res.reina.estado).toBe('RV');
    expect(res.cuadrosTotales.marcosCriaTotal).toBe(0);
  });

  it('15. Reconciliación con LLM protege afirmación "una reina" contra falsos negativos del modelo', () => {
    const baseline = parseApiculturalOntology('una reina');
    // Simulamos que el LLM por error devolvió reinaVista: false y 0 marcos
    const reconciled = reconcileWithLlm(baseline, {
      reinaVista: false,
      marcosCria: 0,
      marcosMiel: 0,
    });
    expect(reconciled.reina.vista).toBe(true);
    expect(reconciled.reina.presente).toBe(true);
    expect(reconciled.reina.estado).toBe('RV');
    expect(reconciled.cuadrosTotales.marcosCriaTotal).toBe(0);
    expect(reconciled.cuadrosTotales.marcosMiel).toBe(0);
  });
});
