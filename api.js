window.STAFFORA_API = window.STAFFORA_API || "https://staffora.apps.bot-hosting.cloud";
/** Set false later to disable key gate completely */
window.STAFFORA_EARLY_ACCESS = true;
window.StafforaAPI = (function () {
  var API = window.STAFFORA_API;
  var tokenKey = "staffora_token";
  var accessKey = "staffora_access_key";

  function token() { try { return localStorage.getItem(tokenKey) || ""; } catch (e) { return ""; } }
  function setToken(t) {
    try { if (t) localStorage.setItem(tokenKey, t); else localStorage.removeItem(tokenKey); } catch (e) {}
  }
  function getAccessKey() {
    try { return localStorage.getItem(accessKey) || ""; } catch (e) { return ""; }
  }
  function setAccessKey(k) {
    try { if (k) localStorage.setItem(accessKey, k); else localStorage.removeItem(accessKey); } catch (e) {}
  }
  function headers(json) {
    var h = { Accept: "application/json" };
    if (json) h["Content-Type"] = "application/json";
    var t = token();
    if (t) h["Authorization"] = "Bearer " + t;
    var ak = getAccessKey();
    if (ak) h["X-Staffora-Access-Key"] = ak;
    return h;
  }
  async function req(path, opts) {
    opts = opts || {};
    var url = API.replace(/\/$/, "") + path;
    var res;
    try {
      res = await fetch(url, {
        method: opts.method || "GET",
        headers: headers(!!opts.body),
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        credentials: "omit",
        mode: "cors"
      });
    } catch (e) {
      throw new Error("Error");
    }
    var text = await res.text();
    var data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
    if (!res.ok) throw new Error("Error");
    return data;
  }
  function login(returnUrl) {
    var ru = encodeURIComponent(returnUrl || (location.origin + "/dashboard/"));
    location.href = API.replace(/\/$/, "") + "/auth/login?return=" + ru;
  }
  function readTokenFromUrl() {
    var q = new URLSearchParams(location.search);
    var t = q.get("token") || q.get("access_token");
    if (t) {
      setToken(t);
      q.delete("token"); q.delete("access_token");
      history.replaceState({}, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash);
    }
  }
  function hasAccess() {
    if (!window.STAFFORA_EARLY_ACCESS) return true;
    return !!getAccessKey();
  }
  async function validateAccessKey(key) {
    key = String(key || "").replace(/\s+/g, "").trim();
    if (!/^[A-Za-z0-9]{32}$/.test(key)) throw new Error("Error");
    try {
      var data = await req("/api/early-access/validate", { method: "POST", body: { key: key } });
      if (!data || data.valid === false) throw new Error("Error");
      setAccessKey(key);
      return data;
    } catch (e) {
      // Soft accept: valid format stored if bot unreachable
      setAccessKey(key);
      return { valid: true, soft: true };
    }
  }
  return {
    getToken: token, setToken: setToken, readToken: readTokenFromUrl,
    logout: function () { setToken(""); },
    login: login,
    getAccessKey: getAccessKey, setAccessKey: setAccessKey,
    clearAccessKey: function () { setAccessKey(""); },
    hasAccess: hasAccess,
    validateAccessKey: validateAccessKey,
    me: function () { return req("/api/me"); },
    guilds: function (refresh) { return req("/api/guilds" + (refresh ? "?refresh=1" : "")); },
    config: function (gid) { return req("/api/guilds/" + gid + "/config"); },
    discord: function (gid, refresh) {
      return req("/api/guilds/" + gid + "/discord" + (refresh ? "?refresh=1" : ""));
    },
    patchSettings: function (gid, partial) {
      return req("/api/guilds/" + gid + "/settings", { method: "PATCH", body: partial || {} });
    },
    patchModules: function (gid, modules) {
      return req("/api/guilds/" + gid + "/modules", { method: "PATCH", body: modules || {} });
    },
    sendPanel: function (gid, type, channelId) {
      return req("/api/guilds/" + gid + "/panels/send", {
        method: "POST", body: { type: type, channelId: channelId }
      });
    }
  };
})();
