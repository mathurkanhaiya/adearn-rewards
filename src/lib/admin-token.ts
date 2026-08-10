const KEY = "ar_admin_token";
const EXP = "ar_admin_token_exp";

export function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  const token = window.sessionStorage.getItem(KEY) ?? "";
  const exp = Number(window.sessionStorage.getItem(EXP) ?? 0);
  if (!token || !exp || exp < Date.now()) {
    clearAdminToken();
    return "";
  }
  return token;
}

export function setAdminToken(token: string, expiresAt: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, token);
  window.sessionStorage.setItem(EXP, String(new Date(expiresAt).getTime()));
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
  window.sessionStorage.removeItem(EXP);
}
