document.addEventListener("DOMContentLoaded", () => {
  // 필요한 HTML 요소 가져오기
  const hamburgerButton = document.querySelector(".hamburger-button");
  const navLinksContainer = document.querySelector(".nav-links-container");
  const hamburgerIcon = hamburgerButton.querySelector("i");
});

hamburgerButton.addEventListener("click", () => {
  const isExpanded = hamburgerButton.getAttribute("aria-expanded") === "true";

  navLinksContainer.classList.toggle("active");
  hamburgerButton.setAttribute("aria-expanded", !isExpanded);

  if (isExpanded) {
    hamburgerIcon.classList.remove("fa-xmark");
    hamburgerIcon.classList.add("fa-bars");
  } else {
    hamburgerIcon.classList.remove("fa-bars");
    hamburgerIcon.classList.add("fa-xmark");
  }
});
