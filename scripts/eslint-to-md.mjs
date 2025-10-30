import fs from "node:fs";

const input = "reports/eslint.json";
const output = "docs/ESLint_Report.md";

const data = JSON.parse(fs.readFileSync(input, "utf8"));
let errCount = 0;
let warnCount = 0;

let md = `# ESLint Report\n\n`;
for (const file of data) {
  if (!file.messages?.length) continue;
  const rel = file.filePath.replace(process.cwd() + "/", "");
  md += `## ${rel}\n\n`;
  md += `| Line:Col | Severity | Rule | Message |\n|---:|---|---|---|\n`;
  for (const m of file.messages) {
    const sev = m.severity === 2 ? "error" : "warn";
    if (sev === "error") errCount++; else warnCount++;
    md += `| ${m.line ?? "-"}:${m.column ?? "-"} | ${sev} | ${m.ruleId ?? "-"} | ${m.message.replace(/\|/g, "\\|")} |\n`;
  }
  md += `\n`;
}
md = `# ESLint Report\n\n- Errors: **${errCount}**\n- Warnings: **${warnCount}**\n\n` + md;

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(output, md);
console.log(`Wrote ${output}`);
