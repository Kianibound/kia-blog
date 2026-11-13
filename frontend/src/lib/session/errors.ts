/** Session errors never carry token or secret values. */
export class SessionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionConfigError";
  }
}

export class SessionStoreUnavailableError extends Error {
  constructor(message = "Session store is unavailable.") {
    super(message);
    this.name = "SessionStoreUnavailableError";
  }
}

export class AuthenticationUnavailableError extends Error {
  constructor(message = "Authentication service is unavailable.") {
    super(message);
    this.name = "AuthenticationUnavailableError";
  }
}

export class UnauthenticatedError extends Error {
  constructor(message = "Session is not authenticated.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class CsrfError extends Error {
  constructor(message = "Request rejected for CSRF safety.") {
    super(message);
    this.name = "CsrfError";
  }
}
