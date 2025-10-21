import fs from "fs";
import path from "path";

const lineagePath = path.join(process.cwd(), "proof", "lineage.json");
const lineage = JSON.parse(fs.readFileSync(lineagePath, "utf8"));

lineage.push({
  gate: "G19.1",
  proof: "proof/v19_1_frontend_certification.json",
  sealed_at: new Date().toISOString(),
});

fs.writeFileSync(lineagePath, JSON.stringify(lineage, null, 2));

