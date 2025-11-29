"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AddEditUserFormValues = {
  name: string;
  email: string;
  password: string;
  role: string;
};

const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Staff", value: "staff" },
];

export default function Page() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  const isEditMode = !!userId;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<AddEditUserFormValues>({
    defaultValues: { name: "", email: "", password: "", role: "" },
  });

  useEffect(() => {
    if (isEditMode) {
      fetchUser(userId);
    }
  }, [isEditMode, userId]);

  async function fetchUser(id: string) {
    try {
      const res = await fetch(`/api/users/${id}`);
      const json = await res.json();
      if (json.success) {
        const user = json.data;
        setValue("name", user.name);
        setValue("email", user.email);
        setValue("role", user.role);
        // Password is not populated for security
      } else {
        toast.error("Failed to fetch user details");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching user");
    }
  }

  async function onSubmit(values: AddEditUserFormValues) {
    try {
      const url = isEditMode ? `/api/users/${userId}` : "/api/users";
      const method = isEditMode ? "PUT" : "POST";

      const payload = { ...values };
      if (isEditMode && !payload.password) {
        delete (payload as any).password;
      }

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to save user");
      }
      toast.success(isEditMode ? "User updated" : "User created", {
        description: isEditMode
          ? `${values.name} updated successfully`
          : `${values.name} (${values.role}) added and emailed credentials`,
      });
      if (!isEditMode) {
        reset({ name: "", email: "", password: "", role: "" });
      }
    } catch (e) {
      toast.error("Could not save user", {
        description: e instanceof Error ? e.message : "Unexpected error",
      });
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditMode ? "Edit User" : "Add User"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm text-gray-400">
            {isEditMode
              ? "Update user details and role."
              : "Create new users and assign roles like Admin or Staff."}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <InputField
            name="name"
            label="Full Name"
            placeholder="Enter full name"
            register={register}
            error={errors.name}
            className="bg-white text-black border-gray-300 focus-visible:ring-yellow-500 placeholder:text-gray-400"
            labelClassName="text-black"
            validation={{ required: "Full name is required" }}
          />

          <InputField
            name="email"
            type="email"
            label="Email"
            placeholder="name@example.com"
            register={register}
            error={errors.email}
            className="bg-white text-black border-gray-300 focus-visible:ring-yellow-500 placeholder:text-gray-400"
            labelClassName="text-black"
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
            placeholder={
              isEditMode ? "Leave blank to keep current" : "••••••••"
            }
            register={register}
            error={errors.password}
            className="bg-white text-black border-gray-300 focus-visible:ring-yellow-500 placeholder:text-gray-400"
            labelClassName="text-black"
            validation={{
              required: isEditMode ? false : "Password is required",
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
            className="bg-white text-black border-gray-300 focus:ring-yellow-500"
            labelClassName="text-black"
            required
          />

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                ? "Update User"
                : "Save User"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              className="bg-white text-black hover:bg-gray-100 border-gray-200"
            >
              Reset
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
