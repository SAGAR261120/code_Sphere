import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { UserQueryInput } from "@/lib/validations/user.schema";
import { AccountStatus, RoleType, Prisma } from "@prisma/client";

export class AdminUserService {
  /**
   * Search, filter, and paginate users for administrator dashboard
   */
  static async listUsers(query: UserQueryInput) {
    const { page, limit, search, status, role, sort } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(status && { status }),
      ...(role && {
        userRoles: {
          some: {
            role: { slug: role },
          },
        },
      }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { profile: { username: { contains: search, mode: "insensitive" } } },
          { profile: { displayName: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "OLDEST") orderBy = { createdAt: "asc" };
    if (sort === "COINS_HIGH") orderBy = { wallet: { availableBalance: "desc" } };
    if (sort === "COINS_LOW") orderBy = { wallet: { availableBalance: "asc" } };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          status: true,
          isEmailVerified: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          lastLoginAt: true,
          createdAt: true,
          profile: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          wallet: {
            select: {
              availableBalance: true,
              totalEarned: true,
              totalSpent: true,
            },
          },
          userRoles: {
            select: {
              role: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              orders: true,
              entitlements: true,
              taskAttempts: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        ...u,
        roles: u.userRoles.map((ur) => ur.role.slug),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Inspect detailed user record including ledger, purchases, entitlements, and sessions
   */
  static async getUserDetails(targetUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        profile: true,
        wallet: true,
        userRoles: {
          include: { role: true },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: { product: true },
            },
          },
        },
        entitlements: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { product: true },
        },
        taskAttempts: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { task: true },
        },
        sessions: {
          where: { expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        coinTransactions: {
          take: 15,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "Target user not found", "USER_NOT_FOUND");
    }

    // Exclude password hashes and sensitive tokens
    const { passwordHash, passwordResetToken, emailVerifyToken, ...sanitized } = user;

    return sanitized;
  }

  /**
   * Suspend or reactivate user accounts with mandatory audit record
   */
  static async setUserStatus(
    adminId: string,
    targetUserId: string,
    status: AccountStatus,
    reason: string,
    ipAddress?: string
  ) {
    if (adminId === targetUserId) {
      throw new ApiError(400, "Administrators cannot alter their own account status", "SELF_ACTION_DENIED");
    }

    const targetUser = await prisma.user.findUniqueOrThrow({
      where: { id: targetUserId },
    });

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: {
          status,
          ...(status === "ACTIVE" ? { failedLoginAttempts: 0, lockedUntil: null } : {}),
        },
      });

      // Revoke all sessions if suspended or banned
      if (status === "SUSPENDED" || status === "BANNED") {
        await tx.session.deleteMany({
          where: { userId: targetUserId },
        });
      }

      await tx.auditLog.create({
        data: {
          adminId,
          action: `USER_STATUS_${status}`,
          targetType: "User",
          targetId: targetUserId,
          reason,
          ipAddress,
          metadata: {
            beforeStatus: targetUser.status,
            afterStatus: status,
          },
        },
      });

      return u;
    });

    return {
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        status: updated.status,
      },
    };
  }

  /**
   * Update user roles with audit trail
   */
  static async setUserRole(
    adminId: string,
    targetUserId: string,
    roleSlug: RoleType,
    reason: string,
    ipAddress?: string
  ) {
    const role = await prisma.role.findUnique({
      where: { slug: roleSlug },
    });

    if (!role) {
      throw new ApiError(404, `Role '${roleSlug}' not found in role matrix`, "ROLE_NOT_FOUND");
    }

    await prisma.$transaction(async (tx) => {
      // Remove previous roles
      await tx.userRole.deleteMany({
        where: { userId: targetUserId },
      });

      // Assign new role
      await tx.userRole.create({
        data: {
          userId: targetUserId,
          roleId: role.id,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId,
          action: "USER_ROLE_ASSIGNED",
          targetType: "User",
          targetId: targetUserId,
          reason,
          ipAddress,
          metadata: { newRole: roleSlug },
        },
      });
    });

    return { success: true, message: `Role updated to ${roleSlug}` };
  }

  /**
   * Surface suspicious activities (lockouts, multiple failed logins, anti-fraud flags)
   */
  static async getSuspiciousActivity(page = 1, limit = 20) {
    const [lockedUsers, fraudAttempts] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { failedLoginAttempts: { gte: 3 } },
            { lockedUntil: { gt: new Date() } },
          ],
        },
        select: {
          id: true,
          email: true,
          status: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          profile: {
            select: { username: true, displayName: true },
          },
        },
        take: limit,
      }),
      prisma.taskAttempt.findMany({
        where: {
          OR: [
            { status: "FLAGGED_FRAUD" },
            { fraudFlags: { isEmpty: false } },
          ],
        },
        include: {
          user: {
            select: { id: true, email: true, profile: { select: { username: true } } },
          },
          task: {
            select: { title: true, rewardCoins: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    return {
      lockedUsers,
      fraudAttempts,
    };
  }
}
