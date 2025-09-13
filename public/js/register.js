// church/public/js/register.js

const form = document.getElementById("register-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (data.password !== data.confirm_password) {
    alert("비밀번호가 일치하지 않습니다.");
    return;
  }
  delete data.confirm_password;

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    alert(result.message);

    if (response.ok) {
      // 회원가입 성공 후 메인 페이지로 이동하여
      // 이메일을 확인하라는 메시지를 사용자에게 보여줍니다.
      window.location.href = "/";
    }
  } catch (error) {
    console.error("오류:", error);
    alert("회원가입 중 오류가 발생했습니다.");
  }
});
