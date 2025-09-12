// church/public/js/home.js

document.addEventListener("DOMContentLoaded", () => {
  const hamburgerButton = document.querySelector(".hamburger-button");
  const navLinksContainer = document.querySelector(".nav-links-container");
  const hamburgerIcon = hamburgerButton.querySelector("i");

  hamburgerButton.addEventListener("click", () => {
    const isExpanded = hamburgerButton.getAttribute("aria-expanded") === "true";

    // 메뉴 컨테이너의 'active' 클래스 토글
    navLinksContainer.classList.toggle("active");

    // 햄버거 버튼의 aria-expanded 속성 토글 (접근성)
    hamburgerButton.setAttribute("aria-expanded", !isExpanded);

    // 아이콘 변경 (햄버거 <-> X)
    if (isExpanded) {
      hamburgerIcon.classList.remove("fa-xmark");
      hamburgerIcon.classList.add("fa-bars");
    } else {
      hamburgerIcon.classList.remove("fa-bars");
      hamburgerIcon.classList.add("fa-xmark");
    }
  });
});
