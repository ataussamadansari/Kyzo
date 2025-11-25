import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // Gmail (or use SMTP config)
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
    console.log(mail);

  } catch (error) {
    console.log("Email error:", error.message);
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;


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
