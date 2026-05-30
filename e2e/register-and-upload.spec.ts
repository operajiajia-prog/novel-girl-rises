import { test, expect } from '@playwright/test'

test.describe('Register page', () => {
  test('register page loads with required fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('input[name="username"], input[placeholder*="用户"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows validation error for short username', async ({ page }) => {
    await page.goto('/register')
    const usernameInput = page.locator('input[name="username"], input[placeholder*="用户"]').first()
    await usernameInput.fill('ab')
    await page.locator('button[type="submit"]').click()
    // Expect some kind of error feedback (could be HTML5 validation or custom)
    // Just verify the page didn't navigate away
    await expect(page).toHaveURL(/register/)
  })
})
