// chruch/server.js

// 필요한 모듈들을 불러옵니다.
const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb"); // MongoDB 드라이버 불러오기
const { ObjectId } = require("mongodb"); // MongoDB ObjectId 불러오기
const bcrypt = require("bcryptjs"); // 비밀번호 암호화 라이브러리
const session = require("express-session"); // 로그인 유지 세션 관리 라이브러리

// Express 애플리케이션을 생성합니다.
const app = express();
const port = 3000;

// process.env.변수명 으로 환경 변수를 불러옵니다.
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// 데이터베이스 연결 함수
async function connectDB() {
  try {
    await client.connect();
    console.log("MongoDB에 성공적으로 연결되었습니다.");
  } catch (err) {
    console.error("MongoDB 연결 오류:", err);
  }
}

connectDB(); // 서버 시작 시 데이터베이스 연결

// 세션 미들웨어 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET, // 환경 변수에서 비밀 키를 불러옴
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 }, // 세션 유지 시간 (1시간)
  })
);

// 정적 파일(public 폴더)을 제공합니다.
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // JSON 형식의 요청 본문을 파싱합니다.
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 요청 본문을 파싱합니다.

// 로그인 상태 확인 미들웨어 (새로 추가)
const requireAuth = (req, res, next) => {
  if (req.session.isLoggedIn) {
    next();
  } else {
    res.status(401).send("로그인이 필요합니다.");
  }
};

// 관리자 페이지에 접속하는 사용자가 관리자인지 확인하는 미들웨어
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("접근 권한이 없습니다.");
  }
  next();
};

// HTML 파일들을 제공하는 라우트들
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "main", "templates", "main", "home.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "main", "templates", "main", "login.html"));
});

app.get("/register.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "main", "templates", "main", "register.html")
  );
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "main", "templates", "main", "admin.html"));
});

// 내 정보 페이지 접근 라우트 (로그인한 사용자만 접근 가능)
app.get("/mypage.html", (req, res) => {
  if (req.session.user) {
    res.sendFile(
      path.join(__dirname, "main", "templates", "main", "mypage.html")
    );
  } else {
    res.redirect("/login.html");
  }
});

// 회원가입 요청(POST)을 처리하는 라우트
app.post("/register", async (req, res) => {
  const { name, username, password, email } = req.body;

  try {
    const db = client.db("church_db");
    const collection = db.collection("users");

    // 사용자가 이미 존재하는지 확인
    const existingUser = await collection.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 역할(role)을 'user'로 설정하여 저장
    const newUser = {
      name,
      username,
      password: hashedPassword,
      email,
      role: "user", // 새로운 필드 추가: 기본 역할은 'user'
      createdAt: new Date(),
    };
    await collection.insertOne(newUser);

    console.log("새로운 사용자 등록:", newUser);
    res.status(201).json({ message: "회원가입이 성공적으로 완료되었습니다!" });
  } catch (error) {
    console.error("회원가입 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 로그인 요청(POST)을 처리하는 라우트
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const db = client.db("church_db");
    const collection = db.collection("users");

    // 1. 데이터베이스에서 아이디(username)로 사용자 찾기
    const user = await collection.findOne({ username });

    // 사용자가 존재하지 않으면 오류 메시지 전송
    if (!user) {
      return res
        .status(401)
        .json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }

    // 2. 입력된 비밀번호와 저장된 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);

    // 비밀번호가 일치하지 않으면 오류 메시지 전송
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }

    // **로그인 성공 시 세션에 사용자 정보 저장**
    req.session.user = {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role, // 사용자 역할도 세션에 저장
    };

    // 3. 비밀번호가 일치하면 로그인 성공 메시지 전송
    console.log(`사용자 ${username} 로그인 성공`);
    res.status(200).json({ message: "로그인 성공!" });
  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 로그아웃 요청을 처리하는 라우트
app.post("/logout", (req, res) => {
  // 세션 삭제
  req.session.destroy((err) => {
    if (err) {
      console.error("로그아웃 오류:", err);
      return res.status(500).json({ message: "로그아웃 오류가 발생했습니다." });
    }
    res.status(200).json({ message: "로그아웃 성공!" });
  });
});

// 회원 탈퇴 API
app.post("/api/user/delete-account", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const db = client.db("church_db");
    const collection = db.collection("users");
    const result = await collection.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 1) {
      // 계정 삭제 성공 시 세션도 파기
      req.session.destroy();
      res.status(200).json({ message: "회원 탈퇴가 완료되었습니다." });
    } else {
      res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error("회원 탈퇴 오류:", error);
    res.status(500).json({ message: "회원 탈퇴 중 오류가 발생했습니다." });
  }
});

// 로그인 상태 확인 라우트
app.get("/api/auth/status", (req, res) => {
  if (req.session.user) {
    // 세션에 사용자 정보가 있으면 로그인 상태
    res.status(200).json({
      isLoggedIn: true,
      username: req.session.user.username,
      name: req.session.user.name,
      role: req.session.user.role, // 세션에 저장된 역할도 함께 전송
    });
  } else {
    // 없으면 로그아웃 상태
    res.status(200).json({ isLoggedIn: false });
  }
});

// 모든 사용자 목록을 가져오는 관리자 전용 API
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const db = client.db("church_db");
    const collection = db.collection("users");
    // 비밀번호를 제외한 사용자 정보만 가져옴
    const users = await collection
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.status(200).json(users);
  } catch (error) {
    console.error("사용자 목록 조회 오류:", error);
    res
      .status(500)
      .json({ message: "사용자 목록을 불러오는 중 오류가 발생했습니다." });
  }
});

// 사용자 정보(비밀번호 제외)를 업데이트하는 관리자 전용 API
app.post("/api/admin/users/update", requireAdmin, async (req, res) => {
  const { _id, newRole, newTitle } = req.body;

  if (!_id) {
    return res.status(400).json({ message: "사용자 ID가 필요합니다." });
  }

  try {
    const db = client.db("church_db");
    const collection = db.collection("users");
    const updateFields = {};
    if (newRole) {
      updateFields.role = newRole;
    }
    if (newTitle) {
      updateFields.title = newTitle;
    }

    await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateFields }
    );

    res
      .status(200)
      .json({ message: "사용자 정보가 성공적으로 업데이트되었습니다." });
  } catch (error) {
    console.error("사용자 정보 업데이트 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 내 정보 페이지: 로그인한 사용자의 정보를 가져오는 API
app.get("/api/user/info", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const db = client.db("church_db");
    const collection = db.collection("users");
    const user = await collection.findOne(
      { _id: new ObjectId(req.session.user.id) },
      { projection: { password: 0 } } // 비밀번호는 제외
    );
    if (user) {
      res.status(200).json({
        username: user.username,
        name: user.name,
        email: user.email,
      });
    } else {
      res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error("사용자 정보 조회 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 내 정보 페이지: 이름과 이메일을 업데이트하는 API
app.post("/api/user/update-info", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  const { name, email } = req.body;
  if (!name || !email) {
    return res
      .status(400)
      .json({ message: "이름과 이메일을 모두 입력해야 합니다." });
  }

  try {
    const db = client.db("church_db");
    const collection = db.collection("users");
    await collection.updateOne(
      { _id: new ObjectId(req.session.user.id) },
      { $set: { name, email } }
    );

    // 세션 정보도 업데이트해서 즉시 반영
    req.session.user.name = name;

    res.status(200).json({ message: "정보가 성공적으로 업데이트되었습니다." });
  } catch (error) {
    console.error("정보 업데이트 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 내 정보 페이지: 비밀번호를 변경하는 API
app.post("/api/user/change-password", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "현재 비밀번호와 새 비밀번호를 모두 입력해야 합니다." });
  }

  try {
    const db = client.db("church_db");
    const collection = db.collection("users");
    const user = await collection.findOne({
      _id: new ObjectId(req.session.user.id),
    });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "현재 비밀번호가 올바르지 않습니다." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await collection.updateOne(
      { _id: new ObjectId(req.session.user.id) },
      { $set: { password: hashedNewPassword } }
    );

    res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다." });
  } catch (error) {
    console.error("비밀번호 변경 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 서버를 시작하고 지정된 포트에서 대기합니다.
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

// 관리자 권한 확인 미들웨어
const verifyAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "관리자 권한이 필요합니다." });
  }
};

// 모든 사용자 목록을 가져오는 API
app.get("/api/admin/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "username name email role title");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 칭호 목록을 가져오는 API
app.get("/api/admin/titles", verifyAdmin, async (req, res) => {
  try {
    const titles = await Title.find({});
    res.status(200).json(titles);
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 관리자 전용 칭호 관련 API
app.get("/api/admin/titles", async (req, res) => {
  try {
    const db = client.db("church_db");
    const collection = db.collection("titles"); // 새로운 'titles' 컬렉션
    const titles = await collection.find({}).toArray();
    res.status(200).json(titles);
  } catch (error) {
    console.error("칭호 목록 조회 오류:", error);
    res
      .status(500)
      .json({ message: "칭호 목록을 불러오는 중 오류가 발생했습니다." });
  }
});

app.get("/admin_content.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "main", "templates", "main", "admin_content.html")
  );
});

app.get("/greetings.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "main", "templates", "main", "greetings.html")
  );
});

// 새로운 칭호를 추가하는 관리자 전용 API
app.post("/api/admin/titles/add", requireAdmin, async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: "추가할 칭호를 입력해야 합니다." });
  }
  try {
    const db = client.db("church_db");
    const collection = db.collection("titles");
    await collection.insertOne({ title });
    res
      .status(200)
      .json({ message: "새로운 칭호가 성공적으로 추가되었습니다." });
  } catch (error) {
    console.error("칭호 추가 오류:", error);
    res.status(500).json({ message: "칭호 추가 중 오류가 발생했습니다." });
  }
});

// 관리자 전용 칭호 삭제 API
app.post("/api/admin/titles/delete", requireAdmin, async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: "삭제할 칭호를 입력해야 합니다." });
  }
  try {
    const db = client.db("church_db");
    const collection = db.collection("titles");
    const result = await collection.deleteOne({ title });
    if (result.deletedCount === 1) {
      res.status(200).json({ message: "칭호가 성공적으로 삭제되었습니다." });
    } else {
      res.status(404).json({ message: "해당 칭호를 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error("칭호 삭제 오류:", error);
    res.status(500).json({ message: "칭호 삭제 중 오류가 발생했습니다." });
  }
});

// 관리자 전용 사용자 비밀번호 재설정 API
app.post("/api/admin/users/reset-password", requireAdmin, async (req, res) => {
  const { _id, newPassword } = req.body;
  if (!_id || !newPassword) {
    return res
      .status(400)
      .json({ message: "사용자 ID와 새로운 비밀번호가 필요합니다." });
  }

  try {
    const db = client.db("church_db");
    const collection = db.collection("users");

    // 새로운 비밀번호를 암호화
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const result = await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { password: hashedNewPassword } }
    );

    if (result.matchedCount === 1) {
      res
        .status(200)
        .json({ message: "비밀번호가 성공적으로 재설정되었습니다." });
    } else {
      res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error("비밀번호 재설정 오류:", error);
    res
      .status(500)
      .json({ message: "비밀번호 재설정 중 오류가 발생했습니다." });
  }
});

// 관리자 전용 사용자 계정 삭제 API
app.post("/api/admin/users/delete", requireAdmin, async (req, res) => {
  const { _id } = req.body;
  if (!_id) {
    return res.status(400).json({ message: "사용자 ID가 필요합니다." });
  }

  // 관리자 본인을 삭제하지 못하도록 예외 처리
  if (req.session.userId === _id) {
    return res
      .status(403)
      .json({ message: "자신의 계정은 삭제할 수 없습니다." });
  }

  try {
    const db = client.db("church_db");
    const collection = db.collection("users");

    const result = await collection.deleteOne({ _id: new ObjectId(_id) });

    if (result.deletedCount === 1) {
      res
        .status(200)
        .json({ message: "사용자 계정이 성공적으로 삭제되었습니다." });
    } else {
      res.status(404).json({ message: "해당 사용자를 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error("사용자 삭제 오류:", error);
    res.status(500).json({ message: "사용자 삭제 중 오류가 발생했습니다." });
  }
});

// 사용자 정보(칭호, 역할 등)를 업데이트하는 관리자 전용 API
app.post("/api/admin/users/update", requireAdmin, async (req, res) => {
  const { _id, newRole, newTitle } = req.body;
  if (!_id) {
    return res.status(400).json({ message: "사용자 ID가 필요합니다." });
  }
  try {
    const db = client.db("church_db");
    const collection = db.collection("users");
    const updateFields = {};
    if (newRole) {
      updateFields.role = newRole;
    }
    if (newTitle) {
      updateFields.title = newTitle;
    }
    await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateFields }
    );
    res
      .status(200)
      .json({ message: "사용자 정보가 성공적으로 업데이트되었습니다." });
  } catch (error) {
    console.error("사용자 정보 업데이트 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 새로운 API: 관리자가 콘텐츠를 업데이트하는 라우트
// requireAdmin 미들웨어를 사용하여 관리자만 접근 가능하도록 보호합니다.
app.post("/api/admin/content/update", requireAdmin, async (req, res) => {
  const { pageName, title, content } = req.body;
  if (!pageName || !title || !content) {
    return res.status(400).json({ message: "모든 필드를 채워주세요." });
  }

  try {
    const db = client.db("church_db");
    const collection = db.collection("content");

    // pageName으로 문서를 찾아서 업데이트하거나, 없으면 새로 만듭니다.
    await collection.updateOne(
      { pageName: pageName },
      { $set: { title: title, content: content } },
      { upsert: true } // 문서가 없으면 새로 만듭니다.
    );

    res
      .status(200)
      .json({ message: "콘텐츠가 성공적으로 업데이트되었습니다." });
  } catch (error) {
    console.error("콘텐츠 업데이트 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 새로운 API: 사용자가 콘텐츠를 가져가는 라우트
app.get("/api/content/:pageName", async (req, res) => {
  const pageName = req.params.pageName; // URL 파라미터에서 페이지 이름 가져오기

  try {
    const db = client.db("church_db");
    const collection = db.collection("content");

    // 요청된 페이지 이름과 일치하는 문서 찾기
    const pageContent = await collection.findOne({ pageName: pageName });

    if (pageContent) {
      // 콘텐츠가 있으면 JSON 형식으로 전송
      res.status(200).json(pageContent);
    } else {
      // 없으면 기본 메시지 전송
      res.status(404).json({ message: "콘텐츠를 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error("콘텐츠 조회 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});
