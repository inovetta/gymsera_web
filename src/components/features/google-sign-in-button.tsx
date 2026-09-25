'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

// Google Identity Services' own typings live in @types/google.accounts, which
// this project doesn't depend on — declared narrowly here to exactly the
// shape actually used below, rather than pulling in the whole library.
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              logo_alignment?: 'left' | 'center'
              width?: number
            }
          ) => void
        }
      }
    }
  }
}

interface GoogleSignInButtonProps {
  /** Called with the raw Google ID token (a JWT) once the person picks an account. */
  onCredential: (idToken: string) => void
  /** 'signin_with' on the login page, 'signup_with' on registration — same button, different copy. */
  text?: 'signin_with' | 'signup_with' | 'continue_with'
}

/**
 * Renders Google's own "Sign in with Google" button via Google Identity
 * Services (GIS) — not a custom-styled lookalike. GIS's renderButton is the
 * one flow that hands back a real, backend-verifiable ID token from an
 * actual click gesture; the OAuth "token client" alternative only yields an
 * access token, which POST /auth/social/google (googleLogin) can't verify.
 * The Flutter app's own Google Sign-In (google_auth_provider.dart) ends at
 * the identical backend call with the identical payload shape — this is the
 * web equivalent of that, not a separate auth path.
 *
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID to be set, AND that client's
 * "Authorized JavaScript origins" (Google Cloud Console → Credentials) to
 * include this site's actual origin — GIS fails silently in the browser
 * console with an origin mismatch otherwise, not as a backend error.
 */
export function GoogleSignInButton({ onCredential, text = 'signin_with' }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const onCredentialRef = useRef(onCredential)
  onCredentialRef.current = onCredential
  const [scriptReady, setScriptReady] = useState(false)
  const [configError, setConfigError] = useState(false)

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!scriptReady) return
    if (!clientId) {
      setConfigError(true)
      return
    }
    if (!window.google || !buttonRef.current) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      // Stable ref so GIS always calls the latest onCredential without this
      // effect needing to re-initialize (and re-render the button) every time
      // the parent re-renders.
      callback: (response) => onCredentialRef.current(response.credential),
    })
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text,
      logo_alignment: 'left',
      width: buttonRef.current.parentElement?.clientWidth,
    })
  }, [scriptReady, clientId, text])

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      {configError ? (
        <div className="w-full h-11 flex items-center justify-center rounded-md border text-sm text-muted-foreground">
          Google sign-in is not configured
        </div>
      ) : (
        // GIS renders its button into this div directly (an iframe it
        // injects itself) — h-11 matches the height of every other button on
        // this form so nothing jumps once the script loads and replaces it.
        <div ref={buttonRef} className="w-full h-11 flex items-center justify-center overflow-hidden rounded-md" />
      )}
    </>
  )
}
