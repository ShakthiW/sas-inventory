import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

const InputField = ({
  name,
  label,
  placeholder,
  type = "text",
  disabled,
  value,
  register,
  error,
  validation,
}: FormInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-gray-200">
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        className={cn("h-11 bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500 focus-visible:ring-yellow-500", {
          "opacity-50 cursor-not-allowed": disabled,
        })}
        {...register(name, validation)}
      />
      {error && <p className="text-destructive text-sm">{error.message}</p>}
    </div>
  );
};

export default InputField;
