import { prisma } from '@/lib/prisma';
import { RecommendationQueryInput } from '@/lib/validations/interaction.schema';

export interface RecommendedProduct {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  coinPrice: number;
  fiatPricePaise: number;
  isFree: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  thumbnailUrl: string | null;
  averageRating: number;
  reviewCount: number;
  totalSales: number;
  tags: string[];
  matchReason?: string;
}

export class RecommendationService {
  /**
   * Helper to format a product into standard RecommendedProduct output.
   */
  private static formatProduct(p: any, matchReason?: string): RecommendedProduct {
    const thumbnail = p.images?.find((img: any) => img.isThumbnail)?.url || p.images?.[0]?.url || null;
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      shortDescription: p.shortDescription,
      coinPrice: p.coinPrice,
      fiatPricePaise: p.fiatPricePaise,
      isFree: p.isFree,
      category: {
        id: p.category.id,
        name: p.category.name,
        slug: p.category.slug,
      },
      thumbnailUrl: thumbnail,
      averageRating: p.rating?.averageRating || 0,
      reviewCount: p.rating?.reviewCount || 0,
      totalSales: p.totalSales || 0,
      tags: p.tags || [],
      matchReason,
    };
  }

  /**
   * Fallback recommendations: highest rated and most popular published products.
   */
  static async getFallbackRecommendations(excludeIds: string[] = [], limit = 6): Promise<RecommendedProduct[]> {
    const products = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: excludeIds },
      },
      take: limit,
      orderBy: [
        { isFeatured: 'desc' },
        { totalSales: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        category: true,
        images: { orderBy: { displayOrder: 'asc' } },
        rating: true,
      },
    });

    return products.map((p) => this.formatProduct(p, 'Popular across marketplace'));
  }

  /**
   * Product-detail recommendations:
   * Finds related products by category, tags, and tech stack.
   * Excludes the current product and any items already owned if user is logged in.
   */
  static async getRelatedProducts(
    productId: string,
    userId?: string,
    limit = 6
  ): Promise<RecommendedProduct[]> {
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!currentProduct) {
      return this.getFallbackRecommendations([], limit);
    }

    // Exclude current product and products the user already owns
    const excludeIds = [productId];
    if (userId) {
      const userEntitlements = await prisma.purchaseEntitlement.findMany({
        where: { userId, isRevoked: false },
        select: { productId: true },
      });
      userEntitlements.forEach((e) => excludeIds.push(e.productId));
    }

    // Find candidates in same category or sharing tags
    const candidates = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: excludeIds },
        OR: [
          { categoryId: currentProduct.categoryId },
          { tags: { hasSome: currentProduct.tags } },
          { techStack: { hasSome: currentProduct.techStack } },
        ],
      },
      take: limit * 3,
      include: {
        category: true,
        images: { orderBy: { displayOrder: 'asc' } },
        rating: true,
      },
    });

    // Score candidates based on match relevance + quality
    const scored = candidates.map((candidate) => {
      let score = 0;
      let reasons: string[] = [];

      if (candidate.categoryId === currentProduct.categoryId) {
        score += 15;
        reasons.push(`Similar ${candidate.category.name}`);
      }

      const sharedTags = candidate.tags.filter((t) => currentProduct.tags.includes(t));
      if (sharedTags.length > 0) {
        score += sharedTags.length * 5;
        reasons.push(`Shared tags (${sharedTags.slice(0, 2).join(', ')})`);
      }

      const sharedTech = candidate.techStack.filter((t) => currentProduct.techStack.includes(t));
      if (sharedTech.length > 0) {
        score += sharedTech.length * 4;
        reasons.push(`Built with ${sharedTech[0]}`);
      }

      // Add popularity factor
      score += Math.min(candidate.totalSales * 2, 20);
      score += (candidate.rating?.averageRating || 0) * 3;

      return {
        product: candidate,
        score,
        reason: reasons[0] || 'Recommended match',
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.slice(0, limit).map((s) => this.formatProduct(s.product, s.reason));

    // If we have fewer than requested, backfill with fallback recommendations
    if (topMatches.length < limit) {
      const currentSelectedIds = [...excludeIds, ...topMatches.map((p) => p.id)];
      const fallbacks = await this.getFallbackRecommendations(
        currentSelectedIds,
        limit - topMatches.length
      );
      topMatches.push(...fallbacks);
    }

    return topMatches;
  }

  /**
   * Personalized recommendations:
   * Uses user's own past purchases (privately inspected) to recommend similar products.
   * Fallbacks safely to top trending products if no history exists.
   */
  static async getPersonalizedRecommendations(
    userId?: string,
    limit = 6
  ): Promise<RecommendedProduct[]> {
    if (!userId) {
      return this.getFallbackRecommendations([], limit);
    }

    // Get user's own purchases
    const userEntitlements = await prisma.purchaseEntitlement.findMany({
      where: { userId, isRevoked: false },
      include: {
        product: {
          select: {
            id: true,
            categoryId: true,
            tags: true,
            techStack: true,
          },
        },
      },
    });

    if (userEntitlements.length === 0) {
      return this.getFallbackRecommendations([], limit);
    }

    const ownedProductIds = userEntitlements.map((e) => e.productId);
    const favoriteCategories = [
      ...new Set(userEntitlements.map((e) => e.product.categoryId)),
    ];
    const favoriteTags = [
      ...new Set(userEntitlements.flatMap((e) => e.product.tags)),
    ];

    const candidates = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: ownedProductIds },
        OR: [
          { categoryId: { in: favoriteCategories } },
          { tags: { hasSome: favoriteTags } },
        ],
      },
      take: limit * 2,
      include: {
        category: true,
        images: { orderBy: { displayOrder: 'asc' } },
        rating: true,
      },
    });

    if (candidates.length === 0) {
      return this.getFallbackRecommendations(ownedProductIds, limit);
    }

    // Rank candidates
    const scored = candidates.map((p) => {
      let score = 0;
      let reason = 'Recommended based on your library';

      if (favoriteCategories.includes(p.categoryId)) {
        score += 10;
        reason = `Because you like ${p.category.name}`;
      }

      const matchingTags = p.tags.filter((t) => favoriteTags.includes(t));
      if (matchingTags.length > 0) {
        score += matchingTags.length * 3;
      }

      score += (p.rating?.averageRating || 0) * 2;
      score += Math.min(p.totalSales, 10);

      return {
        product: p,
        score,
        reason,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, limit).map((s) => this.formatProduct(s.product, s.reason));

    if (results.length < limit) {
      const needed = limit - results.length;
      const exclude = [...ownedProductIds, ...results.map((r) => r.id)];
      const fallbacks = await this.getFallbackRecommendations(exclude, needed);
      results.push(...fallbacks);
    }

    return results;
  }
}
