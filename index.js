import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// BUAT FOLDER UPLOADS
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// MULTER UTK SIMPAN FILE YG DIUNGGAH
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

app.use('/uploads', express.static(uploadDir));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

let posts = []; //UTK SIMPAN POST

// TENTUKAN LOKASI FILE JSON
const postsFilePath = path.join(__dirname, 'posts.json');

// MEMUAT DATA DARI FILE JSON
if (fs.existsSync(postsFilePath)) {
  const data = fs.readFileSync(postsFilePath, 'utf-8');
  posts = JSON.parse(data);
}

// FUNGSI UNTUK MENYIMPAN POSTS KE FILE JSON
function savePostsToFile() {
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2), 'utf-8');
}

app.get("/", (req, res) => {
  res.render("index.ejs", { posts: posts });
});

app.get("/create", (req, res) => {
  res.render("blog.ejs");
});

app.get("/services", (req, res) => {
  res.render("services.ejs");
});

app.get("/creator", (req, res) => {
  res.render("creator.ejs");
});

app.post("/create", upload.single('image'), (req, res) => {
  const { title, category, description } = req.body;
  const image = req.file ? req.file.filename : null;
  const id = Date.now().toString(); // Generate a unique ID for the post

  const newPost = {
    id,
    title,
    category,
    description,
    image
  };

  posts.push(newPost);
  savePostsToFile(); // SIMPAN DATA KE FILE JSON SETELAH POST DITAMBAHKAN

  res.redirect("/");
});

app.get("/post/:id", (req, res) => {
  const postId = req.params.id;
  const post = posts.find(p => p.id === postId);

  if (post) {
    res.render("post.ejs", { post: post });
  } else {
    res.status(404).send("Post not found");
  }
});

app.get("/post/:id/edit", (req, res) => {
  const postId = req.params.id;
  const post = posts.find(p => p.id === postId);

  if (post) {
    res.render("edit.ejs", { post: post });
  } else {
    res.status(404).send("Post not found");
  }
});

app.post("/post/:id/edit", upload.single('image'), (req, res) => {
  const postId = req.params.id;
  const { title, category, description } = req.body;
  const post = posts.find(p => p.id === postId);

  if (post) {
    post.title = title;
    post.category = category;
    post.description = description;

    if (req.file) { // Jika ada file baru yang diunggah
      post.image = req.file.filename;
    }

    savePostsToFile(); // Simpan perubahan ke file JSON
    res.redirect(`/post/${postId}`);
  } else {
    res.status(404).send("Post not found");
  }
});

app.post("/post/:id/delete", (req, res) => {
  const postId = req.params.id;
  posts = posts.filter(p => p.id !== postId);

  savePostsToFile(); // Simpan perubahan ke file JSON
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});