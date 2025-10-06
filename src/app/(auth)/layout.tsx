import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/better-auth/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex items-center justify-center h-screen w-full">
      <section className="w-1/2 max-lg:border-t max-lg:border-gray-600 lg:h-screen bg-gray-800 px-6 py-4 md:p-6 lg:py-12 lg:px-18 flex flex-col justify-start">
        <Link href="/" className="pt-6 lg:pt-8 mb-8 lg:mb-12">
          <Image
            src="/assets/images/dark-logo.png"
            alt="Standord Inventory logo"
            width={140}
            height={32}
            className="h-16 w-auto"
          />
        </Link>

        <div className="pb-6 lg:pb-8 flex-1">{children}</div>
      </section>

      <section className="w-full max-lg:border-t max-lg:border-gray-600 lg:w-[55%] lg:h-screen bg-gray-800 px-6 py-4 md:p-6 lg:py-12 lg:px-18 flex flex-col justify-start">
        <div className="z-10 relative lg:mt-4 lg:mb-16">
          <blockquote className="text-sm md:text-xl lg:text-2xl font-medium text-gray-400 mb-1 md:mb-6 lg:mb-8">
            Standord Inventory turned my watchlist into a winning list. The
            alerts are spot-on, and I feel more confident making moves in the
            market
          </blockquote>
          <div className="flex items-center justify-between">
            <div>
              <cite className="text-xs md:text-lg font-bold text-gray-400 not-italic">
                - Ethan R.
              </cite>
              <p className="max-md:text-xs text-gray-500">Retail Investor</p>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Image
                  src="/assets/icons/star.svg"
                  alt="Star"
                  key={star}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <Image
            src="/assets/images/dashboard.png"
            alt="Dashboard Preview"
            width={1440}
            height={1150}
            className="auth-dashboard-preview absolute top-0"
          />
        </div>
      </section>
    </main>
  );
};
export default Layout;
