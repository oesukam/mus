import { DataSource } from "typeorm"
import { FeatureFlag, FeatureFlagScope } from "../entities/feature-flag.entity"

interface FeatureFlagData {
  key: string
  displayName: string
  description: string
  scope: FeatureFlagScope
  isEnabled: boolean
  rules?: Record<string, any>
  rolloutPercentage?: number
}

export async function seedFeatureFlags(dataSource: DataSource) {
  const featureFlagRepository = dataSource.getRepository(FeatureFlag)

  const featureFlags: FeatureFlagData[] = [
    // Core E-commerce Features
    {
      key: "product-reviews",
      displayName: "Product Reviews",
      description: "Allow customers to write and view product reviews",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
      rules: {
        requiresPurchase: true,
        moderationEnabled: true,
      },
    },
    {
      key: "wishlist",
      displayName: "Wishlist",
      description: "Allow customers to save products to wishlist",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "product-comparison",
      displayName: "Product Comparison",
      description: "Allow customers to compare multiple products side-by-side",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
      rules: {
        maxProducts: 4,
      },
    },
    {
      key: "guest-checkout",
      displayName: "Guest Checkout",
      description: "Allow customers to checkout without creating an account",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },

    // Payment & Checkout Features
    {
      key: "saved-payment-methods",
      displayName: "Saved Payment Methods",
      description: "Allow customers to save payment methods for faster checkout",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
      rules: {
        securityLevel: "PCI-DSS",
      },
    },
    {
      key: "buy-now-pay-later",
      displayName: "Buy Now Pay Later",
      description: "Enable installment payment options (Affirm, Klarna, etc.)",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
      rules: {
        providers: ["affirm", "klarna", "afterpay"],
      },
    },
    {
      key: "crypto-payments",
      displayName: "Cryptocurrency Payments",
      description: "Accept cryptocurrency payments (Bitcoin, Ethereum, etc.)",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },

    // Marketing & Promotions
    {
      key: "discount-codes",
      displayName: "Discount Codes",
      description: "Allow customers to apply discount/promo codes at checkout",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "flash-sales",
      displayName: "Flash Sales",
      description: "Enable time-limited flash sale promotions",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "loyalty-program",
      displayName: "Loyalty Program",
      description: "Enable customer loyalty points and rewards program",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
      rules: {
        pointsPerDollar: 1,
        redemptionRate: 100,
      },
    },
    {
      key: "referral-program",
      displayName: "Referral Program",
      description: "Enable customer referral program with rewards",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },

    // Shipping & Fulfillment
    {
      key: "real-time-shipping",
      displayName: "Real-time Shipping Rates",
      description: "Calculate real-time shipping rates from carriers",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "order-tracking",
      displayName: "Order Tracking",
      description: "Allow customers to track their orders in real-time",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "in-store-pickup",
      displayName: "In-Store Pickup",
      description: "Enable buy online, pick up in-store (BOPIS)",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },
    {
      key: "same-day-delivery",
      displayName: "Same-Day Delivery",
      description: "Offer same-day delivery in supported areas",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },

    // Customer Engagement
    {
      key: "live-chat",
      displayName: "Live Chat Support",
      description: "Enable live chat support for customers",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "email-notifications",
      displayName: "Email Notifications",
      description: "Send email notifications for orders, shipping, etc.",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "sms-notifications",
      displayName: "SMS Notifications",
      description: "Send SMS notifications for order updates",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },
    {
      key: "push-notifications",
      displayName: "Push Notifications",
      description: "Send browser/mobile push notifications",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },

    // Social & Community
    {
      key: "social-login",
      displayName: "Social Login",
      description: "Allow login with Google, Facebook, Apple, etc.",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
      rules: {
        providers: ["google", "facebook", "apple"],
      },
    },
    {
      key: "social-sharing",
      displayName: "Social Sharing",
      description: "Enable sharing products on social media",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "product-qa",
      displayName: "Product Q&A",
      description: "Allow customers to ask and answer product questions",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },

    // Search & Discovery
    {
      key: "advanced-search",
      displayName: "Advanced Search",
      description: "Enable advanced search with filters and facets",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "ai-recommendations",
      displayName: "AI Product Recommendations",
      description: "Enable AI-powered product recommendations",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },
    {
      key: "visual-search",
      displayName: "Visual Search",
      description: "Search products using images",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },

    // Inventory & Availability
    {
      key: "stock-notifications",
      displayName: "Back-in-Stock Notifications",
      description: "Notify customers when out-of-stock items are available",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "low-stock-indicator",
      displayName: "Low Stock Indicator",
      description: "Show low stock warnings to create urgency",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
      rules: {
        threshold: 10,
      },
    },
    {
      key: "preorders",
      displayName: "Pre-orders",
      description: "Allow customers to pre-order upcoming products",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },

    // Personalization
    {
      key: "recently-viewed",
      displayName: "Recently Viewed Products",
      description: "Show customers their recently viewed products",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "personalized-homepage",
      displayName: "Personalized Homepage",
      description: "Customize homepage based on user behavior",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },
    {
      key: "price-drop-alerts",
      displayName: "Price Drop Alerts",
      description: "Notify customers when wishlist items go on sale",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },

    // International & Localization
    {
      key: "multi-currency",
      displayName: "Multi-Currency Support",
      description: "Support multiple currencies with auto-conversion",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "multi-language",
      displayName: "Multi-Language Support",
      description: "Support multiple languages/locales",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "tax-calculation",
      displayName: "Automatic Tax Calculation",
      description: "Calculate taxes based on location automatically",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },

    // Returns & Customer Service
    {
      key: "easy-returns",
      displayName: "Easy Returns",
      description: "Enable self-service returns and exchanges",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "gift-wrapping",
      displayName: "Gift Wrapping",
      description: "Offer gift wrapping service for orders",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
      rules: {
        price: 5.0,
      },
    },
    {
      key: "gift-cards",
      displayName: "Gift Cards",
      description: "Enable digital and physical gift cards",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },

    // Admin & Seller Features
    {
      key: "multi-vendor",
      displayName: "Multi-Vendor Marketplace",
      description: "Enable multiple sellers on the platform",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: true,
    },
    {
      key: "seller-analytics",
      displayName: "Seller Analytics Dashboard",
      description: "Provide analytics dashboard for sellers",
      scope: FeatureFlagScope.ROLE,
      isEnabled: true,
      rules: {
        roleNames: ["seller", "admin"],
      },
    },
    {
      key: "bulk-import",
      displayName: "Bulk Product Import",
      description: "Allow bulk importing products via CSV/Excel",
      scope: FeatureFlagScope.ROLE,
      isEnabled: true,
      rules: {
        roleNames: ["admin"],
      },
    },

    // Mobile App Features
    {
      key: "mobile-app",
      displayName: "Mobile App",
      description: "Enable mobile app specific features",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },
    {
      key: "biometric-auth",
      displayName: "Biometric Authentication",
      description: "Enable fingerprint/Face ID login for mobile",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },

    // Experimental/Beta Features
    {
      key: "ar-product-preview",
      displayName: "AR Product Preview",
      description: "View products in augmented reality",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },
    {
      key: "voice-search",
      displayName: "Voice Search",
      description: "Search products using voice commands",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },
    {
      key: "subscription-products",
      displayName: "Subscription Products",
      description: "Enable recurring subscription orders",
      scope: FeatureFlagScope.GLOBAL,
      isEnabled: false,
    },
  ]

  let seededCount = 0
  let skippedCount = 0
  let updatedCount = 0

  for (const flagData of featureFlags) {
    // Check if feature flag already exists
    const existingFlag = await featureFlagRepository.findOne({
      where: { key: flagData.key },
    })

    if (!existingFlag) {
      const flag = featureFlagRepository.create(flagData)
      await featureFlagRepository.save(flag)
      console.log(`✓ Seeded feature flag: ${flagData.key} (${flagData.isEnabled ? "enabled" : "disabled"})`)
      seededCount++
    } else {
      // Update description and rules if changed, but preserve enabled status
      if (
        existingFlag.description !== flagData.description ||
        JSON.stringify(existingFlag.rules) !== JSON.stringify(flagData.rules)
      ) {
        existingFlag.description = flagData.description
        existingFlag.rules = flagData.rules
        await featureFlagRepository.save(existingFlag)
        console.log(`↻ Updated feature flag: ${flagData.key}`)
        updatedCount++
      } else {
        console.log(`- Feature flag already exists: ${flagData.key}`)
        skippedCount++
      }
    }
  }

  console.log(`\n🎚️  Feature Flags seeding completed!`)
  console.log(`   ✓ Seeded: ${seededCount} flags`)
  console.log(`   ↻ Updated: ${updatedCount} flags`)
  console.log(`   - Skipped: ${skippedCount} flags (already exist)`)
  console.log(`   📊 Total in file: ${featureFlags.length} flags`)
  console.log(`   🟢 Enabled: ${featureFlags.filter((f) => f.isEnabled).length} flags`)
  console.log(`   🔴 Disabled: ${featureFlags.filter((f) => !f.isEnabled).length} flags\n`)
}
