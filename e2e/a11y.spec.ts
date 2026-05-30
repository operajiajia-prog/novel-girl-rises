import { test, expect } from '@playwright/test'

test.describe('Accessibility: page structure', () => {
  test('login page has proper input elements', async ({ page }) => {
    await page.goto('/login')
    const inputs = page.locator('input:not([type="hidden"])')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('login page inputs have labels or aria-label', async ({ page }) => {
    await page.goto('/login')
    const inputs = page.locator('input:not([type="hidden"])')
    const count = await inputs.count()
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      // Each input must be identifiable by id (for label[for]), aria-label, or aria-labelledby
      const hasLabel = id
        ? (await page.locator(`label[for="${id}"]`).count()) > 0
        : false
      const isAccessible = hasLabel || !!ariaLabel || !!ariaLabelledBy
      expect(
        isAccessible,
        `Input #${i} (id="${id}") has no accessible name`,
      ).toBe(true)
    }
  })

  test('register page has labels for inputs', async ({ page }) => {
    await page.goto('/register')
    const inputs = page.locator('input:not([type="hidden"])')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('register page inputs have labels or aria-label', async ({ page }) => {
    await page.goto('/register')
    const inputs = page.locator('input:not([type="hidden"])')
    const count = await inputs.count()
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      const hasLabel = id
        ? (await page.locator(`label[for="${id}"]`).count()) > 0
        : false
      const isAccessible = hasLabel || !!ariaLabel || !!ariaLabelledBy
      expect(
        isAccessible,
        `Input #${i} (id="${id}") has no accessible name`,
      ).toBe(true)
    }
  })

  test('login page has a page title', async ({ page }) => {
    await page.goto('/login')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})
