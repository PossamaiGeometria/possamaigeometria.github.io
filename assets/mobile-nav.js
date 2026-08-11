document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".mobile-menu-toggle");
  var menu = document.querySelector(".mobile-menu");

  if (!toggle || !menu) return;

  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
  }

  toggle.addEventListener("click", function () {
    var opening = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(opening));
    menu.classList.toggle("is-open", opening);
  });

  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 1100) closeMenu();
  });
});
