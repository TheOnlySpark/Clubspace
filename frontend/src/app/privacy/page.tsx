// src/app/privacy/page.tsx
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: June 22, 2026
          </p>
          <div className="space-y-6 text-left w-full">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">1. Introduction</h2>
              <p className="text-muted-foreground">
                ClubSpace (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">2. Information We Collect</h2>
              <p className="text-muted-foreground">
                We may collect personal information such as your name, email address, university affiliation, and other data you provide when registering for an account or using our service.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">3. How We Use Your Information</h2>
              <p className="text-muted-foreground">
                We use your information to provide, maintain, and improve our service, to communicate with you, and to comply with legal obligations.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">4. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground">
                We do not sell your personal information. We may share your data with trusted third parties who assist us in operating our service, conducting business, or serving you, as long as those parties agree to keep this information confidential.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">5. Your Rights</h2>
              <p className="text-muted-foreground">
                You have the right to access, correct, or delete your personal information. You can exercise these rights through your account settings or by contacting us directly.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">6. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">7. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your own. We ensure adequate protection for such transfers in accordance with applicable data protection laws.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">8. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. The updated version will be effective immediately upon posting unless otherwise specified.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">9. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at privacy@clubspace.example.
              </p>
            </div>
          </div>

          <Link href="/" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}