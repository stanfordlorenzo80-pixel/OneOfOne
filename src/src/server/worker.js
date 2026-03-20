/**
 * 👑 AI SHORTS EMPIRE — MASTER LICENSE SERVER
 * DEPLOY TO: Cloudflare Workers
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // WEBHOOKS (Lorenzo: Update these in Cloudflare Environment Variables)
    const DISCORD_WEBHOOK = env.DISCORD_WEBHOOK;
    const TELEGRAM_BOT_TOKEN = env.TELEGRAM_TOKEN;
    const TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID;

    // Helper: Notify Lorenzo
    const notify = async (msg) => {
      // Discord
      if (DISCORD_WEBHOOK) await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: "👑 **EMPIRE ALERT**: " + msg })
      });
      // Telegram
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: "👑 EMPIRE ALERT: " + msg })
        });
      }
    };

    if (method === 'POST' && url.pathname === '/activate') {
      const { token, hwid, name } = await request.json();
      
      // Verification logic: 
      // In a real DB, you'd check if 'token' is valid and if 'hwid' is bound.
      // For Lorenzo's V1, we'll use Cloudflare KV or a simple validation.
      
      const secret = "EMPIRE_SECRET_2026";
      // (Simplified check for demo - Lorenzo should add a real DB check here)
      if (!token || !hwid) return new Response("Invalid Request", { status: 400 });

      await notify(`✅ **ACTIVATION**: [${name || 'User'}] linked key ${token.substring(0,8)} to hardware ${hwid.substring(0,8)}`);
      
      return new Response(JSON.stringify({ success: true, message: "License Activated" }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (method === 'POST' && url.pathname === '/verify') {
      const { token, hwid } = await request.json();
      // Verify logic...
      return new Response(JSON.stringify({ valid: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (method === 'POST' && url.pathname === '/deactivate') {
      const { token, hwid } = await request.json();
      await notify(`⚠️ **DEACTIVATED**: HWID ${hwid.substring(0,8)} unbound from key ${token.substring(0,8)}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response("Empire License Server Online", { status: 200 });
  }
};
