(function () {
  function track(eventName, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params || {});
    }
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (!link) return;

    var href = link.getAttribute("href") || "";
    if (href.indexOf("wa.me/") !== -1) {
      track("generate_lead", { method: "whatsapp", page_path: location.pathname });
    } else if (href.indexOf("mailto:") === 0) {
      track("generate_lead", { method: "email", page_path: location.pathname });
    }
  });

  var form = document.querySelector(".lead-form");
  if (form) {
    form.addEventListener("submit", function () {
      track("form_submit", { form_name: "technical_request", page_path: location.pathname });
    });
  }
})();
