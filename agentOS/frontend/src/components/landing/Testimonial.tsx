export function Testimonial() {
  return (
    <section className="border-b border-[#e2e2e2] bg-white">
      <div
        className="relative mx-auto max-w-[1440px]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #e2e2e2 0px, #e2e2e2 1px, transparent 1px, transparent 90px), repeating-linear-gradient(0deg, #e2e2e2 0px, #e2e2e2 1px, transparent 1px, transparent 90px)",
        }}
      >
        <div className="flex min-h-[540px]">
          {/* Quote */}
          <div className="ml-[180px] mt-[90px] flex flex-1 flex-col justify-between border-r border-t border-[#e2e2e2] bg-white p-4">
            <p className="text-[26px] leading-[32.4px] tracking-[-0.32px] text-[#0d0d0d]">
              &ldquo;I used to spend days stitching LLM calls together with
              custom code. With AgentOS, I designed the same pipeline on a
              canvas in 20 minutes — and Claude generated half the skills
              for me.&rdquo;
            </p>
            <div className="mt-8">
              <span className="bg-[#acffd1] px-1 text-sm font-medium uppercase tracking-[-0.14px] text-[#001612]">
                Early Beta User — AI Workflow Engineer
              </span>
            </div>
          </div>

          {/* Decorative colored blocks */}
          <div className="mt-[180px] w-[270px]">
            <div className="grid h-full grid-cols-3 grid-rows-4">
              <div className="bg-[#9d66ff]" />
              <div className="bg-[#38bdf8]" />
              <div className="bg-[#ff6b6b]" />
              <div className="bg-[#fbbf24]" />
              <div className="bg-[#0d0d0d]" />
              <div className="bg-[#9d66ff]" />
              <div className="bg-[#38bdf8]" />
              <div className="bg-[#acffd1]" />
              <div className="bg-[#ff6b6b]" />
              <div className="bg-[#0d0d0d]" />
              <div className="bg-[#fbbf24]" />
              <div className="bg-[#9d66ff]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
