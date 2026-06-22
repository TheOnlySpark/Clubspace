// src/app/terms/page.tsx
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: June 22, 2026
          </p>
          <div className="space-y-6 text-left w-full">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using ClubSpace ("Service"), you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you may not use the Service.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">2. Description of Service</h2>
              <p className="text-muted-foreground">
                ClubSpace is a platform for managing university student club memberships, events, and communications. We provide tools for club administration, event planning, member communication, and more.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">3. User Accounts</h2>
              <p className="text-muted-foreground">
                To access certain features, you must create an account. You agree to provide accurate information and to keep your account credentials secure.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">4. User Conduct</h2>
              <p className="text-muted-foreground">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You are responsible for your own contributions to the Service and for any consequences of your actions.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">5. Intellectual Property</h2>
              <p className="text-muted-foreground">
                The Service and its original content, features, and functionality are owned by ClubSpace and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">6. Third-Party Links</h2>
              <p className="text-muted-foreground">
                The Service may contain links to third-party websites or services. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">7. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground">
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis, without warranties of any kind, either express or implied, including but not limited to warranties of title or implied warranties of merchantability or fitness for a particular purpose.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, ClubSpace shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">9. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to defend, indemnify, and hold harmless ClubSpace and its officers, directors, employees, and agents, from and against any claims, liabilities, damages, losses, and expenses, arising out of or in connection with your use of the Service.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">10. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">11. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed and construed in accordance with the laws of South Africa, without regard to its conflict of law provisions.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">12. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide notice. Continued use of the Service after any such changes constitutes your acceptance of the new Terms.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">13. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us at legal@clubspace.example.
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