"use client";

import React from "react";
import { useForm } from "react-hook-form";
import InputField from "@/components/forms/InputField";
import { Button } from "@/components/ui/button";

type RoleFormValues = {
  name: string;
  description: string;
};

type Role = {
  id: string;
  name: string;
  description?: string;
  userCount?: number;
};

// Placeholder in-memory roles list; replace with API integration later
const initialRoles: Role[] = [
  { id: "r1", name: "Admin", description: "Full access", userCount: 2 },
  { id: "r2", name: "Staff", description: "POS and sales", userCount: 5 },
];

export default function Page() {
  const [roles, setRoles] = React.useState<Role[]>(initialRoles);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RoleFormValues>({ defaultValues: { name: "", description: "" } });

  function onCreateRole(values: RoleFormValues) {
    const newRole: Role = {
      id: `r-${Date.now()}`,
      name: values.name.trim(),
      description: values.description.trim(),
      userCount: 0,
    };
    setRoles((prev) => [newRole, ...prev]);
    reset();
  }

  function onDeleteRole(id: string) {
    setRoles((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Manage Roles
          </h1>
          <p className="text-muted-foreground mt-1 text-sm text-gray-500">
            Create and manage roles used to assign permissions to users.
          </p>
        </div>

        <form onSubmit={handleSubmit(onCreateRole)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              name="name"
              label="Role Name"
              placeholder="e.g., Manager"
              register={register}
              error={errors.name}
              className="bg-white text-black border-gray-300 focus-visible:ring-yellow-500 placeholder:text-gray-400"
              labelClassName="text-black"
              validation={{ required: "Role name is required" }}
            />
            <InputField
              name="description"
              label="Description"
              placeholder="Short description"
              register={register}
              error={errors.description}
              className="bg-white text-black border-gray-300 focus-visible:ring-yellow-500 placeholder:text-gray-400"
              labelClassName="text-black"
              validation={{}}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSubmitting ? "Creating..." : "Create Role"}
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

        <div className="space-y-3">
          <h2 className="text-lg font-medium text-black">Existing Roles</h2>
          <div className="divide-border rounded-md border border-gray-200 bg-white">
            {roles.length === 0 ? (
              <div className="text-muted-foreground p-4 text-sm text-gray-500">
                No roles yet.
              </div>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between gap-4 border-b border-gray-200 p-4 last:border-b-0"
                >
                  <div>
                    <div className="font-medium text-gray-900">{role.name}</div>
                    {role.description ? (
                      <div className="text-muted-foreground text-sm text-gray-500">
                        {role.description}
                      </div>
                    ) : null}
                    {typeof role.userCount === "number" ? (
                      <div className="text-muted-foreground mt-1 text-xs text-gray-400">
                        {role.userCount} user{role.userCount === 1 ? "" : "s"}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="text-gray-500 border-gray-200 hover:bg-gray-100"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteRole(role.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
