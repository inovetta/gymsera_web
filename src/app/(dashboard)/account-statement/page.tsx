'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/features/empty-state'
import { meApi } from '@/lib/api/me'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function AccountStatementPage() {
  const { toast } = useToast()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['account-statement', startDate, endDate],
    queryFn: () => meApi.getAccountStatement({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: 100,
    }),
  })

  const rawSubscriptions = data?.data?.subscriptions || []
  const rawPayments = data?.data?.payments || []

  const entries = [
    ...rawSubscriptions.map((s) => ({
      id: s.id,
      type: 'SUBSCRIPTION' as const,
      description: s.membershipPlan?.name || 'Membership Subscription',
      amount: s.membershipPlan?.price || 0,
      status: s.status,
      date: s.startDate,
    })),
    ...rawPayments.map((p) => ({
      id: p.id,
      type: 'PAYMENT' as const,
      description: p.paymentFor || 'Payment',
      amount: p.amount,
      status: p.status,
      date: p.createdAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalPaid = rawPayments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const blob = await meApi.exportAccountStatement({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gymsera-statement-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'Statement exported!', variant: 'success' })
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  const typeColors: Record<string, string> = {
    SUBSCRIPTION: 'bg-blue-500/10 text-blue-600',
    PAYMENT: 'bg-green-500/10 text-green-600',
    INVOICE: 'bg-purple-500/10 text-purple-600',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Account Statement</h1>
          <p className="text-muted-foreground mt-1">Your complete payment and subscription history</p>
        </div>
        <Button onClick={handleExport} loading={isExporting} className="gap-2 shrink-0">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="mb-2 block text-sm">From Date</Label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <Label className="mb-2 block text-sm">To Date</Label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {(startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate('') }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Records</p>
            <p className="text-2xl font-bold mt-1">{entries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Amount</p>
            <p className="text-2xl font-bold mt-1 text-primary">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Subscriptions</p>
            <p className="text-2xl font-bold mt-1">{entries.filter((e) => e.type === 'SUBSCRIPTION').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No records found"
          description="Your account statement will appear here once you have subscriptions or payments."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {entry.description}
                    </TableCell>
                    <TableCell>
                      <span className={cn('text-xs font-medium px-2 py-1 rounded-full', typeColors[entry.type] || 'bg-muted text-muted-foreground')}>
                        {entry.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(getStatusColor(entry.status) as 'success' | 'warning' | 'secondary' | 'destructive') || 'secondary'}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
