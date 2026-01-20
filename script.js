(function () {
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  // year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  if (!menuBtn || !mobileMenu) return;

  function setOpen(isOpen) {
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      mobileMenu.hidden = false;
    } else {
      mobileMenu.hidden = true;
    }
  }

  menuBtn.addEventListener("click", () => {
    const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  // close menu when clicking a link
  mobileMenu.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) setOpen(false);
  });

  // close menu on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // close menu when resizing to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) setOpen(false);
  });
})();
