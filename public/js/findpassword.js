// church/public/js/findpassword.js

const form = document.getElementById("find-password-form");
const usernameEmailInput = document.getElementById("username_email");
const sendCodeBtn = document.getElementById("send-code-btn");
const verificationCodeInput = document.getElementById("verification-code");
const verifyCodeBtn = document.getElementById("verify-code-btn");
const newPasswordInput = document.getElementById("new_password");
const confirmPasswordInput = document.getElementById("confirm_password");
const submitBtn = document.getElementById("submit-btn");

const step1 = document.getElementById("step-1");
const step2 = document.getElementById("step-2");
const step3 = document.getElementById("step-3");

const formDescription = document.getElementById("form-description");
const formMessage = document.getElementById("form-message");
const timerElement = document.getElementById("timer");

let isEmailVerified = false;
let timerId;

// 로딩 상태를 토글하는 함수 (회원가입 페이지와 동일)
function setButtonLoading(button, isLoading) {
  const buttonText = button.querySelector(".button-text");
  const spinner = button.querySelector(".loading-spinner");

  if (isLoading) {
    button.disabled = true;
    button.classList.add("loading");
    if (buttonText) buttonText.style.display = "none";
    if (spinner) spinner.style.display = "inline-block";
  } else {
    button.disabled = false;
    button.classList.remove("loading");
    if (buttonText) buttonText.style.display = "inline-block";
    if (spinner) spinner.style.display = "none";
  }
}

// 에러 메시지 표시/숨김 함수
function showMessage(element, message, isError = true) {
  element.textContent = message;
  element.style.color = isError ? "#e74c3c" : "#2ecc71";
}

// 타이머 시작 함수 (회원가입 페이지와 동일)
function startTimer(duration) {
  let timeLeft = duration;
  timerElement.style.display = "block";
  timerElement.textContent = `남은 시간: ${formatTime(timeLeft)}`;

  timerId = setInterval(() => {
    timeLeft--;
    timerElement.textContent = `남은 시간: ${formatTime(timeLeft)}`;

    if (timeLeft <= 0) {
      clearInterval(timerId);
      timerElement.textContent = "인증 시간이 만료되었습니다. 다시 보내주세요.";
      sendCodeBtn.disabled = false;
      sendCodeBtn.querySelector(".button-text").textContent = "재전송";
    }
  }, 1000);
}

// 시간 포맷팅 함수
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

// '인증번호 보내기' 버튼 클릭 이벤트
sendCodeBtn.addEventListener("click", async () => {
  const usernameOrEmail = usernameEmailInput.value;
  if (!usernameOrEmail) {
    showMessage(formMessage, "아이디 또는 이메일을 입력해주세요.");
    return;
  }

  // 기존 타이머가 있으면 중지
  if (timerId) clearInterval(timerId);
  showMessage(formMessage, "", false);
  setButtonLoading(sendCodeBtn, true);

  try {
    const response = await fetch("/api/auth/find-password/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username_email: usernameOrEmail }),
    });

    const result = await response.json();

    if (response.ok) {
      showMessage(formMessage, result.message, false);
      // 인증번호 입력 섹션 보이기
      step2.style.display = "block";
      sendCodeBtn.disabled = true;
      usernameEmailInput.disabled = true;
      startTimer(180); // 3분 타이머 시작
    } else {
      showMessage(formMessage, result.message);
    }
  } catch (error) {
    console.error("인증번호 전송 오류:", error);
    showMessage(formMessage, "인증번호 전송 중 오류가 발생했습니다.");
  } finally {
    setButtonLoading(sendCodeBtn, false);
  }
});

// '인증확인' 버튼 클릭 이벤트
verifyCodeBtn.addEventListener("click", async () => {
  const usernameOrEmail = usernameEmailInput.value;
  const code = verificationCodeInput.value;

  if (!code) {
    showMessage(formMessage, "인증번호를 입력해주세요.");
    return;
  }

  setButtonLoading(verifyCodeBtn, true);
  showMessage(formMessage, "", false);

  try {
    const response = await fetch("/api/auth/find-password/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username_email: usernameOrEmail, code }),
    });

    const result = await response.json();

    if (response.ok) {
      showMessage(formMessage, result.message, false);
      isEmailVerified = true;
      verifyCodeBtn.disabled = true;
      verificationCodeInput.disabled = true;

      // 타이머 중지
      if (timerId) clearInterval(timerId);
      timerElement.style.display = "none";

      // 비밀번호 재설정 단계 보이기
      step3.style.display = "block";
      submitBtn.style.display = "block";
      formDescription.textContent = "새로운 비밀번호를 입력해 주세요.";
    } else {
      showMessage(formMessage, result.message);
    }
  } catch (error) {
    console.error("인증 확인 오류:", error);
    showMessage(formMessage, "인증 확인 중 오류가 발생했습니다.");
  } finally {
    setButtonLoading(verifyCodeBtn, false);
  }
});

// 폼 제출 이벤트 (비밀번호 재설정)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!isEmailVerified) {
    showMessage(formMessage, "이메일 인증을 먼저 완료해주세요.");
    return;
  }

  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (newPassword !== confirmPassword) {
    showMessage(formMessage, "비밀번호가 일치하지 않습니다.");
    return;
  }

  if (newPassword.length < 8) {
    showMessage(formMessage, "비밀번호는 8자 이상이어야 합니다.");
    return;
  }

  showMessage(formMessage, "", false);
  setButtonLoading(submitBtn, true);

  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username_email: usernameEmailInput.value,
        new_password: newPassword,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      window.location.href = "/login.html";
    } else {
      showMessage(formMessage, result.message);
    }
  } catch (error) {
    console.error("비밀번호 재설정 오류:", error);
    showMessage(formMessage, "비밀번호 재설정 중 오류가 발생했습니다.");
  } finally {
    setButtonLoading(submitBtn, false);
  }
});
