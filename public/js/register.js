// church/public/js/register.js

const form = document.getElementById("register-form");
const emailInput = document.getElementById("email");
const sendCodeBtn = document.getElementById("send-code-btn");
const verificationSection = document.getElementById("verification-section");
const verificationCodeInput = document.getElementById("verification-code");
const verifyCodeBtn = document.getElementById("verify-code-btn");
const registerBtn = document.getElementById("register-btn");
const timerDisplay = document.getElementById("timer");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");

let timerId;
let isEmailVerified = false;

// 타이머 시작 함수
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
      sendCodeBtn.disabled = false; // 재전송 버튼 활성화
      sendCodeBtn.querySelector(".button-text").textContent = "재전송";
    }
  }, 1000);
}

// 시간 포맷팅 함수 (분:초)
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

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

// 에러 메시지를 표시하는 함수
function showErrorMessage(element, message) {
  element.textContent = message;
}
// 에러 메시지를 숨기는 함수
function hideErrorMessage(element) {
  element.textContent = "";
}

// 인증번호 보내기 버튼 클릭 이벤트
sendCodeBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  if (!email) {
    alert("이메일을 입력해주세요.");
    return;
  }

  setButtonLoading(sendCodeBtn, true);

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
      hideErrorMessage(emailError);
      verificationSection.style.display = "flex";
      sendCodeBtn.disabled = true;
      emailInput.disabled = true;
    } else {
      showErrorMessage(emailError, result.message);
    }
    // 기존 타이머가 있으면 중지
    if (timerId) clearInterval(timerId);
    // 서버에서 전달받은 유효 시간으로 타이머 시작 (예: 180초)
    startTimer(180);
  } catch (error) {
    showErrorMessage(emailError, "인증번호 전송 중 오류가 발생했습니다.");
  } finally {
    setButtonLoading(sendCodeBtn, false); // 로딩 상태 종료 (성공/실패 무관)
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

  setButtonLoading(verifyCodeBtn, true); // 로딩 상태 시작

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
  } finally {
    setButtonLoading(verifyCodeBtn, false); // 로딩 상태 종료 (성공/실패 무관)
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

  // 비밀번호 일치 여부 확인 시
  if (data.password !== data.confirm_password) {
    showErrorMessage(passwordError, "비밀번호가 일치하지 않습니다.");
    return;
  } else {
    hideErrorMessage(passwordError);
  }

  // 확인용 비밀번호 필드 삭제
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
      // 서버에서 온 상세 오류 메시지 처리
      // 예를 들어, 'email-error' 또는 'username-error'와 같은 필드별 에러를 서버가 전달한다면
      if (result.field === "email") {
        showErrorMessage(emailError, result.message);
      } else if (result.field === "password") {
        showErrorMessage(passwordError, result.message);
      } else {
        alert(result.message);
      }
    }
  } catch (error) {
    alert("회원가입 중 오류가 발생했습니다.");
  }
});
