import nodemailer from "nodemailer";
import {
  DAILY_INVENTORY_SUMMARY_TEMPLATE,
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
