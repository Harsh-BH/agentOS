import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#e2e2e2] bg-white">
      {/* Grid pattern background */}
      <div className="absolute inset-0 opacity-[0.15]" style={{
        backgroundImage: "repeating-linear-gradient(90deg, #9d66ff 0px, #9d66ff 1px, transparent 1px, transparent 90px), repeating-linear-gradient(0deg, #9d66ff 0px, #9d66ff 1px, transparent 1px, transparent 90px)",
      }} />

      {/* Purple block art - right side decorative */}
      <div className="absolute right-0 top-[90px] hidden h-[630px] w-[540px] lg:block">
        <div className="grid h-full w-full grid-cols-6 grid-rows-7 gap-0">
          <div className="col-start-4 row-start-1 bg-[#9d66ff]" />
          <div className="col-start-3 row-start-2 bg-[#7b3aed]" />
          <div className="col-start-6 row-start-2 bg-[#c084fc]" />
          <div className="col-start-3 row-start-3 bg-[#9d66ff]" />
          <div className="col-start-4 row-start-3 bg-[#7b3aed]" />
          <div className="col-start-3 row-start-4 bg-[#c084fc]" />
          <div className="col-start-2 row-start-4 bg-[#9d66ff]" />
          <div className="col-start-2 row-start-5 bg-[#7b3aed]" />
          <div className="col-start-1 row-start-6 bg-[#9d66ff]" />
          <div className="col-start-5 row-start-4 bg-[#c084fc]" />
          <div className="col-start-6 row-start-5 bg-[#9d66ff]" />
          <div className="col-start-4 row-start-5 bg-[#7b3aed]" />
          <div className="col-start-3 row-start-5 bg-[#c084fc]" />
          <div className="col-start-5 row-start-7 bg-[#9d66ff]" />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-[90px] py-[90px]">
        <div className="max-w-[600px]">
          <h1 className="text-[84px] leading-[84px] tracking-[-1.92px] text-[#0d0d0d]">
            Build AI<br />workflows,<br />visually
          </h1>
          <p className="mt-10 max-w-[551px] text-[26px] leading-[32.4px] tracking-[-0.32px] text-[#4d4d4d]">
            Design, compose, and deploy intelligent agent
            workflows — from a single prompt to a full
            autonomous pipeline.
          </p>
          <div className="mt-8 flex items-center gap-5 pt-[30px]">
            <Link
              href="/signup"
              className="flex items-center gap-3 bg-[#0d0d0d] px-[30px] py-5 text-xl tracking-[0.2px] text-white transition-colors hover:bg-[#333]"
            >
              Start Building Free
              <ArrowIcon />
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 border border-[#0d0d0d] px-[25px] py-[21px] text-xl tracking-[0.2px] text-[#0d0d0d] transition-colors hover:bg-[#f5f5f5]"
            >
              Watch Demo
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 7.5H14M14 7.5L8 1.5M14 7.5L8 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
