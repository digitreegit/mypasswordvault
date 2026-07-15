/**
 * Marketing attribution: capture inbound UTM params and decorate outbound links.
 * Page views use Vercel Analytics (vercel-analytics-init.js).
 *
 * Share links (examples):
 *   https://mypasswordvault.app/?utm_source=tiktok&utm_medium=social&utm_campaign=launch
 *   https://mypasswordvault.app/?utm_source=shorts&utm_medium=social&utm_campaign=subscription_calc
 *   https://mypasswordvault.app/?utm_source=reddit&utm_medium=community&utm_campaign=launch
 */
(function () {
  var STORAGE_PREFIX = "mpv_utm_";
  var UTM_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];

  function captureInboundUtm() {
    try {
      var params = new URLSearchParams(location.search);
      var touched = false;
      UTM_KEYS.forEach(function (key) {
        var value = params.get(key);
        if (!value) return;
        sessionStorage.setItem(STORAGE_PREFIX + key, value);
        touched = true;
      });
      if (touched) {
        sessionStorage.setItem(STORAGE_PREFIX + "captured_at", new Date().toISOString());
      }
    } catch (_err) {
      /* ignore private mode / blocked storage */
    }
  }

  function getStoredUtm() {
    var out = {};
    UTM_KEYS.forEach(function (key) {
      try {
        var value = sessionStorage.getItem(STORAGE_PREFIX + key);
        if (value) out[key] = value;
      } catch (_err) {
        /* ignore */
      }
    });
    return out;
  }

  function appendUtm(url, defaults) {
    defaults = defaults || {};
    try {
      var base =
        url.indexOf("http://") === 0 || url.indexOf("https://") === 0
          ? undefined
          : location.origin;
      var parsed = new URL(url, base);
      var stored = getStoredUtm();
      UTM_KEYS.forEach(function (key) {
        if (parsed.searchParams.has(key)) return;
        var value = stored[key] || defaults[key];
        if (value) parsed.searchParams.set(key, value);
      });
      if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
        return parsed.toString();
      }
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (_err) {
      return url;
    }
  }

  function trackEvent(name, props) {
    if (typeof window.MPV_VERCEL_TRACK !== "function") return;
    window.MPV_VERCEL_TRACK(name, props || undefined);
  }

  function decorateAppLinks() {
    document
      .querySelectorAll('a[href^="/app/"], a[href^="/app"]')
      .forEach(function (link) {
        var href = link.getAttribute("href");
        if (!href) return;
        link.setAttribute(
          "href",
          appendUtm(href, { utm_medium: "landing", utm_source: "web" }),
        );
      });
  }

  function bindTrackEvents() {
    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var tracked = target.closest("[data-mpv-track]");
      if (!tracked) return;
      var name = tracked.getAttribute("data-mpv-track");
      if (!name) return;
      var props = {};
      var store = tracked.getAttribute("data-mpv-store");
      if (store) props.store = store;
      trackEvent(name, props);
    });
  }

  window.MPV_APPEND_UTM = appendUtm;
  window.MPV_GET_UTM = getStoredUtm;
  window.MPV_TRACK = trackEvent;

  captureInboundUtm();
  bindTrackEvents();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", decorateAppLinks);
  } else {
    decorateAppLinks();
  }
})();
