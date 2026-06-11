'use client'

import { useRef } from 'react'
import { Download, QrCode } from 'lucide-react'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'

interface QRCodeDisplayProps {
  qrCode?: string
  memberName?: string
  planName?: string
}

export function QRCodeDisplay({ qrCode, memberName, planName }: QRCodeDisplayProps) {
  const svgRef = useRef<HTMLDivElement>(null)

  const handleDownload = () => {
    const svgEl = svgRef.current?.querySelector('svg')
    if (!svgEl) return

    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    const size = 480
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `gymsera-qr-${Date.now()}.png`
      link.click()
    }
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`
  }

  if (!qrCode) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-xl">
        <QrCode className="h-16 w-16 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">QR code not available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={svgRef} className="bg-white p-4 rounded-2xl shadow-lg border">
        <QRCode
          value={qrCode}
          size={240}
          level="M"
          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
        />
      </div>
      {memberName && <p className="font-semibold text-center">{memberName}</p>}
      {planName && <p className="text-sm text-muted-foreground text-center">{planName}</p>}
      <Button variant="outline" className="gap-2" onClick={handleDownload}>
        <Download className="h-4 w-4" />
        Download QR Code
      </Button>
    </div>
  )
}
