const MIN_COOKIE_PASSWORD_LENGTH = 32;

export type WorkosConfig = {
  apiKey: string;
  clientId: string;
  cookiePassword: string;
  redirectUri: string;
};

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function assertAbsoluteHttpUrl(value: string, name: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} must use http or https.`);
  }

  return url.toString();
}

export function isWorkosConfigured(): boolean {
  try {
    getWorkosConfig();
    return true;
  } catch {
    return false;
  }
}

export function getWorkosConfig(): WorkosConfig {
  const apiKey = readEnv("WORKOS_API_KEY");
  const clientId = readEnv("WORKOS_CLIENT_ID");
  const cookiePassword = readEnv("WORKOS_COOKIE_PASSWORD");
  const redirectUri = readEnv("NEXT_PUBLIC_WORKOS_REDIRECT_URI");

  if (!apiKey) {
    throw new Error("WORKOS_API_KEY is required.");
  }

  if (!clientId) {
    throw new Error("WORKOS_CLIENT_ID is required.");
  }

  if (!cookiePassword) {
    throw new Error("WORKOS_COOKIE_PASSWORD is required.");
  }

  if (cookiePassword.length < MIN_COOKIE_PASSWORD_LENGTH) {
    throw new Error(`WORKOS_COOKIE_PASSWORD must be at least ${MIN_COOKIE_PASSWORD_LENGTH} characters long.`);
  }

  if (!redirectUri) {
    throw new Error("NEXT_PUBLIC_WORKOS_REDIRECT_URI is required.");
  }

  return {
    apiKey,
    clientId,
    cookiePassword,
    redirectUri: assertAbsoluteHttpUrl(redirectUri, "NEXT_PUBLIC_WORKOS_REDIRECT_URI")
  };
}

export function getWorkosCallbackPath(): string {
  const { pathname } = new URL(getWorkosConfig().redirectUri);

  if (!pathname.startsWith("/")) {
    throw new Error("NEXT_PUBLIC_WORKOS_REDIRECT_URI must include an absolute callback path.");
  }

  return pathname;
}
