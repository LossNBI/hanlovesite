// church/public/js/findpassword.js

const form = document.getElementById("find-password-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/find_password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message); // 예: '새로운 비밀번호가 이메일로 전송되었습니다.'
    } else {
      alert(result.message); // 예: '입력하신 정보와 일치하는 회원이 없습니다.'
    }
  } catch (error) {
    console.error("오류:", error);
    alert("비밀번호 찾기 중 오류가 발생했습니다.");
  }
});
