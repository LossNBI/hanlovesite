// church/public/js/mypage.js

// 마이페이지 폼 이벤트 리스너는 마이페이지에만 추가
document.addEventListener("DOMContentLoaded", () => {
  // 정보 업데이트 폼 제출 이벤트 핸들러
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
            // 정보 업데이트 후 헤더 아이콘을 새로고침
            // 이전 mypage.js의 checkLoginStatus() 대신
            // window.location.reload() 또는 서버에서 응답 받은 후
            // 필요한 값만 업데이트하는 로직 추가
            window.location.reload();
          }
        } catch (error) {
          console.error("정보 업데이트 오류:", error);
          alert("정보 업데이트 중 오류가 발생했습니다.");
        }
      });
  }

  // 비밀번호 변경 폼 제출 이벤트 핸들러
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

  // 회원 탈퇴 버튼 이벤트 리스너 추가
  if (document.getElementById("deleteAccountBtn")) {
    document
      .getElementById("deleteAccountBtn")
      .addEventListener("click", async () => {
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
      });
  }

  // 로그인 확인 로직은 header.js로 이동했으므로, mypage.js에서는 불필요
  // 로그인 상태가 아닐 때 리디렉션 처리
  fetch("/api/auth/status")
    .then((response) => response.json())
    .then((data) => {
      if (!data.isLoggedIn) {
        alert("로그인이 필요합니다.");
        window.location.href = "/login.html";
      } else {
        // 로그인 상태일 때만 마이페이지 정보 로드
        document.getElementById("userName").textContent = data.name;
        document.getElementById("userId").textContent = data.username;
        document.getElementById("userEmail").textContent = data.email;
        document.getElementById("userTitle").textContent =
          data.title || "칭호 없음";
        document.getElementById("userRole").textContent =
          data.role === "admin" ? "관리자" : "일반 사용자";
        document.getElementById("name").value = data.name;
        document.getElementById("email").value = data.email;
      }
    })
    .catch((error) => {
      console.error("로그인 상태 확인 오류:", error);
      alert(
        "로그인 상태를 가져오는 중 오류가 발생했습니다. 다시 로그인해주세요."
      );
      window.location.href = "/login.html";
    });
});
