(() => {
  const topnav = document.getElementById("topnav");
  const menuBtn = document.getElementById("menuBtn");

  if (!topnav || !menuBtn) return;

  menuBtn.addEventListener("click", (e) => {
    e.preventDefault();
    topnav.classList.toggle("open");
  });
})();
