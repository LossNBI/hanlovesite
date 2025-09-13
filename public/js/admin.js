// church/public/js/admin.js

let titles = [];

// 섹션 전환 기능
function showSection(id) {
  document.querySelectorAll(".admin-section").forEach((section) => {
    section.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

// 칭호 목록 가져오기
async function fetchTitles() {
  try {
    const response = await fetch("/api/admin/titles");
    const data = await response.json();
    titles = data.map((t) => t.title);

    const titleListElement = document.getElementById("title-list");
    titleListElement.innerHTML = "";
    titles.forEach((title) => {
      const li = document.createElement("li");
      li.className = "title-list-item";
      li.innerHTML = `
        <span>${title}</span>
        <button class="btn-demote" onclick="deleteTitle('${title}')">삭제</button>
      `;
      titleListElement.appendChild(li);
    });
  } catch (error) {
    console.error("칭호 목록 가져오기 오류:", error);
    alert("칭호 목록을 불러오는 중 오류가 발생했습니다.");
  }
}

// 사용자 목록 가져오기
async function fetchUsers() {
  try {
    const response = await fetch("/api/admin/users");
    const users = await response.json();
    const userList = document.getElementById("user-list");
    userList.innerHTML = "";

    if (response.ok) {
      users.forEach((user) => {
        const row = document.createElement("tr");

        const titleDropdown = document.createElement("select");
        titleDropdown.onchange = (e) =>
          updateUserTitle(user._id, e.target.value);

        titles.forEach((title) => {
          const option = document.createElement("option");
          option.value = title;
          option.textContent = title;
          if (user.title === title) {
            option.selected = true;
          }
          titleDropdown.appendChild(option);
        });

        const noTitleOption = document.createElement("option");
        noTitleOption.value = "";
        noTitleOption.textContent = "칭호 없음";
        if (!user.title) {
          noTitleOption.selected = true;
        }
        titleDropdown.prepend(noTitleOption);

        row.innerHTML = `
          <td>${user.username}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>
            <select onchange="updateUserRole('${user._id}', this.value)">
              <option value="user" ${
                user.role === "user" ? "selected" : ""
              }>일반 사용자</option>
              <option value="admin" ${
                user.role === "admin" ? "selected" : ""
              }>관리자</option>
            </select>
          </td>
          <td></td>
          <td>
            <div class="btn-group">
              <button class="btn-update" onclick="resetUserPassword('${
                user._id
              }', '${user.username}')">비밀번호 재설정</button>
              <button class="btn-demote" onclick="deleteUser('${user._id}', '${
          user.username
        }')">삭제</button>
            </div>
          </td>
        `;
        row.querySelector("td:nth-child(5)").appendChild(titleDropdown);
        userList.appendChild(row);
      });
    } else {
      alert(users.message);
      window.location.href = "/login.html";
    }
  } catch (error) {
    console.error("사용자 목록 가져오기 오류:", error);
    alert("사용자 목록을 불러오는 중 오류가 발생했습니다.");
  }
}

// 역할 업데이트
async function updateUserRole(userId, newRole) {
  const confirmUpdate = confirm(`${newRole} 역할로 변경하시겠습니까?`);
  if (!confirmUpdate) return;
  try {
    const response = await fetch("/api/admin/users/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: userId, newRole }),
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      fetchUsers();
    }
  } catch (error) {
    console.error("역할 업데이트 오류:", error);
    alert("역할 업데이트 중 오류가 발생했습니다.");
  }
}

// 칭호 업데이트
async function updateUserTitle(userId, newTitle) {
  try {
    const response = await fetch("/api/admin/users/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: userId, newTitle }),
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      fetchUsers();
    }
  } catch (error) {
    console.error("칭호 업데이트 오류:", error);
    alert("칭호 업데이트 중 오류가 발생했습니다.");
  }
}

// 새로운 칭호 추가
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("add-title-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const newTitle = document.getElementById("new-title-input").value;
      if (!newTitle) return;

      try {
        const response = await fetch("/api/admin/titles/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        });
        const result = await response.json();
        alert(result.message);
        if (response.ok) {
          document.getElementById("new-title-input").value = "";
          await fetchTitles();
          fetchUsers();
        }
      } catch (error) {
        console.error("칭호 추가 오류:", error);
        alert("칭호 추가 중 오류가 발생했습니다.");
      }
    });
});

// 칭호 삭제
async function deleteTitle(title) {
  const confirmText = prompt(
    `'${title}' 칭호를 삭제하려면 '삭제'를 입력하세요.`
  );
  if (confirmText !== "삭제") {
    alert("입력이 일치하지 않아 삭제를 취소합니다.");
    return;
  }

  try {
    const response = await fetch("/api/admin/titles/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      await fetchTitles();
      fetchUsers();
    }
  } catch (error) {
    console.error("칭호 삭제 오류:", error);
    alert("칭호 삭제 중 오류가 발생했습니다.");
  }
}

// 비밀번호 재설정
async function resetUserPassword(userId, username) {
  const newPassword = prompt(
    `${username} 사용자의 새로운 비밀번호를 입력하세요:`
  );
  if (!newPassword) {
    alert("비밀번호를 입력해야 합니다.");
    return;
  }

  const confirmReset = confirm(
    `정말 ${username} 사용자의 비밀번호를 재설정하시겠습니까?`
  );
  if (!confirmReset) return;

  try {
    const response = await fetch("/api/admin/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: userId, newPassword }),
    });
    const result = await response.json();
    alert(result.message);
    if (!response.ok) {
      console.error("비밀번호 재설정 실패:", result.message);
    }
  } catch (error) {
    console.error("비밀번호 재설정 오류:", error);
    alert("비밀번호 재설정 중 오류가 발생했습니다.");
  }
}

// 사용자 삭제
async function deleteUser(userId, username) {
  const confirmText = prompt(
    `'${username}' 사용자를 삭제하려면 '삭제'를 입력하세요.`
  );
  if (confirmText !== "삭제") {
    alert("입력이 일치하지 않아 삭제를 취소합니다.");
    return;
  }

  try {
    const response = await fetch("/api/admin/users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: userId }),
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      fetchUsers();
    }
  } catch (error) {
    console.error("사용자 삭제 오류:", error);
    alert("사용자 삭제 중 오류가 발생했습니다.");
  }
}

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", async () => {
  // 관리자 권한 확인
  const response = await fetch("/api/auth/status");
  const data = await response.json();

  if (!data.isLoggedIn || data.role !== "admin") {
    alert("관리자 권한이 없습니다.");
    window.location.href = "/";
    return;
  }

  // 관리자 권한이 있을 때만 데이터 로드
  await fetchTitles();
  fetchUsers();
});
