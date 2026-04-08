import Link from "next/link";

const footerColumns = [
  {
    title: "Platform",
    links: [
      "Visual Canvas",
      "Skill Library",
      "AI Generation",
      "Workflow Versioning",
      "SSE Streaming",
      "Project Workspaces",
      "Team Management",
      "REST API",
    ],
  },
  {
    title: "Skill Types",
    links: [
      "Prompt Operators",
      "Tool Operators",
      "Agent Operators",
      "Custom Nodes",
      "IO Nodes",
      "Chains & Pipelines",
    ],
  },
  {
    title: "Company",
    links: [
      "About",
      "Pricing",
      "Docs",
      "Changelog",
      "Blog",
      "Careers",
      "Privacy Policy",
      "Terms of Use",
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[#272727] bg-[#141414]">
      <div className="mx-auto max-w-[1440px]">
        <div
          className="relative border-b border-[#e2e2e2] py-[90px] pl-[180px]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #e2e2e2 0px, #e2e2e2 1px, transparent 1px, transparent 90px), repeating-linear-gradient(0deg, #e2e2e2 0px, #e2e2e2 1px, transparent 1px, transparent 90px)",
            backgroundSize: "90px 90px",
          }}
        >
          <div className="relative z-10 border-t border-[#272727] bg-[#141414]">
            <div className="flex justify-center gap-[170px] border-t border-[#272727] px-[190px] py-[147px]">
              {footerColumns.map((column) => (
                <div key={column.title} className="w-[211px]">
                  <h4 className="pb-[30px] text-xs font-medium uppercase tracking-[0.24px] text-white">
                    {column.title}
                  </h4>
                  <ul className="flex flex-col gap-5">
                    {column.links.map((link) => (
                      <li key={link}>
                        <Link
                          href="#"
                          className="text-base tracking-[0.16px] text-[#858585] transition-colors hover:text-white"
                        >
                          {link}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
