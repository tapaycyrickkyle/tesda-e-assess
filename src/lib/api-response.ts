type ApiFailurePayload = {
  message?: string;
  success?: boolean;
};

function extractHtmlTitle(value: string) {
  const match = value.match(/<title>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

export async function parseApiResponse<T extends object>(
  response: Response,
): Promise<T & ApiFailurePayload> {
  const rawBody = await response.text();

  if (!rawBody.trim()) {
    return {} as T & ApiFailurePayload;
  }

  try {
    return JSON.parse(rawBody) as T & ApiFailurePayload;
  } catch {
    const statusMessage =
      response.status >= 500
        ? "The server returned an unexpected response. Please try again."
        : "The request could not be completed. Please sign in again and retry.";
    const htmlTitle = extractHtmlTitle(rawBody);

    return {
      message: htmlTitle || statusMessage,
      success: false,
    } as T & ApiFailurePayload;
  }
}
