import nodemailer from "nodemailer";
import {
  DAILY_INVENTORY_SUMMARY_TEMPLATE,
  ADDED_USER_CREDENTIALS_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";

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

export const sendDailyInventorySummaryEmail = async ({
  email,
  name,
  summary,
}: DailySummaryEmailData): Promise<void> => {
  const htmlTemplate = DAILY_INVENTORY_SUMMARY_TEMPLATE.replace(
    "{{name}}",
    name
  ).replace("{{summary}}", summary);

  const mailOptions = {
    from: `"Standord Inventory" <shakthiraveen2002@gmail.com>`,
    to: email,
    subject: `Standord Inventory — Daily Inventory Summary ${new Date().toLocaleDateString()}`,
    text: "Standord Inventory Daily Inventory Summary",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendAddedUserCredentialsEmail = async ({
  email,
  name,
  password,
  role,
}: {
  email: string;
  name: string;
  password: string;
  role: string;
}): Promise<void> => {
  const htmlTemplate = ADDED_USER_CREDENTIALS_TEMPLATE.replace("{{name}}", name)
    .replace("{{email}}", email)
    .replace("{{password}}", password)
    .replace("{{role}}", role);

  const mailOptions = {
    from: `"Standord Inventory" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: `Your Standord Inventory account credentials`,
    text: `Hi ${name}, your account is ready. Email: ${email} | Password: ${password} | Role: ${role}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
