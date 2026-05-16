/**
 * Landing header: mobile hamburger, overlay menu below sticky band, backdrop dim.
 */
(function () {
  var band = document.querySelector(".landing-header-band");
  var header = document.querySelector(".landing-header-main");
  var toggle = document.querySelector(".landing-menu-toggle");
  var panel = document.getElementById("landing-nav-panel");
  var backdrop = document.getElementById("landing-nav-backdrop");
  if (!band || !header || !toggle || !panel) return;

  var mq = typeof window.matchMedia === "function" ? window.matchMedia("(min-width: 768px)") : null;

  function isDesktop() {
    return mq ? mq.matches : window.innerWidth >= 768;
  }

  function syncPanelTop() {
    if (isDesktop()) return;
    var bottom = band.getBoundingClientRect().bottom;
    document.documentElement.style.setProperty("--landing-panel-top", bottom + "px");
  }

  function setOpen(open) {
    if (isDesktop()) {
      band.classList.remove("is-nav-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("landing-nav-open");
      if (backdrop) backdrop.setAttribute("aria-hidden", "true");
      return;
    }
    band.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("landing-nav-open", open);
    if (backdrop) backdrop.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      syncPanelTop();
    }
  }

  toggle.addEventListener("click", function (e) {
    e.stopPropagation();
    if (isDesktop()) return;
    setOpen(!band.classList.contains("is-nav-open"));
  });

  panel.querySelectorAll("a[href]").forEach(function (a) {
    a.addEventListener("click", function () {
      setOpen(false);
    });
  });

  panel.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.closest && t.closest(".landing-lang-opt")) setOpen(false);
  });

  document.addEventListener("click", function (e) {
    if (!band.classList.contains("is-nav-open")) return;
    if (panel.contains(e.target) || header.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });

  function onViewportChange() {
    if (isDesktop()) {
      setOpen(false);
      return;
    }
    if (band.classList.contains("is-nav-open")) syncPanelTop();
  }

  if (mq && mq.addEventListener) {
    mq.addEventListener("change", onViewportChange);
  } else if (mq && mq.addListener) {
    mq.addListener(onViewportChange);
  } else {
    window.addEventListener("resize", onViewportChange);
  }

  window.addEventListener(
    "scroll",
    function () {
      if (band.classList.contains("is-nav-open") && !isDesktop()) syncPanelTop();
    },
    { passive: true },
  );
  window.addEventListener("resize", onViewportChange);
})();
