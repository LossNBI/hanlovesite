// church/public/js/mypage.js

// 마이페이지 정보 로드 함수
async function fetchUserInfo() {
  try {
    const response = await fetch("/api/user/info");
    const data = await response.json();

    if (response.ok) {
      document.getElementById("user-name").textContent = data.name;
      document.getElementById("user-username").textContent = data.username;
      document.getElementById("user-email").textContent = data.email;
      document.getElementById("user-title").textContent = data.title || "없음";
      document.getElementById("user-role").textContent =
        data.role === "admin" ? "관리자" : "일반 사용자";
      document.getElementById("name").value = data.name;
      document.getElementById("email").value = data.email;
    } else {
      alert("사용자 정보를 불러오는데 실패했습니다: " + data.message);
      window.location.href = "/login.html";
    }
  } catch (error) {
    console.error("사용자 정보 조회 오류:", error);
    alert("사용자 정보를 가져오는 중 오류가 발생했습니다.");
    window.location.href = "/login.html";
  }
}

// 정보 업데이트 폼 제출 이벤트 핸들러
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
        // 정보 업데이트 후 최신 정보로 갱신
        fetchUserInfo();
      }
    } catch (error) {
      console.error("정보 업데이트 오류:", error);
      alert("정보 업데이트 중 오류가 발생했습니다.");
    }
  });

// 비밀번호 변경 폼 제출 이벤트 핸들러
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

// 회원 탈퇴 버튼 이벤트 리스너 추가
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

// 페이지 로드 시 로그인 상태 확인 및 정보 로드
document.addEventListener("DOMContentLoaded", () => {
  fetchUserInfo();
});
