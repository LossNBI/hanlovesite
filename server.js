// chruch/server.js

// 필요한 모듈들을 불러옵니다.
const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");
const nodemailer = require("nodemailer");

// Cloudinary 설정은 .env 파일에서 불러옵니다.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Nodemailer 트랜스포터 생성
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // .env 파일에 저장된 이메일 주소
    pass: process.env.GMAIL_APP_PASSWORD, // .env 파일에 저장된 앱 비밀번호
  },
});

// Express 애플리케이션을 생성합니다.
const app = express();
const port = 3000;

// process.env.변수명 으로 환경 변수를 불러옵니다.
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 },
  })
);

// 정적 파일(public 폴더)을 제공합니다.
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 로그인 여부와 관리자 권한을 동시에 확인하는 미들웨어
const requireAdmin = (req, res, next) => {
  // 세션에 로그인 정보가 있고, 역할이 'admin'인지 확인
  if (req.session.user && req.session.user.role === "admin") {
    next();
  } else {
    // 권한이 없으면 403 Forbidden 에러 응답
    res.status(403).json({ message: "접근 권한이 없습니다." });
  }
};

// ===================================
// HTML 파일들을 제공하는 라우트들
// ===================================

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

app.get("/findpassword.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "main", "templates", "main", "findpassword.html")
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

app.get("/greetings.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "main", "templates", "main", "greetings.html")
  );
});

// 새로운 라우트: 공지사항 페이지 제공
app.get("/notice.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "main", "templates", "main", "notice.html")
  );
});

// 새로운 라우트: 공지사항 페이지 제공
app.get("/sermon.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "main", "templates", "main", "sermon.html")
  );
});

// ===================================
// 사용자 관련 API
// ===================================

app.post("/register", async (req, res) => {
  const { name, username, password, email } = req.body;
  try {
    const db = client.db("church_db");
    const collection = db.collection("users");
    const existingUser = await collection.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      username,
      password: hashedPassword,
      email,
      role: "user",
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

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const db = client.db("church_db");
    const collection = db.collection("users");
    const user = await collection.findOne({ username });
    if (!user) {
      return res
        .status(401)
        .json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }
    req.session.user = {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
    };
    console.log(`사용자 ${username} 로그인 성공`);
    res.status(200).json({ message: "로그인 성공!" });
  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("로그아웃 오류:", err);
      return res.status(500).json({ message: "로그아웃 오류가 발생했습니다." });
    }
    res.status(200).json({ message: "로그아웃 성공!" });
  });
});

app.post("/api/user/delete-account", async (req, res) => {
  try {
    const userId = req.session.user.id;
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    const db = client.db("church_db");
    const collection = db.collection("users");
    const result = await collection.deleteOne({ _id: new ObjectId(userId) });
    if (result.deletedCount === 1) {
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

app.get("/api/auth/status", (req, res) => {
  if (req.session.user) {
    res.status(200).json({
      isLoggedIn: true,
      username: req.session.user.username,
      name: req.session.user.name,
      role: req.session.user.role,
    });
  } else {
    res.status(200).json({ isLoggedIn: false });
  }
});

app.get("/api/user/info", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  try {
    const db = client.db("church_db");
    const collection = db.collection("users");
    const user = await collection.findOne(
      { _id: new ObjectId(req.session.user.id) },
      { projection: { password: 0 } }
    );
    if (user) {
      res.status(200).json({
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
      });
    } else {
      res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error("사용자 정보 조회 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

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
    req.session.user.name = name;
    res.status(200).json({ message: "정보가 성공적으로 업데이트되었습니다." });
  } catch (error) {
    console.error("정보 업데이트 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

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

// ===================================
// 관리자 관련 API
// ===================================
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const db = client.db("church_db");
    const collection = db.collection("users");
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

app.get("/api/admin/titles", requireAdmin, async (req, res) => {
  try {
    const db = client.db("church_db");
    const collection = db.collection("titles");
    const titles = await collection.find({}).toArray();
    res.status(200).json(titles);
  } catch (error) {
    console.error("칭호 목록 조회 오류:", error);
    res
      .status(500)
      .json({ message: "칭호 목록을 불러오는 중 오류가 발생했습니다." });
  }
});

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
      .status(201)
      .json({ message: "새로운 칭호가 성공적으로 추가되었습니다." });
  } catch (error) {
    console.error("칭호 추가 오류:", error);
    res.status(500).json({ message: "칭호 추가 중 오류가 발생했습니다." });
  }
});

app.post("/api/admin/titles/delete", requireAdmin, async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ message: "삭제할 칭호를 입력해야 합니다." });
  }
  try {
    const db = client.db("church_db");
    const titlesCollection = db.collection("titles");
    const usersCollection = db.collection("users");
    // 해당 칭호를 사용하는 사용자들의 칭호를 초기화합니다.
    await usersCollection.updateMany(
      { title: title },
      { $unset: { title: "" } }
    );
    const result = await titlesCollection.deleteOne({ title });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "해당 칭호를 찾을 수 없습니다." });
    }
    res.status(200).json({ message: "칭호가 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("칭호 삭제 오류:", error);
    res.status(500).json({ message: "칭호 삭제 중 오류가 발생했습니다." });
  }
});

app.post("/api/admin/users/update", requireAdmin, async (req, res) => {
  const { _id, newRole, newTitle } = req.body;
  if (!_id) {
    return res.status(400).json({ message: "사용자 ID가 필요합니다." });
  }
  try {
    const db = client.db("church_db");
    const collection = db.collection("users");
    const updateFields = {};
    if (newRole) updateFields.role = newRole;
    if (newTitle) updateFields.title = newTitle;
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

app.post("/api/admin/users/delete", requireAdmin, async (req, res) => {
  const { _id } = req.body;
  if (!_id) {
    return res.status(400).json({ message: "사용자 ID가 필요합니다." });
  }
  if (req.session.user.id.toString() === _id) {
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

// 새로운 API: 관리자가 콘텐츠를 업데이트하는 라우트
app.post("/api/admin/content/update", requireAdmin, async (req, res) => {
  const { pageName, title, content } = req.body;
  if (!pageName || !title || !content) {
    return res.status(400).json({ message: "모든 필드를 채워주세요." });
  }
  try {
    const db = client.db("church_db");
    const collection = db.collection("content");
    await collection.updateOne(
      { pageName: pageName },
      { $set: { title: title, content: content } },
      { upsert: true }
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
  const pageName = req.params.pageName;
  try {
    const db = client.db("church_db");
    const collection = db.collection("content");
    const pageContent = await collection.findOne({ pageName: pageName });
    if (pageContent) {
      res.status(200).json(pageContent);
    } else {
      res.status(404).json({ message: "콘텐츠를 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error("콘텐츠 조회 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// ===================================
// 주보 업로드 API
// ===================================

// POST /api/sermons/upload: 주보 업로드 API
app.post(
  "/api/sermons/upload",
  upload.array("sermonFiles"),
  requireAdmin,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "업로드할 파일이 없습니다." });
      }

      const db = client.db("church_db");
      const collection = db.collection("sermons");
      const sermonDocs = [];

      for (const file of req.files) {
        // Cloudinary에 파일 업로드
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "church_sermons", // 주보를 저장할 폴더명
        });

        // 임시 파일 삭제
        fs.unlinkSync(file.path);

        sermonDocs.push({
          filename: file.originalname,
          imageUrl: result.secure_url, // Cloudinary 이미지 URL
          uploadDate: new Date(),
          uploaderId: req.session.user.id,
        });
      }

      // MongoDB에 문서 삽입
      await collection.insertMany(sermonDocs);

      res.status(200).json({
        message: "주보가 성공적으로 업로드되었습니다.",
        sermons: sermonDocs,
      });
    } catch (error) {
      console.error("주보 업로드 오류:", error);
      res.status(500).json({ message: "주보 업로드 중 오류가 발생했습니다." });
    }
  }
);

// GET /api/sermons: 주보 목록을 가져오는 API
app.get("/api/sermons", async (req, res) => {
  try {
    const db = client.db("church_db");
    const collection = db.collection("sermons");
    const sermons = await collection
      .find({})
      .sort({ uploadDate: -1 })
      .toArray();
    res.status(200).json(sermons);
  } catch (error) {
    console.error("주보 목록 조회 오류:", error);
    res
      .status(500)
      .json({ message: "주보 목록을 불러오는 중 오류가 발생했습니다." });
  }
});

// 서버를 시작하고 지정된 포트에서 대기합니다.
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

// ===================================
// 게시글/댓글 API
// ===================================

// 모든 게시글 목록을 가져오는 API
app.get("/api/posts", async (req, res) => {
  try {
    const db = client.db("church_db");
    const collection = db.collection("posts");
    const posts = await collection.find({}).sort({ createdAt: -1 }).toArray();
    res.status(200).json(posts);
  } catch (error) {
    console.error("게시글 목록 조회 오류:", error);
    res
      .status(500)
      .json({ message: "게시글을 불러오는 중 오류가 발생했습니다." });
  }
});

// 특정 게시글 상세 내용을 가져오는 API
app.get("/api/posts/:id", async (req, res) => {
  try {
    const db = client.db("church_db");
    const collection = db.collection("posts");
    const post = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!post) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error("게시글 상세 조회 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 새 게시글을 추가하는 API (로그인 필요)
app.post("/api/posts", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  const { title, content } = req.body;
  if (!title || !content) {
    return res
      .status(400)
      .json({ message: "제목과 내용을 모두 입력해야 합니다." });
  }
  try {
    const db = client.db("church_db");
    const collection = db.collection("posts");
    const newPost = {
      title,
      content,
      authorId: new ObjectId(req.session.user.id),
      authorName: req.session.user.name,
      createdAt: new Date(),
      comments: [],
    };
    await collection.insertOne(newPost);
    res.status(201).json({ message: "게시글이 성공적으로 작성되었습니다." });
  } catch (error) {
    console.error("게시글 작성 오류:", error);
    res.status(500).json({ message: "게시글 작성 중 오류가 발생했습니다." });
  }
});

// 게시글을 수정하는 API (작성자 또는 관리자만 가능)
app.put("/api/posts/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  const { title, content } = req.body;
  try {
    const db = client.db("church_db");
    const collection = db.collection("posts");
    const post = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!post) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }
    const isAuthor =
      post.authorId.toString() === req.session.user.id.toString();
    const isAdmin = req.session.user.role === "admin";
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "게시글 수정 권한이 없습니다." });
    }
    await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { title, content, updatedAt: new Date() } }
    );
    res.status(200).json({ message: "게시글이 성공적으로 수정되었습니다." });
  } catch (error) {
    console.error("게시글 수정 오류:", error);
    res.status(500).json({ message: "게시글 수정 중 오류가 발생했습니다." });
  }
});

// 게시글을 삭제하는 API (작성자 또는 관리자만 가능)
app.delete("/api/posts/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  try {
    const db = client.db("church_db");
    const collection = db.collection("posts");
    const post = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!post) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }
    const isAuthor =
      post.authorId.toString() === req.session.user.id.toString();
    const isAdmin = req.session.user.role === "admin";
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "게시글 삭제 권한이 없습니다." });
    }
    await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(200).json({ message: "게시글이 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("게시글 삭제 오류:", error);
    res.status(500).json({ message: "게시글 삭제 중 오류가 발생했습니다." });
  }
});

// 새 댓글을 추가하는 API (로그인 필요)
app.post("/api/posts/:id/comments", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  const { commentText } = req.body;
  if (!commentText) {
    return res.status(400).json({ message: "댓글 내용을 입력해야 합니다." });
  }
  try {
    const db = client.db("church_db");
    const collection = db.collection("posts");
    const newComment = {
      _id: new ObjectId(),
      text: commentText,
      authorId: new ObjectId(req.session.user.id),
      authorName: req.session.user.name,
      createdAt: new Date(),
    };
    await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $push: { comments: newComment } }
    );
    res
      .status(201)
      .json({ message: "댓글이 성공적으로 작성되었습니다.", newComment });
  } catch (error) {
    console.error("댓글 작성 오류:", error);
    res.status(500).json({ message: "댓글 작성 중 오류가 발생했습니다." });
  }
});

// 댓글을 수정하는 API (작성자만 가능)
app.put("/api/posts/:postId/comments/:commentId", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  const { newText } = req.body;
  try {
    const db = client.db("church_db");
    const collection = db.collection("posts");
    const post = await collection.findOne({
      _id: new ObjectId(req.params.postId),
    });
    const comment = post.comments.find(
      (c) => c._id.toString() === req.params.commentId
    );
    if (!comment) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }
    const isAuthor =
      comment.authorId.toString() === req.session.user.id.toString();
    const isAdmin = req.session.user.role === "admin";
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "댓글 수정 권한이 없습니다." });
    }
    await collection.updateOne(
      { "comments._id": new ObjectId(req.params.commentId) },
      {
        $set: {
          "comments.$.text": newText,
          "comments.$.updatedAt": new Date(),
        },
      }
    );
    res.status(200).json({ message: "댓글이 성공적으로 수정되었습니다." });
  } catch (error) {
    console.error("댓글 수정 오류:", error);
    res.status(500).json({ message: "댓글 수정 중 오류가 발생했습니다." });
  }
});

// 댓글을 삭제하는 API (작성자 또는 관리자만 가능)
app.delete("/api/posts/:postId/comments/:commentId", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  try {
    const db = client.db("church_db");
    const collection = db.collection("posts");
    const post = await collection.findOne({
      _id: new ObjectId(req.params.postId),
    });
    const comment = post.comments.find(
      (c) => c._id.toString() === req.params.commentId
    );
    if (!comment) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }
    const isAuthor =
      comment.authorId.toString() === req.session.user.id.toString();
    const isAdmin = req.session.user.role === "admin";
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "댓글 삭제 권한이 없습니다." });
    }
    await collection.updateOne(
      { _id: new ObjectId(req.params.postId) },
      { $pull: { comments: { _id: new ObjectId(req.params.commentId) } } }
    );
    res.status(200).json({ message: "댓글이 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    res.status(500).json({ message: "댓글 삭제 중 오류가 발생했습니다." });
  }
});

// POST /api/upload: Quill 에디터용 이미지 업로드 API
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "업로드할 파일이 없습니다." });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "church_notices",
    });
    fs.unlinkSync(req.file.path);
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error("Quill 이미지 업로드 오류:", error);
    res.status(500).json({ message: "이미지 업로드 중 오류가 발생했습니다." });
  }
});

// POST /find_password 라우트 추가
app.post("/findpassword", async (req, res) => {
  const { username_email } = req.body;

  try {
    const db = client.db("church_db");
    const usersCollection = db.collection("users"); // 1. 아이디 또는 이메일로 사용자 찾기

    const user = await usersCollection.findOne({
      $or: [{ username: username_email }, { email: username_email }],
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "입력하신 정보와 일치하는 회원이 없습니다." });
    }

    // 2. 임시 비밀번호 생성 및 해시
    const tempPassword = Math.random().toString(36).substring(2, 10); // 8자리 임시 비밀번호
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 3. 데이터베이스에 임시 비밀번호 저장
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    // 4. 이메일 전송
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: "한사랑교회 임시 비밀번호 안내입니다.",
      html: `
        <h2>한사랑교회 임시 비밀번호 안내</h2>
        <p>안녕하세요, ${user.name}님.</p>
        <p>요청하신 임시 비밀번호가 발급되었습니다.</p>
        <p><b>임시 비밀번호: <span style="font-size: 1.2em; color: #007BFF;">${tempPassword}</span></b></p>
        <p>로그인 후 마이페이지에서 반드시 비밀번호를 변경해주세요.</p>
        <br>
        <p>한사랑교회</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`임시 비밀번호가 ${user.email}로 전송되었습니다.`);

    // 5. 성공 응답
    res
      .status(200)
      .json({ message: "새로운 비밀번호가 이메일로 전송되었습니다." });
  } catch (error) {
    console.error("비밀번호 찾기 및 이메일 전송 오류:", error);
    res.status(500).json({
      message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    });
  }
});
