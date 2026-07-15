(function () {
  var cfg = window.__MPV_LANDING_CONFIG__ || {};
  var playUrl =
    cfg.playStoreUrl ||
    "https://play.google.com/store/apps/details?id=com.skyface.mypasswordvault";
  var appStoreUrl =
    cfg.appStoreUrl ||
    "https://apps.apple.com/us/app/my-password-vault/id6776333649";

  function withUtm(url, defaults) {
    if (window.MPV_APPEND_UTM) return window.MPV_APPEND_UTM(url, defaults);
    return url;
  }

  document.querySelectorAll('[data-store="google"]').forEach(function (link) {
    link.href = withUtm(playUrl, {
      utm_source: "web",
      utm_medium: "store_badge",
      utm_campaign: "google_play",
    });
  });
  document.querySelectorAll('[data-store="apple"]').forEach(function (link) {
    link.href = withUtm(appStoreUrl, {
      utm_source: "web",
      utm_medium: "store_badge",
      utm_campaign: "app_store",
    });
  });
})();
