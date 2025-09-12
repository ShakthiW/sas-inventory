import Image from "next/image";
import { Button } from "@/components/ui/button";

type Props = { variant?: "sign-in" | "sign-up" };

export default function SocialProviders({ variant = "sign-in" }: Props) {
  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 rounded-full"
        aria-label={`${
          variant === "sign-in" ? "Continue" : "Sign up"
        } with Google`}
      >
        <Image src="/google.svg" alt="" width={18} height={18} />
        <span>Continue with Google</span>
      </Button>
    </div>
  );
}
