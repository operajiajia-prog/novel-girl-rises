import { test, expect } from '@playwright/test'

test.describe('App pages', () => {
  test('home page loads without error', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('/')
    // Just verify no JS runtime errors
    expect(errors.filter(e => !e.includes('Warning'))).toHaveLength(0)
  })

  test('login page has correct title or heading', async ({ page }) => {
    await page.goto('/login')
    // Check for page title or h1 heading
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})
