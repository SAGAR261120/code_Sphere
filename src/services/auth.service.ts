import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { RegisterInput, LoginInput } from "@/lib/validations/auth.schema";

export class AuthService {
  /**
   * Register a new user account with initial wallet and profile
   */
  static async registerUser(input: RegisterInput) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw new ApiError(409, "An account with this email address already exists", "EMAIL_TAKEN");
    }

    const existingUsername = await prisma.userProfile.findUnique({
      where: { username: input.username },
    });
    if (existingUsername) {
      throw new ApiError(409, "Username is already taken by another developer", "USERNAME_TAKEN");
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // Get or create default USER role
    let userRole = await prisma.role.findUnique({
      where: { slug: "USER" },
    });
    if (!userRole) {
      userRole = await prisma.role.create({
        data: {
          name: "Developer User",
          slug: "USER",
          description: "Standard developer marketplace user",
          isSystem: true,
        },
      });
    }

    const welcomeBonusCoins = 50;

    // Execute atomic user creation
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          profile: {
            create: {
              username: input.username,
              displayName: input.displayName,
            },
          },
          wallet: {
            create: {
              availableBalance: welcomeBonusCoins,
              totalEarned: welcomeBonusCoins,
              totalSpent: 0,
            },
          },
          userRoles: {
            create: {
              roleId: userRole.id,
            },
          },
        },
        include: {
          profile: true,
          wallet: true,
        },
      });

      // Record welcome bonus transaction in financial ledger
      if (newUser.wallet) {
        await tx.coinTransaction.create({
          data: {
            walletId: newUser.wallet.id,
            userId: newUser.id,
            amount: welcomeBonusCoins,
            balanceAfter: welcomeBonusCoins,
            type: "PROMO_BONUS",
            description: "Welcome grant: 50 free CPC Coins",
            idempotencyKey: `welcome-${newUser.id}`,
            referenceId: newUser.id,
            referenceType: "User",
          },
        });
      }

      return newUser;
    });

    return {
      id: user.id,
      email: user.email,
      username: user.profile?.username,
      displayName: user.profile?.displayName,
      coinBalance: user.wallet?.availableBalance ?? 0,
      role: "USER",
    };
  }

  /**
   * Authenticate user with password comparison and lockout defense
   */
  static async loginUser(input: LoginInput, clientIp?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        profile: true,
        wallet: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password combination", "INVALID_CREDENTIALS");
    }

    if (user.status === "BANNED") {
      throw new ApiError(403, "This account has been permanently terminated.", "ACCOUNT_BANNED");
    }

    if (user.status === "SUSPENDED") {
      throw new ApiError(403, "This account is currently suspended. Please contact support.", "ACCOUNT_SUSPENDED");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ApiError(
        423,
        `Account temporarily locked due to consecutive failed attempts. Try again in ${minutesRemaining} minutes.`,
        "ACCOUNT_LOCKED"
      );
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);

    if (!isMatch) {
      const attempts = user.failedLoginAttempts + 1;
      const willLock = attempts >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          ...(willLock && {
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 min lock
          }),
        },
      });

      throw new ApiError(401, "Invalid email or password combination", "INVALID_CREDENTIALS");
    }

    // Reset failed login attempts and record session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      }),
      prisma.session.create({
        data: {
          userId: user.id,
          sessionToken,
          ipAddress: clientIp,
          userAgent,
          expiresAt,
        },
      }),
    ]);

    const primaryRole = user.userRoles[0]?.role?.slug || "USER";

    return {
      sessionToken,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        username: user.profile?.username,
        displayName: user.profile?.displayName,
        role: primaryRole,
        coinBalance: user.wallet?.availableBalance ?? 0,
      },
    };
  }

  /**
   * Validate session token from cookie or Authorization header
   */
  static async validateSession(sessionToken: string) {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            profile: true,
            wallet: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    const roles = session.user.userRoles.map((ur) => ur.role.slug);
    const permissions = session.user.userRoles.flatMap((ur) =>
      ur.role.permissions.map((rp) => `${rp.permission.action}:${rp.permission.subject}`)
    );

    return {
      id: session.user.id,
      email: session.user.email,
      username: session.user.profile?.username,
      displayName: session.user.profile?.displayName,
      status: session.user.status,
      coinBalance: session.user.wallet?.availableBalance ?? 0,
      roles,
      permissions: Array.from(new Set(permissions)),
    };
  }

  /**
   * Log out and invalidate session in database
   */
  static async logout(sessionToken: string) {
    if (!sessionToken) return;
    try {
      await prisma.session.delete({
        where: { sessionToken },
      });
    } catch {
      // Session already deleted or expired
    }
  }

  /**
   * Initiate forgot-password workflow (generates cryptographically secure token)
   */
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Timing-attack / enumeration mitigation: return success regardless
    if (!user || user.status === "BANNED") {
      return { success: true, message: "If that email is registered, password reset instructions have been sent." };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: expiresAt,
      },
    });

    return {
      success: true,
      message: "If that email is registered, password reset instructions have been sent.",
      resetToken, // Returned for dev testing; in production, sent via email
    };
  }

  /**
   * Complete password reset using token
   */
  static async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new ApiError(400, "Reset token is invalid or has expired", "INVALID_TOKEN");
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      // Revoke all existing sessions for security
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return { success: true, message: "Password updated successfully. Please sign in with your new credentials." };
  }

  /**
   * Change password for authenticated user with session revocation option
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    revokeOtherSessions = true,
    currentSessionToken?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(400, "Incorrect current password", "INCORRECT_PASSWORD");
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    if (revokeOtherSessions && currentSessionToken) {
      await prisma.session.deleteMany({
        where: {
          userId,
          sessionToken: { not: currentSessionToken },
        },
      });
    }

    return { success: true, message: "Password changed successfully" };
  }

  /**
   * Generate email verification token
   */
  static async verifyEmailRequest(userId: string) {
    const token = crypto.randomBytes(32).toString("hex");

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken: token },
    });

    return { token, message: "Verification token generated" };
  }

  /**
   * Confirm email address with token
   */
  static async confirmEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired verification token", "INVALID_TOKEN");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
      },
    });

    return { success: true, message: "Email address verified successfully" };
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserSessions(userId: string, currentSessionToken?: string) {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    return sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress || "Unknown IP",
      userAgent: s.userAgent || "Unknown Device",
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.sessionToken === currentSessionToken,
    }));
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new ApiError(404, "Session not found", "NOT_FOUND");
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return { success: true, message: "Session revoked successfully" };
  }

  /**
   * Revoke all other sessions
   */
  static async revokeAllOtherSessions(userId: string, currentSessionToken: string) {
    await prisma.session.deleteMany({
      where: {
        userId,
        sessionToken: { not: currentSessionToken },
      },
    });

    return { success: true, message: "All other sessions have been logged out" };
  }

  // Backwards-compatible aliases
  static async register(input: RegisterInput, clientIp?: string, userAgent?: string) {
    await this.registerUser(input);
    return this.loginUser({ email: input.email, password: input.password }, clientIp, userAgent);
  }

  static async login(input: LoginInput, clientIp?: string, userAgent?: string) {
    return this.loginUser(input, clientIp, userAgent);
  }
}
