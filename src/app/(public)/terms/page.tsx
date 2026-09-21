import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, ShieldAlert, CheckCircle2, AlertTriangle, Scale, Mail, Phone, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Review the terms and conditions governing the use of the GymsEra platform, mobile application, and gym membership services.',
}

export default function TermsAndConditionsPage() {
  const lastUpdated = 'September 2026'

  return (
    <div className="pt-16 pb-20 bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4 border border-primary/30">
            <FileText className="w-4 h-4" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Terms &amp; Conditions
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Please read these terms carefully before accessing or using the GymsEra website and mobile applications.
          </p>
          <div className="mt-4 text-xs text-slate-400">
            Last Updated: <span className="text-slate-300 font-medium">{lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Quick Summary Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Questions about our legal terms?</p>
            <p className="text-xs text-slate-500">Our customer support team is available on WhatsApp and email.</p>
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
          {/* 1. Acceptance */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              1. Agreement to Terms
            </h2>
            <p className="text-sm sm:text-base mb-3">
              These Terms &amp; Conditions constitute a legally binding agreement between you (&quot;User,&quot; &quot;Member,&quot; or &quot;Host&quot;) and GymsEra (&quot;GymsEra,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By creating an account, downloading the GymsEra mobile app, or browsing gymsera.com, you agree to comply with and be bound by these terms.
            </p>
            <p className="text-sm sm:text-base text-slate-600">
              If you do not agree with any part of these terms, you must immediately discontinue using our services.
            </p>
          </section>

          {/* 2. Platform Role */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              2. Nature of GymsEra Services
            </h2>
            <p className="text-sm sm:text-base mb-3">
              GymsEra operates an online digital fitness marketplace platform that allows:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 mb-3">
              <li><strong>Members:</strong> To discover verified gym branches, purchase membership plans, upload payment proofs, and verify daily attendance using personal dynamic QR codes.</li>
              <li><strong>Gym Hosts / Owners:</strong> To list fitness facilities, configure membership tiers, verify member payments, scan QR codes for check-in, and monitor facility capacity and analytics.</li>
            </ul>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900">
              <strong>Independent Entities:</strong> Partner gyms and fitness facilities listed on GymsEra are independent business operators. GymsEra does not own or operate individual gym locations unless explicitly indicated.
            </div>
          </section>

          {/* 3. Account Eligibility & Responsibilities */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              3. Account Registration & Security
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600">
              <li>You must be at least 18 years old (or possess verified parental/guardian consent) to register an account and purchase memberships.</li>
              <li>You agree to provide accurate, truthful, and up-to-date personal details during registration.</li>
              <li>You are solely responsible for maintaining the confidentiality of your login credentials and password. Any actions executed under your account credentials are your responsibility.</li>
              <li>Account sharing is strictly forbidden. Subscriptions and check-in QR codes are personal to the registered individual and non-transferable.</li>
            </ul>
          </section>

          {/* 4. Subscriptions, Payments & Proof Verification */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              4. Subscriptions &amp; Payment Proof Verification
            </h2>
            <div className="space-y-3 text-sm sm:text-base text-slate-600">
              <p>
                When selecting a membership plan through GymsEra, payment may be conducted via direct bank transfer or approved payment channels specified on the gym&apos;s checkout page:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-1">Proof Submission</h3>
                  <p className="text-xs sm:text-sm">Members must upload a clear screenshot or receipt of the completed bank transfer containing transaction date, amount, and reference number.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-1">Verification Period</h3>
                  <p className="text-xs sm:text-sm">The gym host reviews and verifies the payment proof (typically within 24 hours). The subscription status becomes &quot;Active&quot; once approved.</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Uploading counterfeit, edited, or reused payment receipts constitutes fraud and results in immediate account termination, blacklisting, and potential legal action.
              </p>
            </div>
          </section>

          {/* 5. Check-In & Attendance Rules */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              5. QR Code Check-In &amp; Facility Access
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600">
              <li>Each active member is provided with a unique digital QR code inside the GymsEra mobile app.</li>
              <li>You must present your active QR code to the gym staff scanner upon entering any authorized gym branch.</li>
              <li>Attempting to screenshot, duplicate, or share your QR code with non-members is a violation of these terms and grounds for instant membership forfeiture without refund.</li>
              <li>Members must adhere to all gym house rules, dress codes, hygiene guidelines, and equipment handling instructions set by individual facility hosts.</li>
            </ul>
          </section>

          {/* 6. Health & Physical Activity Disclaimer */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              6. Health Warning &amp; Waiver of Liability
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-base space-y-3">
              <p className="font-semibold text-slate-900">
                Participation in fitness activities carries inherent physical risk:
              </p>
              <p className="text-slate-600 text-xs sm:text-sm">
                Physical exercise, weight training, cardiovascular workouts, and using fitness machinery involve risks of injury. You acknowledge that you voluntarily engage in physical activities and consult a qualified physician prior to commencing any strenuous workout regime.
              </p>
              <p className="text-slate-600 text-xs sm:text-sm">
                To the fullest extent permitted by law, GymsEra and its directors, employees, and software providers shall not be held liable for any personal injury, illness, accident, or property loss incurred on the premises of any partner gym.
              </p>
            </div>
          </section>

          {/* 7. Cancellations & Refunds */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              7. Cancellation, Freezing &amp; Refunds
            </h2>
            <p className="text-sm sm:text-base mb-2">
              All subscription cancellations, plan freezes, and refund claims are governed by our dedicated{' '}
              <Link href="/refund-policy" className="text-primary font-semibold hover:underline">
                Refund &amp; Cancellation Policy
              </Link>
              . Please review that document for precise eligibility timeframes and dispute procedures.
            </p>
          </section>

          {/* 8. Gym Host Terms */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              8. Gym Host &amp; Partner Responsibilities
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600">
              <li>Gym hosts agree to maintain accurate pricing, operating hours, facility photographs, and branch amenities in their GymsEra listing.</li>
              <li>Hosts must promptly verify submitted payment receipts within 24 hours and maintain functional QR scanning equipment or staff mobile access at all listed operating hours.</li>
              <li>Hosts are prohibited from discriminating against members or charging unauthorized extra door fees for access guaranteed under an active GymsEra plan.</li>
            </ul>
          </section>

          {/* 9. Contact */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              9. Inquiries &amp; Legal Notices
            </h2>
            <p className="text-sm sm:text-base mb-4">
              For any legal inquiries, formal notices, or disputes regarding these terms, please contact:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Official Email</p>
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
          <Link href="/refund-policy" className="hover:text-primary transition-colors">
            Read Refund &amp; Cancellation Policy &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
