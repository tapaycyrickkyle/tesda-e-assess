export function buildApplicationSubmissionPdfUrl(submissionId: string, options?: { download?: boolean }) {
  const baseUrl = `/api/application-submissions/${submissionId}/pdf`;
  return options?.download ? `${baseUrl}?download=1` : baseUrl;
}
