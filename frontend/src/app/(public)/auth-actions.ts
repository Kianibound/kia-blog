"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loadAppOrigin, loadApiBaseUrl } from "@/lib/session/config";
import {
  createBrowserSession,
  handleLogoutMutation,
} from "@/lib/session/server";
import { loginWithNest, registerWithNest } from "@/lib/auth/nest-auth";
import { loadAuthCsrfSecret } from "@/lib/auth/csrf-token";
import { executeLogin, executeRegister } from "@/lib/auth/action-flow";
import {
  authFailureMessage,
  type AuthFormState,
} from "@/lib/auth/form-state";

function readField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  let result: Awaited<ReturnType<typeof executeLogin>>;
  try {
    const requestHeaders = await headers();
    result = await executeLogin(
      {
        email: readField(formData, "email"),
        password: readField(formData, "password"),
        next: formData.get("next"),
        csrfToken: formData.get("csrfToken"),
        origin: requestHeaders.get("origin"),
      },
      {
        expectedOrigin: loadAppOrigin(),
        csrfSecret: loadAuthCsrfSecret(),
        loginNest: (credentials) =>
          loginWithNest(credentials, { apiBaseUrl: loadApiBaseUrl() }),
        createSession: createBrowserSession,
      },
    );
  } catch {
    return {
      status: "error",
      message: authFailureMessage("unavailable", "login"),
    };
  }

  if (result.status !== "success") return result;
  redirect(result.redirectTo);
}

export async function registerAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  let result: Awaited<ReturnType<typeof executeRegister>>;
  try {
    const requestHeaders = await headers();
    result = await executeRegister(
      {
        email: readField(formData, "email"),
        password: readField(formData, "password"),
        confirmPassword: readField(formData, "confirmPassword"),
        csrfToken: formData.get("csrfToken"),
        origin: requestHeaders.get("origin"),
      },
      {
        expectedOrigin: loadAppOrigin(),
        csrfSecret: loadAuthCsrfSecret(),
        registerNest: (credentials) =>
          registerWithNest(credentials, { apiBaseUrl: loadApiBaseUrl() }),
      },
    );
  } catch {
    return {
      status: "error",
      message: authFailureMessage("unavailable", "register"),
    };
  }

  if (result.status === "error") return result;
  redirect("/login?registered=1");
}

export async function logoutAction(formData: FormData): Promise<void> {
  const requestHeaders = await headers();
  const request = new Request("http://session.internal/logout", {
    method: "POST",
    headers: {
      origin: requestHeaders.get("origin") ?? "",
      "x-csrf-token": readField(formData, "csrfToken"),
    },
  });

  let failed = false;
  try {
    await handleLogoutMutation(request);
  } catch {
    failed = true;
  }
  redirect(failed ? "/login?logout=error" : "/login?loggedOut=1");
}
