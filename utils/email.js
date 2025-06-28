const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const ORDER_NOTIFY_EMAIL = process.env.ORDER_NOTIFY_EMAIL || GMAIL_USER;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

function formatOrderEmail(order) {
  return {
    subject: `New Order Received: ${order._id}`,
    text: `A new order has been placed.\n\nOrder ID: ${order._id}\nCustomer: ${order.customer.name}\nAddress: ${order.customer.address}\nPhone: ${order.customer.phone}\nTotal: ₹${order.total}\nStatus: ${order.status || 'pending'}\n\nItems:\n${order.items.map(item => `- ${item.name} x${item.quantity} (₹${item.price})`).join('\n')}\n\nNote: ${order.note || 'N/A'}\n\nOrder Date: ${new Date(order.timestamp).toLocaleString()}`
  };
}

async function sendOrderEmail(order) {
  const { subject, text } = formatOrderEmail(order);
  const mailOptions = {
    from: GMAIL_USER,
    to: ORDER_NOTIFY_EMAIL,
    subject,
    text,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('[OrderEmail] Email sent for order', order._id);
  } catch (err) {
    console.error('[OrderEmail] Failed to send email:', err);
  }
}

module.exports = { sendOrderEmail };
