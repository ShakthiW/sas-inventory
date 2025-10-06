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
        className={cn("bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-amber-500 focus:ring-amber-500/20 h-11", {
          "opacity-50 cursor-not-allowed": disabled,
        })}
        {...register(name, validation)}
      />
      {error && <p className="text-destructive text-sm">{error.message}</p>}
    </div>
  );
};

export default InputField;
