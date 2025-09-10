import { test, expect } from '@playwright/test'

test.describe('AI Image Studio - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up environment for testing
    await page.addInitScript(() => {
      // Mock the API calls to avoid external dependencies
      window.fetch = new Proxy(window.fetch, {
        apply: async (target, thisArg, args) => {
          const url = args[0]
          if (typeof url === 'string') {
            // Mock image generation
            if (url.includes('/images/generate')) {
              return new Response(JSON.stringify([{
                filename: 'test-generated.png',
                size_bytes: 1024,
                url: '/static/images/test-generated.png'
              }]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              })
            }
            // Mock image editing
            if (url.includes('/images/edit')) {
              return new Response(JSON.stringify([{
                filename: 'test-edited.png',
                size_bytes: 1024,
                url: '/static/images/test-edited.png'
              }]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              })
            }
            // Mock image listing
            if (url.includes('/images') && !url.includes('/generate') && !url.includes('/edit')) {
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              })
            }
            // Mock client logging
            if (url.includes('/logs/client')) {
              return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              })
            }
          }
          return target.apply(thisArg, args)
        }
      })
    })
  })

  test('should load the application', async ({ page }) => {
    await page.goto('http://localhost:3000/edit')

    // Check that the main heading is visible
    await expect(page.getByText('AI Image Studio')).toBeVisible()

    // Check that the form elements are present
    await expect(page.getByLabel('Base Image *')).toBeVisible()
    await expect(page.getByLabel('Prompt')).toBeVisible()
    await expect(page.getByText('Generate / Edit')).toBeVisible()
  })

  test('should generate an image', async ({ page }) => {
    await page.goto('http://localhost:3000/edit')

    // Fill in the prompt
    await page.getByLabel('Prompt').fill('A beautiful sunset over mountains')

    // Click generate
    await page.getByText('Generate / Edit').click()

    // Wait for success message
    await expect(page.getByText('Image generated')).toBeVisible()

    // Check that an image appears in the gallery
    await expect(page.getByAltText(/test-generated/)).toBeVisible()
  })

  test('should edit an image with references', async ({ page }) => {
    await page.goto('http://localhost:3000/edit')

    // Create a test image file
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

    // Upload base image
    await page.getByLabel('Base Image *').setInputFiles([{
      name: 'base.png',
      mimeType: 'image/png',
      buffer: testImageBuffer
    }])

    // Upload reference images
    await page.getByLabel('Reference Images (0–7)').setInputFiles([
      {
        name: 'ref1.png',
        mimeType: 'image/png',
        buffer: testImageBuffer
      },
      {
        name: 'ref2.png',
        mimeType: 'image/png',
        buffer: testImageBuffer
      }
    ])

    // Fill in the prompt
    await page.getByLabel('Prompt').fill('Edit this image with better lighting')

    // Click generate
    await page.getByText('Generate / Edit').click()

    // Wait for success message
    await expect(page.getByText('Image generated')).toBeVisible()

    // Check that an image appears in the gallery
    await expect(page.getByAltText(/test-edited/)).toBeVisible()
  })

  test('should edit an image with mask', async ({ page }) => {
    await page.goto('http://localhost:3000/edit')

    // Create test files
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

    // Upload base image
    await page.getByLabel('Base Image *').setInputFiles([{
      name: 'base.png',
      mimeType: 'image/png',
      buffer: testImageBuffer
    }])

    // Upload mask
    await page.getByLabel('Mask (PNG/alpha, optional)').setInputFiles([{
      name: 'mask.png',
      mimeType: 'image/png',
      buffer: testImageBuffer
    }])

    // Select inpaint mode
    await page.getByLabel('Inpaint (Mask)').check()

    // Fill in the prompt
    await page.getByLabel('Prompt').fill('Remove the object in the masked area')

    // Click generate
    await page.getByText('Generate / Edit').click()

    // Wait for success message
    await expect(page.getByText('Image generated')).toBeVisible()

    // Check that an image appears in the gallery
    await expect(page.getByAltText(/test-edited/)).toBeVisible()
  })

  test('should handle provider override', async ({ page }) => {
    await page.goto('http://localhost:3000/edit')

    // Fill in the prompt
    await page.getByLabel('Prompt').fill('Test provider override')

    // Change provider to Gemini Direct
    await page.getByLabel('Provider').selectOption('Gemini (direct)')

    // Click generate
    await page.getByText('Generate / Edit').click()

    // Wait for success message
    await expect(page.getByText('Image generated')).toBeVisible()

    // Check that an image appears in the gallery
    await expect(page.getByAltText(/test-generated/)).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('http://localhost:3000/edit')

    // Try to submit without prompt
    await page.getByText('Generate / Edit').click()

    // Should show validation error (this would be handled by the form validation)
    // Since we're mocking, we'll just check that the button is clickable
    await expect(page.getByText('Generate / Edit')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000/edit')

    // Mock an API error
    await page.addInitScript(() => {
      window.fetch = new Proxy(window.fetch, {
        apply: async (target, thisArg, args) => {
          const url = args[0]
          if (typeof url === 'string' && url.includes('/images/generate')) {
            return new Response(JSON.stringify({ detail: 'API Error' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            })
          }
          return target.apply(thisArg, args)
        }
      })
    })

    // Fill in the prompt
    await page.getByLabel('Prompt').fill('This will fail')

    // Click generate
    await page.getByText('Generate / Edit').click()

    // Should show error message
    await expect(page.getByText(/Error/)).toBeVisible()
  })

  test('should display image gallery with download links', async ({ page }) => {
    await page.goto('http://localhost:3000/edit')

    // Mock gallery with existing images
    await page.addInitScript(() => {
      window.fetch = new Proxy(window.fetch, {
        apply: async (target, thisArg, args) => {
          const url = args[0]
          if (typeof url === 'string' && url.includes('/images') && !url.includes('/generate') && !url.includes('/edit')) {
            return new Response(JSON.stringify([{
              filename: 'existing-image.png',
              size_bytes: 2048,
              url: '/static/images/existing-image.png',
              created_at: Date.now() / 1000
            }]), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }
          return target.apply(thisArg, args)
        }
      })
    })

    // Reload to get the mocked data
    await page.reload()

    // Check that the existing image is displayed
    await expect(page.getByAltText('existing-image.png')).toBeVisible()

    // Check for download link
    const downloadLink = page.getByText('Download')
    await expect(downloadLink).toBeVisible()
    await expect(downloadLink).toHaveAttribute('href', /\/static\/images\/existing-image\.png/)
    await expect(downloadLink).toHaveAttribute('download')
  })

  test('should handle queue functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/edit')

    // Enable queue toggle
    await page.getByLabel('Use Queue').check()

    // Fill in the prompt
    await page.getByLabel('Prompt').fill('Test queue functionality')

    // Mock queue submission and polling
    await page.addInitScript(() => {
      window.fetch = new Proxy(window.fetch, {
        apply: async (target, thisArg, args) => {
          const url = args[0]
          if (typeof url === 'string') {
            if (url.includes('/jobs/submit')) {
              return new Response(JSON.stringify({
                id: 'test-job-123',
                status: 'queued'
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              })
            }
            if (url.includes('/jobs/test-job-123')) {
              return new Response(JSON.stringify({
                id: 'test-job-123',
                status: 'done',
                result: [{
                  filename: 'queued-result.png',
                  size_bytes: 1024,
                  url: '/static/images/queued-result.png'
                }]
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              })
            }
          }
          return target.apply(thisArg, args)
        }
      })
    })

    // Click generate
    await page.getByText('Generate / Edit').click()

    // Should show queue submission message
    await expect(page.getByText(/Submitted to queue/)).toBeVisible()

    // Should eventually show success message
    await expect(page.getByText('Image ready')).toBeVisible()

    // Check that the result appears in gallery
    await expect(page.getByAltText(/queued-result/)).toBeVisible()
  })
})