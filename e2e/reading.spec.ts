import { test, expect } from '@playwright/test'

test.describe('Login page', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[name="username"], input[placeholder*="用户"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="username"], input[placeholder*="用户"]').first().fill('nonexistent_user_xyz')
    await page.locator('input[type="password"]').first().fill('wrongpassword123')
    await page.locator('button[type="submit"]').click()
    // Should show error or stay on login page
    await expect(page).toHaveURL(/login/)
  })
})
