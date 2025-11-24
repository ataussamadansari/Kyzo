import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;

export const generateToken = (user) => {
    return jwt.sign(
        { email: user.email, id: user._id },
        SECRET_KEY,
        // '1d'
    );
}

export const verifyToken = (token) => {
    return jwt.verify(token, SECRET_KEY);
}