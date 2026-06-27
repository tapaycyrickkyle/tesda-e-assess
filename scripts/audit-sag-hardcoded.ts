import { readFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadSagFormsFromPdfFiles } from "../src/lib/sag-pdf";
import { createSagLookupKey, type SagFormDefinition } from "../src/lib/sag-form-schema";
import { sagFormTemplates as hardcodedForms } from "../src/lib/sag-form-templates.generated";

const execFileAsync = promisify(execFile);

type ComparedForm = {
  hardcodedCount: number;
  hardcodedOnly: string[];
  key: string;
  matchesEitherParserExactly: boolean;
  questionUnionCoverage: number;
  structuredCount: number;
  structuredOnly: string[];
  textCount: number;
  textOnly: string[];
  title: string;
};

async function loadGeneratedFormsFromFile(filePath: string): Promise<SagFormDefinition[]> {
  const contents = await readFile(filePath, "utf8");
  const match = contents.match(/export const sagFormTemplates: SagFormDefinition\[] = ([\s\S]*);\s*$/);

  if (!match?.[1]) {
    throw new Error(`Unable to parse generated forms from ${filePath}`);
  }

  return JSON.parse(match[1]) as SagFormDefinition[];
}

async function ensureTextParsedFormsFile(filePath: string) {
  try {
    await readFile(filePath, "utf8");
    return;
  } catch {
    await execFileAsync("cmd", [
      "/c",
      `set SAG_TEMPLATE_OUTPUT=${filePath.replace(/\//g, "\\")} && node scripts\\generate-sag-templates.cjs`,
    ], {
      cwd: process.cwd(),
    });
  }
}

function normalizeQuestion(text: string) {
  return String(text ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Å“|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â|Ã¢â‚¬Å“|Ã¢â‚¬Â|Ã¢â‚¬Âœ|Ã¢â‚¬Â/g, '"')
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢|ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“|Ã¢â‚¬â„¢|Ã¢â‚¬Ëœ/g, "'")
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“|ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â|Ã¢â‚¬â€œ|Ã¢â‚¬â€/g, "-")
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦|Ã¢â‚¬Â¦/g, "...")
    .replace(/ÃƒÆ’Ã‚Â±|ÃƒÂ±/g, "n")
    .trim()
    .toLowerCase();
}

function flattenQuestions(form: SagFormDefinition | undefined) {
  return (form?.units ?? []).flatMap((unit) => unit.questions.map((question) => question.text));
}

function compareAgainstSources(
  title: string,
  hardcodedForm: SagFormDefinition | undefined,
  structuredForm: SagFormDefinition | undefined,
  textForm: SagFormDefinition | undefined,
): ComparedForm {
  const key = createSagLookupKey(title);
  const hardcodedQuestions = flattenQuestions(hardcodedForm);
  const structuredQuestions = flattenQuestions(structuredForm);
  const textQuestions = flattenQuestions(textForm);

  const hardcodedSet = new Set(hardcodedQuestions.map(normalizeQuestion));
  const structuredSet = new Set(structuredQuestions.map(normalizeQuestion));
  const textSet = new Set(textQuestions.map(normalizeQuestion));
  const unionSet = new Set([...structuredSet, ...textSet]);

  const hardcodedOnly = hardcodedQuestions.filter((question) => {
    const normalized = normalizeQuestion(question);
    return !structuredSet.has(normalized) && !textSet.has(normalized);
  });

  const structuredOnly = structuredQuestions.filter((question) => {
    const normalized = normalizeQuestion(question);
    return !hardcodedSet.has(normalized);
  });

  const textOnly = textQuestions.filter((question) => {
    const normalized = normalizeQuestion(question);
    return !hardcodedSet.has(normalized);
  });

  const matchesStructuredExactly =
    hardcodedSet.size === structuredSet.size &&
    [...hardcodedSet].every((question) => structuredSet.has(question));

  const matchesTextExactly =
    hardcodedSet.size === textSet.size &&
    [...hardcodedSet].every((question) => textSet.has(question));

  return {
    hardcodedCount: hardcodedQuestions.length,
    hardcodedOnly,
    key,
    matchesEitherParserExactly: matchesStructuredExactly || matchesTextExactly,
    questionUnionCoverage: unionSet.size === 0 ? 100 : Math.round(([...hardcodedSet].filter((question) => unionSet.has(question)).length / unionSet.size) * 100),
    structuredCount: structuredQuestions.length,
    structuredOnly,
    textCount: textQuestions.length,
    textOnly,
    title,
  };
}

async function main() {
  const structuredForms = await loadSagFormsFromPdfFiles();
  const textParsedFormsPath = path.join(process.cwd(), "tmp", "sag-form-templates.text.generated.ts");
  await ensureTextParsedFormsFile(textParsedFormsPath);
  const textParsedForms = await loadGeneratedFormsFromFile(textParsedFormsPath);

  const hardcodedMap = new Map(hardcodedForms.map((form) => [createSagLookupKey(form.qualificationTitle), form]));
  const structuredMap = new Map(structuredForms.map((form) => [createSagLookupKey(form.qualificationTitle), form]));
  const textMap = new Map(textParsedForms.map((form) => [createSagLookupKey(form.qualificationTitle), form]));

  const keys = new Set([...hardcodedMap.keys(), ...structuredMap.keys(), ...textMap.keys()]);
  const compared = Array.from(keys)
    .map((key) => {
      const hardcodedForm = hardcodedMap.get(key);
      const structuredForm = structuredMap.get(key);
      const textForm = textMap.get(key);
      const title = hardcodedForm?.qualificationTitle ?? structuredForm?.qualificationTitle ?? textForm?.qualificationTitle ?? key;

      return compareAgainstSources(title, hardcodedForm, structuredForm, textForm);
    })
    .sort((left, right) => left.title.localeCompare(right.title));

  const mismatches = compared.filter(
    (form) =>
      !form.matchesEitherParserExactly ||
      form.hardcodedOnly.length > 0 ||
      form.structuredOnly.length > 0 ||
      form.textOnly.length > 0,
  );

  console.log(
    JSON.stringify(
      {
        exactMatches: compared.length - mismatches.length,
        mismatches: mismatches.map((form) => ({
          hardcodedCount: form.hardcodedCount,
          hardcodedOnly: form.hardcodedOnly.slice(0, 10),
          questionUnionCoverage: form.questionUnionCoverage,
          structuredCount: form.structuredCount,
          structuredOnly: form.structuredOnly.slice(0, 10),
          textCount: form.textCount,
          textOnly: form.textOnly.slice(0, 10),
          title: form.title,
        })),
        totalForms: compared.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
