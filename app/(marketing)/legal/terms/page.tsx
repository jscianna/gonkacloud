import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Dogecat",
  description: "Terms of Service for Dogecat decentralized AI inference service operated by Block Thyme, LLC.",
};

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-white/50 text-sm mb-8">Last updated: February 14, 2026</p>

          <div className="space-y-8 text-white/80">
            
            {/* CRITICAL WARNING BOX - FIRST THING USERS SEE */}
            <section>
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-6 my-2">
                <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  🚨 IMPORTANT WARNINGS — PLEASE READ
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-bold text-white text-lg mb-2">❌ NO ENCRYPTION — NODE OPERATORS CAN SEE YOUR DATA</p>
                    <p className="text-white/90">
                      The Gonka network does NOT use confidential computing. <strong>Third-party node operators can potentially 
                      view your prompts and AI responses.</strong> Do not send any sensitive or confidential information.
                    </p>
                  </div>

                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-bold text-white text-lg mb-2">💾 CHAT HISTORY STORED WITHOUT E2E ENCRYPTION</p>
                    <p className="text-white/90">
                      Your conversations are stored in our database in plaintext. While we don't actively monitor chats, 
                      Block Thyme, LLC has technical access to stored data.
                    </p>
                  </div>

                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-bold text-white text-lg mb-2">🤖 APPLICATION BUILT WITH AI ASSISTANCE</p>
                    <p className="text-white/90">
                      This application was largely developed by AI coding agents. The software may contain bugs, 
                      security vulnerabilities, or unexpected behaviors. <strong>Use at your own risk.</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-red-900/30 rounded-lg border border-red-500/30">
                  <p className="font-bold text-red-300 text-lg mb-2">🚫 NEVER SEND THROUGH THIS SERVICE:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-white/90">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Passwords or login credentials</li>
                      <li>API keys or access tokens</li>
                      <li>Credit card or bank info</li>
                      <li>Social security numbers</li>
                    </ul>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Medical/health records</li>
                      <li>Private keys or seed phrases</li>
                      <li>Trade secrets</li>
                      <li>Any confidential data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white">1. Agreement to Terms</h2>
              <p>
                These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") 
                and Block Thyme, LLC ("Company," "we," "us," or "our"), a Delaware limited liability company, governing your 
                access to and use of the Dogecat service, website located at dogecat.com, APIs, and any related services 
                (collectively, the "Service").
              </p>
              <p>
                By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by 
                these Terms. If you do not agree to these Terms, you may not access or use the Service.
              </p>
              <p className="font-semibold text-emerald-400">
                IMPORTANT: THE SERVICE IS PROVIDED ON A DECENTRALIZED NETWORK. BY USING THIS SERVICE, YOU ACKNOWLEDGE AND 
                ACCEPT THAT ONCE A REQUEST IS SUBMITTED TO THE NETWORK, IT CANNOT BE CANCELED, DELETED, OR MODIFIED.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">2. Description of Service</h2>
              <p>
                Dogecat provides an interface and gateway to access artificial intelligence inference services running on the 
                Gonka decentralized network ("Gonka Network"). The Service functions as a front-end access layer to third-party, 
                independently operated computing nodes that process AI inference requests.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-4">
                <p className="font-semibold text-amber-400 mb-2">⚠️ NO CONFIDENTIAL COMPUTING</p>
                <p className="mb-2">
                  The Gonka Network does NOT provide confidential computing or end-to-end encryption for inference:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Node operators can see your prompts</strong> — Your input is visible to processors</li>
                  <li><strong>Node operators can see responses</strong> — AI outputs are visible during generation</li>
                  <li><strong>No trusted execution environments</strong> — Processing is not in secure enclaves</li>
                  <li><strong>Data may be logged</strong> — Operators may record your interactions</li>
                </ul>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white mb-2">Critical Notice Regarding Decentralized Infrastructure:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Block Thyme, LLC does not own, operate, control, or manage the Gonka Network nodes</li>
                  <li>Once an inference request is broadcast to the network, it cannot be canceled, stopped, deleted, or modified by us</li>
                  <li>We have no ability to monitor, filter, or intervene in inference processes once they begin</li>
                  <li>The decentralized nature of the network means processing occurs across multiple independent third-party operators</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white">3. AI-Assisted Development Disclosure</h2>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 my-4">
                <p className="font-semibold text-purple-400 mb-2">🤖 Experimental Software Notice</p>
                <p>
                  This application was substantially developed with the assistance of AI coding agents and automated tools. 
                  As a result:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>The software may contain bugs, errors, or unexpected behaviors</li>
                  <li>Security vulnerabilities may exist that have not been identified</li>
                  <li>The codebase may include AI-generated code that has not been fully audited</li>
                  <li>Features may not work as expected in all circumstances</li>
                </ul>
                <p className="mt-2 font-semibold text-white">
                  This Service is provided on an experimental, "as-is" basis. Use at your own risk.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">4. Eligibility</h2>
              <p>
                You must be at least eighteen (18) years of age to use this Service. By using the Service, you represent and 
                warrant that you are at least 18 years old and have the legal capacity to enter into these Terms. If you are 
                using the Service on behalf of an organization, you represent and warrant that you have authority to bind that 
                organization to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">5. Account Registration</h2>
              <p>
                To access certain features of the Service, you may be required to create an account. You agree to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="mt-4">
                By creating an account, you acknowledge that you have read and agree to be bound by these Terms of Service, 
                our <Link href="/legal/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>, and our{" "}
                <Link href="/legal/acceptable-use" className="text-emerald-400 hover:underline">Acceptable Use Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">6. Service Availability and Best-Effort Basis</h2>
              <p>
                THE SERVICE IS PROVIDED ON A "BEST-EFFORT" BASIS. We explicitly disclaim any guarantee of:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>24/7 or continuous availability</li>
                <li>Specific response times or latency</li>
                <li>Successful completion of inference requests</li>
                <li>Accuracy, reliability, or quality of outputs</li>
                <li>Uptime percentages or service level agreements (SLAs)</li>
              </ul>
              <p className="mt-4">
                The low-cost nature of our Service reflects its best-effort, experimental nature. The Service is not designed 
                for, and should not be used in, mission-critical applications, real-time systems, or any application where 
                failure or inaccuracy could result in harm, damage, or significant consequences.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, 
                with or without notice, and without liability to you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">7. AI Output Disclaimers</h2>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-4">
                <p className="font-semibold text-amber-400 mb-2">⚠️ IMPORTANT AI DISCLAIMER</p>
                <p>
                  AI models are probabilistic systems that may generate content that is false, inaccurate, biased, misleading, 
                  incomplete, or harmful ("hallucinations"). Outputs should never be relied upon as factual or accurate without 
                  independent verification.
                </p>
              </div>
              <p>
                <strong>No Professional Advice:</strong> AI outputs are provided for informational and entertainment purposes only. 
                They do not constitute and should never be relied upon as:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Medical, health, or therapeutic advice</li>
                <li>Legal advice or legal opinions</li>
                <li>Financial, investment, or tax advice</li>
                <li>Professional engineering or architectural guidance</li>
                <li>Any other form of professional counsel</li>
              </ul>
              <p className="mt-4">
                <strong>User Responsibility:</strong> You are solely responsible for:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Evaluating and verifying all AI-generated outputs before any use</li>
                <li>Any decisions made based on AI outputs</li>
                <li>Any actions taken in reliance on AI outputs</li>
                <li>Any consequences resulting from your use of AI outputs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">8. Prohibited Uses</h2>
              <p>
                You agree not to use the Service for any purpose that is unlawful or prohibited by these Terms or applicable law. 
                See our <Link href="/legal/acceptable-use" className="text-emerald-400 hover:underline">Acceptable Use Policy</Link>{" "}
                for detailed prohibited uses, including but not limited to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Generating illegal content, including child sexual abuse material (CSAM)</li>
                <li>Generating content that promotes violence, terrorism, or hate</li>
                <li>Creating malware, viruses, or tools for cyberattacks</li>
                <li>Harassment, stalking, or threatening behavior</li>
                <li>Use in critical infrastructure, autonomous weapons, or real-time medical diagnostics</li>
                <li>Attempts to extract, distill, or reverse-engineer model weights</li>
              </ul>
              <p className="mt-4">
                While we cannot technically prevent or stop prohibited uses once requests are submitted to the decentralized 
                network, we reserve the right to terminate your account, deny future access, and report illegal activity to 
                appropriate authorities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">9. Payment Terms and No Refund Policy</h2>
              <p>
                Payment for the Service may be required for certain features or usage tiers. By making a payment, you agree to our 
                payment terms and acknowledge:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All fees are quoted and payable in USD unless otherwise specified</li>
                <li>Fees are non-refundable except as required by applicable law</li>
                <li>Unused credits or prepaid amounts do not rollover and are non-refundable</li>
                <li>We may change pricing at any time with notice to existing subscribers</li>
              </ul>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white">NO REFUND POLICY</p>
                <p className="mt-2">
                  Due to the nature of the Service and the immediate consumption of computational resources upon request submission, 
                  all purchases are final and non-refundable. This includes situations where:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>AI outputs do not meet your expectations</li>
                  <li>You change your mind about using the Service</li>
                  <li>Network issues affect request processing</li>
                  <li>Service interruptions occur</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">10. Intellectual Property</h2>
              <p>
                <strong>Our Property:</strong> The Service, including its design, code, branding, and documentation (excluding 
                AI-generated outputs), is owned by Block Thyme, LLC and protected by intellectual property laws.
              </p>
              <p>
                <strong>Your Content:</strong> You retain ownership of inputs you submit to the Service. You grant us a limited 
                license to process your inputs solely for the purpose of providing the Service.
              </p>
              <p>
                <strong>AI Outputs:</strong> Subject to applicable law and these Terms, you may use AI-generated outputs for 
                lawful purposes. We make no representations regarding ownership or originality of AI outputs, and you assume 
                all responsibility for ensuring your use complies with applicable laws, including intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">11. Disclaimer of Warranties</h2>
              <p className="uppercase font-semibold">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, 
                STATUTORY, OR OTHERWISE. WE SPECIFICALLY DISCLAIM ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
                PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p className="mt-4">
                WITHOUT LIMITING THE FOREGOING, WE DO NOT WARRANT THAT:
              </p>
              <ul className="list-disc pl-5 space-y-1 uppercase">
                <li>The Service will be uninterrupted, error-free, or secure</li>
                <li>Any defects or errors will be corrected</li>
                <li>AI outputs will be accurate, reliable, complete, or current</li>
                <li>The Service will meet your requirements or expectations</li>
                <li>The decentralized network will process your requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">12. Limitation of Liability</h2>
              <p className="uppercase font-semibold">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL BLOCK THYME, LLC, ITS AFFILIATES, OFFICERS, 
                DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR 
                PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION:
              </p>
              <ul className="list-disc pl-5 space-y-1 uppercase">
                <li>Loss of profits, revenue, data, or goodwill</li>
                <li>Cost of substitute services</li>
                <li>Damages arising from AI output inaccuracy or hallucinations</li>
                <li>Damages arising from decentralized network operations</li>
                <li>Damages arising from service interruptions</li>
              </ul>
              <p className="mt-4 font-semibold">
                OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL 
                NOT EXCEED THE GREATER OF: (A) THE AMOUNTS YOU PAID TO US IN THE THREE (3) MONTHS PRECEDING THE CLAIM, OR (B) 
                ONE HUNDRED U.S. DOLLARS ($100.00).
              </p>
              <p className="mt-4">
                THE LIMITATIONS IN THIS SECTION APPLY REGARDLESS OF THE THEORY OF LIABILITY, WHETHER BASED ON WARRANTY, 
                CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT WE 
                HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">13. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Block Thyme, LLC, its affiliates, officers, directors, 
                employees, agents, and licensors from and against any and all claims, damages, losses, liabilities, costs, 
                and expenses (including reasonable attorneys' fees) arising out of or relating to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any applicable law or regulation</li>
                <li>Your content or inputs submitted to the Service</li>
                <li>Your use of AI-generated outputs</li>
                <li>Any claims by third parties related to your activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">14. Termination</h2>
              <p>
                We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any 
                reason, including if you breach these Terms. Upon termination:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your right to use the Service immediately ceases</li>
                <li>Any unused credits or prepaid amounts are forfeited</li>
                <li>We may delete your account and data</li>
                <li>Provisions that by their nature should survive termination shall survive</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">15. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, 
                without regard to its conflict of law principles.
              </p>
              <p className="mt-4">
                <strong>Arbitration:</strong> Any dispute arising out of or relating to these Terms or the Service shall be 
                resolved by binding arbitration administered by the American Arbitration Association in accordance with its 
                Commercial Arbitration Rules. The arbitration shall take place in Wilmington, Delaware. The arbitrator's 
                decision shall be final and binding, and judgment may be entered in any court of competent jurisdiction.
              </p>
              <p className="mt-4">
                <strong>Class Action Waiver:</strong> YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED 
                ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">16. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the 
                updated Terms on the Service with a new "Last Updated" date. Your continued use of the Service after changes 
                become effective constitutes your acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">17. Miscellaneous</h2>
              <p>
                <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy and Acceptable Use Policy, 
                constitute the entire agreement between you and Block Thyme, LLC regarding the Service.
              </p>
              <p>
                <strong>Severability:</strong> If any provision of these Terms is held invalid or unenforceable, that provision 
                will be enforced to the maximum extent permissible and the other provisions will remain in full force and effect.
              </p>
              <p>
                <strong>Waiver:</strong> Our failure to enforce any right or provision shall not be deemed a waiver of such 
                right or provision.
              </p>
              <p>
                <strong>Assignment:</strong> You may not assign or transfer these Terms without our prior written consent. 
                We may assign these Terms without restriction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">18. Contact Information</h2>
              <p>
                For questions about these Terms, please contact us at:
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white">Block Thyme, LLC</p>
                <p>Email: legal@dogecat.com</p>
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
