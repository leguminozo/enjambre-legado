/**
 * Server-safe: no 'use client'.
 * Injectar en root layout (head o primer hijo de body) para alinear
 * class light/dark antes de la hidratación de React (#418).
 */

export type ThemeInitValue = 'light' | 'dark' | 'system';

export function themeInitScript(
  storageKey: string,
  defaultTheme: ThemeInitValue,
  enableSystem: boolean,
  forcedTheme?: ThemeInitValue | null,
): string {
  return `(function(){try{var k=${JSON.stringify(storageKey)};var d=${JSON.stringify(defaultTheme)};var f=${JSON.stringify(forcedTheme ?? null)};var s=${JSON.stringify(enableSystem)};var t=f||localStorage.getItem(k)||d;if(t==="system"&&s){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}if(t!=="light"&&t!=="dark"){t="dark"}var r=document.documentElement;r.classList.remove("light","dark");r.classList.add(t);r.style.colorScheme=t}catch(e){}})();`;
}

export function ThemeInitScript({
  storageKey = 'enjambre-theme',
  defaultTheme = 'system',
  enableSystem = true,
  forcedTheme,
  nonce,
}: {
  storageKey?: string;
  defaultTheme?: ThemeInitValue;
  enableSystem?: boolean;
  forcedTheme?: ThemeInitValue | null;
  nonce?: string;
}) {
  return (
    <script
      {...(nonce ? { nonce } : {})}
      dangerouslySetInnerHTML={{
        __html: themeInitScript(
          storageKey,
          defaultTheme,
          Boolean(enableSystem) && !forcedTheme,
          forcedTheme,
        ),
      }}
    />
  );
}
