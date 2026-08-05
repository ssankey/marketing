import jwt from "jsonwebtoken";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { otpToken, enteredOtp } = req.body;

  try {
    const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
    if (Date.now() > decoded.exp) {
      return res.status(401).json({ message: "OTP expired" });
    }
    if (enteredOtp != decoded.otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }
    return res
      .status(200)
      .json({ message: "OTP_VALIDATED", email: decoded.email });
  } catch (error) {
    console.error("OTP verification failed:", error);
    return res.status(401).json({ message: "Invalid or expired OTP" });
  }
}
