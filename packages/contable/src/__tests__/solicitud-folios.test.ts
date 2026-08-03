import { describe, it, expect } from 'vitest';
import { buildSolicitudFoliosXml } from '../domain/solicitud-folios';

describe('buildSolicitudFoliosXml (movimiento 2: CAF automático)', () => {
  it('genera la estructura canónica SolicitudDeFolios', () => {
    const xml = buildSolicitudFoliosXml({
      rutSolicitante: '77777777-7',
      rutEmpresa: '77777777-7',
      tipoDte: 39,
      cantidad: 100,
    });

    expect(xml).toContain('<?xml version="1.0" encoding="ISO-8859-1"?>');
    expect(xml).toContain('<SolicitudDeFolios xmlns="http://www.sii.cl/XMLSchema" version="1.0">');
    expect(xml).toContain('<RutSolicitante>77777777-7</RutSolicitante>');
    expect(xml).toContain('<RutEmpresa>77777777-7</RutEmpresa>');
    expect(xml).toContain('<TipoSolicitud>0</TipoSolicitud>');
    expect(xml).toContain('<TipoDte>39</TipoDte>');
    expect(xml).toContain('<Cantidad>100</Cantidad>');
    expect(xml).toContain('<FoliosReutilizar/>');
    expect(xml).toContain('</SolicitudDeFolios>');
  });

  it('cantidad se redondea a entero positivo (nunca 0 o negativo)', () => {
    expect(buildSolicitudFoliosXml({ rutSolicitante: '1-1', rutEmpresa: '1-1', tipoDte: 39, cantidad: 0 })).toContain('<Cantidad>1</Cantidad>');
    expect(buildSolicitudFoliosXml({ rutSolicitante: '1-1', rutEmpresa: '1-1', tipoDte: 39, cantidad: 99.7 })).toContain('<Cantidad>99</Cantidad>');
  });

  it('escapa XML en observaciones y folios reutilizables', () => {
    const xml = buildSolicitudFoliosXml({
      rutSolicitante: '1-1',
      rutEmpresa: '1-1',
      tipoDte: 33,
      cantidad: 50,
      foliosReutilizar: '100,101,102',
      observaciones: 'Reposición <urgente> & normal',
    });
    expect(xml).toContain('<FoliosReutilizar>100,101,102</FoliosReutilizar>');
    expect(xml).toContain('Reposición &lt;urgente&gt; &amp; normal');
  });

  it('soporta distintos tipos de DTE (33 factura, 39 boleta)', () => {
    expect(buildSolicitudFoliosXml({ rutSolicitante: '1-1', rutEmpresa: '1-1', tipoDte: 33, cantidad: 10 })).toContain('<TipoDte>33</TipoDte>');
  });
});
