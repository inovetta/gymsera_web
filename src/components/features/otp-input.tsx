'use client'

import { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  className?: string
}

export function OTPInput({ value, onChange, length = 6, disabled = false, className }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '')
    if (!newValue) return

    const char = newValue[newValue.length - 1]
    const newDigits = [...digits]
    newDigits[index] = char
    onChange(newDigits.join('').slice(0, length))

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newDigits = [...digits]
      if (digits[index]) {
        newDigits[index] = ''
        onChange(newDigits.join(''))
      } else if (index > 0) {
        newDigits[index - 1] = ''
        onChange(newDigits.join(''))
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, length - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  return (
    <div className={cn('flex gap-2 sm:gap-3', className)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 bg-background transition-all',
            'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
            digit ? 'border-primary text-primary' : 'border-input text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      ))}
    </div>
  )
}
