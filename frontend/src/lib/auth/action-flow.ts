import {
  AuthRequestError,
  type AuthenticatedUser,
  type LoginResult,
  type RegisterResult,
} from "./nest-auth.ts";
import {
  authFailureMessage,
  validateEmailValue,
  type AuthFormState,
} from "./form-state.ts";
import { assertTrustedMutation } from "./action-guard.ts";
import { safeRedirectPath } from "../session/csrf.ts";
import { CsrfError } from "../session/errors.ts";
import {
  validatePasswordCharacters,
  validateRegistrationPasswords,
} from "../registration-validation.ts";

export type LoginSuccess = {
  status: "success";
  redirectTo: string;
  user: AuthenticatedUser;
};

export type LoginDeps = {
  expectedOrigin: string;
  csrfSecret: Buffer;
  loginNest(credentials: {
    email: string;
    password: string;
  }): Promise<LoginResult>;
  createSession(tokens: {
    accessToken: string;
    refreshToken: string;
  }): Promise<unknown>;
  now?: number;
};

export type RegisterDeps = {
  expectedOrigin: string;
  csrfSecret: Buffer;
  registerNest(credentials: {
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<RegisterResult>;
  now?: number;
};

function rejected(
  error: unknown,
  operation: "login" | "register",
): AuthFormState {
  if (error instanceof CsrfError)
    return {
      status: "error",
      message: "درخواست از منبع معتبر ارسال نشد. صفحه را دوباره بارگذاری کنید.",
    };
  if (error instanceof AuthRequestError)
    return {
      status: "error",
      message: authFailureMessage(error.kind, operation),
    };
  return {
    status: "error",
    message: authFailureMessage("unavailable", operation),
  };
}

export async function executeLogin(
  input: {
    email: string;
    password: string;
    next: unknown;
    csrfToken: unknown;
    origin: string | null;
  },
  deps: LoginDeps,
): Promise<LoginSuccess | AuthFormState> {
  const email = input.email.trim();
  const emailError = validateEmailValue(email);
  const passwordError = validatePasswordCharacters(input.password);
  if (emailError || passwordError)
    return {
      status: "error",
      message: emailError || passwordError,
      field: emailError ? "email" : "password",
    };

  try {
    assertTrustedMutation({
      origin: input.origin,
      expectedOrigin: deps.expectedOrigin,
      csrfToken: input.csrfToken,
      csrfSecret: deps.csrfSecret,
      now: deps.now,
    });
  } catch (error) {
    return rejected(error, "login");
  }

  let result: LoginResult;
  try {
    result = await deps.loginNest({ email, password: input.password });
  } catch (error) {
    return rejected(error, "login");
  }

  try {
    // A session store failure is not an authentication verdict: Nest already
    // issued credentials, but no browser session exists yet.
    await deps.createSession({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch {
    return {
      status: "error",
      message: authFailureMessage("uncertain", "login"),
    };
  }

  return {
    status: "success",
    redirectTo: safeRedirectPath(input.next, "/"),
    user: result.user,
  };
}

export async function executeRegister(
  input: {
    email: string;
    password: string;
    confirmPassword: string;
    csrfToken: unknown;
    origin: string | null;
  },
  deps: RegisterDeps,
): Promise<AuthFormState | { status: "registered" }> {
  const email = input.email.trim();
  const emailError = validateEmailValue(email);
  const passwords = validateRegistrationPasswords(
    input.password,
    input.confirmPassword,
  );
  if (emailError || passwords.password || passwords.confirmPassword)
    return {
      status: "error",
      message: emailError || passwords.password || passwords.confirmPassword,
      field: emailError
        ? "email"
        : passwords.password
          ? "password"
          : "confirmPassword",
    };

  try {
    assertTrustedMutation({
      origin: input.origin,
      expectedOrigin: deps.expectedOrigin,
      csrfToken: input.csrfToken,
      csrfSecret: deps.csrfSecret,
      now: deps.now,
    });
  } catch (error) {
    return rejected(error, "register");
  }

  try {
    const result = await deps.registerNest({
      email,
      password: input.password,
      confirmPassword: input.confirmPassword,
    });
    if (result.user.role !== "USER")
      return {
        status: "error",
        message: authFailureMessage("protocol", "register"),
      };
  } catch (error) {
    return rejected(error, "register");
  }

  return { status: "registered" };
}
