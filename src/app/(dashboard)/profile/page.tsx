'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Eye, EyeOff, User, Lock, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { meApi } from '@/lib/api/me'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/hooks/use-toast'
import { getInitials } from '@/lib/utils'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
})

const fitnessSchema = z.object({
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  height: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  fitnessGoal: z.string().optional(),
  allergies: z.string().optional(),
  foodPreferences: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ProfileFormData = z.infer<typeof profileSchema>
type FitnessFormData = z.infer<typeof fitnessSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => meApi.getProfile(),
  })

  const user = profileData?.data?.profile

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: user ? { fullName: user.fullName, phone: user.phone || '' } : undefined,
  })

  const fitnessForm = useForm<FitnessFormData>({
    resolver: zodResolver(fitnessSchema),
    values: user ? {
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth || '',
      height: user.height,
      weight: user.weight,
      fitnessGoal: user.fitnessGoal || '',
      allergies: user.allergies || '',
      foodPreferences: user.foodPreferences || '',
    } : undefined,
  })

  const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => meApi.updateProfile(data),
    onSuccess: (response) => {
      if (response.data?.profile) setUser(response.data.profile)
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      toast({ title: 'Profile updated!', variant: 'success' })
    },
    onError: () => toast({ title: 'Failed to update profile', variant: 'destructive' }),
  })

  const updateFitnessMutation = useMutation({
    mutationFn: (data: FitnessFormData) => meApi.updateProfile(data),
    onSuccess: (response) => {
      if (response.data?.profile) setUser(response.data.profile)
      toast({ title: 'Fitness profile updated!', variant: 'success' })
    },
    onError: () => toast({ title: 'Failed to update fitness profile', variant: 'destructive' }),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordFormData) => meApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    onSuccess: () => {
      toast({ title: 'Password changed!', variant: 'success' })
      passwordForm.reset()
    },
    onError: () => toast({ title: 'Failed to change password. Check your current password.', variant: 'destructive' }),
  })

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => meApi.uploadProfileImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      toast({ title: 'Profile photo updated!', variant: 'success' })
    },
    onError: () => toast({ title: 'Failed to upload photo', variant: 'destructive' }),
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadImageMutation.mutate(file)
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information and settings</p>
      </div>

      {/* Avatar Upload */}
      <Card>
        <CardContent className="flex items-center gap-5 p-5">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback className="text-xl">{user ? getInitials(user.fullName) : 'U'}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white shadow-md hover:bg-primary/90 transition-colors"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{user?.fullName}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {uploadImageMutation.isPending ? 'Uploading...' : 'Click the camera icon to update photo'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="fitness" className="gap-2">
            <Activity className="h-4 w-4" />
            Fitness
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="mb-2 block">Full Name</Label>
                    <Input
                      id="fullName"
                      {...profileForm.register('fullName')}
                      error={profileForm.formState.errors.fullName?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="mb-2 block">Email</Label>
                    <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="phone" className="mb-2 block">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+92 300 1234567"
                      {...profileForm.register('phone')}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={updateProfileMutation.isPending}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fitness Profile Tab */}
        <TabsContent value="fitness">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fitness Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={fitnessForm.handleSubmit((data) => updateFitnessMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Gender</Label>
                    <Select value={fitnessForm.watch('gender') || ''} onValueChange={(v) => fitnessForm.setValue('gender', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dob" className="mb-2 block">Date of Birth</Label>
                    <input
                      id="dob"
                      type="date"
                      {...fitnessForm.register('dateOfBirth')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="mb-2 block">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="175"
                      {...fitnessForm.register('height')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight" className="mb-2 block">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      {...fitnessForm.register('weight')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="mb-2 block">Fitness Goal</Label>
                    <Select value={fitnessForm.watch('fitnessGoal') || ''} onValueChange={(v) => fitnessForm.setValue('fitnessGoal', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEIGHT_LOSS">Weight Loss</SelectItem>
                        <SelectItem value="MUSCLE_GAIN">Muscle Gain</SelectItem>
                        <SelectItem value="ENDURANCE">Build Endurance</SelectItem>
                        <SelectItem value="FLEXIBILITY">Improve Flexibility</SelectItem>
                        <SelectItem value="GENERAL_FITNESS">General Fitness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="allergies" className="mb-2 block">Allergies</Label>
                    <Input
                      id="allergies"
                      placeholder="e.g. peanuts, gluten"
                      {...fitnessForm.register('allergies')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="foodPreferences" className="mb-2 block">Food Preferences</Label>
                    <Input
                      id="foodPreferences"
                      placeholder="e.g. vegetarian, halal"
                      {...fitnessForm.register('foodPreferences')}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={updateFitnessMutation.isPending}>
                    Save Fitness Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="mb-2 block">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type={showCurrentPw ? 'text' : 'password'}
                    placeholder="Enter current password"
                    {...passwordForm.register('currentPassword')}
                    error={passwordForm.formState.errors.currentPassword?.message}
                    iconRight={
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="mb-2 block">New Password</Label>
                  <Input
                    id="newPassword"
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    {...passwordForm.register('newPassword')}
                    error={passwordForm.formState.errors.newPassword?.message}
                    iconRight={
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)}>
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="mb-2 block">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    {...passwordForm.register('confirmPassword')}
                    error={passwordForm.formState.errors.confirmPassword?.message}
                    iconRight={
                      <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                        {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={changePasswordMutation.isPending}>
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
