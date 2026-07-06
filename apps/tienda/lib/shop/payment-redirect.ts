'use client';

export type PaymentRedirectInput = {
  url: string;
  token: string;
  provider?: string;
};

/** Redirige al proveedor de pago (Flow GET o Transbank form POST). */
export function redirectToPaymentProvider({ url, token, provider }: PaymentRedirectInput): void {
  if (provider === 'flow') {
    window.location.href = `${url}?token=${token}`;
    return;
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  const tokenInput = document.createElement('input');
  tokenInput.type = 'hidden';
  tokenInput.name = 'token_ws';
  tokenInput.value = token;
  form.appendChild(tokenInput);
  document.body.appendChild(form);
  form.submit();
}