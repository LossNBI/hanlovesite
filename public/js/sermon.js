// church/public/js/sermon.js

const addSermonBtn = document.getElementById("addSermonBtn");
const uploadModal = document.getElementById("uploadModal");
const uploadForm = document.getElementById("uploadForm");
const sermonGallery = document.getElementById("sermonGallery");
const noSermonsMessage = document.getElementById("noSermonsMessage");

const userMenu = document.querySelector(".user-menu");
let authStatus = {}; // 전역 변수로 로그인 상태를 저장

// 커스텀 알림 모달
const customAlertModal = document.getElementById("customAlertModal");
const alertMessageEl = document.getElementById("alertMessage");
const alertOkBtn = document.getElementById("alertOkBtn");

const showAlert = (message) => {
  return new Promise((resolve) => {
    alertMessageEl.textContent = message;
    customAlertModal.style.display = "flex";
    alertOkBtn.onclick = () => {
      customAlertModal.style.display = "none";
      resolve(true);
    };
  });
};

// API: 로그인 상태 확인
const checkAuthStatus = async () => {
  try {
    const response = await fetch("/api/auth/status", {
      credentials: "include",
    });
    const data = await response.json();
    authStatus = data;

    // 헤더 메뉴 업데이트
    if (authStatus.isLoggedIn) {
      let menuHtml = `<a href="/my-page.html" class="welcome-message">환영합니다, ${authStatus.name}님</a><a href="#" id="logout-btn">로그아웃</a>`;
      if (authStatus.role === "admin") {
        menuHtml = `<a href="/my-page.html" class="welcome-message">환영합니다, ${authStatus.name}님</a><a href="/admin.html" class="admin-link">관리자 공간</a><a href="#" id="logout-btn">로그아웃</a>`;
      }
      userMenu.innerHTML = menuHtml;

      // 관리자일 경우 '새 주보' 버튼 표시
      if (authStatus.role === "admin") {
        addSermonBtn.style.display = "inline-block";
      }

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
      userMenu.innerHTML = `<a href="/login.html">로그인</a><a href="/register.html">회원가입</a>`;
    }
  } catch (error) {
    console.error("인증 상태 확인 오류:", error);
    authStatus = { isLoggedIn: false };
    userMenu.innerHTML = `<a href="/login.html">로그인</a><a href="/register.html">회원가입</a>`;
  }
};

// API: 주보 이미지 목록 가져오기
const fetchSermons = async () => {
  try {
    const response = await fetch("/api/sermons");
    if (!response.ok) throw new Error("주보 목록을 불러오지 못했습니다.");
    const sermons = await response.json();
    renderSermons(sermons);
  } catch (error) {
    console.error("주보 목록 불러오기 오류:", error);
    await showAlert("주보 목록을 가져오는 중 오류가 발생했습니다.");
  }
};

// 템플릿: 주보 갤러리 렌더링
const renderSermons = (sermons) => {
  sermonGallery.innerHTML = "";
  if (sermons.length === 0) {
    noSermonsMessage.style.display = "block";
    return;
  }
  noSermonsMessage.style.display = "none";
  sermons.forEach((sermon) => {
    const sermonItem = document.createElement("div");
    sermonItem.className = "sermon-item";
    sermonItem.innerHTML = `
      <img src="${sermon.imageUrl}" alt="${sermon.filename}" />
      <div class="sermon-item-meta">${new Date(
        sermon.uploadDate
      ).toLocaleDateString()}</div>
    `;
    sermonGallery.appendChild(sermonItem);
  });
};

// 이벤트 리스너
addSermonBtn.addEventListener("click", () => {
  uploadModal.style.display = "flex";
});

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  const files = document.getElementById("sermonFiles").files;
  if (files.length === 0) {
    await showAlert("파일을 선택해주세요.");
    return;
  }
  for (const file of files) {
    formData.append("sermonFiles", file);
  }

  try {
    const response = await fetch("/api/sermons/upload", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (response.ok) {
      await showAlert("주보가 성공적으로 업로드되었습니다.");
      uploadModal.style.display = "none";
      uploadForm.reset();
      fetchSermons(); // 업로드 후 갤러리 새로고침
    } else {
      await showAlert(result.message || "업로드에 실패했습니다.");
    }
  } catch (error) {
    console.error("주보 업로드 오류:", error);
    await showAlert("주보 업로드 중 오류가 발생했습니다.");
  }
});

// 모달 닫기
document.querySelectorAll(".close-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    uploadModal.style.display = "none";
  });
});

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuthStatus();
  await fetchSermons();
});
