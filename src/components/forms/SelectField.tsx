import { Controller } from "react-hook-form";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SelectField = ({
  name,
  label,
  placeholder,
  options,
  control,
  error,
  required = false,
}: SelectFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-gray-200">
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        rules={{
          required: required ? `Please select ${label.toLowerCase()}` : false,
        }}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="h-11 bg-gray-900 border-gray-700 text-gray-100 focus:ring-yellow-500">
              <SelectValue placeholder={placeholder} className="placeholder:text-gray-500" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="focus:bg-gray-700 focus:text-gray-100 cursor-pointer"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
            {error && (
              <p className="text-destructive text-sm">{error.message}</p>
            )}
          </Select>
        )}
      />
    </div>
  );
};

export default SelectField;
