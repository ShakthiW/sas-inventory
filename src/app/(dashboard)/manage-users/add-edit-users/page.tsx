"use client";

import React from "react";
import { useForm } from "react-hook-form";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";

type AddEditUserFormValues = {
  name: string;
  email: string;
  password: string;
  role: string;
};

const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Cashier", value: "cashier" },
];

export default function Page() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddEditUserFormValues>({
    defaultValues: { name: "", email: "", password: "", role: "" },
  });

  async function onSubmit(values: AddEditUserFormValues) {
    // Placeholder submit: wire to API later
    console.log("Add/Edit User submit", values);
    reset({ name: "", email: "", password: "", role: "" });
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add / Edit Users
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create new users and assign roles like Admin or Cashier.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <InputField
            name="name"
            label="Full Name"
            placeholder="Enter full name"
            register={register}
            error={errors.name}
            validation={{ required: "Full name is required" }}
          />

          <InputField
            name="email"
            type="email"
            label="Email"
            placeholder="name@example.com"
            register={register}
            error={errors.email}
            validation={{
              required: "Email is required",
              pattern: {
                value:
                  /^(?:[a-zA-Z0-9_'^&\-]+(?:\.[a-zA-Z0-9_'^&\-]+)*|"(?:[^"\\]|\\.)+")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
                message: "Enter a valid email",
              },
            }}
          />

          <InputField
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            register={register}
            error={errors.password}
            validation={{
              required: "Password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            }}
          />

          <SelectField
            name="role"
            label="Role"
            placeholder="Select role"
            options={roleOptions}
            control={control}
            error={errors.role}
            required
          />

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save User"}
            </Button>
            <Button type="button" variant="outline" onClick={() => reset()}>
              Reset
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
