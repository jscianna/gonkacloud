import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Disclaimer | Dogecat",
  description: "Service Disclaimer for Dogecat decentralized AI inference service operated by Block Thyme, LLC.",
};

export default function ServiceDisclaimer() {
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
          <h1 className="text-3xl font-bold text-white mb-2">Service Disclaimer</h1>
          <p className="text-white/50 text-sm mb-8">Last updated: February 14, 2026</p>

          <div className="space-y-8 text-white/80">
            
            {/* Critical Warning Box */}
            <section>
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-6 my-6">
                <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  🚨 CRITICAL WARNINGS — READ BEFORE USING
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-bold text-white text-lg mb-2">🚫 NOT FOR MISSION-CRITICAL APPLICATIONS</p>
                    <p className="text-white/90">
                      This Service is provided on an experimental, best-effort basis. Do not use for any application 
                      where failure could result in death, injury, financial loss, or serious consequences.
                    </p>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-bold text-white text-lg mb-2">❌ NO ENCRYPTION — YOUR DATA IS VISIBLE</p>
                    <p className="text-white/90">
                      The Gonka network does NOT use confidential computing. <strong>Third-party node operators 
                      can see your prompts and AI responses in plaintext.</strong> Never send sensitive data.
                    </p>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-bold text-white text-lg mb-2">💾 CHAT HISTORY IS NOT END-TO-END ENCRYPTED</p>
                    <p className="text-white/90">
                      Conversations are stored in our database in plaintext. Block Thyme, LLC technically has 
                      access to stored chat data. We don't actively monitor, but data is accessible.
                    </p>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="font-bold text-white text-lg mb-2">🤖 BUILT BY AI AGENTS — USE AT YOUR OWN RISK</p>
                    <p className="text-white/90">
                      This application was largely developed by AI coding agents. It may contain bugs, security 
                      vulnerabilities, or unexpected behaviors. <strong>This is experimental software.</strong>
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-red-900/30 rounded-lg border border-red-500/30">
                  <p className="font-bold text-red-300 text-lg mb-2">🚫 NEVER SEND THROUGH THIS SERVICE:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-white/90">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Passwords or login credentials</li>
                      <li>API keys, tokens, or secrets</li>
                      <li>Credit card / bank account numbers</li>
                      <li>Social security numbers</li>
                    </ul>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Medical / health records</li>
                      <li>Private keys or seed phrases</li>
                      <li>Trade secrets or confidential IP</li>
                      <li>Any data requiring confidentiality</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">1. No Confidential Computing</h2>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-4">
                <p className="font-semibold text-amber-400 mb-2">⚠️ NODE OPERATORS CAN SEE YOUR DATA</p>
                <p className="mb-2">
                  The Gonka decentralized network does <strong>NOT</strong> employ:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>End-to-end encryption for inference processing</li>
                  <li>Confidential computing or trusted execution environments (TEEs)</li>
                  <li>Secure enclaves that prevent operator access</li>
                  <li>Homomorphic encryption or other privacy-preserving computation</li>
                </ul>
                <p className="mt-3">
                  <strong>This means:</strong> When you submit a prompt, the third-party node operator processing 
                  your request can potentially read your prompt text and the AI's response. Treat every interaction 
                  as if it will be viewed by unknown parties.
                </p>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white">2. Chat Storage Practices</h2>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white mb-2">💾 How Your Conversations Are Stored</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Chat history is stored in our PostgreSQL database</li>
                  <li>Storage is <strong>NOT end-to-end encrypted</strong></li>
                  <li>Block Thyme, LLC has technical access to stored conversations</li>
                  <li>We do not actively monitor or review chats under normal operations</li>
                  <li>We may access data for: legal compliance, abuse investigation, or user-requested support</li>
                  <li>Database backups contain chat history in readable form</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-white">3. AI-Assisted Development</h2>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 my-4">
                <p className="font-semibold text-purple-400 mb-2">🤖 This Application Was Built by AI Agents</p>
                <p className="mb-2">
                  A significant portion of this application's codebase was written by AI coding agents. 
                  This means:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The software may contain bugs or unexpected behaviors</li>
                  <li>Security vulnerabilities may exist that have not been identified</li>
                  <li>The code has not undergone traditional human code review for all components</li>
                  <li>Edge cases may not be handled properly</li>
                  <li>The application is experimental in nature</li>
                </ul>
                <p className="mt-3 font-semibold text-white">
                  Use this Service at your own risk. We make no guarantees about the quality, security, 
                  or reliability of AI-generated code.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">4. Nature of the Service</h2>
              <p>
                Dogecat is a service operated by Block Thyme, LLC that provides an interface to access AI inference 
                capabilities through the Gonka decentralized network. By using this Service, you acknowledge and 
                understand:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Decentralized Infrastructure:</strong> The AI inference processing occurs on a network of 
                  independent, third-party nodes that we do not own, operate, or control.
                </li>
                <li>
                  <strong>Experimental Technology:</strong> This Service utilizes experimental decentralized technology. 
                  Performance, reliability, and results may vary significantly.
                </li>
                <li>
                  <strong>No Control Over Processing:</strong> Once a request is submitted to the Gonka network, 
                  we cannot cancel, stop, modify, or delete it.
                </li>
                <li>
                  <strong>Low-Cost Reflects Nature:</strong> Our low pricing reflects the best-effort, experimental 
                  nature of the Service, not the quality appropriate for production or critical systems.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">5. AI Hallucination Warning</h2>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-4">
                <p className="font-semibold text-amber-400 mb-2">⚠️ AI OUTPUTS MAY BE WRONG</p>
                <p className="text-white/90">
                  Artificial intelligence models are probabilistic systems that generate outputs based on patterns 
                  in training data. They can and do produce content that is:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Factually incorrect</strong> — AI can confidently state false information</li>
                  <li><strong>Fabricated</strong> — AI can invent facts, citations, quotes, and sources that don't exist</li>
                  <li><strong>Biased</strong> — AI outputs may reflect biases present in training data</li>
                  <li><strong>Inconsistent</strong> — The same prompt may yield different results</li>
                  <li><strong>Outdated</strong> — AI knowledge has training cutoff dates</li>
                  <li><strong>Misleading</strong> — Correct-sounding but fundamentally wrong</li>
                  <li><strong>Harmful</strong> — Despite safety measures, potentially dangerous content may be generated</li>
                </ul>
              </div>
              <p className="font-semibold text-white">
                NEVER rely on AI outputs without independent verification from authoritative sources.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">6. No Professional Advice</h2>
              <p>
                AI-generated outputs from this Service are for <strong>informational and entertainment purposes only</strong>. 
                They do not constitute and should never be used as a substitute for:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="font-semibold text-white">🏥 Medical Advice</p>
                  <p className="text-sm text-white/70">
                    Do not use for diagnosis, treatment decisions, medication information, or any health-related guidance. 
                    Always consult qualified healthcare professionals.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="font-semibold text-white">⚖️ Legal Advice</p>
                  <p className="text-sm text-white/70">
                    Do not use for legal opinions, case strategy, contract interpretation, or regulatory compliance. 
                    Consult a licensed attorney.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="font-semibold text-white">💰 Financial Advice</p>
                  <p className="text-sm text-white/70">
                    Do not use for investment decisions, tax planning, retirement strategies, or financial planning. 
                    Consult a licensed financial advisor.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="font-semibold text-white">🔧 Professional Services</p>
                  <p className="text-sm text-white/70">
                    Do not use for engineering, architecture, therapy, accounting, or any other professional service 
                    requiring licensed practitioners.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">7. Service Availability</h2>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white mb-2">NO SERVICE LEVEL AGREEMENT (SLA)</p>
                <p>
                  This Service is provided WITHOUT any availability guarantees:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>No guaranteed uptime or availability percentage</li>
                  <li>No guaranteed response times or latency</li>
                  <li>No guaranteed throughput or capacity</li>
                  <li>No guaranteed request completion</li>
                  <li>Service may be interrupted, degraded, or unavailable at any time</li>
                </ul>
              </div>
              <p>
                We may modify, suspend, or discontinue the Service (or any part thereof) at any time, with or 
                without notice, for any reason, including maintenance, upgrades, or business decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">8. Decentralized Network Disclaimer</h2>
              <p>
                The Gonka decentralized network operates independently of Block Thyme, LLC. We explicitly disclaim:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Any control over node operators, their hardware, software, or practices</li>
                <li>Any ability to monitor, filter, or moderate content processed by nodes</li>
                <li>Any ability to recall, delete, or modify requests after submission</li>
                <li>Any guarantee of privacy, security, or confidentiality on the network</li>
                <li>Any responsibility for actions or omissions of node operators</li>
                <li>Any guarantee that nodes will process requests correctly or at all</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">9. User Responsibility</h2>
              <p className="font-semibold text-emerald-400">
                YOU ARE 100% RESPONSIBLE FOR:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Evaluating all AI outputs before any use</li>
                <li>Verifying accuracy through independent authoritative sources</li>
                <li>All decisions made based on AI outputs</li>
                <li>All actions taken in reliance on AI outputs</li>
                <li>All consequences resulting from your use of the Service</li>
                <li>Ensuring your use complies with applicable laws and regulations</li>
                <li>Any harm caused by your use or misuse of AI outputs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">10. Disclaimer of Warranties</h2>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4 uppercase text-sm">
                <p>
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                  WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO 
                  WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                </p>
                <p className="mt-4">
                  WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF 
                  VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT WARRANT THAT AI OUTPUTS WILL BE ACCURATE, 
                  RELIABLE, COMPLETE, CURRENT, OR SUITABLE FOR ANY PURPOSE.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">11. Limitation of Liability</h2>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4 uppercase text-sm">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL BLOCK THYME, LLC, 
                  ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY 
                  INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING 
                  WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE 
                  LOSSES, ARISING OUT OF OR RELATING TO YOUR USE OF OR INABILITY TO USE THE SERVICE.
                </p>
                <p className="mt-4">
                  OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNTS YOU PAID TO US IN THE THREE 
                  (3) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED U.S. DOLLARS ($100.00), WHICHEVER IS GREATER.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">12. Assumption of Risk</h2>
              <p>
                By using this Service, you expressly acknowledge and assume all risks associated with:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Using experimental decentralized AI technology</li>
                <li>Receiving potentially inaccurate or harmful AI outputs</li>
                <li>Data being processed by unknown third-party node operators</li>
                <li>Service interruptions, failures, or unavailability</li>
                <li>Loss of data submitted to the Service</li>
                <li>Security vulnerabilities inherent in decentralized systems</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">13. Acceptance</h2>
              <p>
                BY USING THIS SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE 
                BOUND BY THIS DISCLAIMER, OUR{" "}
                <Link href="/legal/terms" className="text-emerald-400 hover:underline">TERMS OF SERVICE</Link>,{" "}
                <Link href="/legal/privacy" className="text-emerald-400 hover:underline">PRIVACY POLICY</Link>, AND{" "}
                <Link href="/legal/acceptable-use" className="text-emerald-400 hover:underline">ACCEPTABLE USE POLICY</Link>.
              </p>
              <p className="mt-4">
                IF YOU DO NOT AGREE WITH ANY PART OF THIS DISCLAIMER OR OUR TERMS, DO NOT USE THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">14. Contact Information</h2>
              <p>
                For questions about this Disclaimer, please contact us at:
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
