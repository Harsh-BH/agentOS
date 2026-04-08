const poweredBy = ["Claude API", "React Flow", "Supabase", "Next.js", "Go + Fiber"];

export function TrustedBy() {
  return (
    <section className="border-b border-[#e2e2e2] bg-[#f4f0ff]">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-8 py-[71px]">
        <p className="px-4 text-center text-[26px] leading-[32.4px] tracking-[-0.32px] text-[#0d0d0d]">
          Powered by the best tools in the stack
        </p>
        <div className="flex items-center gap-0">
          {poweredBy.map((name) => (
            <div key={name} className="flex items-center justify-center px-[30px]">
              <span className="text-lg font-medium tracking-wide text-[#666]">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
