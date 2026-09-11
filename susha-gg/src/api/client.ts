import { z } from "zod";

import { apiErrorSchema } from "./contracts";

export async function fetchApi<T>(
  url: string,
  responseSchema: z.ZodType<T>
): Promise<T> {
  const response = await fetch(url);

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? "The server returned an invalid response"
        : `Request failed with status ${response.status}`
    );
  }

  if (!response.ok) {
    const errorResult = apiErrorSchema.safeParse(payload);
    throw new Error(
      errorResult.success
        ? errorResult.data.error
        : `Request failed with status ${response.status}`
    );
  }

  const result = responseSchema.safeParse(payload);

  if (!result.success) {
    console.error("Invalid API response:", z.prettifyError(result.error));
    throw new Error("The server returned an unexpected response");
  }

  return result.data;
}
