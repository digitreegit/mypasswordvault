(function () {
  if (!("serviceWorker" in navigator)) return;
  var path = location.pathname || "/";
  // Register from site root so SW can control /app/.
  if (path !== "/" && path.indexOf("/app") !== 0 && path.indexOf("/index") !== 0) {
    return;
  }
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").catch(function () {
      /* ignore */
    });
  });
})();
