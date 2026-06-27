export type SagAnswerValue = "" | "no" | "yes";

export type SagQuestionDefinition = {
  id: string;
  text: string;
};

export type SagUnitDefinition = {
  id: string;
  questions: SagQuestionDefinition[];
  title: string;
};

export type SagFormDefinition = {
  agreementText: string;
  candidateFieldLabel?: string | null;
  instructionLines: string[];
  qualificationTitle: string;
  shouldAutofillCandidateName?: boolean;
  title: string;
  units: SagUnitDefinition[];
};

function normalizeWhitespace(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function createSagLookupKey(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/^sag\s*-\s*/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9() ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSagProgramTitle(fileName: string) {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/_/g, " ")
    .replace(/^SAG\s*-\s*/i, "SAG-")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSagFormDefinition(forms: SagFormDefinition[], qualificationTitle: string) {
  const lookupKey = createSagLookupKey(qualificationTitle);

  return forms.find((form) => {
    const formKey = createSagLookupKey(form.qualificationTitle);
    const unprefixedFormKey = formKey.replace(/^sag\s+/, "");
    const unprefixedLookupKey = lookupKey.replace(/^sag\s+/, "");

    return formKey === lookupKey || unprefixedFormKey === unprefixedLookupKey;
  }) ?? null;
}
