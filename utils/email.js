const nodemailer = require('nodemailer');
const Order = require('../models/orderModel');
const Alteration = require('../models/alterationModel');

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const ORDER_NOTIFY_EMAIL = process.env.ORDER_NOTIFY_EMAIL || GMAIL_USER;
const ALTERATION_NOTIFY_EMAIL = process.env.ALTERATION_NOTIFY_EMAIL || GMAIL_USER;

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

// Helper to generate same alteration ID format as website (S0001, S0002, etc.)
async function getWebsiteAlterationId(alteration) {
  try {
    // Get all alterations sorted by timestamp (oldest first) to match website logic
    const allAlterations = await Alteration.find({}).sort({ timestamp: 1 });
    const alterationIndex = allAlterations.findIndex(a => a._id.toString() === alteration._id.toString());
    
    if (alterationIndex === -1) return alteration._id; // Fallback to MongoDB ID
    
    return `S${(alterationIndex + 1).toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating website alteration ID:', error);
    return alteration._id; // Fallback to MongoDB ID
  }
}

function formatAlterationEmail(alteration, websiteAlterationId) {
  return {
    subject: `New Alteration Appointment: ${websiteAlterationId}`,
    text: `A new alteration appointment has been booked.\n\nAlteration ID: ${websiteAlterationId}\nCustomer: ${alteration.customer.name}\nAddress: ${alteration.customer.address}\nPhone: ${alteration.customer.phone}\nEmail: ${alteration.customer.email}\nStatus: ${alteration.status || 'pending'}\n\nNote: ${alteration.note}\n\nAppointment Date: ${new Date(alteration.timestamp).toLocaleString()}`
  };
}

async function sendAlterationEmail(alteration) {
  const websiteAlterationId = await getWebsiteAlterationId(alteration);
  const { subject, text } = formatAlterationEmail(alteration, websiteAlterationId);
  const mailOptions = {
    from: GMAIL_USER,
    to: ALTERATION_NOTIFY_EMAIL,
    subject,
    text,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('[AlterationEmail] Email sent for alteration', websiteAlterationId);
  } catch (err) {
    console.error('[AlterationEmail] Failed to send email:', err);
  }
}

module.exports = { sendOrderEmail, sendAlterationEmail };
