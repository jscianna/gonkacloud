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

            {/* CRITICAL WARNING BOX */}
            <section>
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-6 my-6">
                <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  🚨 CRITICAL PRIVACY WARNINGS — READ BEFORE USING
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-bold text-white text-lg mb-2">❌ NO ENCRYPTION ON INFERENCE NETWORK</p>
                    <p className="text-white/90">
                      The Gonka decentralized network does <strong>NOT</strong> use confidential computing or end-to-end encryption 
                      for inference processing. <strong>Node operators CAN potentially see your prompts and AI responses in plaintext.</strong>
                    </p>
                  </div>

                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-bold text-emerald-400 text-lg mb-2">✅ EPHEMERAL CHAT — WE DO NOT STORE YOUR CONVERSATIONS</p>
                    <p className="text-white/90">
                      Your chat history exists <strong>only in your browser memory</strong>. We do not store your prompts or AI responses 
                      on our servers. When you close your browser tab, your conversation is gone forever. This is by design for maximum privacy.
                    </p>
                  </div>

                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-bold text-white text-lg mb-2">🤖 APPLICATION BUILT WITH AI ASSISTANCE</p>
                    <p className="text-white/90">
                      This application was largely developed with the assistance of AI coding agents. While we strive for quality, 
                      the software may contain bugs, security vulnerabilities, or unexpected behaviors inherent to AI-assisted development.
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-red-900/30 rounded-lg border border-red-500/30">
                  <p className="font-bold text-red-300 text-lg mb-2">🚫 DO NOT SEND (Node operators can see this):</p>
                  <ul className="list-disc pl-5 space-y-1 text-white/90">
                    <li><strong>Passwords or authentication credentials</strong></li>
                    <li><strong>API keys, tokens, or secrets</strong></li>
                    <li><strong>Credit card numbers or financial account information</strong></li>
                    <li><strong>Social security numbers or government IDs</strong></li>
                    <li><strong>Medical records or health information</strong></li>
                    <li><strong>Trade secrets or confidential business data</strong></li>
                    <li><strong>Private keys or cryptocurrency seed phrases</strong></li>
                    <li><strong>Any information you need to remain confidential</strong></li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">2. Decentralized Network — No Confidential Compute</h2>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-4">
                <p className="font-semibold text-amber-400 mb-2">⚠️ NO ENCRYPTION DURING INFERENCE</p>
                <p>
                  Dogecat routes your AI requests through the Gonka decentralized network. This network operates 
                  <strong> WITHOUT confidential computing guarantees</strong>:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Node operators can see your prompts</strong> — Your input text is visible to the operators processing your request</li>
                  <li><strong>Node operators can see AI responses</strong> — The generated outputs are also visible during processing</li>
                  <li><strong>No end-to-end encryption</strong> — Data is not encrypted in a way that prevents node access</li>
                  <li><strong>No trusted execution environments</strong> — Processing does not occur in secure enclaves</li>
                  <li><strong>Operators may log data</strong> — Node operators may record, cache, or retain your data indefinitely</li>
                  <li><strong>Unknown jurisdictions</strong> — Nodes operate globally under varying legal frameworks</li>
                </ul>
              </div>
              <p className="font-semibold text-white">
                Treat every prompt as if it will be read by unknown third parties. Do not submit any data you 
                need to keep private or confidential.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">3. Ephemeral Chat — No Server-Side Storage</h2>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 my-4">
                <p className="font-semibold text-emerald-400 mb-2">✅ YOUR CHATS ARE NOT STORED ON OUR SERVERS</p>
                <p>
                  Dogecat uses an ephemeral chat model similar to Venice.ai:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Browser-only storage</strong> — Your conversations exist only in your browser memory</li>
                  <li><strong>No database storage</strong> — We do not save your prompts or AI responses to any database</li>
                  <li><strong>Close tab = gone</strong> — When you close your browser tab, the conversation is permanently deleted</li>
                  <li><strong>No chat history</strong> — You cannot retrieve previous conversations</li>
                  <li><strong>No backups</strong> — We have no backup copies of your chats because we never stored them</li>
                </ul>
              </div>
              <p>
                This design maximizes your privacy. Block Thyme, LLC cannot access, review, or disclose your conversation 
                content because we simply do not have it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">4. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-white/90 mt-4">4.1 Information You Provide</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account Information:</strong> Email address and profile information when you create an account</li>
                <li><strong>Payment Information:</strong> Billing address and payment details (processed by Stripe; we do not store full card numbers)</li>
                <li><strong>Communications:</strong> Information you provide when contacting support or providing feedback</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">4.2 Information We DO NOT Collect</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Chat content:</strong> We do not store your prompts or AI responses</li>
                <li><strong>Conversation history:</strong> We have no record of your conversations</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">4.3 Information Collected Automatically</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Usage Metrics:</strong> Token counts, timestamps, and model selections (but NOT the content of messages)</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Log Data:</strong> Server logs, error reports (excluding message content)</li>
                <li><strong>Cookies:</strong> Authentication tokens and session identifiers</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">4.4 Information from Third Parties</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Authentication providers (Clerk)</li>
                <li>Payment processors (Stripe — transaction confirmations only)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">5. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide, maintain, and improve the Service</li>
                <li>Route your inference requests to the Gonka network (content is not stored)</li>
                <li>Process payments and manage your subscription</li>
                <li>Track token usage for billing purposes (not content)</li>
                <li>Send transactional communications (receipts, account notifications)</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Monitor for abuse and violations of our Terms of Service</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">6. Data Retention</h2>
              
              <h3 className="text-lg font-medium text-white/90 mt-4">6.1 Block Thyme, LLC Retention</h3>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white mb-2">Our Data Retention Practices:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Chat content:</strong> NOT RETAINED — ephemeral by design</li>
                  <li><strong>Account data:</strong> Retained while your account is active, deleted within 30 days of account closure</li>
                  <li><strong>Usage metrics:</strong> Token counts retained for 90 days for billing reconciliation</li>
                  <li><strong>Payment records:</strong> Retained as required by law (typically 7 years)</li>
                </ul>
              </div>

              <h3 className="text-lg font-medium text-white/90 mt-4">6.2 Decentralized Network Retention</h3>
              <p className="text-amber-400">
                IMPORTANT: We cannot control data retention by Gonka network node operators. Your prompts and responses 
                may be logged, cached, or retained by independent node operators indefinitely. We have no technical 
                ability to delete such data from the decentralized network.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">7. Information Sharing and Disclosure</h2>
              <p>We may share your information in the following circumstances:</p>
              
              <h3 className="text-lg font-medium text-white/90 mt-4">7.1 Decentralized Network Processing</h3>
              <p>
                Your prompts and inputs are transmitted to Gonka network nodes for inference processing. Node operators 
                can see this data. This is essential to providing the Service and cannot be avoided.
              </p>

              <h3 className="text-lg font-medium text-white/90 mt-4">7.2 Service Providers</h3>
              <p>
                We share information with third-party service providers who perform services on our behalf:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Payment processing (Stripe)</li>
                <li>Authentication (Clerk)</li>
                <li>Cloud hosting (Vercel, Neon)</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">7.3 Legal Requirements</h3>
              <p>
                We may disclose information if required by law, subpoena, court order, or government request. However, 
                we cannot disclose chat content that we do not have — our ephemeral model means we have no conversation 
                data to produce.
              </p>

              <h3 className="text-lg font-medium text-white/90 mt-4">7.4 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your account information may be transferred 
                as part of that transaction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">8. Data Security</h2>
              <p>
                We implement reasonable technical and organizational measures to protect your information, including:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Encryption of data in transit (TLS/SSL)</li>
                <li>Secure authentication via Clerk</li>
                <li>No storage of sensitive chat content (cannot be breached if never stored)</li>
                <li>Access controls and authorization</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the internet is 100% secure. The decentralized Gonka network 
                presents additional privacy considerations as described in Section 2. You use the Service at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">9. Your Privacy Rights</h2>
              <p>
                Depending on your location, you may have certain rights regarding your personal information:
              </p>

              <h3 className="text-lg font-medium text-white/90 mt-4">9.1 General Rights</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Access:</strong> Request a copy of the account information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Export:</strong> Request your account data in a portable format</li>
                <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">9.2 Chat Content Rights</h3>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white mb-2">Regarding Chat History:</p>
                <p>
                  Because we do not store your chat content, many traditional data rights do not apply:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>We cannot provide copies of conversations — we do not have them</li>
                  <li>We cannot delete conversations from our systems — they were never stored</li>
                  <li>Right to be forgotten requests for chat content are automatically satisfied</li>
                </ul>
                <p className="mt-2 text-amber-400">
                  However, we cannot delete data that may have been retained by Gonka network node operators.
                </p>
              </div>

              <h3 className="text-lg font-medium text-white/90 mt-4">9.3 California Residents (CCPA)</h3>
              <p>
                California residents have additional rights under the CCPA. We do not sell personal information.
              </p>

              <h3 className="text-lg font-medium text-white/90 mt-4">9.4 European Residents (GDPR)</h3>
              <p>
                If you are in the EEA, you have rights under the GDPR. Given the decentralized nature of the 
                inference network and limitations on controlling data at the network layer, European users 
                should carefully consider whether to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">10. Cookies and Tracking Technologies</h2>
              <p>We use cookies and similar tracking technologies for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Essential cookies:</strong> Required for authentication and security</li>
                <li><strong>Functional cookies:</strong> Remember your preferences and settings</li>
              </ul>
              <p className="mt-4">
                We do not use advertising or extensive analytics cookies. You can control cookies through your 
                browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">11. Children&apos;s Privacy</h2>
              <p>
                The Service is not intended for users under the age of 18. We do not knowingly collect personal 
                information from children under 18. If we become aware that we have collected personal information 
                from a child under 18, we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">12. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. 
                The Gonka decentralized network operates globally, meaning your prompts may be processed by nodes in 
                various jurisdictions. By using the Service, you consent to such international transfers.
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
