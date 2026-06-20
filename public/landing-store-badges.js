(function () {
  var cfg = window.__MPV_LANDING_CONFIG__ || {};
  var playUrl =
    cfg.playStoreUrl ||
    "https://play.google.com/store/apps/details?id=com.skyface.mypasswordvault";
  var appStoreUrl =
    cfg.appStoreUrl ||
    "https://apps.apple.com/us/search?term=My+Password+Vault";

  document.querySelectorAll('[data-store="google"]').forEach(function (link) {
    link.href = playUrl;
  });
  document.querySelectorAll('[data-store="apple"]').forEach(function (link) {
    link.href = appStoreUrl;
  });
})();
