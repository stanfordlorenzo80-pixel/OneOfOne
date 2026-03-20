export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD;
    const DISCORD_WEBHOOK = env.DISCORD_WEBHOOK;
    const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID;

    // Helper to send notifications
    async function notify(message) {
      const tasks = [];
      if (DISCORD_WEBHOOK) {
        tasks.push(fetch(DISCORD_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: `🔔 **Empire Licensing**: ${message}` })
        }));
      }
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        tasks.push(fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: `🔔 Empire Licensing: ${message}` })
        }));
      }
      await Promise.allSettled(tasks);
    }

    // Helper for JSON responses
    const jsonRes = (data, status = 200) => new Response(JSON.stringify(data), {
      status, headers: { "Content-Type": "application/json" }
    });

    // Admin Auth
    const isAdmin = request.headers.get("Authorization") === `Bearer ${ADMIN_PASSWORD}`;

    // --- ADMIN ENDPOINTS ---

    if (url.pathname === "/admin/generate" && request.method === "POST") {
      if (!isAdmin) return jsonRes({ error: "Unauthorized" }, 401);
      
      const body = await request.json().catch(() => ({}));
      const key = `EMPIRE-${crypto.randomUUID()}`;
      const license = {
        key,
        createdAt: Date.now(),
        banned: false,
        hwid: null,
        activated: false,
        name: body.name || "Unnamed License",
        plan: body.plan || "standard"
      };

      await env.LICENSE_KEYS.put(key, JSON.stringify(license));
      await notify(`New license generated: \`${key}\` for ${license.name}`);
      
      return jsonRes({ key, license });
    }

    if (url.pathname === "/admin/keys" && request.method === "GET") {
      if (!isAdmin) return jsonRes({ error: "Unauthorized" }, 401);
      
      const list = await env.LICENSE_KEYS.list();
      const keys = await Promise.all(list.keys.map(k => env.LICENSE_KEYS.get(k.name, "json")));
      return jsonRes({ keys });
    }

    if (url.pathname === "/admin/ban" && request.method === "POST") {
      if (!isAdmin) return jsonRes({ error: "Unauthorized" }, 401);
      
      const { key } = await request.json();
      const license = await env.LICENSE_KEYS.get(key, "json");
      if (!license) return jsonRes({ error: "Not found" }, 404);
      
      license.banned = true;
      await env.LICENSE_KEYS.put(key, JSON.stringify(license));
      await notify(`License BANNED: \`${key}\``);
      return jsonRes({ success: true, license });
    }

    if (url.pathname === "/admin/deactivate" && request.method === "POST") {
      if (!isAdmin) return jsonRes({ error: "Unauthorized" }, 401);
      
      const { key } = await request.json();
      const license = await env.LICENSE_KEYS.get(key, "json");
      if (!license) return jsonRes({ error: "Not found" }, 404);
      
      license.hwid = null;
      license.activated = false;
      await env.LICENSE_KEYS.put(key, JSON.stringify(license));
      await notify(`License force deactivated: \`${key}\``);
      return jsonRes({ success: true, license });
    }

    if (url.pathname === "/admin/notify" && request.method === "POST") {
      if (!isAdmin) return jsonRes({ error: "Unauthorized" }, 401);
      await notify("Admin notification test: System is operational. 🚀");
      return jsonRes({ success: true });
    }

    // --- CLIENT ENDPOINTS ---

    if (url.pathname === "/activate" && request.method === "POST") {
      const { key, hwid } = await request.json();
      if (!key || !hwid) return jsonRes({ error: "Missing key or hwid" }, 400);

      const license = await env.LICENSE_KEYS.get(key, "json");
      if (!license) return jsonRes({ error: "Invalid key" }, 404);
      if (license.banned) return jsonRes({ error: "License is banned" }, 403);
      
      if (license.activated && license.hwid !== hwid) {
        return jsonRes({ error: "Key already activated on another machine" }, 403);
      }

      license.hwid = hwid;
      license.activated = true;
      license.lastCheck = Date.now();

      await env.LICENSE_KEYS.put(key, JSON.stringify(license));
      
      // Log activation
      const activationId = `ACT-${Date.now()}`;
      await env.ACTIVATIONS.put(activationId, JSON.stringify({ key, hwid, time: Date.now() }));
      
      await notify(`Key activated: \`${key}\` on machine \`${hwid}\``);
      
      return jsonRes({ success: true, license });
    }

    if (url.pathname === "/verify" && request.method === "POST") {
      const { key, hwid } = await request.json();
      const license = await env.LICENSE_KEYS.get(key, "json");
      
      if (!license || license.banned || license.hwid !== hwid || !license.activated) {
        return jsonRes({ valid: false }, 403);
      }

      return jsonRes({ valid: true, plan: license.plan });
    }

    if (url.pathname === "/deactivate" && request.method === "POST") {
      const { key, hwid } = await request.json();
      const license = await env.LICENSE_KEYS.get(key, "json");
      
      if (license && license.hwid === hwid) {
        license.hwid = null;
        license.activated = false;
        await env.LICENSE_KEYS.put(key, JSON.stringify(license));
        await notify(`Key deactivated by user: \`${key}\``);
        return jsonRes({ success: true });
      }
      return jsonRes({ error: "Invalid request" }, 400);
    }

    return new Response("Empire Licensing API v2.0 (KV-Powered)", { status: 200 });
  }
};
