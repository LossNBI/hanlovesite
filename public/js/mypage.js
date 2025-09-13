// church/public/js/mypage.js

// 로그인 상태에 따라 헤더와 마이페이지 정보를 변경하는 함수
async function checkLoginStatus() {
  // 상단바에서 유저 상태를 표시할 컨테이너
  const userStatusContainer = document.querySelector(".user-status-container");

  try {
    const response = await fetch("/api/auth/status", {
      credentials: "include",
    });
    const data = await response.json();

    if (response.ok && data.isLoggedIn) {
      // 1. 로그인 상태 확인 성공
      let iconsHtml = `<a href="/mypage.html" class="user-icon"><i class="fa-solid fa-user-circle"></i></a><a href="#" id="logout-btn" class="logout-icon"><i class="fa-solid fa-power-off"></i></a>`;

      // 관리자일 경우 별도 아이콘을 추가할 수도 있습니다.
      // if (data.role === "admin") {
      //   iconsHtml = `...`;
      // }

      userStatusContainer.innerHTML = iconsHtml;

      // 마이페이지인 경우에만 사용자 정보 표시
      if (document.getElementById("mypage-container")) {
        // 2. 마이페이지에 사용자 정보 표시
        document.getElementById("userName").textContent = data.name;
        document.getElementById("userId").textContent = data.username;
        document.getElementById("userEmail").textContent = data.email;
        document.getElementById("userTitle").textContent =
          data.title || "칭호 없음";
        document.getElementById("userRole").textContent =
          data.role === "admin" ? "관리자" : "일반 사용자";

        // 3. 폼 필드에 기존 값 채우기
        document.getElementById("name").value = data.name;
        document.getElementById("email").value = data.email;
      }

      // 4. 로그아웃 이벤트 리스너 추가
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
      // 로그인 상태가 아님: 모든 페이지에서 로그인 아이콘 표시
      userStatusContainer.innerHTML = `<a href="/login.html" class="user-icon"><i class="fa-solid fa-user"></i></a>`;

      // 마이페이지에 접속하려 할 경우
      if (document.getElementById("mypage-container")) {
        alert("로그인이 필요합니다!");
        window.location.href = "/login.html";
      }
    }
  } catch (error) {
    console.error("로그인 상태 확인 오류:", error);
    userStatusContainer.innerHTML = `<a href="/login.html" class="user-icon"><i class="fa-solid fa-user"></i></a>`;

    if (document.getElementById("mypage-container")) {
      alert(
        "로그인 상태를 가져오는 중 오류가 발생했습니다. 다시 로그인해주세요."
      );
      window.location.href = "/login.html";
    }
  }
}

// 정보 업데이트 폼 제출 이벤트 핸들러
document.addEventListener("DOMContentLoaded", () => {
  // 모든 페이지에서 로그인 상태 확인 함수 실행
  checkLoginStatus();

  // 마이페이지 폼 이벤트 리스너는 마이페이지에만 추가
  if (document.getElementById("updateInfoForm")) {
    document
      .getElementById("updateInfoForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;

        try {
          const response = await fetch("/api/user/update-info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email }),
          });
          const result = await response.json();
          alert(result.message);
          if (response.ok) {
            checkLoginStatus(); // 정보 업데이트 후 새로고침
          }
        } catch (error) {
          console.error("정보 업데이트 오류:", error);
          alert("정보 업데이트 중 오류가 발생했습니다.");
        }
      });
  }

  if (document.getElementById("changePasswordForm")) {
    document
      .getElementById("changePasswordForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const oldPassword = document.getElementById("oldPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmNewPassword =
          document.getElementById("confirmNewPassword").value;

        if (newPassword !== confirmNewPassword) {
          alert("새 비밀번호가 일치하지 않습니다.");
          return;
        }

        try {
          const response = await fetch("/api/user/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldPassword, newPassword }),
          });
          const result = await response.json();
          alert(result.message);
          if (response.ok) {
            document.getElementById("changePasswordForm").reset();
          }
        } catch (error) {
          console.error("비밀번호 변경 오류:", error);
          alert("비밀번호 변경 중 오류가 발생했습니다.");
        }
      });
  }

  if (document.getElementById("deleteAccountBtn")) {
    document
      .getElementById("deleteAccountBtn")
      .addEventListener("click", deleteAccount);
  }
});

// 회원 탈퇴 함수
async function deleteAccount() {
  const confirmText = prompt(
    `회원 탈퇴를 진행하시려면 '회원 탈퇴'를 정확히 입력하세요.`
  );
  if (confirmText !== "회원 탈퇴") {
    alert("입력이 일치하지 않아 회원 탈퇴를 취소합니다.");
    return;
  }

  try {
    const response = await fetch("/api/user/delete-account", {
      method: "POST",
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      window.location.href = "/";
    }
  } catch (error) {
    console.error("회원 탈퇴 오류:", error);
    alert("회원 탈퇴 중 오류가 발생했습니다.");
  }
}
