/**
 * Routing utility for handling redirects that respect the app's base path
 * This ensures all redirects use the correct base path: /svasthya/admin-side/
 */

const BASE_PATH = import.meta.env.VITE_APP_BASE_PATH || "/svasthya/admin-side";
const BASE_URL = import.meta.env.VITE_APP_BASE_URL || "http://localhost:8080/svasthya/admin-side";

/**
 * Convert a relative path to a full URL with the correct base path
 * @param path - Relative path (e.g., "/login", "/reset-password")
 * @returns Full URL with base path (e.g., "/svasthya/admin-side/login")
 */
export function getFullPath(path: string): string {
  if (path.startsWith("/svasthya/admin-side")) {
    return path; // Already has base path
  }
  if (path === "/") {
    return BASE_PATH;
  }
  return `${BASE_PATH}${path}`;
}

/**
 * Get the full application URL with base path
 * Useful for email links and external redirects
 * @returns Full URL (e.g., "http://localhost:8080/svasthya/admin-side")
 */
export function getFullAppURL(): string {
  return BASE_URL;
}

/**
 * Redirect to a path using window.location.href (full page reload)
 * Automatically adds the base path
 * @param path - Relative path to redirect to
 */
export function redirectTo(path: string): void {
  window.location.href = getFullPath(path);
}

/**
 * Get the reset password link for email templates
 * Backend should use this to generate email links
 * @param token - Reset token from backend
 * @returns Full URL to reset password page with token
 */
export function getResetPasswordLink(token: string): string {
  return `${BASE_URL}/reset-password?token=${token}`;
}

/**
 * Export for use in backend environment setup
 * Add this to backend configuration for email templates
 */
export const REDIRECT_CONFIG = {
  basePath: BASE_PATH,
  baseUrl: BASE_URL,
  resetPasswordPath: "/reset-password",
  loginPath: "/login",
  forgotPasswordPath: "/forgot-password",
};

export default {
  getFullPath,
  getFullAppURL,
  redirectTo,
  getResetPasswordLink,
  REDIRECT_CONFIG,
};
