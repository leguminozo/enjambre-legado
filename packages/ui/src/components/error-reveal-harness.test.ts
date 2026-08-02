import { describe, expect, it, vi } from 'vitest';
import vm from 'node:vm';
import { errorRevealHarnessScript } from './error-reveal-harness';

function runHarness() {
  const handlers = new Map<string, (ev: unknown) => void>();
  const created: Array<{ id: string; setAttribute: (k: string, v: string) => void; textContent: string }> = [];
  let panelExists = false;
  const appendChild = vi.fn();

  const fakeDocument = {
    getElementById: vi.fn(() => (panelExists ? { id: 'enjambre-error-reveal' } : null)),
    createElement: vi.fn(() => {
      const el = { id: '', setAttribute: () => {}, textContent: '', appendChild: () => {} };
      if (created.length === 0) panelExists = true; // el primer elemento creado es el panel
      created.push(el);
      return el;
    }),
    documentElement: { appendChild },
  };

  const sandbox: Record<string, unknown> = {
    document: fakeDocument,
    navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X)' },
    addEventListener: (ev: string, fn: (ev: unknown) => void) => {
      handlers.set(ev, fn);
    },
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox; // en el navegador window === globalThis
  const ctx = vm.createContext(sandbox);
  vm.runInContext(errorRevealHarnessScript(), ctx);

  return { ctx, handlers, appendChild, created, fakeDocument };
}

describe('errorRevealHarnessScript', () => {
  it('captura window.onerror y pinta un panel con el mensaje', () => {
    const { handlers, appendChild, created } = runHarness();
    const errorHandler = handlers.get('error');
    expect(errorHandler).toBeTypeOf('function');
    errorHandler!({
      message: 'boom en file.js',
      filename: 'http://localhost/x/file.js',
      lineNumber: 3,
      error: { stack: 'Error: boom\n    at fn' },
    });

    expect(appendChild).toHaveBeenCalledTimes(1);
    const panel = appendChild.mock.calls[0]![0] as { id: string };
    expect(panel.id).toBe('enjambre-error-reveal');
    // header (created[1]) + entrada (created[2])
    expect(created[1]!.textContent).toContain('ENJAMBRE DIAGN');
    expect(created[1]!.textContent).toContain('iPhone OS 15_8');
    expect(created[2]!.textContent).toContain('boom');
  });

  it('captura unhandledrejection', () => {
    const { handlers, created } = runHarness();
    handlers.get('unhandledrejection')!({ reason: { message: 'promesa rota', stack: 'at p' } });
    expect(created[2]!.textContent).toContain('promesa rota');
  });

  it('no duplica el panel tras varios errores', () => {
    const { handlers, appendChild } = runHarness();
    const errorHandler = handlers.get('error')!;
    errorHandler({ message: 'uno', filename: '', lineNumber: 1, error: null });
    errorHandler({ message: 'dos', filename: '', lineNumber: 2, error: null });
    expect(appendChild).toHaveBeenCalledTimes(1);
  });

  it('guarda contra doble inicialización', () => {
    const { ctx, handlers } = runHarness();
    const registered = handlers.size;
    vm.runInContext(errorRevealHarnessScript(), ctx);
    expect(handlers.size).toBe(registered);
  });
});
