import fs from "node:fs";
fs.rmSync("reports", { recursive: true, force: true });
fs.mkdirSync("reports", { recursive: true });
console.log("[lint:report] cleaned reports/");
