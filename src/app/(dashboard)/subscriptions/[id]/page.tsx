'use client'

import { useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, MapPin, Clock, QrCode, CheckCircle, Receipt, Upload, AlertCircle, FileImage } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { QRCodeDisplay } from '@/components/features/qr-code-display'
import { EmptyState } from '@/components/features/empty-state'
import { meApi } from '@/lib/api/me'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatDuration, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const statusVariantMap: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  ACTIVE: 'success',
  FROZEN: 'warning',
  EXPIRED: 'secondary',
  CANCELLED: 'secondary',
  PENDING: 'warning',
}

const paymentStatusVariant: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'destructive',
  REFUNDED: 'secondary',
}

const invoiceStatusVariant: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  PAID: 'success',
  ISSUED: 'warning',
  OVERDUE: 'destructive',
  CANCELLED: 'secondary',
}

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const proofInputRef = useRef<HTMLInputElement>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-subscription-detail', id],
    queryFn: () => subscriptionsApi.getMySubscriptionDetail(id),
    enabled: !!id,
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['subscription-attendance', id],
    queryFn: () => meApi.getAttendanceLogs(id),
    enabled: !!id,
  })

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionsApi.cancelSubscription(id),
    onSuccess: () => {
      toast({ title: 'Subscription cancelled', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['my-subscription-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] })
    },
    onError: () => toast({ title: 'Failed to cancel', variant: 'destructive' }),
  })

  const uploadProofMutation = useMutation({
    mutationFn: (file: File) => subscriptionsApi.uploadPaymentProof(id, file),
    onSuccess: () => {
      toast({ title: 'Payment proof uploaded', description: 'Your proof has been submitted for verification.' })
      queryClient.invalidateQueries({ queryKey: ['my-subscription-detail', id] })
      setProofFile(null)
    },
    onError: () => toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' }),
  })

  const result = data?.data
  const sub = result?.subscription
  const payment = result?.payment
  const invoice = result?.invoice
  const attendance = attendanceData?.data || []

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!sub) {
    return (
      <div className="p-6">
        <EmptyState title="Subscription not found" actionLabel="Back to Subscriptions" actionHref="/subscriptions" />
      </div>
    )
  }

  const plan = (sub as any).plan ?? sub.membershipPlan
  const branch = sub.branch
  const isActive = sub.status === 'ACTIVE'
  const isPending = sub.status === 'PENDING'
  const daysLeft = Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const paymentPending = payment?.status === 'PENDING'
  const proofUploaded = !!payment?.proofUrl

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Subscription Details</h1>
          <p className="text-sm text-muted-foreground">{plan?.name}</p>
        </div>
      </div>

      {/* Pending Payment Banner */}
      {isPending && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Payment Required</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your subscription is pending payment. Please transfer the amount and upload your payment proof below. Your subscription will be activated once the gym verifies your payment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Check-In QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isActive ? (
              <QRCodeDisplay
                qrCode={sub.qrCode}
                memberName={user?.fullName}
                planName={plan?.name}
              />
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <QrCode className="h-16 w-16 mx-auto mb-2 opacity-30" />
                <p className="text-sm">QR code available once subscription is active</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-xl">{plan?.name}</h2>
                  {branch && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {branch.branchName}
                    </div>
                  )}
                </div>
                <Badge variant={statusVariantMap[sub.status] || 'secondary'}>
                  {sub.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Start Date', value: formatDate(sub.startDate) },
                  { label: 'End Date', value: formatDate(sub.endDate) },
                  ...(isActive ? [{ label: 'Days Left', value: `${daysLeft} days` }] : []),
                  ...(plan ? [{ label: 'Duration', value: formatDuration(plan.durationType, plan.durationValue) }] : []),
                  ...(sub.remainingVisits !== undefined ? [{ label: 'Visits Left', value: String(sub.remainingVisits) }] : []),
                  ...(plan ? [{ label: 'Price', value: formatCurrency(plan.price) }] : []),
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-semibold text-sm mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {sub.freezeFrom && sub.freezeTo && (
                <div className="mt-4 bg-warning/10 text-warning text-sm rounded-lg p-3">
                  Frozen from {formatDate(sub.freezeFrom)} to {formatDate(sub.freezeTo)}
                </div>
              )}

              {isActive && (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => cancelMutation.mutate()}
                    loading={cancelMutation.isPending}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice */}
          {invoice && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{invoice.invoiceNo}</span>
                  <Badge variant={invoiceStatusVariant[invoice.status] || 'secondary'}>
                    {invoice.status}
                  </Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="font-medium">{formatCurrency(invoice.subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">{formatCurrency(invoice.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="font-medium">{invoice.dueDate ? formatDate(invoice.dueDate) : '—'}</p>
                  </div>
                </div>
                {invoice.paidAt && (
                  <p className="text-xs text-success">Paid on {formatDate(invoice.paidAt)}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Status + Proof Upload */}
          {payment && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Payment
                  <Badge variant={paymentStatusVariant[payment.status] || 'secondary'} className="ml-1">
                    {payment.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Method</p>
                    <Badge variant="outline" className="text-xs mt-0.5">{payment.method?.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDate(payment.createdAt)}</p>
                  </div>
                </div>

                {/* Proof Upload — only for pending payments */}
                {paymentPending && (
                  <div className="space-y-3 pt-2 border-t">
                    {proofUploaded ? (
                      <div className="flex items-center gap-2">
                        <FileImage className="h-4 w-4 text-success" />
                        <span className="text-sm text-success font-medium">Proof uploaded — awaiting verification</span>
                        <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline ml-auto">
                          View proof
                        </a>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Transfer the amount to the gym&apos;s bank account, then upload your payment receipt below.
                        </p>
                        <div className="flex items-center gap-3">
                          <input
                            ref={proofInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => proofInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {proofFile ? proofFile.name : 'Select Receipt'}
                          </Button>
                          {proofFile && (
                            <Button
                              size="sm"
                              onClick={() => uploadProofMutation.mutate(proofFile)}
                              loading={uploadProofMutation.isPending}
                            >
                              Upload Proof
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No check-ins recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendance.slice(0, 10).map((log, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{formatDate(log.checkInTime, 'MMM d, yyyy')}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.checkInTime, 'h:mm a')}
                      {log.checkOutTime && ` - ${formatDate(log.checkOutTime, 'h:mm a')}`}
                    </div>
                  </div>
                </div>
              ))}
              {attendance.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{attendance.length - 10} more check-ins
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
