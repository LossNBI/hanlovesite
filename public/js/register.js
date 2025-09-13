// church/public/js/register.js

const form = document.getElementById("register-form");
const emailInput = document.getElementById("email");
const sendCodeBtn = document.getElementById("send-code-btn");
const verificationSection = document.getElementById("verification-section");
const verificationCodeInput = document.getElementById("verification-code");
const verifyCodeBtn = document.getElementById("verify-code-btn");
const registerBtn = document.getElementById("register-btn");

let isEmailVerified = false;

// 인증번호 보내기 버튼 클릭 이벤트
sendCodeBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  if (!email) {
    alert("이메일을 입력해주세요.");
    return;
  }

  try {
    const response = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    alert(result.message);

    if (response.ok) {
      // 인증번호 입력 섹션 보이기
      verificationSection.style.display = "flex";
      sendCodeBtn.disabled = true;
      emailInput.disabled = true;
    }
  } catch (error) {
    console.error("인증번호 전송 오류:", error);
    alert("인증번호 전송 중 오류가 발생했습니다.");
  }
});

// 인증확인 버튼 클릭 이벤트
verifyCodeBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const code = verificationCodeInput.value;

  if (!code) {
    alert("인증번호를 입력해주세요.");
    return;
  }

  try {
    const response = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const result = await response.json();
    alert(result.message);

    if (response.ok) {
      isEmailVerified = true;
      verifyCodeBtn.disabled = true;
      verificationCodeInput.disabled = true;
      registerBtn.disabled = false; // 회원가입 버튼 활성화
    }
  } catch (error) {
    console.error("인증 확인 오류:", error);
    alert("인증 확인 중 오류가 발생했습니다.");
  }
});

// 회원가입 폼 제출 이벤트
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!isEmailVerified) {
    alert("이메일 인증을 먼저 완료해주세요.");
    return;
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (data.password !== data.confirm_password) {
    alert("비밀번호가 일치하지 않습니다.");
    return;
  }
  delete data.confirm_password;
  // 인증번호 필드도 삭제
  delete data.verification_code;

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      window.location.href = "/login.html";
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error("회원가입 오류:", error);
    alert("회원가입 중 오류가 발생했습니다.");
  }
});
