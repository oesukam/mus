import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-foreground mb-8 text-balance">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: January 2025</p>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              By accessing or using LUXE's website and services, you agree to be bound by these Terms of Service. If you
              do not agree to these terms, please do not use our services.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Use of Our Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>You agree to use our services only for lawful purposes. You must not:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit harmful or malicious code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use our services for fraudulent purposes</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Registration</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              When you create an account, you must provide accurate and complete information. You are responsible for
              maintaining the confidentiality of your account credentials and for all activities that occur under your
              account.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders and Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order
              for any reason. Prices are subject to change without notice.
            </p>
            <p>
              Payment must be received before we dispatch your order. We accept credit cards, debit cards, and mobile
              money payments through secure payment processors.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              We strive to provide accurate product descriptions and images. However, we do not warrant that product
              descriptions, colors, or other content are accurate, complete, or error-free.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              All content on our website, including text, graphics, logos, and images, is the property of LUXE or its
              licensors and is protected by copyright and trademark laws.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              To the fullest extent permitted by law, LUXE shall not be liable for any indirect, incidental, special, or
              consequential damages arising from your use of our services.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately
              upon posting. Your continued use of our services constitutes acceptance of the modified terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              For questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@luxe.com" className="text-foreground hover:underline">
                legal@luxe.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
