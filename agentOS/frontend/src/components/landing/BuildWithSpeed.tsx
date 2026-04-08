const features = [
  {
    title: "Visual Workflow Canvas",
    description: "Drag-and-drop nodes on a React Flow canvas. Connect skills, tools, and agents into executable pipelines.",
  },
  {
    title: "Reusable Skill Library",
    description: "Build once, use everywhere. Skills follow the AFlow operator schema — prompt, tool, or agent — and snap into any workflow.",
  },
  {
    title: "AI-Powered Generation",
    description: "Describe your workflow in plain English. Claude reads your project context and generates skills, nodes, and connections.",
  },
  {
    title: "Per-Project Context",
    description: "Each project carries its own context window. AI generation always reads existing skills and docs before creating new ones.",
  },
];

export function BuildWithSpeed() {
  return (
    <section className="border-b border-[#e2e2e2] bg-white">
      <div className="mx-auto max-w-[1440px]">
        {/* Feature graphic + heading */}
        <div className="flex border-b border-[#e2e2e2]">
          <div className="flex flex-1 items-center justify-center border-r border-[#e2e2e2] bg-[#f0e6ff] p-20">
            <div className="grid h-[300px] w-[400px] grid-cols-5 grid-rows-4 gap-1">
              <div className="col-span-2 row-span-2 bg-[#9d66ff]" />
              <div className="bg-[#c084fc]" />
              <div className="bg-[#7b3aed]" />
              <div className="bg-[#9d66ff]" />
              <div className="bg-[#e9d5ff]" />
              <div className="col-span-2 bg-[#7b3aed]" />
              <div className="col-span-2 row-span-2 bg-[#9d66ff]" />
              <div className="bg-[#c084fc]" />
              <div className="col-span-2 bg-[#e9d5ff]" />
              <div className="bg-[#7b3aed]" />
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center p-20">
            <h2 className="text-[64px] leading-[67.2px] tracking-[-1.28px] text-[#0d0d0d]">
              Design<br />workflows,<br />not glue code
            </h2>
            <p className="mt-5 text-2xl leading-[30px] text-[#0d0d0d]">
              Stop wiring LLM calls by hand.<br />
              Compose agents visually, let AI fill<br />
              in the details, and ship in minutes.
            </p>
            <div className="mt-8">
              <a
                href="/signup"
                className="inline-flex items-center gap-4 border border-[#0d0d0d] px-4 py-[10px] text-lg tracking-[0.18px] text-[#0d0d0d] transition-colors hover:bg-[#f5f5f5]"
              >
                Start Building
                <ArrowIcon />
              </a>
            </div>
          </div>
        </div>

        {/* Feature cards row */}
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
