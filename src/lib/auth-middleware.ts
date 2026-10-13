import { AuthService } from "@/services/auth.service";
import { ApiError } from "@/lib/api-response";

export interface AuthenticatedUser {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  status: string;
  coinBalance: number;
  roles: string[];
  permissions: string[];
}

/**
 * Extract session token from Authorization header or cookie
 */
export function extractSessionToken(req: Request): string | null {
  // 1. Try Bearer token in Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // 2. Try cookie (cpc_session)
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [k, ...v] = c.split("=");
        return [k, v.join("=")];
      })
    );
    if (cookies["cpc_session"]) {
      return cookies["cpc_session"];
    }
  }

  return null;
}

/**
 * Get the currently authenticated user or return null if unauthenticated
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthenticatedUser | null> {
  const token = extractSessionToken(req);
  if (!token) return null;

  try {
    const user = await AuthService.validateSession(token);
    if (!user) return null;

    if (user.status === "BANNED") {
      throw new ApiError(403, "Account is permanently banned.", "ACCOUNT_BANNED");
    }

    return user;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return null;
  }
}

/**
 * Enforce that the request is authenticated with an active account
 */
export async function requireAuth(req: Request): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    throw new ApiError(401, "Authentication required. Please sign in.", "UNAUTHORIZED");
  }

  if (user.status === "SUSPENDED") {
    throw new ApiError(403, "Your account is temporarily suspended. Transactions are restricted.", "ACCOUNT_SUSPENDED");
  }

  return user;
}

/**
 * Enforce that the authenticated user possesses at least one of the allowed roles
 */
export async function requireRole(req: Request, allowedRoles: string[]): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);

  const hasRole = user.roles.some((r) => allowedRoles.includes(r) || r === "SUPER_ADMIN");
  if (!hasRole) {
    throw new ApiError(403, `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]`, "FORBIDDEN");
  }

  return user;
}

/**
 * Enforce that the authenticated user possesses a specific permission string
 */
export async function requirePermission(req: Request, permission: string): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);

  // Super admin has all permissions
  if (user.roles.includes("SUPER_ADMIN")) {
    return user;
  }

  if (!user.permissions.includes(permission)) {
    throw new ApiError(403, `Permission denied: ${permission}`, "FORBIDDEN");
  }

  return user;
}
