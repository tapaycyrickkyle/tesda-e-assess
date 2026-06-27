import { loadSagFormsFromPdfFiles } from "../src/lib/sag-pdf";

function isSuspiciousQuestion(text: string) {
  const normalized = text.trim();

  if (!normalized) {
    return true;
  }

  if (
    /^instruction:?$/i.test(normalized) ||
    /^can i\??$/i.test(normalized) ||
    /^am i aware$/i.test(normalized) ||
    /^yes$/i.test(normalized) ||
    /^no$/i.test(normalized) ||
    /^[A-Z0-9 ,/&()'".-]{18,}$/.test(normalized) ||
    /^(and|or|with|without|to|of|for|from|in|on|as|according|based|following|using|required|industry|current|established|standard|assessment|being)\b/i.test(
      normalized,
    ) ||
    (normalized.split(/\s+/).length <= 2 && !/[?*.:]$/.test(normalized))
  ) {
    return true;
  }

  return false;
}

async function main() {
  const forms = await loadSagFormsFromPdfFiles();
  const summary = forms.map((form) => ({
    questions: form.units.flatMap((unit) => unit.questions).length,
    title: form.qualificationTitle,
    units: form.units.length,
  }));

  const suspicious = forms
    .map((form) => {
      const flaggedQuestions = form.units.flatMap((unit) =>
        unit.questions
          .filter((question) => isSuspiciousQuestion(question.text))
          .map((question) => ({
            text: question.text,
            unit: unit.title,
          })),
      );

      return {
        questionCount: form.units.flatMap((unit) => unit.questions).length,
        suspicious: flaggedQuestions,
        title: form.qualificationTitle,
        unitCount: form.units.length,
      };
    })
    .filter((form) => form.suspicious.length > 0);

  console.log(
    JSON.stringify(
      {
        forms: summary,
        suspicious,
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
