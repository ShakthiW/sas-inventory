import Link from "next/link";

const FooterLink = ({ text, linkText, href }: FooterLinkProps) => {
  return (
    <div className="text-center pt-6 border-t border-gray-700/30 mt-8">
      <p className="text-base text-gray-400">
        {text}{" "}
        <Link
          href={href}
          className="text-amber-500 hover:text-amber-400 font-semibold transition-all duration-200 hover:underline underline-offset-4 decoration-2"
        >
          {linkText}
        </Link>
      </p>
    </div>
  );
};
export default FooterLink;
