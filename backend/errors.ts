export type RiotOperation =
  | "account"
  | "ranked"
  | "match-list"
  | "match-detail"
  | "leaderboard";

export class RiotApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly operation: RiotOperation,
    public readonly retryAfter: string | null
  ) {
    super(`Riot API responded with ${status} during ${operation}`);
    this.name = "RiotApiError";
  }
}

export class RiotPayloadError extends Error {
  constructor(
    public readonly operation: RiotOperation,
    message: string
  ) {
    super(`Invalid Riot API response during ${operation}: ${message}`);
    this.name = "RiotPayloadError";
  }
}

export class RiotNetworkError extends Error {
  constructor(
    public readonly operation: RiotOperation,
    options?: ErrorOptions
  ) {
    super(`Could not reach Riot API during ${operation}`, options);
    this.name = "RiotNetworkError";
  }
}
