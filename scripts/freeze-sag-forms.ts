import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadSagFormDefinitions } from "../src/lib/sag-forms";

async function main() {
  const forms = await loadSagFormDefinitions();
  const outputPath = path.join(process.cwd(), "src", "lib", "sag-form-templates.generated.ts");
  const fileContents = `import type { SagFormDefinition } from "@/lib/sag-form-schema";

export const sagFormTemplates: SagFormDefinition[] = ${JSON.stringify(forms, null, 2)};
`;

  await writeFile(outputPath, fileContents, "utf8");
  console.log(`Frozen ${forms.length} SAG form definitions at ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
