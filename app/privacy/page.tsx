export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>

        <div className="text-sm text-gray-600 mb-8 space-y-1">
          <p>
            <strong>Effective Date:</strong> October 20, 2025
          </p>
          <p>
            <strong>Contact:</strong>{' '}
            <a
              href="mailto:therulekitassistant@gmail.com"
              className="text-blue-600 hover:underline"
            >
              therulekitassistant@gmail.com
            </a>
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8 text-gray-800">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              1. Our Promise to You (The Brutal Truth)
            </h2>
            <p>
              Welcome to TheRuleKit.com. We believe privacy should be simple, transparent, and
              brutally honest. This document explains, in plain English, what information we
              collect, why we need it, and how we keep it safe.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>We Collect the Minimum Necessary:</strong> We are in the business of
                providing perfect code answers, not selling your data.
              </li>
              <li>
                <strong>We Are Radically Transparent:</strong> We will tell you exactly what we do
                with your data and which world-class services we use.
              </li>
              <li>
                <strong>You Are the Owner of Your Data:</strong> You have the right to access and
                delete your information.
              </li>
            </ul>
            <p className="mt-4 text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <strong>Beta Status Notice:</strong> TheRuleKit is currently operated by its founder
              as a pre-registered beta project. We are committed to professional data protection
              standards from day one.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              2. The Information We Collect
            </h2>
            <p>
              To run our service, we collect two types of information: data you give us, and data
              our systems collect automatically.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              2.1. Information You Provide to Us:
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Information:</strong> Your email address and a securely hashed
                password when you sign up.
              </li>
              <li>
                <strong>Content You Create:</strong> The questions you ask and the AI-generated
                answers, which are stored to provide your chat history.
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              2.2. Information We Collect Automatically:
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Usage Data:</strong> We collect your query count to enforce our beta usage
                limits.
              </li>
              <li>
                <strong>Technical Log Data:</strong> Like all modern web services, our trusted
                partners (Vercel and Supabase) automatically collect technical information in server
                logs. This may include your IP address, browser type, and device information.
              </li>
            </ul>
            <p className="mt-4 text-sm bg-blue-50 border border-blue-200 rounded-lg p-4">
              <strong>Our Promise on Log Data:</strong> We use this information only for the
              legitimate purposes of securing our platform (e.g., preventing attacks) and debugging
              technical issues. We never sell this data or use it to track you across other sites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              3. CRITICAL: How We Use Our &quot;Expert AI Team&quot;
            </h2>
            <p>
              To provide you with intelligent answers, we use an &quot;Expert Research Team&quot; of
              world-class AI partners.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>The &quot;Librarian&quot; (OpenAI):</strong> The text of your question is
                sent to the OpenAI API to understand its meaning and find relevant code sections.
              </li>
              <li>
                <strong>The &quot;Consultant&quot; (Anthropic/Claude):</strong> Your question and
                the relevant code sections are sent to the Anthropic API to generate the final
                answer.
              </li>
            </ul>
            <p className="mt-4 text-sm bg-green-50 border border-green-200 rounded-lg p-4">
              <strong>Our Security Promise:</strong> We never send your email or user ID to our AI
              partners. From their perspective, every request is anonymous. They are contractually
              prohibited from using this data to train their models.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Your Rights & Control</h2>
            <p>You are the owner of your data.</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>Access:</strong> You can access your chat history at any time when logged
                in.
              </li>
              <li>
                <strong>Deletion:</strong> To permanently delete your account and all associated
                data, please email us at{' '}
                <a
                  href="mailto:therulekitassistant@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  therulekitassistant@gmail.com
                </a>
                . We will process your request within 30 days.
              </li>
            </ul>
            <p className="mt-4 text-sm text-gray-600 italic">
              Our Future Promise: We are architecting a self-serve &quot;Delete Account&quot; button
              to give you instant control in a future update.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              5. Data Retention: No Hidden Storage
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Active Accounts:</strong> We retain your data until you request deletion.
              </li>
              <li>
                <strong>Inactive Beta Accounts:</strong> We may automatically delete accounts after
                12 months of inactivity to respect your privacy.
              </li>
              <li>
                <strong>Backups:</strong> Deleted data may remain in our secure backups for up to 30
                days before being permanently erased.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              6. Data Security: Our Fortress
            </h2>
            <p>
              We use industry-leading partners to secure your data: <strong>Vercel</strong> for
              hosting and <strong>Supabase</strong> for database and authentication. All data is
              encrypted in transit using industry-standard SSL/TLS.
            </p>
            <p className="mt-4 text-sm text-gray-600 italic">
              While we take all reasonable precautions, no internet service is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              7. Children&apos;s Privacy
            </h2>
            <p>
              Our Service is a professional tool intended for users aged 18 and older. We do not
              knowingly collect any information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              8. International Users & Data Transfers
            </h2>
            <p>
              Our service is operated by a founder based in India, and our technical infrastructure
              is located in the United States. By using our Service, you consent to the transfer and
              processing of your data in these locations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              9. Your California Privacy Rights (CCPA)
            </h2>
            <p>
              <strong>We do not sell your personal information.</strong> If you are a California
              resident, you have the right to request disclosure of our data collection practices
              and request deletion of your personal information.
            </p>
            <p className="mt-4">
              To exercise these rights, contact us at{' '}
              <a
                href="mailto:therulekitassistant@gmail.com"
                className="text-blue-600 hover:underline"
              >
                therulekitassistant@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              10. Governing Law & Dispute Resolution
            </h2>
            <p>
              <strong>Governing Law:</strong> As a pre-registered project, this Agreement is
              governed by the laws of India, where our founder is currently located. We believe in
              radical transparency, and this is the legal reality of our current operational status.
            </p>
            <p className="mt-4">
              <strong>Dispute Resolution:</strong> We believe in direct and fair communication
              first. However, should a legal dispute arise, it shall be finally settled by binding
              arbitration administered by a neutral arbitrator, conducted online in English. By
              using the Service, you waive your right to a trial by jury and to participate in any
              class action lawsuit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              11. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. The &quot;Effective Date&quot; at
              the top reflects the most recent changes. Continued use of the Service after updates
              means you accept the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Contact Us</h2>
            <p>For privacy questions, concerns, or data deletion requests:</p>
            <div className="mt-4 space-y-2">
              <p>
                📧{' '}
                <a
                  href="mailto:therulekitassistant@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  therulekitassistant@gmail.com
                </a>
              </p>
              <p>
                🌐{' '}
                <a href="https://www.therulekit.com" className="text-blue-600 hover:underline">
                  https://www.therulekit.com
                </a>
              </p>
            </div>
          </section>

          <div className="mt-12 p-6 bg-gray-100 border border-gray-300 rounded-lg">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              By clicking &quot;Sign Up&quot; or using the Service, you acknowledge that:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>You have read and understood this Privacy Policy</li>
              <li>You consent to the collection and use of your information as described</li>
              <li>You understand this is a beta service operated by an individual founder</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <a href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
