'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { CheckCircle, Dumbbell, Building2, Package, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { discoveryApi } from '@/lib/api/discovery'
import { tenantsApi } from '@/lib/api/tenants'
import { packagesApi } from '@/lib/api/packages'
import { Tenant, PlatformPackage } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const step1Schema = z.object({
  businessName: z.string().min(2, 'Business name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone number required'),
  cityId: z.string().min(1, 'City required'),
})

const step2Schema = z.object({
  name: z.string().min(2, 'Gym name required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  genderType: z.string().min(1, 'Gender type required'),
  address: z.string().min(5, 'Address required'),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

const steps = [
  { num: 1, label: 'Business Info', icon: Building2 },
  { num: 2, label: 'Gym Profile', icon: Dumbbell },
  { num: 3, label: 'Choose Package', icon: Package },
  { num: 4, label: 'Review', icon: CheckCircle },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login?from=/onboarding')
    }
  }, [isLoading, isAuthenticated, router])
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PlatformPackage | null>(null)
  const [error, setError] = useState('')

  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: () => discoveryApi.getCities(),
  })

  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packagesApi.getPackages(),
  })

  const cities = citiesData?.data?.cities || []
  const packages = packagesData?.data?.filter((p) => p.status === 'ACTIVE') || []

  const step1Form = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  const step2Form = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })

  const registerMutation = useMutation({
    mutationFn: (data: Step1Data) => tenantsApi.registerTenant({ ...data, cityId: Number(data.cityId) }),
    onSuccess: (response) => {
      setTenant(response.data.tenant)
      setCurrentStep(2)
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Registration failed')
    },
  })

  const gymProfileMutation = useMutation({
    mutationFn: (data: Step2Data) => tenantsApi.submitGymProfile(tenant!.id, {
      gymName: data.name,
      gymDescription: data.description,
      genderType: data.genderType,
      address: data.address,
    }),
    onSuccess: () => setCurrentStep(3),
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Failed to save gym profile')
    },
  })

  const selectPackageMutation = useMutation({
    mutationFn: (pkgId: string) => tenantsApi.selectPackage(tenant!.id, { packageId: pkgId }),
    onSuccess: () => setCurrentStep(4),
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Failed to select package')
    },
  })

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center animate-pulse">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">Gyms<span className="text-primary">Era</span></span>
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Gym Owner Onboarding</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-10">
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                  currentStep > step.num
                    ? 'bg-success border-success text-white'
                    : currentStep === step.num
                    ? 'bg-primary border-primary text-white'
                    : 'border-muted-foreground/30 text-muted-foreground bg-background'
                )}>
                  {currentStep > step.num ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={cn(
                  'text-xs mt-1.5 hidden sm:block',
                  currentStep === step.num ? 'text-primary font-medium' : 'text-muted-foreground'
                )}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2',
                  currentStep > step.num ? 'bg-success' : 'bg-border'
                )} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Business Info */}
        {currentStep === 1 && (
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-1">Business Registration</h2>
              <p className="text-muted-foreground mb-8">Tell us about your gym business</p>

              <form onSubmit={step1Form.handleSubmit((data) => { setError(''); registerMutation.mutate(data) })} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <Label htmlFor="businessName" className="mb-2 block">Business Name</Label>
                    <Input
                      id="businessName"
                      placeholder="e.g. Fitness Plus Pvt Ltd"
                      {...step1Form.register('businessName')}
                      error={step1Form.formState.errors.businessName?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bizEmail" className="mb-2 block">Business Email</Label>
                    <Input
                      id="bizEmail"
                      type="email"
                      placeholder="info@yourcompany.com"
                      {...step1Form.register('email')}
                      error={step1Form.formState.errors.email?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bizPhone" className="mb-2 block">Business Phone</Label>
                    <Input
                      id="bizPhone"
                      type="tel"
                      placeholder="+92 300 1234567"
                      {...step1Form.register('phone')}
                      error={step1Form.formState.errors.phone?.message}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="mb-2 block">City</Label>
                    <Select onValueChange={(v) => step1Form.setValue('cityId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={String(city.id)}>{city.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {step1Form.formState.errors.cityId && (
                      <p className="text-xs text-destructive mt-1">{step1Form.formState.errors.cityId.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" size="lg" loading={registerMutation.isPending}>
                    Continue to Gym Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Gym Profile */}
        {currentStep === 2 && (
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-1">Gym Profile</h2>
              <p className="text-muted-foreground mb-8">Add details about your gym</p>

              <form onSubmit={step2Form.handleSubmit((data) => { setError(''); gymProfileMutation.mutate(data) })} className="space-y-5">
                <div>
                  <Label htmlFor="gymName" className="mb-2 block">Gym Name</Label>
                  <Input
                    id="gymName"
                    placeholder="e.g. Fitness Plus"
                    {...step2Form.register('name')}
                    error={step2Form.formState.errors.name?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="mb-2 block">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your gym, facilities, and what makes it unique..."
                    className="min-h-[100px]"
                    {...step2Form.register('description')}
                    error={step2Form.formState.errors.description?.message}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label className="mb-2 block">Gender Type</Label>
                    <Select onValueChange={(v) => step2Form.setValue('genderType', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MIXED">Mixed (Men & Women)</SelectItem>
                        <SelectItem value="MALE">Men Only</SelectItem>
                        <SelectItem value="FEMALE">Women Only</SelectItem>
                      </SelectContent>
                    </Select>
                    {step2Form.formState.errors.genderType && (
                      <p className="text-xs text-destructive mt-1">{step2Form.formState.errors.genderType.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address" className="mb-2 block">Address</Label>
                    <Input
                      id="address"
                      placeholder="Full gym address"
                      {...step2Form.register('address')}
                      error={step2Form.formState.errors.address?.message}
                    />
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Documents & Media</p>
                  <p>Logo, cover image, and KYC documents can be uploaded after account approval from the CMS portal.</p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" type="button" onClick={() => setCurrentStep(1)}>Back</Button>
                  <Button type="submit" size="lg" loading={gymProfileMutation.isPending}>
                    Continue to Package
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Package Selection */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Choose Your Package</h2>
              <p className="text-muted-foreground">Select a subscription package for your gym</p>
            </div>

            {packagesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {packages.map((pkg, i) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={cn(
                      'cursor-pointer rounded-xl border-2 p-5 transition-all',
                      selectedPackage?.id === pkg.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/40',
                      i === 1 && 'ring-2 ring-primary/20'
                    )}
                  >
                    {i === 1 && <div className="text-xs font-semibold text-primary mb-2">MOST POPULAR</div>}
                    <h3 className="font-bold text-lg mb-1">{pkg.name}</h3>
                    {pkg.description && <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>}
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-primary">{formatCurrency(pkg.price)}</span>
                      <span className="text-muted-foreground text-sm">/{pkg.billingCycle.toLowerCase()}</span>
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> {pkg.maxBranches} branches</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> {pkg.maxMembers} members</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> {pkg.maxTrainers} trainers</li>
                    </ul>
                    {selectedPackage?.id === pkg.id && (
                      <div className="mt-3 flex items-center gap-1.5 text-primary text-sm font-medium">
                        <CheckCircle className="h-4 w-4" /> Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
              <Button
                size="lg"
                disabled={!selectedPackage}
                loading={selectPackageMutation.isPending}
                onClick={() => { setError(''); selectedPackage && selectPackageMutation.mutate(selectedPackage.id) }}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Your gym registration is under review. Our team will verify your information and approve your account within 1-2 business days.
              </p>

              <div className="bg-muted rounded-xl p-5 text-left mb-8 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Business</span>
                  <span className="font-medium">{tenant?.businessName}</span>
                </div>
                {selectedPackage && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Package</span>
                    <span className="font-medium">{selectedPackage.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-warning">Under Review</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">Go to Dashboard</Button>
                </Link>
                <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer">
                  <Button size="lg">Open CMS Portal</Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
