import nodemailer from "nodemailer";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

// NODEMAILER 
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: process.env.EMAIL_PORT,
      host: process.env.EMAIL_HOST,
      secure: process.env.EMAIL_SECURE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    };

    const mail = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Email error:", error.message);
    throw new Error("Email could not be sent" + error.message);
  }
};

// RESNED 

// const resend = new Resend(process.env.RESEND_API_KEY);

export const resendEmail = async ({ to, subject, html }) => {
  try {
    const data = resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });
  } catch (error) {
    throw "Email not sent: " + error.message;
  }
};

// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// dotenv.config();

// export const sendEmail = async ({ to, subject, html }) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     await transporter.sendMail({
//       from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       html: html || text,
//     });
//   } catch (error) {
//     console.error("Email send error:", error);
//     throw new Error("Email could not be sent");
//   }
// };
