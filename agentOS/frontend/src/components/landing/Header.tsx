import Link from "next/link";

const navItems = ["Features", "Pricing", "Docs", "Blog", "Changelog"];

export function Header() {
  return (
    <header className="border-b border-[#0d0d0d] bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="px-5 py-5 text-xl font-bold tracking-tight text-[#0d0d0d]">
            AgentOS
          </Link>
          <nav className="hidden pl-10 md:block">
            <ul className="flex items-center">
              {navItems.map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="px-5 py-[23px] text-base tracking-[0.16px] text-[#0d0d0d] transition-colors hover:text-[#6c6c6c]"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center">
          <Link
            href="/login"
            className="hidden px-5 py-[23px] text-base tracking-[0.16px] text-[#0d0d0d] sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-[#0d0d0d] px-[30px] py-6 text-base text-white transition-colors hover:bg-[#333]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
