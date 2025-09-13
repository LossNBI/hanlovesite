// church/public/js/header.js

// 햄버거 메뉴 기능
const hamburgerButton = document.querySelector(".hamburger-button");
const navLinksContainer = document.querySelector(".nav-links-container");

if (hamburgerButton && navLinksContainer) {
  hamburgerButton.addEventListener("click", () => {
    const expanded =
      hamburgerButton.getAttribute("aria-expanded") === "true" || false;
    hamburgerButton.setAttribute("aria-expanded", !expanded);
    navLinksContainer.classList.toggle("active");
  });
}

// 로그인 상태에 따라 헤더 아이콘을 변경하는 함수
async function updateHeaderIcons() {
  const userStatusContainer = document.querySelector(".user-status-container");

  try {
    const response = await fetch("/api/auth/status", {
      credentials: "include",
    });
    const data = await response.json();

    if (response.ok && data.isLoggedIn) {
      // 로그인 상태: 마이페이지 및 로그아웃 아이콘 표시
      let iconsHtml = `<a href="/mypage.html" class="user-icon"><i class="fa-solid fa-user-circle"></i></a><a href="#" id="logout-btn" class="logout-icon"><i class="fa-solid fa-power-off"></i></a>`;

      userStatusContainer.innerHTML = iconsHtml;

      // 로그아웃 이벤트 리스너 추가
      document
        .getElementById("logout-btn")
        .addEventListener("click", async (e) => {
          e.preventDefault();
          const logoutResponse = await fetch("/logout", {
            method: "POST",
          });
          if (logoutResponse.ok) {
            alert("로그아웃 되었습니다.");
            window.location.href = "/";
          }
        });
    } else {
      // 로그아웃 상태: 로그인 아이콘 표시
      userStatusContainer.innerHTML = `<a href="/login.html" class="user-icon"><i class="fa-solid fa-user"></i></a>`;
    }
  } catch (error) {
    console.error("로그인 상태 확인 오류:", error);
    userStatusContainer.innerHTML = `<a href="/login.html" class="user-icon"><i class="fa-solid fa-user"></i></a>`;
  }
}

// 페이지 로드 시 상단바 아이콘 업데이트
document.addEventListener("DOMContentLoaded", updateHeaderIcons);
