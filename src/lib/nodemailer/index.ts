import nodemailer from "nodemailer";
import { WELCOME_EMAIL_TEMPLATE } from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL!,
    pass: process.env.NODEMAILER_PASSWORD!,
  },
});

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace(
    "{{intro}}",
    intro
  );

  const mailOptions = {
    from: `"Standord Inventory" <shakthiraveen2002@gmail.com>`,
    to: email,
    subject: `Welcome to Standord Inventory — let's set up your inventory in minutes`,
    text: "Thanks for joining Standord Inventory",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
