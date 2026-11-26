import Link from 'next/link'
import { ProofOfPremisesUpload } from '@/components/features/proof-of-premises-upload'

export const metadata = { title: 'Proof of premises | GymsEra' }

/** Enterprise D10: where a new host uploads proof of premises after submitting (the wizard and the email link here). */
export default function ProofOfPremisesPage() {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">GymsEra</Link>
        <ProofOfPremisesUpload />
      </div>
    </main>
  )
}
