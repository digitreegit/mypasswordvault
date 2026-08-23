/**
 * Landing header: Sign In vs signed-in user menu (Supabase session).
 * Copy via data-i18n — refreshed on locale change (landing-lang.js).
 */
(function () {
  var root = document.getElementById("landing-auth-root");
  var sessionEmail = null;
  var supabaseClient = null;

  function appPath(path) {
    var base = "";
    if (location.protocol === "file:") base = "http://127.0.0.1:5173";
    var href = base + path;
    if (window.MPV_APPEND_UTM) {
      return window.MPV_APPEND_UTM(href, {
        utm_source: "web",
        utm_medium: "landing_auth",
      });
    }
    return href;
  }

  function applyAuthI18n() {
    if (root && window.MPV_LANDING_APPLY_I18N) {
      window.MPV_LANDING_APPLY_I18N(root);
    }
  }

  function userIconSvg() {
    return (
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
      '<circle cx="12" cy="7" r="4"></circle></svg>'
    );
  }

  function renderSignIn() {
    if (!root) return;
    sessionEmail = null;
    root.innerHTML =
      '<a class="btn btn-primary landing-nav-link" href="' +
      appPath("/app/") +
      '" data-i18n="navSignIn"></a>';
    applyAuthI18n();
  }

  function closeMenu(menu, btn) {
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  }

  function bindSignedInMenu(wrap, btn, menu, logout) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.hidden;
      document.querySelectorAll(".landing-user-dropdown").forEach(function (m) {
        if (m !== menu) m.hidden = true;
      });
      document.querySelectorAll(".landing-user-menu-btn").forEach(function (b) {
        if (b !== btn) b.setAttribute("aria-expanded", "false");
      });
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) closeMenu(menu, btn);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu(menu, btn);
    });

    if (logout) {
      logout.addEventListener("click", function () {
        if (!supabaseClient) return;
        supabaseClient.auth.signOut().finally(function () {
          location.reload();
        });
      });
    }
  }

  function renderSignedIn(email) {
    if (!root) return;
    sessionEmail = email || "";
    root.innerHTML =
      '<div class="landing-signed-in-actions">' +
      '<a class="btn btn-primary landing-nav-link" href="' +
      appPath("/app/#") +
      '" data-i18n="navMyVault"></a>' +
      '<div class="landing-user-menu">' +
      '<button type="button" class="landing-user-menu-btn landing-lang-btn" aria-haspopup="true" aria-expanded="false" data-i18n-aria="navUserMenu">' +
      userIconSvg() +
      "</button>" +
      '<div class="landing-user-dropdown" role="menu" hidden>' +
      '<a role="menuitem" class="landing-user-dropdown-item" href="' +
      appPath("/app/#/settings") +
      '" data-i18n="navSettings"></a>' +
      '<button type="button" role="menuitem" class="landing-user-dropdown-item landing-user-dropdown-logout" data-i18n="navLogOut"></button>' +
      "</div></div></div>";

    applyAuthI18n();

    var wrap = root.querySelector(".landing-user-menu");
    var btn = root.querySelector(".landing-user-menu-btn");
    var menu = root.querySelector(".landing-user-dropdown");
    var logout = root.querySelector(".landing-user-dropdown-logout");
    if (!wrap || !btn || !menu) return;
    bindSignedInMenu(wrap, btn, menu, logout);
  }

  function refreshView() {
    if (sessionEmail) renderSignedIn(sessionEmail);
    else renderSignIn();
  }

  function init() {
    root = document.getElementById("landing-auth-root");
    if (!root) return;

    if (supabaseClient) {
      applyAuthI18n();
      return;
    }

    var cfg = window.__MPV_LANDING_CONFIG__ || {};
    var url = (cfg.url || "").trim().replace(/\/$/, "");
    var anonKey = (cfg.anonKey || "").trim();

    if (!url || !anonKey || !window.supabase) {
      renderSignIn();
      return;
    }

    supabaseClient = window.supabase.createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    window.__mpvLandingSupabase = supabaseClient;

    supabaseClient.auth.getSession().then(function (res) {
      var session = res.data && res.data.session;
      if (session && session.user) {
        renderSignedIn(session.user.email || session.user.id);
      } else {
        renderSignIn();
      }
    });

    supabaseClient.auth.onAuthStateChange(function (_event, session) {
      if (session && session.user) {
        renderSignedIn(session.user.email || session.user.id);
      } else {
        renderSignIn();
      }
    });
  }

  window.MPV_LANDING_AUTH_INIT = init;
  window.MPV_LANDING_AUTH_REFRESH_I18N = function () {
    if (!root) root = document.getElementById("landing-auth-root");
    if (sessionEmail) {
      applyAuthI18n();
      return;
    }
    applyAuthI18n();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
