import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

describe('dead tenant upload client methods are gone (backend has no /logo or /cover-image routes)', () => {
  it('no source file defines or calls uploadLogo / uploadCoverImage', () => {
    const offenders = walk(join(process.cwd(), 'src'))
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => /uploadLogo|uploadCoverImage/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('tenants.ts no longer posts to /logo or /cover-image', () => {
    const src = readFileSync(join(process.cwd(), 'src/lib/api/tenants.ts'), 'utf8')
    expect(src).not.toMatch(/\/logo|\/cover-image/)
  })
})
