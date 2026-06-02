const https = require("https");

let ready = true;

function init() {
  const phone = process.env.ADMIN_PHONE;
  if (phone) {
    console.log("📱 WhatsApp notifications configured for:", phone.replace(/@.*/, ""));
  } else {
    console.log("📱 WhatsApp: Set ADMIN_PHONE in .env to enable order notifications");
  }
}

async function notifyNewOrder(order, adminPhone) {
  if (!adminPhone) {
    console.log("Order notification skipped - no ADMIN_PHONE configured");
    console.log("📦 New order:", order._id, "from", order.customerName);
    return false;
  }

  let message = "🛍 *New Order - by tima*\n";
  message += "━━━━━━━━━━━━━━━\n";
  message += `👤 *Customer:* ${order.customerName}\n`;
  message += `📞 *Phone:* ${order.customerPhone}\n`;
  if (order.customerAddress) message += `📍 *Address:* ${order.customerAddress}\n`;
  if (order.notes) message += `📝 *Notes:* ${order.notes}\n`;
  message += "━━━━━━━━━━━━━━━\n";
  message += "*Items:*\n";

  order.items.forEach((item, i) => {
    message += `${i + 1}. ${item.name} x${item.quantity} = $${(item.price * item.quantity).toFixed(2)}\n`;
  });

  message += "━━━━━━━━━━━━━━━\n";
  message += `💰 *Total:* $${order.total.toFixed(2)}\n`;
  message += `🆔 *Order ID:* ${order._id}\n`;

  // Try WhatsApp Cloud API (Meta) if configured
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (token && phoneId) {
    try {
      await sendMetaMessage(adminPhone, message, token, phoneId);
      console.log("WhatsApp notification sent for order:", order._id);
      return true;
    } catch (err) {
      console.error("WhatsApp API error:", err.message);
    }
  }

  // Fallback: log the order
  console.log("📦 New order placed:", order._id, "by", order.customerName);
  return false;
}

function sendMetaMessage(to, text, token, phoneId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/@c\.us$/, ""),
      type: "text",
      text: { body: text }
    });

    const req = https.request({
      hostname: "graph.facebook.com",
      path: `/v21.0/${phoneId}/messages`,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Content-Length": data.length
      }
    }, (res) => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => {
        if (res.statusCode === 200) resolve(body);
        else reject(new Error(`WhatsApp API ${res.statusCode}: ${body}`));
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

module.exports = { init, notifyNewOrder, isReady: () => ready };
