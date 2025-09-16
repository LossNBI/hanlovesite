// church/public/js/findpassword.js (수정 완료된 버전)

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
const passwordError = document.getElementById("password-error");

let isEmailVerified = false;
let timerId;

// 로딩 상태를 토글하는 함수 (수정 없음)
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

// 메시지 표시/숨김 함수 (passwordError 추가)
function showMessage(element, message, isError = true) {
  element.textContent = message;
  element.style.color = isError ? "#e74c3c" : "#2ecc71";
}
function hideMessage(element) {
  element.textContent = "";
}

// 타이머 시작 함수 (수정 없음)
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
      usernameEmailInput.disabled = false;
      sendCodeBtn.querySelector(".button-text").textContent = "재전송";
    }
  }, 1000);
}

// 시간 포맷팅 함수 (수정 없음)
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

  if (timerId) clearInterval(timerId);
  hideMessage(formMessage);
  setButtonLoading(sendCodeBtn, true);

  let responseOk = false; // 성공 여부 플래그
  try {
    const response = await fetch("/api/auth/find-password/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username_email: usernameOrEmail }),
    });

    responseOk = response.ok;
    const result = await response.json();

    if (responseOk) {
      // UX 개선: alert 대신 페이지 내 메시지 사용 및 스팸 안내 추가
      showMessage(
        formMessage,
        result.message + " 메일이 오지 않으면 스팸함도 확인해주세요.",
        false
      );
      step2.style.display = "block";
      sendCodeBtn.disabled = true;
      usernameEmailInput.disabled = true;
      startTimer(180);
    } else {
      showMessage(formMessage, result.message);
    }
  } catch (error) {
    showMessage(formMessage, "인증번호 전송 중 오류가 발생했습니다.");
  } finally {
    // UX 개선: 요청 성공 시에는 버튼 로딩 상태를 풀지 않음 (타이머가 제어)
    if (!responseOk) {
      setButtonLoading(sendCodeBtn, false);
    }
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
  hideMessage(formMessage);

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

      if (timerId) clearInterval(timerId);
      timerElement.style.display = "none";

      step1.style.display = "none";
      step2.style.display = "none";
      step3.style.display = "block";
      submitBtn.style.display = "block"; // 최종 버튼은 submit 타입이므로 form이 제어
      formDescription.textContent = "새로운 비밀번호를 입력해 주세요.";
    } else {
      showMessage(formMessage, result.message);
    }
  } catch (error) {
    showMessage(formMessage, "인증 확인 중 오류가 발생했습니다.");
  } finally {
    setButtonLoading(verifyCodeBtn, false);
  }
});

// 폼 제출 이벤트 (비밀번호 재설정)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // step-3가 보일 때만 이 로직이 실행되도록 함
  if (step3.style.display !== "block") return;

  if (!isEmailVerified) {
    showMessage(formMessage, "이메일 인증을 먼저 완료해주세요.");
    return;
  }

  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (newPassword !== confirmPassword) {
    // UX 개선: 별도의 password-error 영역에 메시지 표시
    showMessage(passwordError, "비밀번호가 일치하지 않습니다.");
    return;
  } else {
    hideMessage(passwordError);
  }

  if (newPassword.length < 8) {
    showMessage(passwordError, "비밀번호는 8자 이상이어야 합니다.");
    return;
  }

  hideMessage(formMessage);
  // submitBtn은 form의 일부이므로 별도 로딩 처리가 필요하다면 추가
  // setButtonLoading(submitBtn, true);

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
    showMessage(formMessage, "비밀번호 재설정 중 오류가 발생했습니다.");
  } finally {
    // setButtonLoading(submitBtn, false);
  }
});

// 초기에는 재설정 버튼 숨기기
submitBtn.style.display = "none";
