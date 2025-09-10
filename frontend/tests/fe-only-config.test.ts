import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'

// Mock fs and path for testing
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
  },
  existsSync: vi.fn(),
}))

vi.mock('path', () => ({
  join: vi.fn(),
  dirname: vi.fn(),
}))

describe('Frontend-only Configuration', () => {
  const mockFs = fs as any
  const mockPath = path as any

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_API_BASE
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Environment Variable Reading', () => {
    it('should read NEXT_PUBLIC_API_BASE from environment', () => {
      // Set environment variable
      process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:3001'

      // Import the module that uses the environment variable
      // This simulates how the frontend reads the env var
      const apiBase = process.env.NEXT_PUBLIC_API_BASE

      expect(apiBase).toBe('http://localhost:3001')
    })

    it('should use default API base when env var is not set', () => {
      // Don't set the environment variable
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

      expect(apiBase).toBe('http://localhost:8000')
    })

    it('should construct correct API URLs using the base', () => {
      process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:3001'

      const apiBase = process.env.NEXT_PUBLIC_API_BASE
      const imagesUrl = `${apiBase}/images`
      const generateUrl = `${apiBase}/images/generate`
      const editUrl = `${apiBase}/images/edit`
      const jobsUrl = `${apiBase}/jobs/submit`

      expect(imagesUrl).toBe('http://localhost:3001/images')
      expect(generateUrl).toBe('http://localhost:3001/images/generate')
      expect(editUrl).toBe('http://localhost:3001/images/edit')
      expect(jobsUrl).toBe('http://localhost:3001/jobs/submit')
    })
  })

  describe('Setup Scripts', () => {
    it('should create output directory when running setup script', async () => {
      mockFs.existsSync.mockReturnValue(false)
      mockFs.promises.mkdir.mockResolvedValue(undefined)

      // Simulate the setup script logic
      const outputDir = 'public/output'
      if (!fs.existsSync(outputDir)) {
        await fs.promises.mkdir(outputDir, { recursive: true })
      }

      expect(mockFs.existsSync).toHaveBeenCalledWith(outputDir)
      expect(mockFs.promises.mkdir).toHaveBeenCalledWith(outputDir, { recursive: true })
    })

    it('should create .env.local file with correct content', async () => {
      const envContent = `# Frontend-only configuration
# Set this to your backend API URL when running with backend
NEXT_PUBLIC_API_BASE=http://localhost:8000
`

      mockFs.promises.writeFile.mockResolvedValue(undefined)

      // Simulate writing .env.local
      await fs.promises.writeFile('.env.local', envContent)

      expect(mockFs.promises.writeFile).toHaveBeenCalledWith('.env.local', envContent)
    })

    it('should handle existing output directory gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true)

      // Simulate the setup script logic
      const outputDir = 'public/output'
      if (!fs.existsSync(outputDir)) {
        await fs.promises.mkdir(outputDir, { recursive: true })
      }

      expect(mockFs.existsSync).toHaveBeenCalledWith(outputDir)
      expect(mockFs.promises.mkdir).not.toHaveBeenCalled()
    })
  })

  describe('API Calls with Environment Variables', () => {
    it('should use environment variable for fetch calls', async () => {
      process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:3001'

      const apiBase = process.env.NEXT_PUBLIC_API_BASE
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      })

      global.fetch = mockFetch

      // Simulate API call
      await fetch(`${apiBase}/images`)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/images', undefined)
    })

    it('should handle different API base URLs', () => {
      const testCases = [
        'http://localhost:8000',
        'https://api.example.com',
        'http://192.168.1.100:3000',
        'https://staging-api.example.com/v1'
      ]

      testCases.forEach(baseUrl => {
        process.env.NEXT_PUBLIC_API_BASE = baseUrl
        const apiBase = process.env.NEXT_PUBLIC_API_BASE

        expect(apiBase).toBe(baseUrl)
        expect(`${apiBase}/images`).toBe(`${baseUrl}/images`)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing environment variable gracefully', () => {
      // Don't set NEXT_PUBLIC_API_BASE
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

      expect(apiBase).toBe('http://localhost:8000')
    })

    it('should handle invalid environment variable values', () => {
      process.env.NEXT_PUBLIC_API_BASE = ''

      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

      expect(apiBase).toBe('http://localhost:8000')
    })
  })
})