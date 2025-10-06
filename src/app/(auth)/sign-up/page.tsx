"use client";

import FooterLink from "@/components/forms/FooterLink";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";
import { signUpWithEmail } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import { toast } from "sonner";

const currencyOptions: Option[] = [
  { label: "US Dollar (USD)", value: "USD" },
  { label: "Euro (EUR)", value: "EUR" },
  { label: "Sri Lankan Rupee (LKR)", value: "LKR" },
  { label: "British Pound (GBP)", value: "GBP" },
  { label: "Indian Rupee (INR)", value: "INR" },
];

const industryOptions: Option[] = [
  { label: "Retail", value: "retail" },
  { label: "Wholesale", value: "wholesale" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Services", value: "services" },
  { label: "Other", value: "other" },
];

const SignUp = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      companyName: "",
      numEmployees: 1,
      currency: undefined,
      phone: "",
      industry: undefined,
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const result = await signUpWithEmail(data);
      if (result.success) {
        toast.success("Account created", {
          description: "You can now sign in to your account.",
        });
        router.push("/sign-in");
      }
    } catch (error) {
      console.error(error);
      toast.error("Sign up failed", {
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Failed to sign up.",
      });
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6 text-gray-200">
        Create your account
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            name="fullName"
            label="Full name"
            placeholder="Enter your full name"
            register={register}
            error={errors.fullName}
            validation={{ required: "Full name is required", minLength: 2 }}
          />
          <InputField
            name="email"
            label="Email"
            placeholder="Enter your email"
            register={register}
            error={errors.email}
            validation={{
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email address",
              },
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            name="password"
            label="Password"
            placeholder="Create a strong password"
            type="password"
            register={register}
            error={errors.password}
            validation={{ required: "Password is required", minLength: 8 }}
          />
          <InputField
            name="companyName"
            label="Company name"
            placeholder="Your company or store name"
            register={register}
            error={errors.companyName}
            validation={{ required: "Company name is required", minLength: 2 }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            name="numEmployees"
            label="No. of employees"
            placeholder="e.g. 10"
            type="number"
            register={register}
            error={errors.numEmployees}
            validation={{
              required: "Number of employees is required",
              valueAsNumber: true,
              min: 1,
            }}
          />
          <SelectField
            name="currency"
            label="Preferred currency (optional)"
            placeholder="Select a currency"
            options={currencyOptions}
            control={control}
            error={errors.currency as unknown as FieldError | undefined}
            required={false}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            name="phone"
            label="Phone (optional)"
            placeholder="e.g. +94 77 123 4567"
            register={register}
            error={errors.phone}
            validation={{
              pattern: {
                value: /^[0-9+\-()\s]{7,20}$/,
                message: "Invalid phone number",
              },
            }}
          />
          <SelectField
            name="industry"
            label="Industry (optional)"
            placeholder="Select an industry"
            options={industryOptions}
            control={control}
            error={errors.industry as unknown as FieldError | undefined}
            required={false}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn w-full mt-5"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

        <FooterLink
          text="Already have an account?"
          linkText="Sign in"
          href="/sign-in"
        />
      </form>
    </>
  );
};

export default SignUp;
