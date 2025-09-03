// church/public/js/notice.js

const postListContainer = document.getElementById("postListContainer");
const postDetailsContainer = document.getElementById("postDetailsContainer");
const postListEl = document.getElementById("postList");
const noPostsMessageEl = document.getElementById("noPostsMessage");
const addPostBtn = document.getElementById("addPostBtn");
const backToListBtn = document.getElementById("backToListBtn");

const postModal = document.getElementById("postModal");
const postForm = document.getElementById("postForm");
const postTitleInput = document.getElementById("postTitle");
const postIdInput = document.getElementById("postIdInput");
const modalHeader = postModal.querySelector(".modal-header");
const saveBtn = postModal.querySelector(".save-btn");

const postDetailsContent = document.getElementById("postDetailsContent");
const editPostBtn = document.getElementById("editPostBtn");
const deletePostBtn = document.getElementById("deletePostBtn");
const commentForm = document.getElementById("commentForm");
const commentList = document.getElementById("commentList");
let currentPostId = null;
let authStatus = {};

const customAlertModal = document.getElementById("customAlertModal");
const alertMessageEl = document.getElementById("alertMessage");
const alertOkBtn = document.getElementById("alertOkBtn");

const customConfirmModal = document.getElementById("customConfirmModal");
const confirmMessageEl = document.getElementById("confirmMessage");
const confirmOkBtn = document.getElementById("confirmOkBtn");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");

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

const showConfirm = (message) => {
  return new Promise((resolve) => {
    confirmMessageEl.textContent = message;
    customConfirmModal.style.display = "flex";
    confirmOkBtn.onclick = () => {
      customConfirmModal.style.display = "none";
      resolve(true);
    };
    confirmCancelBtn.onclick = () => {
      customConfirmModal.style.display = "none";
      resolve(false);
    };
  });
};

// Quill.js 에디터 설정
const toolbarOptions = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ["bold", "italic", "underline", "strike"],
  ["blockquote", "code-block"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }],
  [{ size: ["small", false, "large", "huge"] }],
  [{ color: [] }, { background: [] }],
  [{ font: [] }],
  [{ align: [] }],
  ["link", "image", "video"],
  ["clean"],
];
const quill = new Quill("#editor", {
  modules: {
    toolbar: toolbarOptions,
  },
  theme: "snow",
});

const imageInput = document.getElementById("imageInput");

quill.getModule("toolbar").addHandler("image", () => {
  imageInput.click();
});

imageInput.addEventListener("change", async () => {
  const file = imageInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (response.ok) {
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, "image", result.url);
    } else {
      await showAlert("파일 업로드에 실패했습니다.");
    }
  } catch (error) {
    console.error("파일 업로드 오류:", error);
    await showAlert("파일 업로드 중 오류가 발생했습니다.");
  }
});

// 템플릿: 시간 변환
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "년 전";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "달 전";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "일 전";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "시간 전";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "분 전";
  return "방금 전";
};

// 템플릿: 게시글 목록 렌더링
const renderPostList = (posts) => {
  postListEl.innerHTML = "";
  if (posts.length === 0) {
    noPostsMessageEl.style.display = "block";
    return;
  }
  noPostsMessageEl.style.display = "none";
  posts.forEach((post) => {
    const li = document.createElement("li");
    li.className = "post-item";
    // 클릭 시 URL 해시 변경
    li.onclick = () => {
      window.location.hash = `#${post._id}`;
    };
    li.innerHTML = `
      <div class="post-title">${post.title}</div>
      <div class="post-meta">작성자: ${post.authorName} | ${timeAgo(
      post.createdAt
    )}</div>
    `;
    postListEl.appendChild(li);
  });
};

// 템플릿: 게시글 상세 렌더링
const showPostDetails = async (postId) => {
  if (!postId) {
    // ID가 없으면 목록 페이지로 전환
    postListContainer.style.display = "block";
    postDetailsContainer.style.display = "none";
    return;
  }

  currentPostId = postId;
  try {
    const response = await fetch(`/api/posts/${postId}`);
    if (!response.ok) throw new Error("게시글을 불러오지 못했습니다.");
    const post = await response.json();

    // 게시글 내용 업데이트
    postDetailsContent.querySelector(".post-detail-title").textContent =
      post.title;
    postDetailsContent.querySelector(
      ".post-detail-meta"
    ).textContent = `작성자: ${post.authorName} | ${timeAgo(
      post.createdAt
    )} | 댓글 ${post.comments.length}개`;
    postDetailsContent.querySelector(".post-detail-content").innerHTML =
      post.content;

    // 수정/삭제 버튼 가시성 설정
    const isAuthor =
      authStatus.isLoggedIn && authStatus.name === post.authorName;
    const isAdmin = authStatus.isLoggedIn && authStatus.role === "admin";
    editPostBtn.style.display = isAuthor || isAdmin ? "inline-block" : "none";
    deletePostBtn.style.display = isAuthor || isAdmin ? "inline-block" : "none";

    // 댓글 렌더링
    renderComments(post.comments);

    // 상세 페이지 표시, 목록 페이지 숨김
    postListContainer.style.display = "none";
    postDetailsContainer.style.display = "block";
  } catch (error) {
    console.error("게시글 상세 보기 오류:", error);
    await showAlert("게시글을 불러오는 중 오류가 발생했습니다.");
    window.location.hash = ""; // 오류 발생 시 목록으로 돌아감
  }
};

// 템플릿: 댓글 렌더링
const renderComments = (comments) => {
  commentList.innerHTML = "";
  if (authStatus.isLoggedIn) {
    commentForm.style.display = "flex";
  } else {
    commentForm.style.display = "none";
  }

  comments.forEach((comment) => {
    const li = document.createElement("li");
    li.className = "comment-item";
    const isAuthor =
      authStatus.isLoggedIn && authStatus.name === comment.authorName;
    const isAdmin = authStatus.isLoggedIn && authStatus.role === "admin";

    li.innerHTML = `
      <div class="comment-meta">
        <strong>${comment.authorName}</strong> | <span>${timeAgo(
      comment.createdAt
    )}</span>
      </div>
      <div class="comment-text">${comment.text}</div>
      <div class="comment-actions">
        ${
          isAuthor || isAdmin
            ? `<button class="edit-comment-btn" data-id="${comment._id}">수정</button>`
            : ""
        }
        ${
          isAuthor || isAdmin
            ? `<button class="delete-comment-btn" data-id="${comment._id}">삭제</button>`
            : ""
        }
      </div>
    `;
    commentList.appendChild(li);
  });
};

// UI 업데이트 함수 (로그인 상태에 따라 버튼 가시성 변경)
const updateUI = (status) => {
  authStatus = status;
  addPostBtn.style.display =
    authStatus.isLoggedIn && authStatus.role === "admin"
      ? "inline-block"
      : "none";
};

// API: 로그인 상태 확인
const checkAuthStatus = async () => {
  try {
    const response = await fetch("/api/auth/status");
    if (response.ok) {
      const status = await response.json();
      updateUI(status);
    }
  } catch (error) {
    console.error("인증 상태 확인 오류:", error);
  }
};

// API: 게시글 목록 가져오기
const fetchPosts = async () => {
  try {
    const response = await fetch("/api/posts");
    const posts = await response.json();
    renderPostList(posts);
    handleHashChange();
  } catch (error) {
    console.error("게시글 목록 불러오기 오류:", error);
    await showAlert("게시글을 불러오는 중 오류가 발생했습니다.");
  }
};

// API: 로그아웃
const logout = async () => {
  try {
    const response = await fetch("/logout", { method: "POST" });
    const result = await response.json();
    if (response.ok) {
      window.location.href = "/";
    } else {
      await showAlert(result.message);
    }
  } catch (error) {
    console.error("로그아웃 오류:", error);
    await showAlert("로그아웃 중 오류가 발생했습니다.");
  }
};

// URL 해시 변경 핸들러
const handleHashChange = () => {
  const postId = window.location.hash.slice(1);
  if (postId) {
    showPostDetails(postId);
  } else {
    showPostDetails(null);
  }
};

// 이벤트 리스너
addPostBtn.addEventListener("click", () => {
  postForm.reset();
  quill.root.innerHTML = "";
  postIdInput.value = "";
  modalHeader.textContent = "새 게시글 작성";
  saveBtn.textContent = "작성";
  postModal.style.display = "flex";
});

backToListBtn.addEventListener("click", () => {
  window.location.hash = "";
});

postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const postId = postIdInput.value;
  const title = postTitleInput.value;
  const content = quill.root.innerHTML;
  const method = postId ? "PUT" : "POST";
  const url = postId ? `/api/posts/${postId}` : "/api/posts";

  try {
    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    const result = await response.json();
    if (response.ok) {
      await showAlert(result.message);
      postModal.style.display = "none";
      fetchPosts();
    } else {
      await showAlert(result.message);
    }
  } catch (error) {
    console.error("게시글 저장 오류:", error);
    await showAlert("게시글 저장 중 오류가 발생했습니다.");
  }
});

editPostBtn.addEventListener("click", async () => {
  try {
    const response = await fetch(`/api/posts/${currentPostId}`);
    const post = await response.json();
    postDetailsContainer.style.display = "none";
    postIdInput.value = post._id;
    postTitleInput.value = post.title;
    quill.root.innerHTML = post.content;
    modalHeader.textContent = "게시글 수정";
    saveBtn.textContent = "수정";
    postModal.style.display = "flex";
  } catch (error) {
    console.error("게시글 수정 준비 오류:", error);
  }
});

deletePostBtn.addEventListener("click", async () => {
  const confirmed = await showConfirm("정말로 이 게시글을 삭제하시겠습니까?");
  if (confirmed) {
    try {
      const response = await fetch(`/api/posts/${currentPostId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (response.ok) {
        await showAlert(result.message);
        window.location.hash = "";
      } else {
        await showAlert(result.message);
      }
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      await showAlert("게시글 삭제 중 오류가 발생했습니다.");
    }
  }
});

commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const commentText = document.getElementById("commentText").value;
  try {
    const response = await fetch(`/api/posts/${currentPostId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentText }),
    });
    const result = await response.json();
    if (response.ok) {
      document.getElementById("commentText").value = "";
      showPostDetails(currentPostId);
    } else {
      await showAlert(result.message);
    }
  } catch (error) {
    console.error("댓글 작성 오류:", error);
    await showAlert("댓글 작성 중 오류가 발생했습니다.");
  }
});

commentList.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-comment-btn")) {
    const commentId = e.target.dataset.id;
    const newText = await showConfirm("수정할 댓글 내용을 입력하세요.");
    if (newText) {
      try {
        const response = await fetch(
          `/api/posts/${currentPostId}/comments/${commentId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newText }),
          }
        );
        const result = await response.json();
        if (response.ok) {
          await showAlert(result.message);
          showPostDetails(currentPostId);
        } else {
          await showAlert(result.message);
        }
      } catch (error) {
        console.error("댓글 수정 오류:", error);
        await showAlert("댓글 수정 중 오류가 발생했습니다.");
      }
    }
  }
  if (e.target.classList.contains("delete-comment-btn")) {
    const confirmed = await showConfirm("정말로 이 댓글을 삭제하시겠습니까?");
    if (confirmed) {
      const commentId = e.target.dataset.id;
      try {
        const response = await fetch(
          `/api/posts/${currentPostId}/comments/${commentId}`,
          {
            method: "DELETE",
          }
        );
        const result = await response.json();
        if (response.ok) {
          await showAlert(result.message);
          showPostDetails(currentPostId);
        } else {
          await showAlert(result.message);
        }
      } catch (error) {
        console.error("댓글 삭제 오류:", error);
        await showAlert("댓글 삭제 중 오류가 발생했습니다.");
      }
    }
  }
});

// 모달 닫기
document.querySelectorAll(".close-btn, .cancel-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    postModal.style.display = "none";
  });
});

// 페이지 로드 시 초기화 및 해시 변경 감지
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus();
  fetchPosts();
});

// URL 해시가 변경될 때마다 페이지 상태를 업데이트
window.addEventListener("hashchange", handleHashChange);
