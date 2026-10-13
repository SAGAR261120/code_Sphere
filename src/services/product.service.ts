import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-response';
import {
  ProductQueryInput,
  CreateProductInput,
  UpdateProductInput,
  CreateProductVersionInput,
  CreateProductReviewInput,
} from '@/lib/validations/product.schema';
import { ProductStatus, Prisma } from '@prisma/client';

export class ProductService {
  /**
   * Search and filter products with pagination.
   */
  static async getProducts(query: ProductQueryInput) {
    const {
      page,
      limit,
      category,
      platform,
      pricing,
      minRating,
      minPrice,
      maxPrice,
      sort,
      search,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: 'PUBLISHED',
      ...(category && {
        category: { slug: category },
      }),
      ...(platform && {
        platforms: { has: platform },
      }),
      ...(pricing === 'FREE' && { isFree: true }),
      ...(pricing === 'UNDER_300' && { isFree: false, coinPrice: { lte: 300 } }),
      ...(pricing === 'OVER_300' && { coinPrice: { gt: 300 } }),
      ...(minRating !== undefined && {
        rating: { averageRating: { gte: minRating } },
      }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        coinPrice: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
          { tags: { has: search.toLowerCase() } },
          { techStack: { has: search } },
        ],
      }),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = {
      downloadCount: 'desc',
    };

    if (sort === 'TRENDING') {
      // Defined ranking metric: highest sales and user view counts
      orderBy = [{ totalSales: 'desc' }, { viewCount: 'desc' }];
    } else if (sort === 'RATING') {
      orderBy = { rating: { averageRating: 'desc' } };
    } else if (sort === 'NEWEST') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'UPDATED') {
      orderBy = { updatedAt: 'desc' };
    } else if (sort === 'PRICE_LOW') {
      orderBy = { coinPrice: 'asc' };
    } else if (sort === 'PRICE_HIGH') {
      orderBy = { coinPrice: 'desc' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          publisher: {
            include: { profile: true },
          },
          images: {
            orderBy: { displayOrder: 'asc' },
          },
          rating: true,
          versions: {
            where: { isCurrent: true },
            take: 1,
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves marketplace home shelves backed by real database queries.
   */
  static async getMarketplaceHomeShelves() {
    const commonInclude = {
      category: true,
      publisher: {
        include: { profile: true },
      },
      images: {
        orderBy: { displayOrder: 'asc' } as const,
      },
      rating: true,
      versions: {
        where: { isCurrent: true },
        take: 1,
      },
    };

    const [
      featured,
      trending,
      recent,
      topRated,
      freeProducts,
      recentlyUpdated,
      categories,
    ] = await Promise.all([
      // 1. Featured products
      prisma.product.findMany({
        where: { status: 'PUBLISHED', isFeatured: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: commonInclude,
      }),

      // 2. Trending products: defined metric based on totalSales & viewCount
      prisma.product.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: [{ totalSales: 'desc' }, { viewCount: 'desc' }],
        take: 6,
        include: commonInclude,
      }),

      // 3. Recently added
      prisma.product.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: commonInclude,
      }),

      // 4. Top-rated products
      prisma.product.findMany({
        where: {
          status: 'PUBLISHED',
          rating: { averageRating: { gte: 4.0 } },
        },
        orderBy: { rating: { averageRating: 'desc' } },
        take: 6,
        include: commonInclude,
      }),

      // 5. Free products
      prisma.product.findMany({
        where: { status: 'PUBLISHED', isFree: true },
        orderBy: { downloadCount: 'desc' },
        take: 6,
        include: commonInclude,
      }),

      // 6. Recently updated products
      prisma.product.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        include: commonInclude,
      }),

      // 7. Popular categories with counts
      prisma.productCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        include: {
          _count: {
            select: {
              products: { where: { status: 'PUBLISHED' } },
            },
          },
        },
      }),
    ]);

    return {
      featured,
      trending,
      recent,
      topRated,
      free: freeProducts,
      recentlyUpdated,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        productCount: c._count.products,
      })),
    };
  }

  /**
   * Retrieves a single product by slug and increments its viewCount.
   */
  static async getProductBySlug(slug: string, incrementView: boolean = true) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        publisher: {
          include: { profile: true },
        },
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        features: {
          orderBy: { displayOrder: 'asc' },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          include: { files: true },
        },
        rating: true,
        reviews: {
          where: { isApproved: true },
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }

    if (incrementView && product.status === 'PUBLISHED') {
      prisma.product
        .update({
          where: { id: product.id },
          data: { viewCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    return product;
  }

  /**
   * Retrieves related products for a product detail page.
   */
  static async getRelatedProducts(productId: string, categoryId: string, limit: number = 4) {
    return prisma.product.findMany({
      where: {
        id: { not: productId },
        categoryId,
        status: 'PUBLISHED',
      },
      take: limit,
      orderBy: { downloadCount: 'desc' },
      include: {
        category: true,
        publisher: {
          include: { profile: true },
        },
        images: {
          where: { isThumbnail: true },
          take: 1,
        },
        rating: true,
        versions: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    });
  }

  /**
   * Create a new draft product.
   */
  static async createProduct(input: CreateProductInput, publisherId: string) {
    const baseSlug = input.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    let slug = baseSlug;
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          title: input.title,
          slug,
          shortDescription: input.shortDescription,
          description: input.description,
          categoryId: input.categoryId,
          publisherId,
          isFree: input.isFree,
          coinPrice: input.isFree ? 0 : input.coinPrice,
          fiatPricePaise: input.fiatPricePaise,
          demoUrl: input.demoUrl || null,
          videoUrl: input.videoUrl || null,
          tags: input.tags,
          techStack: input.techStack,
          platforms: input.platforms,
          status: 'DRAFT',
          features: {
            create: input.features.map((feat, idx) => ({
              title: feat.title,
              description: feat.description,
              icon: feat.icon,
              displayOrder: idx,
            })),
          },
          ...(input.initialVersion && {
            versions: {
              create: {
                version: input.initialVersion.version,
                changelogMarkdown: input.initialVersion.changelogMarkdown,
                setupGuideMarkdown: input.initialVersion.setupGuideMarkdown,
                isCurrent: true,
              },
            },
          }),
        },
      });

      await tx.productRating.create({
        data: {
          productId: product.id,
          averageRating: 0.0,
          reviewCount: 0,
        },
      });

      return product;
    });
  }

  /**
   * Update an existing product.
   */
  static async updateProduct(
    productId: string,
    input: UpdateProductInput,
    userId: string,
    isAdmin: boolean = false
  ) {
    const existing = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
    });

    if (!isAdmin && existing.publisherId !== userId) {
      throw new ApiError(403, 'You do not have permission to modify this product', 'FORBIDDEN');
    }

    return prisma.product.update({
      where: { id: productId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.shortDescription && { shortDescription: input.shortDescription }),
        ...(input.description && { description: input.description }),
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.isFree !== undefined && {
          isFree: input.isFree,
          coinPrice: input.isFree ? 0 : input.coinPrice ?? existing.coinPrice,
        }),
        ...(input.coinPrice !== undefined && !input.isFree && { coinPrice: input.coinPrice }),
        ...(input.fiatPricePaise !== undefined && { fiatPricePaise: input.fiatPricePaise }),
        ...(input.demoUrl !== undefined && { demoUrl: input.demoUrl || null }),
        ...(input.videoUrl !== undefined && { videoUrl: input.videoUrl || null }),
        ...(input.tags && { tags: input.tags }),
        ...(input.techStack && { techStack: input.techStack }),
        ...(input.platforms && { platforms: input.platforms }),
      },
    });
  }

  /**
   * Publisher submits a product for moderation review.
   */
  static async submitForReview(productId: string, userId: string) {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
    });

    if (product.publisherId !== userId) {
      throw new ApiError(403, 'You do not own this product', 'FORBIDDEN');
    }

    if (product.status !== 'DRAFT' && product.status !== 'REJECTED') {
      throw new ApiError(
        400,
        `Cannot submit product with status ${product.status} for review`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    return prisma.product.update({
      where: { id: productId },
      data: {
        status: 'PENDING_REVIEW',
        rejectionReason: null,
      },
    });
  }

  /**
   * Admin moderate product status (APPROVE -> PUBLISHED, REJECT -> REJECTED, ARCHIVE, etc.)
   */
  static async updateProductStatus(
    adminId: string,
    productId: string,
    status: ProductStatus,
    rejectionReason?: string,
    ipAddress?: string
  ) {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
    });

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: productId },
        data: {
          status,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'PRODUCT_STATUS_UPDATE',
          targetType: 'Product',
          targetId: productId,
          reason: rejectionReason || `Status transition from ${product.status} to ${status}`,
          ipAddress,
          metadata: {
            beforeStatus: product.status,
            afterStatus: status,
          },
        },
      });

      return p;
    });

    return updated;
  }

  /**
   * Add a new SemVer release version to an existing product.
   */
  static async addProductVersion(
    productId: string,
    input: CreateProductVersionInput,
    userId: string,
    isAdmin: boolean = false
  ) {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
    });

    if (!isAdmin && product.publisherId !== userId) {
      throw new ApiError(403, 'Permission denied', 'FORBIDDEN');
    }

    return prisma.$transaction(async (tx) => {
      if (input.isCurrent) {
        await tx.productVersion.updateMany({
          where: { productId, isCurrent: true },
          data: { isCurrent: false },
        });
      }

      return tx.productVersion.create({
        data: {
          productId,
          version: input.version,
          changelogMarkdown: input.changelogMarkdown,
          setupGuideMarkdown: input.setupGuideMarkdown,
          isCurrent: input.isCurrent,
        },
      });
    });
  }

  /**
   * Add or update a product review and recompute aggregate rating.
   */
  static async addReview(
    productId: string,
    userId: string,
    input: CreateProductReviewInput
  ) {
    return prisma.$transaction(async (tx) => {
      const review = await tx.productReview.upsert({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        update: {
          rating: input.rating,
          title: input.title,
          content: input.content,
          isApproved: true,
        },
        create: {
          productId,
          userId,
          rating: input.rating,
          title: input.title,
          content: input.content,
          isVerifiedPurchase: true,
          isApproved: true,
        },
      });

      // Recalculate average rating & counts
      const approvedReviews = await tx.productReview.findMany({
        where: { productId, isApproved: true },
        select: { rating: true },
      });

      const reviewCount = approvedReviews.length;
      const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = reviewCount > 0 ? parseFloat((sum / reviewCount).toFixed(2)) : 0.0;

      const starCounts = {
        one: approvedReviews.filter((r) => r.rating === 1).length,
        two: approvedReviews.filter((r) => r.rating === 2).length,
        three: approvedReviews.filter((r) => r.rating === 3).length,
        four: approvedReviews.filter((r) => r.rating === 4).length,
        five: approvedReviews.filter((r) => r.rating === 5).length,
      };

      await tx.productRating.upsert({
        where: { productId },
        update: {
          averageRating,
          reviewCount,
          oneStarCount: starCounts.one,
          twoStarCount: starCounts.two,
          threeStarCount: starCounts.three,
          fourStarCount: starCounts.four,
          fiveStarCount: starCounts.five,
        },
        create: {
          productId,
          averageRating,
          reviewCount,
          oneStarCount: starCounts.one,
          twoStarCount: starCounts.two,
          threeStarCount: starCounts.three,
          fourStarCount: starCounts.four,
          fiveStarCount: starCounts.five,
        },
      });

      return review;
    });
  }

  /**
   * Retrieves products for admin moderation queue.
   */
  static async getAdminProducts(statusFilter?: ProductStatus) {
    return prisma.product.findMany({
      where: {
        ...(statusFilter && { status: statusFilter }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        publisher: {
          include: { profile: true },
        },
        rating: true,
        versions: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    });
  }
}
