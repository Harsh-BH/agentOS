const capabilities = [
  { name: "Prompts", color: "#9d66ff" },
  { name: "Tools", color: "#38bdf8" },
  { name: "Agents", color: "#f97316" },
  { name: "RAG", color: "#22c55e" },
  { name: "Chains", color: "#ef4444" },
  { name: "Memory", color: "#eab308" },
  { name: "Evals", color: "#ec4899" },
  { name: "Deploy", color: "#0d0d0d" },
];

export function TechStack() {
  return (
    <section className="border-b border-[#e2e2e2] bg-white">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col items-center gap-8 border-b border-[#e2e2e2] px-10 py-16">
          <p className="text-center text-[26px] leading-[32.4px] tracking-[-0.32px] text-[#0d0d0d]">
            Every AI primitive,<br />one canvas.
          </p>
          <div className="flex items-center gap-4">
            {capabilities.map((cap) => (
              <div
                key={cap.name}
                className="flex items-center gap-2 rounded-full border border-[#e2e2e2] px-4 py-2"
              >
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: cap.color }}
                />
                <span className="text-sm font-medium text-[#0d0d0d]">{cap.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
