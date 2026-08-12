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
      track("generate_lead", {
        method: "whatsapp",
        page_path: location.pathname,
      });
    } else if (href.indexOf("mailto:") === 0) {
      track("generate_lead", {
        method: "email",
        page_path: location.pathname,
      });
    }
  });

  var form = document.querySelector(".lead-form");
  if (!form) return;

  var submitButton = form.querySelector('button[type="submit"]');
  var originalButtonHtml = submitButton ? submitButton.innerHTML : "";
  var statusMessage = document.createElement("p");
  statusMessage.setAttribute("role", "status");
  statusMessage.setAttribute("aria-live", "polite");
  statusMessage.style.gridColumn = "1 / -1";
  statusMessage.style.margin = "12px 0 0";
  statusMessage.style.fontWeight = "600";
  form.appendChild(statusMessage);

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (form.dataset.submitting === "true") return;
    form.dataset.submitting = "true";
    statusMessage.textContent = "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    var endpoint = form.action.replace(
      "https://formsubmit.co/",
      "https://formsubmit.co/ajax/"
    );
    var formData = new FormData(form);
    var nextField = form.querySelector('input[name="_next"]');
    var successUrl = nextField
      ? nextField.value
      : location.origin +
        (location.pathname.indexOf("/es/") === 0
          ? "/es/gracias/"
          : "/obrigado/");

    fetch(endpoint, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.data || result.data.success === false) {
          throw new Error(
            result.data && result.data.message
              ? result.data.message
              : "FormSubmit não confirmou o envio."
          );
        }

        track("form_submit", {
          form_name: "technical_request",
          page_path: location.pathname,
          status: "success",
        });
        window.location.assign(successUrl);
      })
      .catch(function () {
        track("form_submit_error", {
          form_name: "technical_request",
          page_path: location.pathname,
        });

        statusMessage.style.color = "#a32222";
        statusMessage.textContent =
          location.pathname.indexOf("/es/") === 0
            ? "No fue posible confirmar el envío. Verifique su conexión e inténtelo nuevamente o contáctenos por WhatsApp."
            : "Não foi possível confirmar o envio. Verifique sua conexão e tente novamente ou fale conosco pelo WhatsApp.";

        form.dataset.submitting = "false";
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonHtml;
        }
      });
  });
})();
