import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadSagFormsFromPdfFiles } from "../src/lib/sag-pdf";

async function main() {
  const forms = await loadSagFormsFromPdfFiles();
  const outputPath = path.join(process.cwd(), "src", "lib", "sag-form-templates.generated.ts");
  const fileContents = `import type { SagFormDefinition } from "@/lib/sag-form-schema";

export const sagFormTemplates: SagFormDefinition[] = ${JSON.stringify(forms, null, 2)};
`;

  await writeFile(outputPath, fileContents, "utf8");
  console.log(`Generated ${forms.length} SAG template definitions at ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
