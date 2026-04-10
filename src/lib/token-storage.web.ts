const TOKEN_KEY = 'auth_token';

export async function getToken(): Promise<string | null> {
  return localStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  localStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  localStorage.removeItem(TOKEN_KEY);
}
