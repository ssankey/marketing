// pages/api/auth/login.js
import jwt from "jsonwebtoken";

const SECRET_KEY = "your_jwt_secret_key";

export default function handler(req, res) {
  if (req.method === "POST") {
    const { username, password } = req.body;

    // Simple hardcoded check
    if (username === "admin" && password === "pass") {
      const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
      res.status(200).json({ success: true, token });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
