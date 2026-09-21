import type { Metadata } from 'next'
import Link from 'next/link'
import {
  RefreshCw, CheckCircle2, AlertCircle, Clock, FileCheck,
  CreditCard, ShieldCheck, Mail, Phone, ArrowLeft
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Understand the cancellation, freeze, and refund policies for gym memberships and subscriptions on GymsEra.',
}

export default function RefundPolicyPage() {
  const lastUpdated = 'September 2026'

  return (
    <div className="pt-16 pb-20 bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4 border border-primary/30">
            <RefreshCw className="w-4 h-4" />
            <span>Fair Billing Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Transparent rules on membership cancellations, subscription freezes, and refund eligibility on the GymsEra platform.
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
            <p className="text-sm font-semibold text-slate-900">Need help with a cancellation or refund?</p>
            <p className="text-xs text-slate-500">Contact our billing dispute department on WhatsApp or email.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="mailto:support@gymsera.com?subject=Refund%20or%20Cancellation%20Request"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-primary" />
              support@gymsera.com
            </a>
            <a
              href="https://wa.me/923055901414?text=Hello%20Gymsera%20Support%2C%20I%20have%20a%20refund%20inquiry%3A"
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
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              1. Overview
            </h2>
            <p className="text-sm sm:text-base mb-3">
              At GymsEra, we strive to provide a transparent and fair membership experience. Because gym memberships involve resource allocation, capacity reservations, and direct verification by partner gym hosts, the following rules specify when and how cancellations, freezes, and refunds apply.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              2. Cancellation Before Host Verification (100% Refundable)
            </h2>
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2 text-sm sm:text-base text-emerald-950">
              <p className="font-semibold text-emerald-900">
                Full Refund Window:
              </p>
              <p className="text-xs sm:text-sm text-emerald-800">
                If you have transferred payment to a partner gym and uploaded a transfer screenshot, but the gym host has <strong>not yet approved/verified</strong> your subscription, you may cancel your request immediately via the GymsEra app.
              </p>
              <p className="text-xs sm:text-sm text-emerald-800">
                In this case, any pending transaction is cancelled and your payment is eligible for a 100% refund.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              3. Cancellation After Verification (Active Subscriptions)
            </h2>
            <p className="text-sm sm:text-base mb-3">
              Once a gym host reviews and verifies your payment receipt, your subscription becomes active and reserve capacity is allocated at the gym:
            </p>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <strong className="block text-slate-900 font-semibold mb-1">Within 48 Hours (No Check-In)</strong>
                If you cancel within 48 hours of verification and have not recorded any QR code check-in or visit at the gym branch, you may request a refund subject to a nominal administrative handling fee (if applicable).
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <strong className="block text-slate-900 font-semibold mb-1">After 48 Hours or Check-In Recorded</strong>
                Once you have checked into the gym or more than 48 hours have elapsed since activation, standard subscriptions are non-refundable for that billing cycle.
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              4. Subscription Freeze Policy (Pause Plan)
            </h2>
            <p className="text-sm sm:text-base mb-3">
              We understand that life events, unexpected travel, or medical conditions can temporarily interrupt your fitness journey. GymsEra allows eligible members to freeze their active plan rather than forfeit membership days:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
              <li><strong>Freeze Duration:</strong> You may request a freeze for a minimum of 7 days up to a maximum of 30 days per subscription cycle (subject to individual gym policy).</li>
              <li><strong>How to Freeze:</strong> Navigate to <em>My Plans</em> &rarr; tap your active plan &rarr; select <em>Freeze Subscription</em> and select the start and end dates.</li>
              <li><strong>Extension of Validity:</strong> Your membership expiry date will automatically extend by the exact number of approved frozen days.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              5. Special Circumstances &amp; Facility Closure Protection
            </h2>
            <p className="text-sm sm:text-base mb-3">
              GymsEra protects members against unfair facility disruptions:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
              <li><strong>Permanent Gym Closure or Relocation:</strong> If a partner gym ceases operations or relocates more than 5 km away during your active plan, you are entitled to a pro-rated refund for all unused days or a transfer of credit to another GymsEra partner gym.</li>
              <li><strong>Extended Facility Maintenance:</strong> If a gym undergoes unscheduled repairs or shutdowns exceeding 5 consecutive days without alternative branch access, equivalent days are added to your membership or pro-rated refunds are issued.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              6. Refund Request &amp; Processing Timelines
            </h2>
            <div className="space-y-3 text-sm sm:text-base text-slate-600">
              <p>
                To file a formal refund dispute or request:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>Submit your request directly via the mobile app under <em>Settings &rarr; Help &amp; Support</em>.</li>
                <li>Alternatively, send an email to <a href="mailto:support@gymsera.com" className="text-primary hover:underline font-medium">support@gymsera.com</a> or message our WhatsApp team at <a href="https://wa.me/923055901414" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">+92 305 5901414</a> with your registered phone number, gym name, and payment transaction reference.</li>
                <li>Approved refunds are processed back to your original bank account within <strong>5 to 7 business days</strong>.</li>
              </ol>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              7. Dispute Resolution Contact
            </h2>
            <p className="text-sm sm:text-base mb-4">
              If you have any questions or unresolved disputes with a partner gym regarding payment verification or cancellations, please contact us immediately:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Disputes &amp; Billing Email</p>
                  <a href="mailto:support@gymsera.com" className="text-xs sm:text-sm text-primary hover:underline font-medium">
                    support@gymsera.com
                  </a>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <Phone className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">WhatsApp Support</p>
                  <a href="https://wa.me/923055901414" target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-emerald-600 hover:underline font-medium">
                    +92 305 5901414
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
          <Link href="/privacy" className="hover:text-primary transition-colors">
            &larr; Read Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Read Terms &amp; Conditions &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
