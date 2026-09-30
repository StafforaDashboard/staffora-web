window.STAFFORA_API = window.STAFFORA_API || "https://staffora.apps.bot-hosting.cloud";
window.StafforaAPI = (function () {
  var API = window.STAFFORA_API;
  var tokenKey = "staffora_token";
  function token() { try { return localStorage.getItem(tokenKey) || ""; } catch (e) { return ""; } }
  function setToken(t) {
    try { if (t) localStorage.setItem(tokenKey, t); else localStorage.removeItem(tokenKey); } catch (e) {}
  }
  function headers(json) {
    var h = { Accept: "application/json" };
    if (json) h["Content-Type"] = "application/json";
    var t = token();
    if (t) h["Authorization"] = "Bearer " + t;
    return h;
  }
  function netErr(e) {
    var m = (e && e.message) || String(e || "");
    if (/load failed|failed to fetch|networkerror|network error/i.test(m)) return "Keine Verbindung zum Bot.";
    return m || "Fehler";
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
      throw new Error(netErr(e));
    }
    var text = await res.text();
    var data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
    if (!res.ok) {
      throw new Error((data && (data.error || data.message)) || ("HTTP " + res.status));
    }
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
  return {
    getToken: token, setToken: setToken, readToken: readTokenFromUrl,
    logout: function () { setToken(""); },
    login: login,
    me: function () { return req("/api/me"); },
    guilds: function () { return req("/api/guilds"); },
    config: function (gid) { return req("/api/guilds/" + gid + "/config"); },
    discord: function (gid) { return req("/api/guilds/" + gid + "/discord"); },
    patchSettings: function (gid, partial) {
      return req("/api/guilds/" + gid + "/config", { method: "PATCH", body: { settings: partial } });
    },
    sendPanel: function (gid, panel, channelId) {
      return req("/api/guilds/" + gid + "/panels/" + encodeURIComponent(panel), {
        method: "POST", body: { channelId: channelId || null }
      });
    }
  };
})();
