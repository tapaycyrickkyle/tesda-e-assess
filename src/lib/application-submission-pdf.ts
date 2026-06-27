export type SubmissionPdfDocument = "application" | "sag";

export function buildApplicationSubmissionPdfUrl(
  submissionId: string,
  options?: { document?: SubmissionPdfDocument; download?: boolean },
) {
  const baseUrl = `/api/application-submissions/${submissionId}/pdf`;
  const searchParams = new URLSearchParams();

  if (options?.document && options.document !== "application") {
    searchParams.set("document", options.document);
  }

  if (options?.download) {
    searchParams.set("download", "1");
  }

  const query = searchParams.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}
