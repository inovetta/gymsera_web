'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wallet, Upload, Download, CheckCircle, Clock, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/features/empty-state'
import { meApi } from '@/lib/api/me'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Payment } from '@/types'

const statusIcons: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle className="h-4 w-4 text-success" />,
  PENDING: <Clock className="h-4 w-4 text-warning" />,
  FAILED: <X className="h-4 w-4 text-destructive" />,
  REFUNDED: <AlertCircle className="h-4 w-4 text-blue-500" />,
}

const statusBadge: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'destructive',
  REFUNDED: 'secondary',
}

export default function PaymentsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-payments', statusFilter],
    queryFn: () => meApi.getPayments({ status: statusFilter || undefined, limit: 50 }),
  })

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => meApi.uploadPaymentProof(id, file),
    onSuccess: () => {
      toast({ title: 'Proof uploaded!', description: 'Your payment proof has been submitted.', variant: 'success' })
      setUploadingId(null)
      queryClient.invalidateQueries({ queryKey: ['my-payments'] })
    },
    onError: () => toast({ title: 'Upload failed', variant: 'destructive' }),
  })

  const handleUpload = (paymentId: string) => {
    setUploadingId(paymentId)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && uploadingId) {
      uploadMutation.mutate({ id: uploadingId, file })
    }
  }

  const payments = data?.data?.payments || []

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payment History</h1>
          <p className="text-muted-foreground mt-1">Track all your payment transactions</p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payments found"
          description="Your payment history will appear here once you start your gym membership."
        />
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              onUploadProof={handleUpload}
              isUploading={uploadMutation.isPending && uploadingId === payment.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PaymentRow({
  payment,
  onUploadProof,
  isUploading,
}: {
  payment: Payment
  onUploadProof: (id: string) => void
  isUploading: boolean
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
            payment.status === 'COMPLETED' ? 'bg-success/10' :
            payment.status === 'PENDING' ? 'bg-warning/10' :
            payment.status === 'FAILED' ? 'bg-destructive/10' : 'bg-muted'
          )}>
            {statusIcons[payment.status] || <Wallet className="h-4 w-4" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-medium text-sm">{payment.paymentFor}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {payment.method} &bull; {formatDate(payment.createdAt)}
                </p>
                {payment.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-lg">{formatCurrency(payment.amount)}</p>
                <Badge variant={statusBadge[payment.status] || 'secondary'} className="text-xs mt-1">
                  {payment.status}
                </Badge>
              </div>
            </div>

            {/* Upload Proof for pending bank transfers */}
            {payment.status === 'PENDING' && payment.method === 'BANK_TRANSFER' && (
              <div className="mt-3 pt-3 border-t flex items-center gap-3">
                {payment.proofUrl ? (
                  <div className="flex items-center gap-2 text-xs text-success">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Payment proof uploaded
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-xs"
                    onClick={() => onUploadProof(payment.id)}
                    loading={isUploading}
                  >
                    <Upload className="h-3 w-3" />
                    Upload Payment Proof
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
