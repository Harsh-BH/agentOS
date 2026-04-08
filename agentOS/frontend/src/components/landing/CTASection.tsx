import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex pl-[180px] pr-[270px] pt-[160px]">
          {/* Text */}
          <div className="flex-1 border-l border-r border-t border-[#e2e2e2] px-4 pb-4 pt-4">
            <h2 className="max-w-[450px] text-[64px] leading-[67.2px] tracking-[-1.28px] text-[#0d0d0d]">
              Start building<br />with AgentOS
            </h2>
            <p className="mt-32 max-w-[450px] text-[26px] leading-[32.4px] tracking-[-0.32px] text-[#4d4d4d]">
              The visual AI workflow studio for
              developers and teams.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex w-[270px] items-end justify-center pb-[1px]">
            <Link
              href="/signup"
              className="flex w-full items-center justify-between bg-[#0d0d0d] px-[30px] py-6 text-[26px] leading-[32.4px] tracking-[-0.32px] text-white transition-colors hover:bg-[#333]"
            >
              Get Started
              <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 7.5H14M14 7.5L8 1.5M14 7.5L8 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
