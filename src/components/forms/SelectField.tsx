import { cn } from "@/lib/utils";
import { Control, Controller, FieldError } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = {
  label: string;
  value: string;
};

type FormSelectProps = {
  name: string;
  label: string;
  placeholder: string;
  options: Option[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  error?: FieldError;
  required?: boolean;
  className?: string;
  labelClassName?: string;
};

const SelectField = ({
  name,
  label,
  placeholder,
  options,
  control,
  error,
  required = false,
  className,
  labelClassName,
}: FormSelectProps) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className={cn("text-sm font-medium text-gray-200", labelClassName)}
      >
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        rules={{ required: required ? "This field is required" : false }}
        render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger
              className={cn(
                "h-11 bg-gray-900 border-gray-700 text-gray-100 focus:ring-yellow-500",
                className,
                { "border-red-500 focus:ring-red-500": error }
              )}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-gray-100">
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="focus:bg-gray-800 focus:text-white cursor-pointer"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <span className="text-sm text-red-500">{error.message}</span>}
    </div>
  );
};

export default SelectField;
