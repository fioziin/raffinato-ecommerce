'use strict';

let Resend;
try { Resend = require('resend').Resend; } catch { /* resend não instalado */ }

const from     = () => process.env.RESEND_FROM    || 'RAFFINATO <pedidos@raffinato.com>';
const support  = () => process.env.STORE_EMAIL    || 'contato@raffinato.com';
const frontend = () => process.env.FRONTEND_URL   || 'https://vista-raffinato.vercel.app';

const fmt = n => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── Layout base ──────────────────────────────────────────────── */
function layout(title, subtitle, body) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — RAFFINATO</title>
</head>
<body style="margin:0;padding:0;background:#f7f6f4;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px 64px;">

  <!-- Cabeçalho -->
  <div style="background:#0a0a0a;border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
    <p style="color:#c8a96e;font-size:10px;font-weight:700;letter-spacing:0.32em;text-transform:uppercase;margin:0 0 10px 0;">RAFFINATO</p>
    <h1 style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0;">${title}</h1>
    ${subtitle ? `<p style="color:rgba(255,255,255,0.5);font-size:12px;margin:8px 0 0 0;letter-spacing:0.06em;">${subtitle}</p>` : ''}
  </div>

  <!-- Corpo -->
  <div style="background:#ffffff;border:1px solid #e4e4e4;border-top:none;border-radius:0 0 12px 12px;padding:40px;">
    ${body}

    <!-- Rodapé -->
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid #eeeeee;text-align:center;">
      <p style="font-size:11px;color:#aaaaaa;margin:0 0 6px 0;">Dúvidas? Fale conosco</p>
      <a href="mailto:${support()}" style="color:#c8a96e;font-size:11px;font-weight:700;text-decoration:none;">${support()}</a>
      <p style="font-size:10px;color:#cccccc;margin:16px 0 0 0;">© RAFFINATO — Moda Premium</p>
    </div>
  </div>

</div>
</body>
</html>`;
}

/* ── Componentes reutilizáveis ────────────────────────────────── */
function badge(label, value) {
  return `
  <div style="background:#f7f6f4;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
    <p style="font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#aaaaaa;margin:0 0 4px 0;">${label}</p>
    <p style="font-size:22px;font-weight:700;color:#0a0a0a;margin:0;letter-spacing:0.06em;">${value}</p>
  </div>`;
}

function itemsTable(items) {
  const rows = items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:13px;color:#222222;">
        ${item.nome}
        ${item.tamanho ? `<span style="color:#999999;font-size:11px;"> — Tam. ${item.tamanho}</span>` : ''}
        ${item.cor     ? `<span style="color:#999999;font-size:11px;"> · ${item.cor}</span>`          : ''}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:13px;color:#777777;text-align:center;white-space:nowrap;">${item.quantidade}×</td>
      <td style="padding:12px 0;border-bottom:1px solid #f5f5f5;font-size:13px;font-weight:700;color:#0a0a0a;text-align:right;white-space:nowrap;">${fmt(item.preco * item.quantidade)}</td>
    </tr>`).join('');

  return `
  <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
    <thead>
      <tr>
        <th style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:#aaaaaa;text-transform:uppercase;text-align:left;padding-bottom:10px;border-bottom:2px solid #0a0a0a;">Produto</th>
        <th style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:#aaaaaa;text-transform:uppercase;text-align:center;padding-bottom:10px;border-bottom:2px solid #0a0a0a;">Qtd</th>
        <th style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:#aaaaaa;text-transform:uppercase;text-align:right;padding-bottom:10px;border-bottom:2px solid #0a0a0a;">Valor</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function totalsBlock(order) {
  const discountRow = order.discount > 0 ? `
    <tr>
      <td style="font-size:13px;color:#777777;padding:6px 0;">Desconto</td>
      <td style="font-size:13px;font-weight:600;color:#2d6a4f;text-align:right;padding:6px 0;">-${fmt(order.discount)}</td>
    </tr>` : '';

  const freteVal = order.shipping === 0
    ? `<span style="color:#2d6a4f;font-weight:700;">GRÁTIS</span>`
    : fmt(order.shipping);

  return `
  <table style="width:100%;border-collapse:collapse;background:#f7f6f4;border-radius:10px;margin-top:20px;">
    <tbody style="padding:20px;">
      <tr>
        <td style="font-size:13px;color:#777777;padding:16px 20px 6px 20px;">Subtotal</td>
        <td style="font-size:13px;font-weight:600;color:#0a0a0a;text-align:right;padding:16px 20px 6px 20px;">${fmt(order.subtotal)}</td>
      </tr>
      ${discountRow}
      <tr>
        <td style="font-size:13px;color:#777777;padding:6px 20px;">Frete</td>
        <td style="font-size:13px;text-align:right;padding:6px 20px;">${freteVal}</td>
      </tr>
      <tr style="border-top:1px solid #e4e4e4;">
        <td style="font-size:15px;font-weight:700;color:#0a0a0a;padding:14px 20px 16px 20px;">Total</td>
        <td style="font-size:20px;font-weight:700;color:#0a0a0a;text-align:right;padding:14px 20px 16px 20px;">${fmt(order.total)}</td>
      </tr>
    </tbody>
  </table>`;
}

function addressBlock(address) {
  const comp = address.complemento ? `, ${address.complemento}` : '';
  return `
  <p style="font-size:13px;color:#555555;line-height:1.9;margin:0;">
    ${address.rua}, ${address.numero}${comp}<br>
    ${address.bairro} — ${address.cidade} / ${address.estado}<br>
    CEP: ${address.cep}
  </p>`;
}

function ctaButton(text, url) {
  return `
  <div style="text-align:center;margin:36px 0 0 0;">
    <a href="${url}"
       style="display:inline-block;background:#0a0a0a;color:#ffffff;padding:16px 48px;
              border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.2em;
              text-transform:uppercase;text-decoration:none;">
      ${text}
    </a>
  </div>`;
}

/* ── Template: Pedido recebido ────────────────────────────────── */
function tplOrderReceived(order) {
  const firstName = order.customer.name.split(' ')[0];
  const body = `
    <p style="font-size:15px;color:#111111;margin:0 0 6px 0;">Olá, <strong>${firstName}</strong>!</p>
    <p style="font-size:13px;color:#777777;line-height:1.8;margin:0 0 28px 0;">
      Recebemos seu pedido e ele está sendo processado. Você receberá uma nova notificação assim que o pagamento for confirmado.
    </p>

    ${badge('Número do pedido', order.orderNumber)}

    <h3 style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;margin:0 0 16px 0;">Produtos</h3>
    ${itemsTable(order.items)}
    ${totalsBlock(order)}

    <div style="margin-top:32px;">
      <h3 style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;margin:0 0 12px 0;">Endereço de entrega</h3>
      ${addressBlock(order.address)}
    </div>

    ${ctaButton('RASTREAR PEDIDO', frontend() + '/rastrear.html')}`;

  return layout('Pedido Recebido!', `#${order.orderNumber}`, body);
}

/* ── Template: Pagamento aprovado ────────────────────────────── */
function tplPaymentApproved(order) {
  const firstName = order.customer.name.split(' ')[0];
  const body = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:72px;height:72px;background:#2d6a4f;border-radius:50%;
                  display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <img src="https://em-content.zobj.net/source/google/387/check-mark_2714-fe0f.png"
             width="32" height="32" alt="✓" style="display:block;">
      </div>
      <p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px 0;">Pagamento aprovado, ${firstName}!</p>
      <p style="font-size:13px;color:#777777;line-height:1.8;margin:0;">
        Seu pedido <strong>${order.orderNumber}</strong> já está sendo separado e em breve será enviado.
      </p>
    </div>

    <div style="background:#f7f6f4;border-radius:8px;padding:20px;text-align:center;margin-bottom:32px;">
      <p style="font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#aaaaaa;margin:0 0 6px 0;">Valor pago</p>
      <p style="font-size:32px;font-weight:700;color:#0a0a0a;margin:0;">${fmt(order.total)}</p>
    </div>

    <h3 style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;margin:0 0 16px 0;">Seus produtos</h3>
    ${itemsTable(order.items)}

    <div style="margin-top:32px;">
      <h3 style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;margin:0 0 12px 0;">Endereço de entrega</h3>
      ${addressBlock(order.address)}
    </div>

    ${ctaButton('ACOMPANHAR PEDIDO', frontend() + '/rastrear.html')}`;

  return layout('Pagamento Aprovado!', 'Seu pedido está sendo preparado', body);
}

/* ── Exports ──────────────────────────────────────────────────── */
async function send(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY não definida — e-mail não enviado.');
    return;
  }
  if (!Resend) {
    console.warn('[Email] Pacote resend não importado — e-mail não enviado.');
    return;
  }
  console.log('[Email] Enviando para:', to, '| assunto:', subject);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({ from: from(), to, subject, html });
  if (result?.error) {
    const err = new Error(result.error.message || JSON.stringify(result.error));
    err.resendError = result.error;
    throw err;
  }
  console.log('[Email] Resend respondeu com id:', result?.data?.id || result?.id || '(sem id)');
}

exports.sendOrderConfirmation = (order) =>
  send(
    order.customer.email,
    `Pedido ${order.orderNumber} recebido — RAFFINATO`,
    tplOrderReceived(order)
  );

exports.sendPaymentConfirmed = (order) =>
  send(
    order.customer.email,
    `✓ Pagamento aprovado — Pedido ${order.orderNumber} em preparação`,
    tplPaymentApproved(order)
  );
