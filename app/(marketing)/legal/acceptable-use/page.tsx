import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptable Use Policy | Dogecat",
  description: "Acceptable Use Policy for Dogecat decentralized AI inference service operated by Block Thyme, LLC.",
};

export default function AcceptableUsePolicy() {
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
          <h1 className="text-3xl font-bold text-white mb-2">Acceptable Use Policy</h1>
          <p className="text-white/50 text-sm mb-8">Last updated: February 14, 2026</p>

          <div className="space-y-8 text-white/80">
            <section>
              <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
              <p>
                This Acceptable Use Policy ("AUP") governs your use of the Dogecat service, website, APIs, and related 
                services (collectively, the "Service") provided by Block Thyme, LLC ("Company," "we," "us," or "our"). 
                This AUP is incorporated by reference into our{" "}
                <Link href="/legal/terms" className="text-emerald-400 hover:underline">Terms of Service</Link>.
              </p>
              <p>
                By using the Service, you agree to comply with this AUP. We may update this AUP from time to time, and 
                your continued use of the Service constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">2. User Responsibility and Liability</h2>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 my-4">
                <p className="font-semibold text-amber-400 mb-2">⚠️ CRITICAL: USER LIABILITY NOTICE</p>
                <p>
                  You are solely and entirely responsible for:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>All content, prompts, and inputs you submit to the Service</li>
                  <li>All outputs generated in response to your inputs</li>
                  <li>How you use, distribute, publish, or act upon AI-generated outputs</li>
                  <li>Any consequences, damages, or liabilities arising from your use of the Service or AI outputs</li>
                </ul>
                <p className="mt-2 font-semibold">
                  THE USER ASSUMES ALL LIABILITY FOR THE INTENT, CONTENT, AND RESULTS OF PROMPTS SUBMITTED TO THE SERVICE.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">3. Absolutely Prohibited Uses</h2>
              <p>
                You may NOT use the Service for any of the following purposes. These prohibitions are absolute and 
                violations may result in immediate termination, reporting to law enforcement, and legal action:
              </p>

              <h3 className="text-lg font-medium text-white/90 mt-4">3.1 Illegal Content and Activities</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Child sexual abuse material (CSAM) of any kind</li>
                <li>Non-consensual intimate imagery (revenge porn)</li>
                <li>Content depicting or promoting sexual exploitation of minors</li>
                <li>Human trafficking or exploitation</li>
                <li>Drug trafficking or manufacturing controlled substances</li>
                <li>Terrorism or terrorist recruitment</li>
                <li>Any activity that violates applicable local, state, national, or international law</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">3.2 Violence and Harm</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Content that incites or promotes violence against individuals or groups</li>
                <li>Threats of physical violence or harm</li>
                <li>Instructions for creating weapons, explosives, or bioweapons</li>
                <li>Content glorifying mass violence, terrorism, or atrocities</li>
                <li>Assistance with planning or committing violent acts</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">3.3 Hate Speech and Discrimination</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Content that promotes hatred or discrimination based on race, ethnicity, national origin, religion, 
                    gender, gender identity, sexual orientation, disability, or other protected characteristics</li>
                <li>Dehumanizing language targeting protected groups</li>
                <li>Holocaust denial or genocide denial</li>
                <li>White supremacist or extremist ideology</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">3.4 Harassment and Abuse</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Harassment, bullying, or intimidation of individuals</li>
                <li>Stalking or unwanted surveillance</li>
                <li>Doxxing (revealing private information about others)</li>
                <li>Coordinated inauthentic behavior or brigading</li>
                <li>Creating content to defame or harm specific individuals</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">3.5 Fraud and Deception</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Financial fraud, scams, or phishing schemes</li>
                <li>Identity theft or impersonation</li>
                <li>Creating fake identities, credentials, or documents</li>
                <li>Spreading disinformation designed to manipulate public opinion or elections</li>
                <li>Deepfakes intended to deceive or defame</li>
              </ul>

              <h3 className="text-lg font-medium text-white/90 mt-4">3.6 Malicious Technical Activities</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Creating malware, viruses, ransomware, or other malicious code</li>
                <li>Developing tools for cyberattacks or hacking</li>
                <li>Bypassing security measures or authentication systems</li>
                <li>Spam generation or spam distribution</li>
                <li>Denial-of-service attacks or infrastructure abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">4. High-Risk and Prohibited Applications</h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4">
                <p className="font-semibold text-red-400 mb-2">🚫 NOT FOR MISSION-CRITICAL APPLICATIONS</p>
                <p>
                  The Service is explicitly NOT suitable for and must NOT be used in the following high-risk applications:
                </p>
              </div>
              
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Medical and Healthcare:</strong> Real-time medical diagnostics, treatment decisions, 
                    drug dosing, or any application affecting patient health</li>
                <li><strong>Autonomous Vehicles:</strong> Navigation, control, or decision-making systems</li>
                <li><strong>Weapons Systems:</strong> Autonomous weapons, targeting systems, or military decision-making</li>
                <li><strong>Critical Infrastructure:</strong> Power grids, water systems, transportation networks, 
                    nuclear facilities, or emergency services</li>
                <li><strong>Financial Trading:</strong> Automated trading decisions without human oversight</li>
                <li><strong>Legal Proceedings:</strong> Generating evidence, legal arguments, or court documents 
                    presented as professionally prepared</li>
                <li><strong>Emergency Response:</strong> 911 dispatch, emergency triage, or crisis response</li>
                <li><strong>Aviation and Maritime:</strong> Flight or navigation control systems</li>
              </ul>
              <p className="mt-4">
                The low-cost, best-effort, decentralized nature of the Service means it is unsuitable for any 
                application where failure, delay, or inaccuracy could result in death, injury, significant financial 
                loss, or other serious harm.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">5. Intellectual Property Restrictions</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Do not use the Service to infringe upon copyrights, trademarks, or other intellectual property rights</li>
                <li>Do not attempt to extract, reverse-engineer, distill, or steal model weights or architectures</li>
                <li>Do not create derivative AI models by systematically querying our Service</li>
                <li>Do not use outputs to train competing AI models without authorization</li>
                <li>Do not bypass rate limits, access controls, or technical restrictions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">6. Privacy and Data Restrictions</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Do not submit personal data of third parties without their consent</li>
                <li>Do not process protected health information (PHI) subject to HIPAA</li>
                <li>Do not process sensitive financial data subject to PCI-DSS</li>
                <li>Do not submit children's personal information (COPPA violations)</li>
                <li>Be aware that prompts are processed on a decentralized network with no guarantee of confidentiality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">7. Commercial Use Restrictions</h2>
              <p>
                Commercial use of the Service is permitted, subject to these Terms and the following restrictions:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You may not resell raw API access without authorization</li>
                <li>You must clearly disclose to end users when content is AI-generated</li>
                <li>You remain responsible for ensuring your commercial application complies with this AUP</li>
                <li>Volume usage may be subject to additional terms or rate limits</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">8. Enforcement Limitations</h2>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white mb-2">Technical Limitations Notice</p>
                <p>
                  Due to the decentralized nature of the Gonka network:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>We cannot technically prevent or stop prohibited uses once requests are submitted to the network</li>
                  <li>We cannot monitor or filter content in real-time on decentralized nodes</li>
                  <li>We cannot recall or delete prompts that have been processed</li>
                </ul>
                <p className="mt-2">
                  However, this does not excuse violations. We can and will:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Terminate accounts for violations</li>
                  <li>Block access to the Service</li>
                  <li>Report illegal activity to law enforcement</li>
                  <li>Pursue legal remedies</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">9. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Block Thyme, LLC, its affiliates, officers, directors, 
                employees, agents, and licensors from and against any and all claims, damages, losses, liabilities, 
                costs, and expenses (including reasonable attorneys' fees and costs) arising out of or relating to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your violation of this AUP</li>
                <li>Your use of the Service</li>
                <li>Content you submit to the Service</li>
                <li>Your use of AI-generated outputs</li>
                <li>Any third-party claims related to your activities</li>
              </ul>
              <p className="mt-4">
                This indemnification obligation survives termination of your account and these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">10. Reporting Violations</h2>
              <p>
                If you become aware of any violation of this AUP, please report it to us at:
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white">Abuse Reports</p>
                <p>Email: abuse@dogecat.com</p>
                <p className="mt-2 text-sm text-white/60">
                  Please include as much detail as possible, including usernames, timestamps, and descriptions 
                  of the violating content or behavior.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">11. Consequences of Violations</h2>
              <p>
                Violations of this AUP may result in:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Warning or notice of violation</li>
                <li>Temporary suspension of access</li>
                <li>Permanent termination of your account</li>
                <li>Forfeiture of any unused credits or prepaid amounts</li>
                <li>Reporting to law enforcement agencies</li>
                <li>Civil or criminal legal action</li>
                <li>Monetary damages</li>
              </ul>
              <p className="mt-4">
                We reserve the right to determine, in our sole discretion, what constitutes a violation and what 
                consequences are appropriate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">12. Contact Information</h2>
              <p>
                For questions about this Acceptable Use Policy, please contact us at:
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 my-4">
                <p className="font-semibold text-white">Block Thyme, LLC</p>
                <p>Email: legal@dogecat.com</p>
                <p>Abuse Reports: abuse@dogecat.com</p>
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
