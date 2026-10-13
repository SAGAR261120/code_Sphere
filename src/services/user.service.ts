import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { UpdateProfileInput } from "@/lib/validations/user.schema";

export class UserService {
  /**
   * Retrieve full user profile and wallet balances (sanitized)
   */
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        wallet: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profile: user.profile,
      wallet: {
        availableBalance: user.wallet?.availableBalance ?? 0,
        totalEarned: user.wallet?.totalEarned ?? 0,
        totalSpent: user.wallet?.totalSpent ?? 0,
      },
      roles: user.userRoles.map((ur) => ur.role.slug),
    };
  }

  /**
   * Update public developer profile
   */
  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const profile = await prisma.userProfile.update({
      where: { userId },
      data: {
        displayName: input.displayName,
        bio: input.bio,
        avatarUrl: input.avatarUrl || null,
        website: input.website || null,
        githubUrl: input.githubUrl || null,
        twitterUrl: input.twitterUrl || null,
      },
    });

    return profile;
  }

  /**
   * Retrieve aggregated activity timeline (orders, task completions, coin transactions)
   */
  static async getUserActivity(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [transactions, orders, taskAttempts] = await Promise.all([
      prisma.coinTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.taskAttempt.findMany({
        where: { userId },
        include: { task: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    // Unify activities into chronological timeline
    const activities = [
      ...transactions.map((tx) => ({
        id: tx.id,
        type: "TRANSACTION",
        title: tx.description,
        amount: tx.amount,
        balanceAfter: tx.balanceAfter,
        timestamp: tx.createdAt,
      })),
      ...orders.map((o) => ({
        id: o.id,
        type: "ORDER",
        title: `Purchased order #${o.orderNumber}`,
        totalCoins: o.totalCoins,
        status: o.status,
        timestamp: o.createdAt,
      })),
      ...taskAttempts.map((ta) => ({
        id: ta.id,
        type: "TASK",
        title: `Task attempt: ${ta.task.title}`,
        status: ta.status,
        rewardCoins: ta.task.rewardCoins,
        timestamp: ta.createdAt,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(skip, skip + limit);

    return {
      activities,
      pagination: {
        page,
        limit,
        total: activities.length,
        totalPages: Math.ceil(activities.length / limit) || 1,
      },
    };
  }

  /**
   * Request account deletion: sets status to SUSPENDED, revokes sessions, and records audit trail
   */
  static async requestAccountDeletion(userId: string, reason?: string) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          status: "SUSPENDED",
        },
      }),
      prisma.session.deleteMany({
        where: { userId },
      }),
      prisma.auditLog.create({
        data: {
          adminId: userId, // User initiated
          action: "ACCOUNT_DELETION_REQUEST",
          targetType: "User",
          targetId: userId,
          reason: reason || "User initiated account termination request",
        },
      }),
    ]);

    return {
      success: true,
      message: "Account deletion request received. Your account has been suspended and sessions terminated.",
    };
  }
}
