import { test, expect } from '@playwright/test'

test.describe('App navigation', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/')
    // Should redirect to login or show login link
    await expect(page).toHaveURL(/login|register/)
  })

  test('library page requires authentication', async ({ page }) => {
    await page.goto('/library')
    await expect(page).toHaveURL(/login|register/)
  })
})
