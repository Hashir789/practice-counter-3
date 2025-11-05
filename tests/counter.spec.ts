import { test, expect } from '@playwright/test'

const MAX_COUNT = 10

test.describe('Counter App', () => {
  test('should display initial counter value of 0', async ({ page }) => {
    await page.goto('/')

    const counterDisplay = page.getByTestId('counter-display')
    await expect(counterDisplay).toBeVisible()
    await expect(counterDisplay).toContainText('Count: 0')
  })

  test('should increment counter when button is clicked', async ({ page }) => {
    await page.goto('/')

    const incrementButton = page.getByTestId('increment-button')
    const counterDisplay = page.getByTestId('counter-display')

    // Click once and verify count is 1
    await incrementButton.click()
    await expect(counterDisplay).toContainText('Count: 1')

    // Click again and verify count is 2
    await incrementButton.click()
    await expect(counterDisplay).toContainText('Count: 2')
  })

  test('should reset to 0 after reaching max count', async ({ page }) => {
    await page.goto('/')

    const incrementButton = page.getByTestId('increment-button')
    const counterDisplay = page.getByTestId('counter-display')

    // Click 9 times to reach 9
    for (let i = 1; i < MAX_COUNT; i++) {
      await incrementButton.click()
      await expect(counterDisplay).toContainText(`Count: ${i}`)
    }

    // Click the 10th time, should reset to 0
    await incrementButton.click()
    await expect(counterDisplay).toContainText('Count: 0')
  })

  test('should handle multiple reset cycles', async ({ page }) => {
    await page.goto('/')

    const incrementButton = page.getByTestId('increment-button')
    const counterDisplay = page.getByTestId('counter-display')

    // Complete one full cycle (0 -> 10 -> 0)
    for (let i = 0; i < MAX_COUNT; i++) {
      await incrementButton.click()
    }
    await expect(counterDisplay).toContainText('Count: 0')

    // Complete another cycle
    for (let i = 0; i < MAX_COUNT; i++) {
      await incrementButton.click()
    }
    await expect(counterDisplay).toContainText('Count: 0')
  })

  test('should display hint text about reset behavior', async ({ page }) => {
    await page.goto('/')

    const hint = page.locator('.hint')
    await expect(hint).toBeVisible()
    await expect(hint).toContainText(`The counter will reset to 0 after reaching ${MAX_COUNT}`)
  })
})

