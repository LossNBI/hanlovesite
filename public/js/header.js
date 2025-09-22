// church/public/js/header.js

document.addEventListener("DOMContentLoaded", () => {
  const hamburgerButton = document.querySelector(".hamburger-button");
  const navLinksContainer = document.querySelector(".nav-links-container");
  const navLinks = document.querySelector(".nav-links");
  const hasSubmenus = document.querySelectorAll(".has-submenu > a");

  // 햄버거 버튼 클릭 이벤트 (메인 메뉴 토글)
  hamburgerButton.addEventListener("click", () => {
    navLinksContainer.classList.toggle("active");
    const expanded = navLinksContainer.classList.contains("active");
    hamburgerButton.setAttribute("aria-expanded", expanded);
  });

  // 모바일 환경에서 하위 메뉴 토글 (클릭 이벤트)
  hasSubmenus.forEach((link) => {
    link.addEventListener("click", (event) => {
      // 데스크톱에서는 기본 링크 이동을 허용
      if (window.innerWidth >= 769) {
        return;
      }

      event.preventDefault(); // 기본 링크 이동 막기

      const parentLi = link.parentElement;
      const subMenu = parentLi.querySelector(".sub-menu");

      // 다른 하위 메뉴 닫기
      document.querySelectorAll(".has-submenu").forEach((otherLi) => {
        if (otherLi !== parentLi) {
          otherLi.classList.remove("active");
        }
      });

      // 현재 하위 메뉴 토글
      parentLi.classList.toggle("active");
    });
  });
});

// 로그인 상태에 따라 헤더 아이콘을 변경하는 함수
async function updateHeaderIcons() {
  const userStatusContainer = document.querySelector(".user-status-container");

  try {
    const response = await fetch("/api/auth/status", {
      credentials: "include",
    });
    const data = await response.json();

    if (response.ok && data.isLoggedIn) {
      // 로그인 상태: 마이페이지 아이콘을 먼저 추가
      let iconsHtml = `<a href="/mypage.html" class="user-icon"><i class="fa-solid fa-user-circle"></i></a>`;

      // 관리자일 경우 관리자 공간 아이콘을 추가
      if (data.role === "admin") {
        iconsHtml += `<a href="/admin.html" class="admin-icon" title="관리자 공간"><i class="fa-solid fa-user-shield"></i></a>`;
      }

      // 마지막에 로그아웃 아이콘을 한 번만 추가
      iconsHtml += `<a href="#" id="logout-btn" class="logout-icon"><i class="fa-solid fa-power-off"></i></a>`;

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
