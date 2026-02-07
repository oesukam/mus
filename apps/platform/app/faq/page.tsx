import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { StructuredData } from "@/components/structured-data"
import { generateFAQSchema } from "@/lib/structured-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions",
  description:
    "Find answers to common questions about shopping at MUS including shipping, returns, payments, and more.",
  openGraph: {
    title: "FAQ - Frequently Asked Questions | MUS",
    description: "Get answers to your questions about shopping, shipping, returns, and more at MUS.",
  },
}

export default function FAQPage() {
  const faqData = [
    {
      question: "How long does shipping take?",
      answer:
        "Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 business day delivery. International orders may take 7-14 business days depending on the destination.",
    },
    {
      question: "Do you offer free shipping?",
      answer:
        "Yes! We offer free standard shipping on all orders over $50. Orders under $50 have a flat shipping rate of $5.99.",
    },
    {
      question: "Do you ship internationally?",
      answer:
        "Yes, we ship to 10 countries worldwide including the United States, United Kingdom, Canada, Australia, Germany, France, Ghana, Nigeria, South Africa, and Kenya.",
    },
    {
      question: "What is your return policy?",
      answer:
        "We offer a 30-day return policy on most items. Products must be unused, in original packaging, and in the same condition you received them.",
    },
    {
      question: "When will I receive my refund?",
      answer:
        "Refunds are processed within 5-7 business days after we receive your returned item. The refund will be issued to your original payment method.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Shop Pay.",
    },
    {
      question: "Is my payment information secure?",
      answer:
        "Yes, absolutely. We use industry-standard SSL encryption to protect your payment information. All transactions are processed through secure, PCI-compliant payment gateways.",
    },
    {
      question: "Do I need an account to place an order?",
      answer:
        "No, you can checkout as a guest. However, creating an account allows you to track orders, save items to your wishlist, and enjoy faster checkout.",
    },
  ]

  return (
    <>
      <StructuredData data={generateFAQSchema(faqData)} />

      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">Frequently Asked Questions</h1>
            <p className="text-lg text-muted-foreground">Find answers to common questions about shopping at MUS</p>
          </div>

          <div className="space-y-8">
            {/* Shipping & Delivery */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Shipping & Delivery</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="shipping-1">
                  <AccordionTrigger>How long does shipping take?</AccordionTrigger>
                  <AccordionContent>
                    Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 business
                    day delivery. International orders may take 7-14 business days depending on the destination.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shipping-2">
                  <AccordionTrigger>Do you offer free shipping?</AccordionTrigger>
                  <AccordionContent>
                    Yes! We offer free standard shipping on all orders over $50. Orders under $50 have a flat shipping
                    rate of $5.99. Express shipping is available for an additional fee.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shipping-3">
                  <AccordionTrigger>Do you ship internationally?</AccordionTrigger>
                  <AccordionContent>
                    Yes, we ship to 10 countries worldwide including the United States, United Kingdom, Canada,
                    Australia, Germany, France, Ghana, Nigeria, South Africa, and Kenya. Visit our{" "}
                    <a href="/delivery-coverage" className="underline hover:text-foreground">
                      delivery coverage page
                    </a>{" "}
                    to see all supported cities. International shipping rates and delivery times vary by location.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shipping-4">
                  <AccordionTrigger>Can I track my order?</AccordionTrigger>
                  <AccordionContent>
                    Once your order ships, you'll receive a tracking number via email. You can also track your order by
                    visiting the Orders page in your account and clicking "Track Order" on any shipped item.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Returns & Refunds */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Returns & Refunds</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="returns-1">
                  <AccordionTrigger>What is your return policy?</AccordionTrigger>
                  <AccordionContent>
                    We offer a 30-day return policy on most items. Products must be unused, in original packaging, and
                    in the same condition you received them. Some items like personalized products or final sale items
                    cannot be returned.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="returns-2">
                  <AccordionTrigger>How do I start a return?</AccordionTrigger>
                  <AccordionContent>
                    To start a return, log into your account, go to your Orders page, and click "Return Item" on the
                    order you wish to return. Follow the prompts to print your return label and ship the item back to
                    us.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="returns-3">
                  <AccordionTrigger>When will I receive my refund?</AccordionTrigger>
                  <AccordionContent>
                    Refunds are processed within 5-7 business days after we receive your returned item. The refund will
                    be issued to your original payment method. Please allow an additional 3-5 business days for the
                    refund to appear in your account.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="returns-4">
                  <AccordionTrigger>Do I have to pay for return shipping?</AccordionTrigger>
                  <AccordionContent>
                    Return shipping is free for defective or incorrect items. For standard returns, a $5.99 return
                    shipping fee will be deducted from your refund. Premium members enjoy free returns on all orders.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Orders & Payment */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Orders & Payment</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="orders-1">
                  <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                  <AccordionContent>
                    We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay,
                    Google Pay, and Shop Pay. All payments are processed securely through encrypted connections.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="orders-2">
                  <AccordionTrigger>Can I modify or cancel my order?</AccordionTrigger>
                  <AccordionContent>
                    Orders can be modified or cancelled within 1 hour of placement. After that, orders are processed and
                    cannot be changed. If you need to make changes, please contact our customer service team
                    immediately.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="orders-3">
                  <AccordionTrigger>Is my payment information secure?</AccordionTrigger>
                  <AccordionContent>
                    Yes, absolutely. We use industry-standard SSL encryption to protect your payment information. We
                    never store your full credit card details on our servers. All transactions are processed through
                    secure, PCI-compliant payment gateways.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="orders-4">
                  <AccordionTrigger>Do you offer gift cards?</AccordionTrigger>
                  <AccordionContent>
                    Yes! Digital gift cards are available in denominations from $25 to $500. They can be purchased on
                    our website and are delivered via email instantly. Gift cards never expire and can be used for any
                    products on our site.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Account & Privacy */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Account & Privacy</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="account-1">
                  <AccordionTrigger>Do I need an account to place an order?</AccordionTrigger>
                  <AccordionContent>
                    No, you can checkout as a guest. However, creating an account allows you to track orders, save items
                    to your wishlist, manage your addresses, and enjoy faster checkout on future purchases.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="account-2">
                  <AccordionTrigger>How do I reset my password?</AccordionTrigger>
                  <AccordionContent>
                    Click "Sign In" in the header, then click "Forgot Password?" Enter your email address and we'll send
                    you a link to reset your password. The link expires after 24 hours for security purposes.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="account-3">
                  <AccordionTrigger>How is my personal information used?</AccordionTrigger>
                  <AccordionContent>
                    We use your information only to process orders, improve your shopping experience, and send you
                    updates about your orders. We never sell your personal information to third parties. Read our
                    Privacy Policy for complete details.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="account-4">
                  <AccordionTrigger>Can I delete my account?</AccordionTrigger>
                  <AccordionContent>
                    Yes, you can delete your account at any time from your Account Settings page. Please note that
                    deleting your account will remove your order history, wishlist, and saved addresses. This action
                    cannot be undone.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Products & Stock */}
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Products & Stock</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="products-1">
                  <AccordionTrigger>How do I know if an item is in stock?</AccordionTrigger>
                  <AccordionContent>
                    Stock availability is shown on each product page. Items marked "In Stock" are available for
                    immediate shipping. "Low Stock" items have limited quantities. "Out of Stock" items can be added to
                    your wishlist, and you'll be notified when they're back in stock.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="products-2">
                  <AccordionTrigger>Do you restock sold-out items?</AccordionTrigger>
                  <AccordionContent>
                    Most items are restocked regularly. Add out-of-stock items to your wishlist to receive email
                    notifications when they're available again. Restocking times vary by product and supplier.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="products-3">
                  <AccordionTrigger>Are your product images accurate?</AccordionTrigger>
                  <AccordionContent>
                    We strive to display products as accurately as possible. However, colors may vary slightly due to
                    monitor settings and lighting. Product dimensions and specifications are listed on each product page
                    for your reference.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="products-4">
                  <AccordionTrigger>Do you offer product warranties?</AccordionTrigger>
                  <AccordionContent>
                    Many of our products come with manufacturer warranties. Warranty information is listed on individual
                    product pages when applicable. We also offer extended warranty options at checkout for eligible
                    electronics and appliances.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              Can't find the answer you're looking for? Our customer service team is here to help.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
