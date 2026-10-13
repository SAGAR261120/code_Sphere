import { prisma } from "../src/lib/prisma";
import { RoleType, ProductStatus, TaskType, VerificationMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting CPC Marketplace Database Seed...");

  // ---------------------------------------------------------------------------
  // 1. Roles & Permissions
  // ---------------------------------------------------------------------------
  console.log("Creating roles and system permissions...");

  const rolesData: { name: string; slug: RoleType; description: string }[] = [
    { name: "Super Administrator", slug: RoleType.SUPER_ADMIN, description: "Full root access to all system domains and finances" },
    { name: "Administrator", slug: RoleType.ADMIN, description: "Product approval, task management and platform operations" },
    { name: "Moderator", slug: RoleType.MODERATOR, description: "Review moderation and community dispute handling" },
    { name: "Publisher", slug: RoleType.PUBLISHER, description: "Approved author who can publish code, templates and applications" },
    { name: "Marketplace User", slug: RoleType.USER, description: "Standard user account for earning coins and buying products" },
  ];

  const roleMap = new Map<RoleType, string>();
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { slug: r.slug },
      update: { name: r.name, description: r.description },
      create: r,
    });
    roleMap.set(r.slug, role.id);
  }

  const permissionsData = [
    { action: "manage", subject: "all", description: "Wildcard full administrative capability" },
    { action: "create", subject: "product", description: "Submit products to the marketplace" },
    { action: "approve", subject: "product", description: "Review and approve draft products" },
    { action: "manage", subject: "task", description: "Create and fund reward tasks" },
    { action: "adjust", subject: "wallet", description: "Privileged balance adjustments" },
    { action: "read", subject: "audit", description: "View security and transaction audit logs" },
  ];

  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { action_subject: { action: p.action, subject: p.subject } },
      update: { description: p.description },
      create: p,
    });

    if (p.action === "manage" && p.subject === "all") {
      const superAdminRoleId = roleMap.get(RoleType.SUPER_ADMIN);
      if (superAdminRoleId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: superAdminRoleId, permissionId: perm.id } },
          update: {},
          create: { roleId: superAdminRoleId, permissionId: perm.id },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Users (Super Admin, Publisher, Customer)
  // ---------------------------------------------------------------------------
  console.log("Seeding verified demo accounts...");

  const passwordHash = await bcrypt.hash("Password123!", 12);

  // 2.1 Super Admin
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@cpcmarketplace.internal" },
    update: {},
    create: {
      email: "admin@cpcmarketplace.internal",
      passwordHash,
      status: "ACTIVE",
      profile: {
        create: {
          username: "cpcadmin",
          displayName: "CPC Super Admin",
          bio: "Principal marketplace operations and platform security.",
        },
      },
      wallet: {
        create: {
          availableBalance: 10000,
          totalEarned: 10000,
        },
      },
      userRoles: {
        create: {
          roleId: roleMap.get(RoleType.SUPER_ADMIN)!,
        },
      },
    },
  });

  // 2.2 Publisher
  const publisherUser = await prisma.user.upsert({
    where: { email: "publisher@astranova.dev" },
    update: {},
    create: {
      email: "publisher@astranova.dev",
      passwordHash,
      status: "ACTIVE",
      profile: {
        create: {
          username: "astranova",
          displayName: "AstraNova Studios",
          bio: "Specializing in high-performance SaaS templates, mobile apps and developer tools.",
        },
      },
      wallet: {
        create: {
          availableBalance: 2500,
          totalEarned: 2500,
        },
      },
      userRoles: {
        create: {
          roleId: roleMap.get(RoleType.PUBLISHER)!,
        },
      },
    },
  });

  // 2.3 Regular Customer
  const customerUser = await prisma.user.upsert({
    where: { email: "alex@example.com" },
    update: {},
    create: {
      email: "alex@example.com",
      passwordHash,
      status: "ACTIVE",
      profile: {
        create: {
          username: "alexdev",
          displayName: "Alex Dev",
          bio: "Fullstack developer building indie digital products.",
        },
      },
      wallet: {
        create: {
          availableBalance: 500,
          totalEarned: 500,
        },
      },
      userRoles: {
        create: {
          roleId: roleMap.get(RoleType.USER)!,
        },
      },
    },
  });

  console.log(`Created accounts: admin (${adminUser.email}), publisher (${publisherUser.email}), customer (${customerUser.email})`);

  // ---------------------------------------------------------------------------
  // 2.4 Genesis & Sample Coin Ledger Transactions
  // ---------------------------------------------------------------------------
  console.log("Seeding genesis and sample ledger transactions...");
  const adminWallet = await prisma.coinWallet.findUnique({ where: { userId: adminUser.id } });
  const pubWallet = await prisma.coinWallet.findUnique({ where: { userId: publisherUser.id } });
  const custWallet = await prisma.coinWallet.findUnique({ where: { userId: customerUser.id } });

  if (adminWallet) {
    await prisma.coinTransaction.upsert({
      where: { idempotencyKey: "genesis-admin-001" },
      update: {},
      create: {
        walletId: adminWallet.id,
        userId: adminUser.id,
        amount: 10000,
        balanceAfter: 10000,
        type: "ADMIN_CREDIT",
        description: "Genesis treasury allocation [SAMPLE CONTENT]",
        referenceId: adminUser.id,
        referenceType: "Admin",
        idempotencyKey: "genesis-admin-001",
      },
    });
  }

  if (pubWallet) {
    await prisma.coinTransaction.upsert({
      where: { idempotencyKey: "genesis-publisher-001" },
      update: {},
      create: {
        walletId: pubWallet.id,
        userId: publisherUser.id,
        amount: 2500,
        balanceAfter: 2500,
        type: "PROMO_BONUS",
        description: "Genesis verified publisher grant [SAMPLE CONTENT]",
        referenceId: publisherUser.id,
        referenceType: "PromoCampaign",
        idempotencyKey: "genesis-publisher-001",
      },
    });
  }

  if (custWallet) {
    // Reset and seed a realistic history for Alex Dev:
    // 1. Welcome Bonus (+50)
    // 2. Deposit Credit (+500)
    // 3. Task Reward (+75)
    // 4. Purchase Debit (-125)
    // Ending balance = 500
    await prisma.coinTransaction.upsert({
      where: { idempotencyKey: "genesis-cust-welcome" },
      update: {},
      create: {
        walletId: custWallet.id,
        userId: customerUser.id,
        amount: 50,
        balanceAfter: 50,
        type: "PROMO_BONUS",
        description: "Welcome registration bonus [SAMPLE CONTENT]",
        referenceId: customerUser.id,
        referenceType: "PromoBonus",
        idempotencyKey: "genesis-cust-welcome",
        createdAt: new Date(Date.now() - 14 * 86400000),
      },
    });

    await prisma.coinTransaction.upsert({
      where: { idempotencyKey: "genesis-cust-deposit" },
      update: {},
      create: {
        walletId: custWallet.id,
        userId: customerUser.id,
        amount: 500,
        balanceAfter: 550,
        type: "DEPOSIT_CREDIT",
        description: "Razorpay verified deposit #PAY-88192 [SAMPLE CONTENT]",
        referenceId: "pay_test_88192",
        referenceType: "Deposit",
        idempotencyKey: "genesis-cust-deposit",
        createdAt: new Date(Date.now() - 7 * 86400000),
      },
    });

    await prisma.coinTransaction.upsert({
      where: { idempotencyKey: "genesis-cust-task" },
      update: {},
      create: {
        walletId: custWallet.id,
        userId: customerUser.id,
        amount: 75,
        balanceAfter: 625,
        type: "TASK_REWARD",
        description: "Completed Daily Reward Task: Interactive Product Tour [SAMPLE CONTENT]",
        referenceId: "task_sample_01",
        referenceType: "TaskCompletion",
        idempotencyKey: "genesis-cust-task",
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
    });

    await prisma.coinTransaction.upsert({
      where: { idempotencyKey: "genesis-cust-purchase" },
      update: {},
      create: {
        walletId: custWallet.id,
        userId: customerUser.id,
        amount: -125,
        balanceAfter: 500,
        type: "PURCHASE_DEBIT",
        description: "Purchased DevPulse API Gateway License [SAMPLE CONTENT]",
        referenceId: "ord_sample_991",
        referenceType: "Order",
        idempotencyKey: "genesis-cust-purchase",
        createdAt: new Date(Date.now() - 1 * 86400000),
      },
    });

    // Update wallet stats to match
    await prisma.coinWallet.update({
      where: { id: custWallet.id },
      data: {
        availableBalance: 500,
        totalEarned: 625,
        totalSpent: 125,
      },
    });
  }


  // ---------------------------------------------------------------------------
  // 3. Product Categories (10 Configurable Categories per Phase 4 Requirements)
  // ---------------------------------------------------------------------------
  console.log("Seeding all 10 product categories...");

  const categories = [
    { name: "Web Applications", slug: "web-apps", description: "Full-stack production web applications ready to deploy", icon: "LayoutGrid", displayOrder: 1 },
    { name: "Android Applications", slug: "android-apps", description: "Native Kotlin and Jetpack Compose Android apps and APKs", icon: "Smartphone", displayOrder: 2 },
    { name: "iOS Applications", slug: "ios-apps", description: "Native Swift and SwiftUI iOS applications ready for Xcode", icon: "Apple", displayOrder: 3 },
    { name: "Website Templates", slug: "website-templates", description: "Modern, responsive landing pages and marketing templates", icon: "Code", displayOrder: 4 },
    { name: "Complete Websites", slug: "complete-websites", description: "Turnkey websites with CMS, blog, authentication and SEO built-in", icon: "Globe", displayOrder: 5 },
    { name: "SaaS Applications", slug: "saas-apps", description: "Multi-tenant SaaS platforms with subscriptions, teams and billing", icon: "Server", displayOrder: 6 },
    { name: "Admin Dashboards", slug: "admin-dashboards", description: "Comprehensive analytics, backoffice and management panels", icon: "SlidersHorizontal", displayOrder: 7 },
    { name: "Source Code Packages", slug: "source-code", description: "Clean algorithms, microservices and architectural starter kits", icon: "FileCode", displayOrder: 8 },
    { name: "Developer Tools", slug: "developer-tools", description: "CLI tools, API proxies, linters and dev automation utilities", icon: "Terminal", displayOrder: 9 },
    { name: "UI Kits & Digital Assets", slug: "ui-kits", description: "Component systems, Figma libraries and digital design kits", icon: "Palette", displayOrder: 10 },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const c = await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, displayOrder: cat.displayOrder },
      create: cat,
    });
    categoryMap.set(cat.slug, c.id);
  }

  // ---------------------------------------------------------------------------
  // 4. Products & Versions (Rich sample products across categories)
  // ---------------------------------------------------------------------------
  console.log("Seeding comprehensive catalog products with sample labels...");

  const demoProducts = [
    {
      title: "NovaCloud — Multi-Cloud DevOps Control Center",
      slug: "novacloud-devops-control-center",
      shortDescription: "[SAMPLE CONTENT] Complete cloud orchestrator with real-time Kubernetes cluster telemetry, automated CI/CD deployments and cost analytics.",
      description: "NovaCloud is an enterprise-grade cloud control plane designed for engineering teams managing multi-cloud Kubernetes clusters and serverless fleets.\n\n*Note: This is sample catalog content for demonstration and testing purposes.*\n\nFeatures unified Prometheus telemetry, GitOps pipeline automation, and automated FinOps budget alerts.",
      categorySlug: "web-apps",
      coinPrice: 450,
      fiatPricePaise: 45000,
      isFeatured: true,
      platforms: ["Web", "Linux", "Docker"],
      tags: ["devops", "kubernetes", "cloud", "react", "nextjs", "sample"],
      techStack: ["Next.js 16", "Go", "Tailwind CSS", "PostgreSQL", "Docker"],
      features: [
        { title: "Real-time Telemetry", description: "Sub-second cluster metrics via WebSockets" },
        { title: "One-click Helm Deploys", description: "Deploy over 120+ pre-configured chart configurations" },
        { title: "Automated Cost Optimization", description: "Smart spot-instance management and rightsizing" },
      ],
      version: "2.4.0",
      fileName: "novacloud-v2.4.0-source.zip",
      screenshots: [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      ],
      systemRequirements: "### System Requirements\n- **Node.js**: >= 20.0.0\n- **Database**: PostgreSQL 15+ with pgvector\n- **Docker**: Engine 24+ & Docker Compose v2\n- **RAM**: Minimum 4GB (8GB recommended for local cluster emulation)",
    },
    {
      title: "PulseFit Pro — AI Workout & Nutrition Android App",
      slug: "pulsefit-pro-ai-fitness",
      shortDescription: "[SAMPLE CONTENT] Native Android fitness app featuring computer vision rep counting, dynamic workout generation, and meal tracking.",
      description: "PulseFit Pro is a production-ready mobile fitness ecosystem crafted with Kotlin and TensorFlow Lite on-device inference.\n\n*Note: This is sample catalog content for demonstration and testing purposes.*\n\nEnables automated rep counting through camera tracking and customized macros planning.",
      categorySlug: "android-apps",
      coinPrice: 320,
      fiatPricePaise: 32000,
      isFeatured: true,
      platforms: ["Android"],
      tags: ["android", "fitness", "ai", "kotlin", "health", "sample"],
      techStack: ["Kotlin", "Jetpack Compose", "TensorFlow Lite", "Room DB", "Coroutines"],
      features: [
        { title: "Camera Rep Tracker", description: "On-device pose estimation with 98.4% accuracy" },
        { title: "Adaptive Meal Planner", description: "Macro-balanced nutrition generator with calorie tracking" },
        { title: "Offline Sync", description: "Full local SQLite persistence with background sync" },
      ],
      version: "1.2.0",
      fileName: "pulsefit-pro-v1.2.0.apk",
      screenshots: [
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=80",
      ],
      systemRequirements: "### System Requirements\n- **Target OS**: Android 10.0 (API level 29) or higher\n- **Hardware**: Camera permission for rep tracking\n- **RAM**: Minimum 3GB\n- **Storage**: 150MB free space",
    },
    {
      title: "SwiftTrack — Personal Finance & Stocks iOS App",
      slug: "swifttrack-finance-ios",
      shortDescription: "[SAMPLE CONTENT] Native Swift and SwiftUI iOS application with CoreData offline persistence, WidgetKit, and portfolio analytics.",
      description: "SwiftTrack delivers a silky-smooth iOS personal wealth tracking experience. Complete with interactive charts, Apple Watch synchronization, and biometric FaceID authentication.\n\n*Note: This is sample catalog content for demonstration and testing purposes.*",
      categorySlug: "ios-apps",
      coinPrice: 350,
      fiatPricePaise: 35000,
      isFeatured: false,
      platforms: ["iOS"],
      tags: ["ios", "swift", "swiftui", "finance", "stocks", "sample"],
      techStack: ["Swift 5.9", "SwiftUI", "CoreData", "WidgetKit", "Combine"],
      features: [
        { title: "WidgetKit Integration", description: "Lock screen and home screen net-worth widgets" },
        { title: "Biometric Security", description: "Local FaceID and TouchID data protection" },
        { title: "Interactive Charts", description: "Custom Swift Charts with real-time gesture scrubbing" },
      ],
      version: "1.0.3",
      fileName: "swifttrack-v1.0.3-xcode.zip",
      screenshots: [
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
      ],
      systemRequirements: "### System Requirements\n- **Target OS**: iOS 16.0 or higher\n- **Xcode**: 15.0+ required to build and deploy\n- **Devices**: iPhone, iPad, and Apple Watch companion app",
    },
    {
      title: "ApexFlow SaaS Starter Kit",
      slug: "apexflow-saas-starter-kit",
      shortDescription: "[SAMPLE CONTENT] Modern B2B SaaS boilerplate with multi-tenancy, Stripe subscriptions, team invitations, and role-based access control.",
      description: "Ship your software startup in days instead of months. ApexFlow delivers full organization management, per-seat and usage billing, transactional emails, and an accessible dark-mode UI design system.\n\n*Note: This is sample catalog content for demonstration and testing purposes.*",
      categorySlug: "saas-apps",
      coinPrice: 280,
      fiatPricePaise: 28000,
      isFeatured: true,
      platforms: ["Web"],
      tags: ["saas", "boilerplate", "stripe", "typescript", "auth", "sample"],
      techStack: ["Next.js 16", "TypeScript", "Tailwind CSS", "Prisma", "Stripe"],
      features: [
        { title: "Multi-tenant Organizations", description: "Team invitations and custom subdomain routing" },
        { title: "Stripe Subscriptions", description: "Customer portal, webhook handling and metered billing" },
        { title: "Fine-grained RBAC", description: "Role and capability based route protection" },
      ],
      version: "3.0.0",
      fileName: "apexflow-starter-v3.0.0.zip",
      screenshots: [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      ],
      systemRequirements: "### System Requirements\n- **Node.js**: >= 18.17.0\n- **Database**: PostgreSQL 14+\n- **Stripe Account**: Test API keys for subscription checkout",
    },
    {
      title: "NexusAdmin — Enterprise Analytics Dashboard",
      slug: "nexusadmin-enterprise-dashboard",
      shortDescription: "[SAMPLE CONTENT] Comprehensive admin dashboard with dynamic data tables, charting widgets, and granular permission controls.",
      description: "NexusAdmin provides an out-of-the-box administrative panel with 20+ specialized page views, real-time KPI streaming, user management matrices, and exportable PDF audit summaries.\n\n*Note: This is sample catalog content for demonstration and testing purposes.*",
      categorySlug: "admin-dashboards",
      coinPrice: 220,
      fiatPricePaise: 22000,
      isFeatured: false,
      platforms: ["Web"],
      tags: ["dashboard", "admin", "analytics", "react", "charts", "sample"],
      techStack: ["React 19", "Next.js", "Recharts", "Tailwind CSS", "Shadcn"],
      features: [
        { title: "Interactive Charts", description: "Over 15 chart configurations with live data filters" },
        { title: "Advanced Data Tables", description: "Server-side sorting, pagination, and CSV exports" },
        { title: "Dark & Light Modes", description: "Refined theme switcher with system sync" },
      ],
      version: "2.1.0",
      fileName: "nexusadmin-v2.1.0.zip",
      screenshots: [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
      ],
      systemRequirements: "### System Requirements\n- **Browser**: Modern evergreen browsers (Chrome, Edge, Firefox, Safari)\n- **Node.js**: >= 18.0.0",
    },
    {
      title: "DevForge — Microservices API Gateway & Toolkit",
      slug: "devforge-api-gateway",
      shortDescription: "[SAMPLE CONTENT] Ultra-fast Rust-powered reverse proxy with rate limiting, JWT validation, and automated OpenAPI documentation.",
      description: "DevForge is an edge API gateway capable of processing over 120,000 requests per second with sub-millisecond overhead. Integrates Redis token-bucket rate limiting and zero-downtime certificate renewals.\n\n*Note: This is sample catalog content for demonstration and testing purposes.*",
      categorySlug: "developer-tools",
      coinPrice: 150,
      fiatPricePaise: 15000,
      isFeatured: false,
      platforms: ["Linux", "macOS", "Windows", "Docker"],
      tags: ["rust", "api", "gateway", "microservices", "performance", "sample"],
      techStack: ["Rust", "Tokio", "Redis", "OpenAPI", "Prometheus"],
      features: [
        { title: "Sub-millisecond Latency", description: "High-performance async Tokio runtime" },
        { title: "Distributed Rate Limiting", description: "Sliding window rate limiters backed by Redis" },
        { title: "Automated Swagger/OpenAPI", description: "Extracts route metadata directly from runtime traffic" },
      ],
      version: "1.0.4",
      fileName: "devforge-gateway-v1.0.4.tar.gz",
      screenshots: [
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
      ],
      systemRequirements: "### System Requirements\n- **OS**: Linux (x86_64, aarch64), macOS (Apple Silicon, Intel), Windows 10+\n- **Redis**: Redis 6.2+ for cluster rate-limiting",
    },
    {
      title: "Aura UI — Component Library & Design System",
      slug: "aura-ui-component-library",
      shortDescription: "[SAMPLE CONTENT] 60+ accessible, production-tested React components with Tailwind CSS styling and fluid motion animations.",
      description: "A comprehensive UI component system engineered for rapid prototyping and enterprise web dashboards. Built on Radix UI primitives with full keyboard accessibility and theme customizers.\n\n*Note: This is sample catalog content for demonstration and testing purposes.*",
      categorySlug: "ui-kits",
      coinPrice: 0,
      isFree: true,
      fiatPricePaise: 0,
      isFeatured: true,
      platforms: ["Web"],
      tags: ["ui", "components", "tailwind", "design-system", "free", "sample"],
      techStack: ["React 19", "Tailwind CSS", "Radix UI", "TypeScript"],
      features: [
        { title: "60+ Accessible Components", description: "Tested against WCAG 2.1 AA standards" },
        { title: "Light & Dark Themes", description: "Seamless CSS token switching with zero layout shift" },
        { title: "Copy & Paste Ready", description: "Drop directly into any modern Next.js project" },
      ],
      version: "1.0.0",
      fileName: "aura-ui-v1.0.0.zip",
      screenshots: [
        "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
      ],
      systemRequirements: "### System Requirements\n- **Framework**: React 18 or 19\n- **Styling**: Tailwind CSS v3 or v4",
    },
    {
      title: "Landmark Pro — High-Converting Startup Landing Page",
      slug: "landmark-pro-landing-template",
      shortDescription: "[SAMPLE CONTENT] Beautiful, high-converting marketing landing page template with hero animations, pricing tables, and testimonial sliders.",
      description: "Landmark Pro was designed for software agencies, mobile apps, and SaaS startups aiming to optimize conversion rates. Includes 10 pre-built sections, contact forms, and automated SEO tags.\n\n*Note: This is sample catalog content for demonstration and testing purposes.*",
      categorySlug: "website-templates",
      coinPrice: 90,
      fiatPricePaise: 9000,
      isFeatured: false,
      platforms: ["Web"],
      tags: ["template", "landing", "marketing", "tailwind", "seo", "sample"],
      techStack: ["Next.js 16", "Tailwind CSS", "Framer Motion", "TypeScript"],
      features: [
        { title: "Conversion Optimized", description: "Carefully positioned CTA blocks and social proof sections" },
        { title: "Lighthouse 100/100", description: "Ultra-fast page loads and optimized Core Web Vitals" },
        { title: "Dynamic Themes", description: "Built-in theme toggle with customizable accent colors" },
      ],
      version: "1.1.0",
      fileName: "landmark-pro-v1.1.0.zip",
      screenshots: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      ],
      systemRequirements: "### System Requirements\n- **Node.js**: >= 18.0.0\n- **Package Manager**: npm, pnpm or yarn",
    },
    {
      title: "EchoBlog — Headless Publication & Complete Website",
      slug: "echoblog-headless-website",
      shortDescription: "[SAMPLE CONTENT] Complete turnkey publication website with Markdown/MDX blogging, newsletter subscription, and search.",
      description: "EchoBlog provides everything you need to launch a modern digital publication. Includes full-text client search, automatic RSS feeds, social sharing cards, and responsive typography.\n\n*Note: This is sample catalog content for demonstration and testing purposes.*",
      categorySlug: "complete-websites",
      coinPrice: 120,
      fiatPricePaise: 12000,
      isFeatured: false,
      platforms: ["Web"],
      tags: ["blog", "website", "content", "mdx", "seo", "sample"],
      techStack: ["Next.js 16", "Contentlayer", "Tailwind CSS", "TypeScript"],
      features: [
        { title: "MDX Support", description: "Write interactive blog posts with embedded React components" },
        { title: "Automated SEO & RSS", description: "Pre-rendered sitemaps, OpenGraph cards and RSS 2.0" },
        { title: "Fast Fulltext Search", description: "Zero-dependency client side index search" },
      ],
      version: "1.0.2",
      fileName: "echoblog-v1.0.2.zip",
      screenshots: [
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
      ],
      systemRequirements: "### System Requirements\n- **Node.js**: >= 18.0.0\n- **Hosting**: Vercel, Netlify, Cloudflare Pages, or Docker",
    },
    {
      title: "PyDataVault — Encrypted SQLite Backup & Sync Engine",
      slug: "pydatavault-backup-engine",
      shortDescription: "[SAMPLE CONTENT] Python source package for automated zero-knowledge encrypted database snapshots and S3 synchronization.",
      description: "A battle-tested Python package providing zero-downtime hot backups for SQLite and Postgres databases with AES-256 encryption and multi-cloud sync.\n\n*Note: This is sample catalog content for demonstration and testing purposes.*",
      categorySlug: "source-code",
      coinPrice: 0,
      isFree: true,
      fiatPricePaise: 0,
      isFeatured: false,
      platforms: ["Linux", "macOS", "Windows"],
      tags: ["python", "source-code", "encryption", "backup", "free", "sample"],
      techStack: ["Python 3.11", "Cryptography", "Boto3", "SQLite3"],
      features: [
        { title: "Zero Downtime", description: "Leverages database WAL mode for consistent live backups" },
        { title: "AES-GCM-256", description: "Client-side encryption before byte upload" },
        { title: "Automated Pruning", description: "Configurable grandfather-father-son retention policies" },
      ],
      version: "1.3.1",
      fileName: "pydatavault-1.3.1.tar.gz",
      screenshots: [
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
      ],
      systemRequirements: "### System Requirements\n- **Python**: >= 3.9\n- **Storage**: Amazon S3, Cloudflare R2, or local NAS directory",
    },
  ];

  for (const item of demoProducts) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) continue;

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        shortDescription: item.shortDescription,
        description: item.description,
        isFree: item.isFree ?? false,
        coinPrice: item.coinPrice,
        fiatPricePaise: item.fiatPricePaise,
        platforms: item.platforms,
        tags: item.tags,
        techStack: item.techStack,
        isFeatured: item.isFeatured,
      },
      create: {
        title: item.title,
        slug: item.slug,
        shortDescription: item.shortDescription,
        description: item.description,
        categoryId,
        publisherId: publisherUser.id,
        status: ProductStatus.PUBLISHED,
        isFree: item.isFree ?? false,
        coinPrice: item.coinPrice,
        fiatPricePaise: item.fiatPricePaise,
        platforms: item.platforms,
        tags: item.tags,
        techStack: item.techStack,
        isFeatured: item.isFeatured,
        totalSales: Math.floor(Math.random() * 80) + 15,
        downloadCount: Math.floor(Math.random() * 200) + 60,
        viewCount: Math.floor(Math.random() * 1500) + 400,
        images: {
          create: item.screenshots.map((url, idx) => ({
            url,
            alt: `${item.title} Preview ${idx + 1}`,
            isThumbnail: idx === 0,
            displayOrder: idx,
          })),
        },
        features: {
          create: item.features.map((f, idx) => ({
            title: f.title,
            description: f.description,
            displayOrder: idx,
          })),
        },
        rating: {
          create: {
            averageRating: 4.8,
            reviewCount: 16,
            fiveStarCount: 13,
            fourStarCount: 3,
            threeStarCount: 0,
            twoStarCount: 0,
            oneStarCount: 0,
          },
        },
        reviews: {
          create: [
            {
              userId: customerUser.id,
              rating: 5,
              title: "Exceptional architecture and clean code",
              content: "[SAMPLE REVIEW] The codebase is structured cleanly and includes excellent documentation. Saved us weeks of development time.",
              isVerifiedPurchase: true,
              isApproved: true,
            },
          ],
        },
        versions: {
          create: {
            version: item.version,
            isCurrent: true,
            changelogMarkdown: "### What's New\n- Initial release with production-ready architecture\n- Complete documentation, typing and test coverage\n- Responsive desktop and mobile layout validation",
            setupGuideMarkdown: `${item.systemRequirements}\n\n### Quick Start Installation\n1. Download and extract the archive.\n2. Install required dependencies.\n3. Configure your environment variables.\n4. Run the development server or test build.`,
            files: {
              create: {
                storageKey: `products/${item.slug}/${item.version}/${item.fileName}`,
                fileName: item.fileName,
                fileSizeBytes: BigInt(45200000), // ~45 MB
                mimeType: "application/zip",
                sha256Checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
              },
            },
          },
        },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 5. Short-Link Providers & Reward Tasks
  // ---------------------------------------------------------------------------
  console.log("Seeding short-link providers, daily reward tasks, and budgets...");

  const gplinksProvider = await prisma.taskProvider.upsert({
    where: { slug: "gplinks" },
    update: {},
    create: {
      name: "GPLinks",
      slug: "gplinks",
      baseUrl: "https://gplinks.com/api",
      apiKey: "gpl_live_secret_token_8891",
      permittedDomains: ["gplinks.co", "gplinks.com", "gplinks.in"],
      verificationType: "MANUAL_REVIEW",
      isEnabled: true,
    },
  });

  const signedPostbackProvider = await prisma.taskProvider.upsert({
    where: { slug: "signed-postback" },
    update: {},
    create: {
      name: "Signed Postback Provider",
      slug: "signed-postback",
      baseUrl: "https://shortener-network.internal/link",
      apiKey: "sp_api_demo_9821",
      webhookSecret: "sk_test_cpc_secret_98234abcf",
      permittedDomains: ["shortener-network.internal"],
      verificationType: "SIGNED_POSTBACK",
      isEnabled: true,
    },
  });

  const tasksData = [
    {
      title: "Star & Explore AstraNova Open-Source Engine",
      slug: "star-astranova-engine",
      description: "Inspect our open-source tools on GitHub and engage with the developer community.",
      instructionsMarkdown: "1. Click Start Task to open the project repository.\n2. Star the project and review the architectural README.\n3. Return after 30 seconds to claim your 25 CPC Coins reward.",
      rewardCoins: 25,
      taskType: TaskType.VISIT,
      verificationMethod: VerificationMethod.TIMER,
      requiredDurationSeconds: 30,
      cooldownHours: 24,
      targetUrl: "https://github.com",
      category: "Developer Community",
      difficulty: "Quick (30s)",
      totalBudget: 10000,
      providerId: null as string | null,
    },
    {
      title: "Watch Architecture Deep Dive: Building Scalable Gateways",
      slug: "watch-architecture-deep-dive",
      description: "Watch an architectural breakdown of high-throughput distributed microservices.",
      instructionsMarkdown: "1. Click Start Task to launch the video walkthrough.\n2. Watch the technical presentation for at least 60 seconds.\n3. Verify your session to receive 50 CPC Coins.",
      rewardCoins: 50,
      taskType: TaskType.WATCH,
      verificationMethod: VerificationMethod.TIMER,
      requiredDurationSeconds: 60,
      cooldownHours: 24,
      targetUrl: "https://youtube.com",
      category: "Learning",
      difficulty: "Video (60s)",
      totalBudget: 25000,
      providerId: null as string | null,
    },
    {
      title: "Join Developer Discord Community",
      slug: "join-dev-discord",
      description: "Connect with over 4,000+ indie makers, software engineers, and digital architects.",
      instructionsMarkdown: "1. Join the CPC Marketplace community Discord server.\n2. Browse the #showcase channel.\n3. Return after 45 seconds to claim 30 CPC Coins.",
      rewardCoins: 30,
      taskType: TaskType.SOCIAL,
      verificationMethod: VerificationMethod.TIMER,
      requiredDurationSeconds: 45,
      cooldownHours: 48,
      targetUrl: "https://discord.com",
      category: "Community",
      difficulty: "Social (45s)",
      totalBudget: 15000,
      providerId: null as string | null,
    },
    {
      title: "Complete 2-Minute Developer Tech Stack Survey",
      slug: "complete-tech-survey",
      description: "Share your preferences on frameworks, databases, and hosting providers to help publishers build better tools.",
      instructionsMarkdown: "1. Open the interactive developer questionnaire.\n2. Answer 5 multiple-choice questions on your tech preferences.\n3. Spend at least 90 seconds reviewing to claim 75 CPC Coins.",
      rewardCoins: 75,
      taskType: TaskType.TUTORIAL,
      verificationMethod: VerificationMethod.TIMER,
      requiredDurationSeconds: 90,
      cooldownHours: 72,
      targetUrl: "https://forms.google.com",
      category: "Feedback",
      difficulty: "Survey (90s)",
      totalBudget: 20000,
      providerId: null as string | null,
    },
    {
      title: "Verified Short-Link Challenge: Distributed Cache Blueprint",
      slug: "verified-shortlink-challenge",
      description: "Engage with the verified partner short-link challenge. Requires signed cryptographic callback completion.",
      instructionsMarkdown: "1. Launch the shortlink challenge session.\n2. Complete all partner steps.\n3. A signed server-to-server callback will verify your completion and credit 40 CPC Coins automatically.",
      rewardCoins: 40,
      taskType: TaskType.VISIT,
      verificationMethod: VerificationMethod.CALLBACK,
      requiredDurationSeconds: 30,
      cooldownHours: 24,
      targetUrl: "https://shortener-network.internal/link",
      category: "Partner Challenges",
      difficulty: "Short-Link (30s)",
      totalBudget: 15000,
      providerId: signedPostbackProvider.id,
    },
    {
      title: "Explore Partner Architecture Benchmark (via GPLinks)",
      slug: "explore-partner-benchmark-gplinks",
      description: "Inspect the partner benchmark analysis via GPLinks. Logged attempts are queued for manual administrative verification.",
      instructionsMarkdown: "1. Open the GPLinks short-link challenge.\n2. Complete the destination steps and return to /tasks/return.\n3. As GPLinks does not provide automatic postbacks, your attempt will enter pending verification for review.",
      rewardCoins: 35,
      taskType: TaskType.VISIT,
      verificationMethod: VerificationMethod.CALLBACK,
      requiredDurationSeconds: 30,
      cooldownHours: 24,
      targetUrl: "https://gplinks.com/api",
      category: "Partner Challenges",
      difficulty: "Short-Link (30s)",
      totalBudget: 10000,
      providerId: gplinksProvider.id,
    },
  ];

  for (const t of tasksData) {
    await prisma.rewardTask.upsert({
      where: { slug: t.slug },
      update: {
        providerId: t.providerId,
      },
      create: {
        title: t.title,
        slug: t.slug,
        description: t.description,
        instructionsMarkdown: t.instructionsMarkdown,
        rewardCoins: t.rewardCoins,
        taskType: t.taskType,
        verificationMethod: t.verificationMethod,
        requiredDurationSeconds: t.requiredDurationSeconds,
        cooldownHours: t.cooldownHours,
        targetUrl: t.targetUrl,
        providerId: t.providerId,
        category: t.category,
        difficulty: t.difficulty,
        isActive: true,
        budget: {
          create: {
            totalAllocatedCoins: t.totalBudget,
            totalSpentCoins: 0,
            isExhausted: false,
          },
        },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 6. Platform Settings
  // ---------------------------------------------------------------------------
  console.log("Seeding core platform configuration settings...");

  const settings = [
    { key: "COIN_CONVERSION_RATE_INR_PAISE", value: "100", description: "Number of paise per CPC Coin (100 = ₹1.00 per coin)", isPublic: true },
    { key: "MIN_DEPOSIT_PAISE", value: "10000", description: "Minimum fiat deposit allowed in paise (10000 = ₹100.00)", isPublic: true },
    { key: "MAX_TASK_REWARD_DAILY", value: "300", description: "Maximum CPC Coins a user can earn in a rolling 24 hour window", isPublic: false },
    { key: "PLATFORM_NAME", value: "CPC Marketplace", description: "Marketplace brand title", isPublic: true },
    { key: "SUPPORT_EMAIL", value: "support@cpcmarketplace.internal", description: "Official support desk email address", isPublic: true },
  ];

  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description, isPublic: s.isPublic },
      create: s,
    });
  }

  console.log("✅ Seed complete! All 10 categories, accounts, sample products, tasks, and settings are initialized.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
