const steps = [
  {
    number: "1",
    title: "Pick your skill type",
    description: "Choose from prompt, tool, or agent operators — each follows the AFlow schema.",
  },
  {
    number: "2",
    title: "Wire it on the canvas",
    description: "Drag, connect, and configure nodes visually with React Flow. No code required.",
  },
  {
    number: "3",
    title: "Generate with Claude",
    description: "Describe what you need — Claude builds the workflow, skills, and connections for you.",
  },
];

export function ClickClickDone() {
  return (
    <section className="border-b border-[#e2e2e2] bg-white">
      <div className="mx-auto max-w-[1440px]">
        {/* Heading */}
        <div className="flex items-center justify-center border-b border-[#e2e2e2] py-20">
          <h2 className="text-center text-[64px] leading-[67.2px] tracking-[-1.28px] text-[#0d0d0d]">
            Drag, drop, deploy.
          </h2>
        </div>

        {/* Steps */}
        <div className="flex border-b border-[#e2e2e2]">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`flex flex-1 flex-col items-center justify-between px-[60px] pb-20 pt-[60px] ${
                i > 0 ? "border-l border-[#e2e2e2]" : ""
              }`}
            >
              <div className="w-full max-w-[350px]">
                <div className="mb-4 flex size-7 items-center justify-center bg-[#9d66ff] text-lg font-semibold text-white">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-[#0d0d0d]">
                  {step.title}
                </h3>
                <p className="mt-1 text-lg leading-[24.84px] tracking-[0.18px] text-[#4d4d4d]">
                  {step.description}
                </p>
              </div>
              <div className="mt-10 size-[360px] overflow-hidden rounded-lg bg-[#f5f5f5]">
                <div className="flex h-full items-center justify-center text-sm text-[#999]">
                  Step {step.number} illustration
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
