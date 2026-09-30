window.STAFFORA_API = window.STAFFORA_API || "https://staffora.apps.bot-hosting.cloud";

/** EARLY ACCESS — set to false later to open fully (no other changes needed) */
window.STAFFORA_EARLY_ACCESS = true;

window.StafforaAPI = (function () {
  var API = window.STAFFORA_API;
  var tokenKey = "staffora_token";
  var accessKey = "staffora_access_key";

  function token() {
    try { return localStorage.getItem(tokenKey) || ""; } catch (e) { return ""; }
  }
  function setToken(t) {
    try {
      if (t) localStorage.setItem(tokenKey, t);
      else localStorage.removeItem(tokenKey);
    } catch (e) {}
  }
  function getAccessKey() {
    try { return localStorage.getItem(accessKey) || ""; } catch (e) { return ""; }
  }
  function setAccessKey(k) {
    try {
      if (k) localStorage.setItem(accessKey, k);
      else localStorage.removeItem(accessKey);
    } catch (e) {}
  }
  function headers(json) {
    var h = {};
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
    var res = await fetch(url, {
      method: opts.method || "GET",
      headers: headers(!!opts.body),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: "omit"
    });
    var text = await res.text();
    var data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
    if (!res.ok) {
      var msg = (data && (data.error || data.message)) || ("HTTP " + res.status);
      throw new Error(msg);
    }
    return data;
  }
  function login(returnUrl) {
    var ru = encodeURIComponent(returnUrl || (location.origin + "/dashboard/"));
    var q = "/auth/discord?return_url=" + ru;
    var ak = getAccessKey();
    if (ak) q += "&access_key=" + encodeURIComponent(ak);
    location.href = API.replace(/\/$/, "") + q;
  }
  function readTokenFromUrl() {
    var q = new URLSearchParams(location.search);
    var t = q.get("token") || q.get("access_token");
    if (t) {
      setToken(t);
      q.delete("token"); q.delete("access_token");
      var clean = location.pathname + (q.toString() ? "?" + q : "") + location.hash;
      history.replaceState({}, "", clean);
    }
  }
  /** Validate 32-char key against bot; stores locally if ok */
  async function validateAccessKey(key) {
    key = String(key || "").replace(/\s+/g, "").trim();
    if (!/^[A-Za-z0-9]{32}$/.test(key)) {
      throw new Error("Key muss genau 32 Zeichen sein (Buchstaben und Zahlen).");
    }
    var data = await req("/api/early-access/validate", {
      method: "POST",
      body: { key: key }
    });
    if (!data || data.valid === false) {
      throw new Error((data && data.message) || "Key ungültig.");
    }
    setAccessKey(key);
    return data;
  }
  function hasEarlyAccess() {
    if (!window.STAFFORA_EARLY_ACCESS) return true;
    return !!getAccessKey();
  }
  return {
    getToken: token,
    setToken: setToken,
    readToken: readTokenFromUrl,
    logout: function () { setToken(""); },
    login: login,
    getAccessKey: getAccessKey,
    setAccessKey: setAccessKey,
    clearAccessKey: function () { setAccessKey(""); },
    hasEarlyAccess: hasEarlyAccess,
    validateAccessKey: validateAccessKey,
    me: function () { return req("/api/me"); },
    guilds: function () { return req("/api/guilds"); },
    config: function (gid) { return req("/api/guilds/" + gid + "/config"); },
    discord: function (gid) { return req("/api/guilds/" + gid + "/discord"); },
    patchSettings: function (gid, partial) {
      return req("/api/guilds/" + gid + "/config", { method: "PATCH", body: { settings: partial } });
    },
    sendPanel: function (gid, panel, channelId) {
      return req("/api/guilds/" + gid + "/panels/" + panel, { method: "POST", body: { channelId: channelId } });
    },
    teamStats: function (gid, days) {
      return req("/api/guilds/" + gid + "/stats?days=" + (days || 7));
    }
  };
})();
