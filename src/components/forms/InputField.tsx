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
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        className={cn("h-11", {
          "opacity-50 cursor-not-allowed": disabled,
        })}
        {...register(name, validation)}
      />
      {error && <p className="text-destructive text-sm">{error.message}</p>}
    </div>
  );
};

export default InputField;
