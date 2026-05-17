'use strict';

const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;
const from   = process.env.RESEND_FROM || 'RAFFINATO <onboarding@resend.dev>';

console.log('[Email] API Key carregada?', !!apiKey);
console.log('[Email] Remetente:', from);

if (!apiKey) {
  console.warn('[Email] RESEND_API_KEY não configurada.');
}

const resend = apiKey ? new Resend(apiKey) : null;

async function sendEmail({ to, subject, html }) {
  console.log('[Email] Iniciando envio...');
  console.log('[Email] Para:', to);
  console.log('[Email] Assunto:', subject);

  if (!resend) {
    console.warn('[Email] Resend não inicializado. Verifique RESEND_API_KEY.');
    return;
  }

  const result = await resend.emails.send({ from, to, subject, html });

  if (result.error) {
    console.error('[Email] Falha ao enviar:', result.error);
    throw new Error(result.error.message || 'Erro desconhecido ao enviar e-mail');
  }

  console.log('[Email] Resend respondeu com id:', result.data?.id);
  return result.data;
}

async function sendOrderConfirmation(order) {
  const email = order?.cliente?.email || order?.customer?.email;
  const nome  = order?.cliente?.nome  || order?.cliente?.name || order?.customer?.name || 'Cliente';

  if (!email) {
    console.warn('[Email] Pedido sem e-mail de cliente.');
    return;
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e4e4e4;border-radius:12px;overflow:hidden;">
      <div style="background:#0a0a0a;padding:32px;text-align:center;">
        <p style="color:#c8a96e;font-size:10px;font-weight:700;letter-spacing:0.32em;text-transform:uppercase;margin:0 0 8px;">RAFFINATO</p>
        <h1 style="color:#fff;font-size:20px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0;">Pedido Recebido</h1>
      </div>
      <div style="padding:40px;">
        <p style="font-size:15px;color:#111;margin:0 0 8px;">Olá, <strong>${nome}</strong>!</p>
        <p style="font-size:13px;color:#777;line-height:1.8;margin:0 0 24px;">
          Seu pedido foi recebido com sucesso. Você receberá uma nova notificação assim que o pagamento for confirmado.
        </p>
        <div style="background:#f7f6f4;border-radius:8px;padding:20px;margin-bottom:24px;">
          <p style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#aaa;margin:0 0 6px;">Número do pedido</p>
          <p style="font-size:22px;font-weight:700;color:#0a0a0a;margin:0;">${order.orderNumber || order._id}</p>
        </div>
        <p style="font-size:12px;color:#aaa;text-align:center;margin:32px 0 0;">Dúvidas? <a href="mailto:${process.env.STORE_EMAIL || 'contato@raffinato.com'}" style="color:#c8a96e;">contato@raffinato.com</a></p>
      </div>
    </div>`;

  return sendEmail({
    to:      email,
    subject: `Pedido ${order.orderNumber || order._id} recebido — RAFFINATO`,
    html
  });
}

async function sendPaymentConfirmed(order) {
  const email = order?.cliente?.email || order?.customer?.email;
  const nome  = order?.cliente?.nome  || order?.cliente?.name || order?.customer?.name || 'Cliente';

  if (!email) {
    console.warn('[Email] Pedido sem e-mail de cliente.');
    return;
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e4e4e4;border-radius:12px;overflow:hidden;">
      <div style="background:#0a0a0a;padding:32px;text-align:center;">
        <p style="color:#c8a96e;font-size:10px;font-weight:700;letter-spacing:0.32em;text-transform:uppercase;margin:0 0 8px;">RAFFINATO</p>
        <h1 style="color:#fff;font-size:20px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0;">Pagamento Aprovado</h1>
      </div>
      <div style="padding:40px;">
        <p style="font-size:15px;color:#111;margin:0 0 8px;">Olá, <strong>${nome}</strong>!</p>
        <p style="font-size:13px;color:#777;line-height:1.8;margin:0 0 24px;">
          Seu pagamento foi aprovado com sucesso. Seu pedido já está sendo separado.
        </p>
        <div style="background:#f7f6f4;border-radius:8px;padding:20px;margin-bottom:24px;">
          <p style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#aaa;margin:0 0 6px;">Número do pedido</p>
          <p style="font-size:22px;font-weight:700;color:#0a0a0a;margin:0;">${order.orderNumber || order._id}</p>
        </div>
        <p style="font-size:13px;font-weight:700;color:#2d6a4f;text-align:center;">Total pago: R$ ${Number(order.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <p style="font-size:12px;color:#aaa;text-align:center;margin:32px 0 0;">Dúvidas? <a href="mailto:${process.env.STORE_EMAIL || 'contato@raffinato.com'}" style="color:#c8a96e;">contato@raffinato.com</a></p>
      </div>
    </div>`;

  return sendEmail({
    to:      email,
    subject: `✓ Pagamento aprovado — Pedido ${order.orderNumber || order._id} em preparação`,
    html
  });
}

module.exports = { sendEmail, sendOrderConfirmation, sendPaymentConfirmed };
