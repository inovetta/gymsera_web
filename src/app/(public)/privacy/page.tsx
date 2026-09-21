import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Mail, Phone, Lock, Eye, UserCheck, Bell, Database, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how GymsEra collects, uses, and protects your personal data and privacy across our mobile app and website.',
}

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 2026'

  return (
    <div className="pt-16 pb-20 bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4 border border-primary/30">
            <ShieldCheck className="w-4 h-4" />
            <span>Legal & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Your trust is our top priority. Learn how GymsEra collects, secures, and handles your information.
          </p>
          <div className="mt-4 text-xs text-slate-400">
            Last Updated: <span className="text-slate-300 font-medium">{lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Quick Contact Banner */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Have questions about your data?</p>
            <p className="text-xs text-slate-500">Reach our dedicated data privacy and compliance team anytime.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="mailto:support@gymsera.com"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-primary" />
              support@gymsera.com
            </a>
            <a
              href="https://wa.me/923055901414"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              +92 305 5901414
            </a>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-10 text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section id="introduction">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              1. Introduction
            </h2>
            <p className="text-sm sm:text-base mb-3">
              GymsEra (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) provides a seamless digital fitness platform connecting fitness enthusiasts with gyms, trainers, and fitness facilities through our website (gymsera.com) and mobile application (GymsEra).
            </p>
            <p className="text-sm sm:text-base">
              This Privacy Policy explains what personal information we collect from you, how we process and protect it, and what rights you possess regarding your personal data when using our web portal and mobile app.
            </p>
          </section>

          {/* Section 2 */}
          <section id="information-we-collect">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              2. Information We Collect
            </h2>
            <div className="space-y-4 text-sm sm:text-base">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-1">A. Information You Provide Directly</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs sm:text-sm">
                  <li><strong>Account Details:</strong> Full name, email address, phone number, password, profile photo, and gender.</li>
                  <li><strong>Gym Owner / Business Data:</strong> Organization name, branch locations, business registration details, owner CNIC/ID, staff contacts, and facility amenities.</li>
                  <li><strong>Payment Verification Receipts:</strong> Bank transfer screenshots, transaction reference numbers, and payment slips uploaded for membership verification.</li>
                  <li><strong>Support & Communications:</strong> Messages, support inquiries, feedback, and reviews submitted to GymsEra.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-1">B. Information Collected Automatically</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs sm:text-sm">
                  <li><strong>QR Code Check-in & Attendance Logs:</strong> Timestamp, location/branch ID, and membership status verified when scanning the QR code at gym reception.</li>
                  <li><strong>Location Data:</strong> Geolocation coordinates (with your permission) to discover nearby gym branches and accurate map directions.</li>
                  <li><strong>Device & Log Data:</strong> IP address, device model, operating system version, browser type, push notification tokens, and crash diagnostics.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="how-we-use-information">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              3. How We Use Your Information
            </h2>
            <p className="text-sm sm:text-base mb-3">
              We process your personal information strictly for legitimate business purposes, including:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <li className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="block text-slate-900 font-semibold mb-0.5">Membership Operations</strong>
                Facilitating gym plan discovery, subscription purchases, renewals, and freeze requests.
              </li>
              <li className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="block text-slate-900 font-semibold mb-0.5">Check-In Verification</strong>
                Generating secure member QR codes and logging gym entrance check-ins in real-time.
              </li>
              <li className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="block text-slate-900 font-semibold mb-0.5">Payment Proof Review</strong>
                Enabling gym hosts to verify bank transfer receipts and approve valid active plans.
              </li>
              <li className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="block text-slate-900 font-semibold mb-0.5">Customer Support</strong>
                Answering inquiries, troubleshooting technical issues via email and WhatsApp, and resolving disputes.
              </li>
              <li className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="block text-slate-900 font-semibold mb-0.5">Safety & Fraud Prevention</strong>
                Protecting against account takeovers, fraudulent payment slips, and multi-user pass sharing.
              </li>
              <li className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="block text-slate-900 font-semibold mb-0.5">Service Updates</strong>
                Sending subscription reminders, payment approvals, and critical account alerts via push/email.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="data-sharing">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              4. Data Sharing and Disclosure
            </h2>
            <p className="text-sm sm:text-base mb-3">
              We never sell your personal information. We only share data in the following transparent circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600">
              <li>
                <strong>Partner Gyms & Hosts:</strong> When you purchase a membership or visit a gym, that gym&apos;s verified staff access your name, subscription plan, active status, and attendance log for check-in validation.
              </li>
              <li>
                <strong>Service Providers & Cloud Infrastructure:</strong> Trusted technical vendors (cloud hosting, notification delivery, map services) who adhere to strict data security standards.
              </li>
              <li>
                <strong>Legal Requirements:</strong> When mandated by court orders, lawful authorities, or to protect the vital rights and physical safety of any person.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="data-security">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              5. Data Security & Storage
            </h2>
            <p className="text-sm sm:text-base mb-2">
              We implement industry-standard administrative, technical, and physical safeguards to keep your personal data confidential and integral.
            </p>
            <p className="text-sm sm:text-base">
              All communications between the mobile app, web application, and our servers are encrypted via Transport Layer Security (TLS/HTTPS). Authentication tokens and sensitive keys are stored securely using platform-grade keychain and storage APIs.
            </p>
          </section>

          {/* Section 6 */}
          <section id="user-rights">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              6. Your Privacy Rights & Account Deletion
            </h2>
            <p className="text-sm sm:text-base mb-3">
              You maintain control over your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600">
              <li><strong>Access & Modification:</strong> You can review and edit your name, phone number, and avatar directly in the mobile app or web portal profile settings.</li>
              <li><strong>Permissions:</strong> You can revoke location, camera, or photo library permissions anytime via your device operating system settings.</li>
              <li><strong>Account Deletion:</strong> You can permanently request account deletion inside the mobile app (Settings &rarr; Delete Account) or by emailing <a href="mailto:support@gymsera.com" className="text-primary hover:underline">support@gymsera.com</a>. All personally identifiable information is purged or anonymized in compliance with applicable laws.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="contact-us">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              7. Contact Us & Grievance Redressal
            </h2>
            <p className="text-sm sm:text-base mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please reach out directly:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Official Support Email</p>
                  <a href="mailto:support@gymsera.com" className="text-xs sm:text-sm text-primary hover:underline font-medium">
                    support@gymsera.com
                  </a>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <Phone className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">WhatsApp & Phone Support</p>
                  <a href="https://wa.me/923055901414" target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-emerald-600 hover:underline font-medium">
                    +92 305 5901414
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Navigation helper */}
        <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
          <Link href="/terms" className="hover:text-primary transition-colors">
            &larr; Read Terms &amp; Conditions
          </Link>
          <Link href="/refund-policy" className="hover:text-primary transition-colors">
            Read Refund &amp; Cancellation Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
