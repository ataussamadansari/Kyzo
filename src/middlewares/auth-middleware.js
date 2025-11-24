import User from "../models/User.js";
import { verifyToken } from "../utils/jwt_token.js";

export const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  try {
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized User" });
    }

    const token = authHeader.split(" ")[1];

    const verified = verifyToken(token);
    const user = await User.findById(verified.id).select("-password");

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized User" });
  }
};
