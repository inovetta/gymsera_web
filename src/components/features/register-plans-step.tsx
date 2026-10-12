'use client'

import { useState } from 'react'
import { ArrowLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatPlansForApi } from '@/lib/format-plans'
import { formatCurrency } from '@/lib/utils'

// A plan as the host types it. formatPlansForApi (mirror of mobile's
// _formatPlansForApi) turns the list into the shape the API stores.
export interface PlanDraft {
  name: string
  durationType: string
  durationValue: number
  price: string
  joiningFee: string
  description: string
}

// Half-yearly is MONTHLY x 6: mobile's duration matcher reads any string
// containing "YEAR"/"ANNUAL" as YEARLY, so it can't be sent as a name.
const DURATIONS = [
  { key: 'DAILY', label: 'Daily', durationType: 'DAILY', durationValue: 1 },
  { key: 'WEEKLY', label: 'Weekly', durationType: 'WEEKLY', durationValue: 1 },
  { key: 'MONTHLY', label: 'Monthly', durationType: 'MONTHLY', durationValue: 1 },
  { key: 'QUARTERLY', label: 'Quarterly (3 months)', durationType: 'QUARTERLY', durationValue: 3 },
  { key: 'HALF', label: 'Half-yearly (6 months)', durationType: 'MONTHLY', durationValue: 6 },
  { key: 'YEARLY', label: 'Yearly', durationType: 'YEARLY', durationValue: 12 },
]
const durationKey = (p: Pick<PlanDraft, 'durationType' | 'durationValue'>) =>
  DURATIONS.find((d) => d.durationType === p.durationType && d.durationValue === p.durationValue)?.key ?? 'MONTHLY'

const EMPTY: PlanDraft = { name: '', durationType: 'MONTHLY', durationValue: 1, price: '', joiningFee: '', description: '' }

// Drafts -> API plans. Blank optional text becomes null, as mobile sends it.
export function draftsToApiPlans(drafts: PlanDraft[]) {
  return formatPlansForApi(
    drafts.map((d) => ({
      ...d,
      description: d.description.trim() || undefined,
      joiningFee: d.joiningFee.trim() || undefined,
    }))
  )
}

interface Props {
  plans: PlanDraft[]
  onChange: (plans: PlanDraft[]) => void
  onBack: () => void
  onContinue: () => void
  loading?: boolean
}

export function RegisterPlansStep({ plans, onChange, onBack, onContinue, loading }: Props) {
  const [draft, setDraft] = useState<PlanDraft>(EMPTY)
  const [formError, setFormError] = useState('')

  const addPlan = () => {
    const price = Number(draft.price)
    if (draft.name.trim().length < 2) return setFormError('Plan name is required.')
    if (!draft.price.trim() || Number.isNaN(price) || price < 0) return setFormError('Enter a valid price.')
    if (draft.joiningFee.trim() && (Number.isNaN(Number(draft.joiningFee)) || Number(draft.joiningFee) < 0)) {
      return setFormError('Enter a valid joining fee.')
    }
    setFormError('')
    onChange([...plans, { ...draft, name: draft.name.trim() }])
    setDraft(EMPTY)
  }

  const preview = draftsToApiPlans(plans)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Membership Plans</h1>
        <p className="text-muted-foreground text-sm">
          Add at least one plan members can buy at your gym. You can change plans anytime from your dashboard.
        </p>
      </div>

      {plans.length > 0 && (
        <ul className="space-y-2" aria-label="Membership plans">
          {plans.map((p, i) => (
            <li key={i} className="flex items-center justify-between bg-card border rounded-xl p-3">
              <div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {DURATIONS.find((d) => d.key === durationKey(p))?.label} · {formatCurrency(preview[i].price)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove ${p.name}`}
                onClick={() => onChange(plans.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="bg-card border rounded-xl p-4 space-y-4">
        <div>
          <Label className="mb-2 block">Plan name</Label>
          <Input
            placeholder="e.g. Monthly Membership"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Duration</Label>
            <Select
              value={durationKey(draft)}
              onValueChange={(k) => {
                const d = DURATIONS.find((x) => x.key === k)!
                setDraft({ ...draft, durationType: d.durationType, durationValue: d.durationValue })
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Price</Label>
            <Input
              type="number"
              min="0"
              placeholder="5000"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Joining fee <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={draft.joiningFee}
              onChange={(e) => setDraft({ ...draft, joiningFee: e.target.value })}
            />
          </div>
          <div>
            <Label className="mb-2 block">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
        </div>
        {formError && <p className="text-xs text-destructive" role="alert">{formError}</p>}
        <Button type="button" variant="outline" onClick={addPlan}>
          <Plus className="h-4 w-4 mr-1" /> Add plan
        </Button>
      </div>

      {plans.length === 0 && (
        <p className="text-xs text-muted-foreground">Add at least one plan to continue.</p>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" type="button" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button type="button" size="lg" disabled={plans.length === 0} loading={loading} onClick={onContinue}>
          Continue to Packages <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
