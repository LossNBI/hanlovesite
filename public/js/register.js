// church/public/js/register.js (수정 완료된 버전)

const form = document.getElementById("register-form");
const emailInput = document.getElementById("email");
const sendCodeBtn = document.getElementById("send-code-btn");
const verificationSection = document.getElementById("verification-section");
const verificationCodeInput = document.getElementById("verification-code");
const verifyCodeBtn = document.getElementById("verify-code-btn");
const registerBtn = document.getElementById("register-btn");
const timerDisplay = document.getElementById("timer"); // 변수명 확인
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");

let timerId;
let isEmailVerified = false;

// 타이머 시작 함수
function startTimer(duration) {
  let timeLeft = duration;
  // BUG FIX: timerElement -> timerDisplay 로 수정
  timerDisplay.style.display = "block";
  timerDisplay.textContent = `남은 시간: ${formatTime(timeLeft)}`;

  timerId = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `남은 시간: ${formatTime(timeLeft)}`;

    if (timeLeft <= 0) {
      clearInterval(timerId);
      timerDisplay.textContent = "인증 시간이 만료되었습니다. 다시 보내주세요.";
      sendCodeBtn.disabled = false;
      sendCodeBtn.querySelector(".button-text").textContent = "재전송";
      emailInput.disabled = false; // 시간이 만료되면 이메일 입력창도 다시 활성화
    }
  }, 1000);
}

// 시간 포맷팅 함수 (분:초)
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

// 로딩 상태 처리 함수 (수정 없음)
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

// 에러 메시지 표시/숨김 함수 (수정 없음)
function showErrorMessage(element, message) {
  element.textContent = message;
}
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
  hideErrorMessage(emailError); // 이전 에러 메시지 초기화

  try {
    const response = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    // FEATURE: 스팸 메일 안내 문구 추가
    if (response.ok) {
      alert(
        result.message +
          "\n\n메일이 도착하지 않았다면 스팸 메일함도 확인해주세요."
      );
    } else {
      alert(result.message);
    }

    if (response.ok) {
      verificationSection.style.display = "flex";
      emailInput.disabled = true;
      // 버튼은 타이머가 만료되면 활성화되므로 여기서 바로 활성화하지 않음
      sendCodeBtn.querySelector(".button-text").textContent = "인증번호 보내기";

      // 기존 타이머가 있으면 중지
      if (timerId) clearInterval(timerId); // 3분 (180초) 타이머 시작
      startTimer(180);
    } else {
      showErrorMessage(emailError, result.message);
    }
  } catch (error) {
    showErrorMessage(emailError, "인증번호 전송 중 오류가 발생했습니다.");
  } finally {
    // 성공했을 때는 버튼이 계속 비활성화 상태여야 하므로, 실패했을 때만 로딩 상태 해제
    // response.ok가 아닐 경우에만 로딩을 풀어주도록 수정
    if (
      !document.querySelector("#verification-section[style*='display: flex']")
    ) {
      setButtonLoading(sendCodeBtn, false);
    }
  }
});

// 나머지 코드는 이전과 동일합니다.
// 인증확인 버튼 클릭 이벤트 (수정 없음)
verifyCodeBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const code = verificationCodeInput.value;

  if (!code) {
    alert("인증번호를 입력해주세요.");
    return;
  }

  setButtonLoading(verifyCodeBtn, true);

  try {
    const response = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const result = await response.json();
    alert(result.message);

    if (response.ok) {
      clearInterval(timerId); // 인증 성공 시 타이머 중지
      timerDisplay.style.display = "none";
      isEmailVerified = true;
      verifyCodeBtn.disabled = true;
      verificationCodeInput.disabled = true;
      registerBtn.disabled = false;
    }
  } catch (error) {
    console.error("인증 확인 오류:", error);
    alert("인증 확인 중 오류가 발생했습니다.");
  } finally {
    setButtonLoading(verifyCodeBtn, false);
  }
});

// 회원가입 폼 제출 이벤트 (수정 없음)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!isEmailVerified) {
    alert("이메일 인증을 먼저 완료해주세요.");
    return;
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (data.password !== data.confirm_password) {
    showErrorMessage(passwordError, "비밀번호가 일치하지 않습니다.");
    return;
  } else {
    hideErrorMessage(passwordError);
  }

  delete data.confirm_password;
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
