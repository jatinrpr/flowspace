import { test, expect } from '@playwright/test'

test.describe('Slack Clone End-to-End Smoke Tests', () => {
  test('should render login page and contain login form elements', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Vite|Slack|React/i)
    
    // Email input field present
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()

    // Password input field present
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()

    // Submit button present
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('should redirect unauthenticated users away from admin dashboard', async ({ page }) => {
    await page.goto('/workspace/ws-test-123/admin')
    // Unauthenticated user redirected to login
    await expect(page).toHaveURL(/.*login/)
  })
})
