'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Mail, Phone, MessageSquare, Clock, Send, CheckCircle2,
  HelpCircle, ChevronDown, Sparkles, MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

const faqs = [
  {
    q: 'How long does payment verification take?',
    a: 'Once you upload your bank transfer payment proof, the gym host usually verifies and activates your subscription within 24 hours. You will receive an instant push notification and email confirmation once approved.',
  },
  {
    q: 'My QR code is not scanning at the gym entrance. What should I do?',
    a: 'Ensure your subscription shows as "Active" in the GymsEra mobile app. If your screen brightness is low, increase it so the scanner can read the QR code. You can also tap the QR code to refresh its dynamic security token.',
  },
  {
    q: 'How can I cancel or freeze my gym membership?',
    a: 'In the mobile app, navigate to My Plans → select your active subscription → tap Cancel Subscription or Request Freeze. Check our Refund & Cancellation Policy for eligibility details.',
  },
  {
    q: 'I am a gym owner. How do I list my gym on GymsEra?',
    a: 'You can tap "For Gym Owners" in the top navigation or "Become a Host" in the mobile app. Submit your gym profile and business details, and our onboarding team will review your application within 24-48 hours.',
  },
  {
    q: 'How do I contact GymsEra directly for urgent support?',
    a: 'You can tap the WhatsApp button on this page to chat instantly with our support team at +92 305 5901414, or email support@gymsera.com.',
  },
]

export default function ContactSupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'member_support',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate sending message
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'member_support',
        message: '',
      })
    }, 1200)
  }

  return (
    <div className="pt-16 pb-20 bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4 border border-primary/30">
            <MessageSquare className="w-4 h-4" />
            <span>Support &amp; Contact</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            We&apos;re Here to Help
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Have questions about your membership, QR code check-ins, or hosting your gym? Our dedicated team is ready to assist you.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* WhatsApp Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <Phone className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="mb-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                Instant Chat
              </Badge>
              <h2 className="text-lg font-bold text-slate-900 mb-1">WhatsApp Support</h2>
              <p className="text-xs text-slate-500 mb-4">
                Chat directly with our team for quick assistance and inquiries.
              </p>
              <p className="text-sm font-semibold text-slate-900 mb-1">+92 305 5901414</p>
              <p className="text-xs text-slate-400">Available Mon-Sat (9 AM - 9 PM PKT)</p>
            </div>
            <div className="mt-6">
              <a
                href="https://wa.me/923055901414?text=Hello%20Gymsera%20Support%2C%20I%20need%20help%20with%3A"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Phone className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Email Support Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-primary mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="mb-2 bg-orange-50 text-primary border-orange-200">
                Official Support
              </Badge>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Email Support</h2>
              <p className="text-xs text-slate-500 mb-4">
                Send us detailed inquiries, billing proofs, or partnership proposals.
              </p>
              <p className="text-sm font-semibold text-slate-900 mb-1">support@gymsera.com</p>
              <p className="text-xs text-slate-400">Response guaranteed within 24 hours</p>
            </div>
            <div className="mt-6">
              <a
                href="mailto:support@gymsera.com?subject=Gymsera%20Support%20Request"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4" />
                Send an Email
              </a>
            </div>
          </div>

          {/* Hours & Presence Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">
                Response Times
              </Badge>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Operating Hours</h2>
              <p className="text-xs text-slate-500 mb-4">
                Our support coordinators and verification teams operate across Pakistan.
              </p>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Monday – Friday:</span>
                  <span className="font-medium text-slate-900">9:00 AM – 9:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="font-medium text-slate-900">10:00 AM – 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="font-medium text-slate-500">Emergency &amp; Chat Only</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>Nationwide network serving gyms across Pakistan</span>
            </div>
          </div>
        </div>

        {/* Contact Form & FAQs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Send Us a Message</h2>
              <p className="text-sm text-slate-500">
                Fill out the form below and our customer care team will get back to you promptly.
              </p>
            </div>

            {isSuccess ? (
              <div className="p-8 rounded-xl bg-emerald-50 border border-emerald-200 text-center animate-fade-in">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900 mb-1">Message Received!</h3>
                <p className="text-sm text-emerald-700 max-w-md mx-auto mb-6">
                  Thank you for reaching out. A support coordinator has been assigned to your ticket and will respond within 24 hours.
                </p>
                <Button
                  onClick={() => setIsSuccess(false)}
                  variant="outline"
                  className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
                    <Input
                      required
                      placeholder="Ahmed Khan"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <Input
                      required
                      type="email"
                      placeholder="ahmed@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp Number</label>
                    <Input
                      placeholder="+92 300 1234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Topic / Category *</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      <option value="member_support">Member Account &amp; QR Issues</option>
                      <option value="payment_verification">Payment Verification &amp; Bank Proof</option>
                      <option value="gym_owner">Gym Owner / Host Portal Inquiries</option>
                      <option value="refund_dispute">Refund or Cancellation Request</option>
                      <option value="technical_bug">App Bug or Technical Glitch</option>
                      <option value="other">Other Inquiries</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Message *</label>
                  <Textarea
                    required
                    rows={5}
                    placeholder="Describe your question or issue in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto min-w-[160px] gap-2"
                  >
                    {isSubmitting ? (
                      'Sending Message...'
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: FAQ Accordion */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Quick answers to the most common questions from athletes and gym hosts.
              </p>

              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx
                  return (
                    <div
                      key={idx}
                      className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full text-left px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 flex items-center justify-between gap-2 hover:bg-slate-100/60 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${
                            isOpen ? 'transform rotate-180 text-primary' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Policy Links */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-600">
                <Link href="/privacy" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Read our full Privacy Policy
                </Link>
                <Link href="/refund-policy" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Read our Refund &amp; Cancellation Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
