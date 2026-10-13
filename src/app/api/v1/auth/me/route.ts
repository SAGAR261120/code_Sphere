import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { ApiResponse, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
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

    if (!fullUser) {
      return ApiResponse.error("User not found", "USER_NOT_FOUND", 404);
    }

    return ApiResponse.success({
      id: fullUser.id,
      email: fullUser.email,
      status: fullUser.status,
      profile: fullUser.profile,
      wallet: {
        availableBalance: fullUser.wallet?.availableBalance ?? 0,
        totalEarned: fullUser.wallet?.totalEarned ?? 0,
        totalSpent: fullUser.wallet?.totalSpent ?? 0,
      },
      roles: fullUser.userRoles.map((ur) => ur.role.slug),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
