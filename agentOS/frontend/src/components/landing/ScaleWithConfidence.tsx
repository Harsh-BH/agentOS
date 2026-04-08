const features = [
  {
    title: "SSE Streaming",
    description: "Watch AI generation happen in real-time. Server-Sent Events stream tokens straight to the canvas.",
  },
  {
    title: "Supabase Auth & RLS",
    description: "Every project, skill, and workflow is scoped to your user. Row-Level Security enforced at the database.",
  },
  {
    title: "JSONB Workflow Storage",
    description: "Workflows persist as React Flow JSON in Postgres JSONB columns — queryable, versionable, fast.",
  },
  {
    title: "Go API Layer",
    description: "A typed, compiled backend on Fiber v2. Sub-millisecond routing, pgx connection pooling, clean error chains.",
  },
];

export function ScaleWithConfidence() {
  return (
    <section className="border-b border-[#e2e2e2] bg-white">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex border-b border-[#e2e2e2]">
          {/* Decorative art */}
          <div className="flex flex-1 items-center justify-center bg-[#e8f7ff] p-20">
            <div className="grid h-[300px] w-[400px] grid-cols-5 grid-rows-4 gap-1">
              <div className="col-span-2 row-span-2 bg-[#38bdf8]" />
              <div className="bg-[#7dd3fc]" />
              <div className="bg-[#0ea5e9]" />
              <div className="bg-[#38bdf8]" />
              <div className="bg-[#bae6fd]" />
              <div className="col-span-2 bg-[#0ea5e9]" />
              <div className="col-span-2 row-span-2 bg-[#38bdf8]" />
              <div className="bg-[#7dd3fc]" />
              <div className="col-span-2 bg-[#bae6fd]" />
              <div className="bg-[#0ea5e9]" />
            </div>
          </div>

          {/* Text */}
          <div className="flex flex-1 items-center justify-center bg-[#c5ebff] px-[195px] py-[189px]">
            <div className="max-w-[330px]">
              <h2 className="text-[64px] leading-[67.2px] tracking-[-1.28px] text-[#0d0d0d]">
                Built to<br />scale
              </h2>
              <p className="mt-5 text-2xl leading-[30px] text-[#0d0d0d]">
                A production-grade stack from
                day one — typed Go backend,
                Postgres with RLS, and real-time
                streaming out of the box.
              </p>
              <div className="mt-8">
                <a
                  href="/signup"
                  className="inline-flex items-center gap-4 border border-[#0d0d0d] px-4 py-[10px] text-lg tracking-[0.18px] text-[#0d0d0d] transition-colors hover:bg-[#b8e4f7]"
                >
                  Explore Architecture
                  <ArrowIcon />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="flex">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`flex flex-1 flex-col px-10 py-[100px] ${
                i < features.length - 1 ? "border-r border-[#e2e2e2]" : ""
              }`}
            >
              <div className="mb-8 size-[50px] rounded-lg bg-[#f5f5f5]" />
              <h3 className="text-lg font-semibold tracking-[0.18px] text-[#0d0d0d]">
                {feature.title}
              </h3>
              <p className="mt-1 text-lg leading-[24.84px] tracking-[0.18px] text-[#4d4d4d]">
                {feature.description}
              </p>
            </div>
          ))}
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
