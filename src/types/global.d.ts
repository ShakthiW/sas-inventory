declare global {
  type SignInFormData = {
    email: string;
    password: string;
  };

  type SignUpFormData = {
    fullName: string;
    email: string;
    password: string;
    companyName: string;
    numEmployees: number;
    currency?: string;
    phone?: string;
    industry?: string;
  };

  type WelcomeEmailData = {
    email: string;
    name: string;
    intro: string;
  };

  type DailySummaryEmailData = {
    email: string;
    name: string;
    summary: string;
  };

  type User = {
    id: string;
    name: string;
    email: string;
  };

  type SelectFieldProps = {
    name: string;
    label: string;
    placeholder: string;
    options: readonly Option[];
    control: Control;
    error?: FieldError;
    required?: boolean;
  };

  type FormInputProps = {
    name: string;
    label: string;
    placeholder: string;
    type?: string;
    register: UseFormRegister;
    error?: FieldError;
    validation?: RegisterOptions;
    disabled?: boolean;
    value?: string;
  };

  type FooterLinkProps = {
    text: string;
    linkText: string;
    href: string;
  };

  type Option = { label: string; value: string };
}

export {};

declare module "print-js" {
  // Minimal declaration to satisfy TypeScript. The library exposes a default callable.
  const printJS: (
    options:
      | string
      | {
          printable: string | HTMLElement;
          type?: "pdf" | "html" | "image" | "json";
          header?: string;
          style?: string;
          scanStyles?: boolean;
          targetStyles?: string[];
        }
  ) => void;
  export default printJS;
}
