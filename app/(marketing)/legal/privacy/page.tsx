import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Dogecat",
  description: "Privacy Policy for Dogecat decentralized AI inference service operated by Block Thyme, LLC.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <header className="fixed top-0 z-50 flex w-full items-center justify-between px-5 py-4 backdrop-blur-md bg-[#0a0a0b]/80">
        <Link href="/" className="text-xl font-semibold text-white hover:text-emerald-400 transition">
          dogecat
        </Link>
        <Link 
          href="/sign-in" 
          className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-400"
        >
          Sign In
        </Link>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-24">
        <div className="prose prose-invert prose-emerald max-w-none">
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-white/50 text-sm mb-8">Last updated: February 14, 2026</p>

          <div className="space-y-8 text-white/80">
            <section>
              <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
              <p>
                This Privacy Policy describes how Block Thyme, LLC ("Company," "we," "us," or "our") collects, uses, shares, 
                and protects information when you use the Dogecat service, website at dogecat.com, APIs, and related services 
                (collectively, the "Service").
              </p>
              <p>
                By using the Service, you consent to the practices described in this Privacy Policy. If you do not agree with 
                this Privacy Policy, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">2. Critical Disclosure: Decentralized Processing</h2>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-4">
                <p className="font-semibold text-amber-400 mb-2">⚠️ IMPORTANT: DECENTRALIZED DATA PROCESSING</p>
                <p>
                  Dogecat operates as an interface to the Gonka decentralized network. When you submit prompts or data to 
                  the Service, that data is transmitted to and processed by independent third-party node operators distributed 
                  globally. This has significant privacy implications:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Your prompts and inputs are transmitted to decentralized network nodes that we do not own, operate, or control</li>
                  <li>We cannot guarantee the privacy practices of individual node operators within the Gonka network</li>
                  <li>Node operators may be located in various jurisdictions with different data protection laws</li>
                  <li>We cannot technically enforce "Right to be Forgotten" (GDPR Article 17) requests on the decentralized network</li>
                  <li>Data transmitted to the network may be cached, logged, or retained by node operators</li>
                </ul>
              </div>
              <p className="font-semibold text-white">
                DO NOT submit sensitive personal information, trade secrets, confidential business information, 
                protected health information, or any data you would not want potentially visible to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">3. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-white/90 mt-4">3.1 Information You Provide</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account Information:</strong> Email address, username, password (hashed), and profile information when you create an account</li>
                <li><strong>Payment Information:</strong> Billing address and payment details (processed by our payment processors; we do not store full card numbers)</li>
                <li><strong>Prompts and Inputs:</strong> Text, files, or other content you submit to the AI models through the Service</li>
                <li><strong>Communications:</strong> Information you provide when contacting support or providing feedback</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">3.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Usage Data:</strong> API calls, timestamps, token counts, model selections, and usage patterns</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                <li><strong>Log Data:</strong> Server logs, error reports, and diagnostic information</li>
                <li><strong>Cookies:</strong> Authentication tokens, session identifiers, and analytics cookies</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">3.3 Information from Third Parties</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Authentication providers (if you sign in via OAuth)</li>
                <li>Payment processors (transaction confirmations)</li>
                <li>Analytics providers (aggregated usage data)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">4. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process your inference requests and route them to the Gonka network</li>
                <li>Process payments and manage your account</li>
                <li>Send transactional communications (receipts, account notifications)</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Monitor for abuse, fraud, and violations of our Terms of Service</li>
                <li>Comply with legal obligations</li>
                <li>Analyze usage patterns to improve our Service (in aggregate form)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">5. Data Retention</h2>
              
              <h3 className="text-lg font-medium text-white/90 mt-4">5.1 Block Thyme, LLC Retention</h3>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white mb-2">Our Data Retention Practices:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Account data:</strong> Retained while your account is active, deleted within 30 days of account closure</li>
                  <li><strong>Usage logs:</strong> Retained for 90 days for operational purposes</li>
                  <li><strong>Prompts/Inputs:</strong> We do not persistently store prompt content on our servers after processing</li>
                  <li><strong>Payment records:</strong> Retained as required by law (typically 7 years)</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium text-white/90 mt-4">5.2 Decentralized Network Retention</h3>
              <p className="text-amber-400">
                IMPORTANT: We cannot control data retention by Gonka network node operators. Your prompts may be logged, 
                cached, or retained by independent node operators, and we have no technical ability to delete such data 
                from the decentralized network.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">6. Information Sharing and Disclosure</h2>
              <p>We may share your information in the following circumstances:</p>
              
              <h3 className="text-lg font-medium text-white/90 mt-4">6.1 Decentralized Network Processing</h3>
              <p>
                Your prompts and inputs are transmitted to Gonka network nodes for inference processing. This is essential 
                to providing the Service and cannot be avoided.
              </p>

              <h3 className="text-lg font-medium text-white/90 mt-4">6.2 Service Providers</h3>
              <p>
                We share information with third-party service providers who perform services on our behalf, including:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Payment processors (Stripe, etc.)</li>
                <li>Cloud hosting providers</li>
                <li>Analytics providers</li>
                <li>Customer support tools</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">6.3 Legal Requirements</h3>
              <p>
                We may disclose information if required by law, subpoena, court order, or government request, or if we 
                believe disclosure is necessary to protect our rights, your safety, or the safety of others.
              </p>

              <h3 className="text-lg font-medium text-white/90 mt-4">6.4 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of 
                that transaction.
              </p>

              <h3 className="text-lg font-medium text-white/90 mt-4">6.5 With Your Consent</h3>
              <p>
                We may share information with third parties when you have given us explicit consent to do so.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">7. Data Security</h2>
              <p>
                We implement reasonable technical and organizational measures to protect your information, including:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Encryption of data in transit (TLS/SSL)</li>
                <li>Secure authentication mechanisms</li>
                <li>Access controls and authorization</li>
                <li>Regular security assessments</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the internet or electronic storage is 100% secure. We cannot 
                guarantee absolute security, particularly given the decentralized nature of the Gonka network. You use 
                the Service at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">8. Your Privacy Rights</h2>
              <p>
                Depending on your location, you may have certain rights regarding your personal information:
              </p>

              <h3 className="text-lg font-medium text-white/90 mt-4">8.1 General Rights</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data (subject to legal retention requirements)</li>
                <li><strong>Export:</strong> Request your data in a portable format</li>
                <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">8.2 Limitations on Rights</h3>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white mb-2">Important Limitations:</p>
                <p>
                  Due to the decentralized nature of the Gonka network, we cannot guarantee fulfillment of certain rights 
                  with respect to data that has been transmitted to network nodes. Specifically:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>We cannot delete prompts or data that has been processed by or cached on decentralized nodes</li>
                  <li>We cannot provide access to data held by independent node operators</li>
                  <li>"Right to be Forgotten" requests cannot be technically enforced on the network</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium text-white/90 mt-4">8.3 California Residents (CCPA)</h3>
              <p>
                California residents have additional rights under the California Consumer Privacy Act (CCPA), including 
                the right to know what personal information is collected, the right to delete, and the right to opt-out 
                of the sale of personal information. We do not sell personal information.
              </p>

              <h3 className="text-lg font-medium text-white/90 mt-4">8.4 European Residents (GDPR)</h3>
              <p>
                If you are in the European Economic Area (EEA), you have rights under the General Data Protection 
                Regulation (GDPR). Our legal basis for processing personal data includes consent, contractual necessity, 
                and legitimate interests. Given the decentralized nature of the Service and limitations on enforcing 
                data subject rights, we recommend European users carefully consider whether to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">9. Cookies and Tracking Technologies</h2>
              <p>We use cookies and similar tracking technologies for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Essential cookies:</strong> Required for authentication and security</li>
                <li><strong>Functional cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics cookies:</strong> Understand how users interact with our Service</li>
              </ul>
              <p className="mt-4">
                You can control cookies through your browser settings. Disabling certain cookies may affect Service functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">10. Children's Privacy</h2>
              <p>
                The Service is not intended for users under the age of 18. We do not knowingly collect personal information 
                from children under 18. If we become aware that we have collected personal information from a child under 18, 
                we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">11. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. 
                The Gonka decentralized network operates globally, meaning your prompts may be processed by nodes in 
                various jurisdictions. By using the Service, you consent to such international transfers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">12. Third-Party Links</h2>
              <p>
                The Service may contain links to third-party websites or services. We are not responsible for the privacy 
                practices of such third parties. We encourage you to read the privacy policies of any third-party sites 
                you visit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">13. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting 
                the updated policy with a new "Last Updated" date. Your continued use of the Service after changes 
                constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">14. Contact Us</h2>
              <p>
                For questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white">Block Thyme, LLC</p>
                <p>Email: privacy@dogecat.com</p>
                <p>Website: dogecat.com</p>
              </div>
              <p>
                For GDPR-related inquiries, you may also contact the relevant supervisory authority in your jurisdiction.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="mx-auto max-w-3xl flex flex-wrap justify-center gap-6 text-sm text-white/40">
          <Link href="/legal/terms" className="hover:text-white/60 transition">Terms of Service</Link>
          <Link href="/legal/privacy" className="hover:text-white/60 transition">Privacy Policy</Link>
          <Link href="/legal/acceptable-use" className="hover:text-white/60 transition">Acceptable Use</Link>
          <Link href="/legal/disclaimer" className="hover:text-white/60 transition">Disclaimer</Link>
        </div>
        <p className="text-center text-xs text-white/30 mt-4">© 2026 Block Thyme, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
