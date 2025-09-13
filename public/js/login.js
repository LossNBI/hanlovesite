// church/public/js/login.js

const form = document.getElementById("login-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      window.location.href = "/";
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error("오류:", error);
    alert("로그인 중 오류가 발생했습니다.");
  }
});
