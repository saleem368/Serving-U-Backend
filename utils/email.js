const nodemailer = require('nodemailer');
const Order = require('../models/orderModel');

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

// Helper to generate same order ID format as website (S0001, S0002, etc.)
async function getWebsiteOrderId(order) {
  try {
    // Get all orders sorted by timestamp (oldest first) to match website logic
    const allOrders = await Order.find({}).sort({ timestamp: 1 });
    const orderIndex = allOrders.findIndex(o => o._id.toString() === order._id.toString());
    
    if (orderIndex === -1) return order._id; // Fallback to MongoDB ID
    
    return `S${(orderIndex + 1).toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating website order ID:', error);
    return order._id; // Fallback to MongoDB ID
  }
}

function formatOrderEmail(order, websiteOrderId) {
  return {
    subject: `New Order Received: ${websiteOrderId}`,
    text: `A new order has been placed.\n\nOrder ID: ${websiteOrderId}\nCustomer: ${order.customer.name}\nAddress: ${order.customer.address}\nPhone: ${order.customer.phone}\nTotal: ₹${order.total}\nStatus: ${order.status || 'pending'}\n\nItems:\n${order.items.map(item => `- ${item.name} x${item.quantity} (₹${item.price})`).join('\n')}\n\nNote: ${order.note || 'N/A'}\n\nOrder Date: ${new Date(order.timestamp).toLocaleString()}`
  };
}

async function sendOrderEmail(order) {
  const websiteOrderId = await getWebsiteOrderId(order);
  const { subject, text } = formatOrderEmail(order, websiteOrderId);
  const mailOptions = {
    from: GMAIL_USER,
    to: ORDER_NOTIFY_EMAIL,
    subject,
    text,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('[OrderEmail] Email sent for order', websiteOrderId);
  } catch (err) {
    console.error('[OrderEmail] Failed to send email:', err);
  }
}

module.exports = { sendOrderEmail };
