/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditPage from '../app/edit/page'
import axios from 'axios'

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock fetch for polling
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock the API response
const mockImageItems = [
  {
    filename: 'test-image.png',
    url: '/static/images/test-image.png',
    size_bytes: 1024,
    created_at: Date.now() / 1000,
  },
]

const mockJobResponse = {
  id: 'test-job-123',
  status: 'queued',
}

const mockJobStatusQueued = {
  id: 'test-job-123',
  status: 'queued',
  job_id: 'test-job-123',
}

const mockJobStatusRunning = {
  id: 'test-job-123',
  status: 'running',
  job_id: 'test-job-123',
}

const mockJobStatusDone = {
  id: 'test-job-123',
  status: 'done',
  job_id: 'test-job-123',
  result: mockImageItems,
}

describe('Frontend Queue Flow', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()

    // Mock the initial images fetch
    mockedAxios.get.mockResolvedValue({ data: mockImageItems })

    // Mock fetch responses for polling
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/jobs/')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockJobStatusDone),
          ok: true,
          status: 200,
        } as Response)
      }
      return Promise.resolve({
        json: () => Promise.resolve(mockImageItems),
        ok: true,
        status: 200,
      } as Response)
    })
  })

  test('renders "Use queue" toggle', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    // Check for the queue toggle
    expect(screen.getByLabelText(/Use queue/i)).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /Use queue/i })).toBeInTheDocument()
  })

  test('queue toggle is unchecked by default', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const queueToggle = screen.getByRole('switch', { name: /Use queue/i })
    expect(queueToggle).not.toBeChecked()
  })

  test('can toggle queue on and off', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()
    const queueToggle = screen.getByRole('switch', { name: /Use queue/i })

    // Initially unchecked
    expect(queueToggle).not.toBeChecked()

    // Toggle on
    await user.click(queueToggle)
    expect(queueToggle).toBeChecked()

    // Toggle off
    await user.click(queueToggle)
    expect(queueToggle).not.toBeChecked()
  })

  test('submits to queue when toggle is on', async () => {
    // Mock queue submission
    mockedAxios.post.mockImplementation((url: string) => {
      if (url.includes('/jobs/submit')) {
        return Promise.resolve({ status: 200, data: mockJobResponse })
      }
      return Promise.resolve({ status: 200, data: mockImageItems })
    })

    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Turn on queue toggle
    const queueToggle = screen.getByRole('switch', { name: /Use queue/i })
    await user.click(queueToggle)

    // Upload base image
    const baseFile = new File(['base content'], 'base.png', { type: 'image/png' })
    const baseInput = screen.getByLabelText(/Base Image/i)
    await user.upload(baseInput, baseFile)

    // Update prompt
    const promptTextarea = screen.getByLabelText(/Prompt/i)
    await user.clear(promptTextarea)
    await user.type(promptTextarea, 'Edit this image with queue')

    // Submit form
    const submitButton = screen.getByText(/Generate \/ Edit/i)
    await user.click(submitButton)

    // Check that jobs/submit was called
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/submit'),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      )
    })

    // Check that info toast was called for queue submission
    expect(require('sonner').toast.info).toHaveBeenCalledWith(
      'Submitted to queue',
      { description: expect.stringContaining('test-job-123') }
    )
  })

  test('polls job status when using queue', async () => {
    // Mock queue submission
    mockedAxios.post.mockImplementation((url: string) => {
      if (url.includes('/jobs/submit')) {
        return Promise.resolve({ status: 200, data: mockJobResponse })
      }
      return Promise.resolve({ status: 200, data: mockImageItems })
    })

    // Mock polling sequence: queued -> running -> done
    let pollCount = 0
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/jobs/test-job-123')) {
        pollCount++
        if (pollCount === 1) {
          return Promise.resolve({
            json: () => Promise.resolve(mockJobStatusQueued),
            ok: true,
            status: 200,
          } as Response)
        } else if (pollCount === 2) {
          return Promise.resolve({
            json: () => Promise.resolve(mockJobStatusRunning),
            ok: true,
            status: 200,
          } as Response)
        } else {
          return Promise.resolve({
            json: () => Promise.resolve(mockJobStatusDone),
            ok: true,
            status: 200,
          } as Response)
        }
      }
      return Promise.resolve({
        json: () => Promise.resolve(mockImageItems),
        ok: true,
        status: 200,
      } as Response)
    })

    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Turn on queue toggle
    const queueToggle = screen.getByRole('switch', { name: /Use queue/i })
    await user.click(queueToggle)

    // Upload base image
    const baseFile = new File(['base content'], 'base.png', { type: 'image/png' })
    const baseInput = screen.getByLabelText(/Base Image/i)
    await user.upload(baseInput, baseFile)

    // Update prompt
    const promptTextarea = screen.getByLabelText(/Prompt/i)
    await user.clear(promptTextarea)
    await user.type(promptTextarea, 'Edit this image with queue')

    // Submit form
    const submitButton = screen.getByText(/Generate \/ Edit/i)
    await user.click(submitButton)

    // Wait for polling to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/test-job-123'),
        expect.any(Object)
      )
    })

    // Check that success toast was called when job completes
    expect(require('sonner').toast.success).toHaveBeenCalledWith('Image ready')
  })

  test('handles job error status', async () => {
    // Mock queue submission
    mockedAxios.post.mockImplementation((url: string) => {
      if (url.includes('/jobs/submit')) {
        return Promise.resolve({ status: 200, data: mockJobResponse })
      }
      return Promise.resolve({ status: 200, data: mockImageItems })
    })

    // Mock job error
    const mockJobStatusError = {
      id: 'test-job-123',
      status: 'error',
      job_id: 'test-job-123',
      error: 'Job processing failed',
    }

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/jobs/test-job-123')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockJobStatusError),
          ok: true,
          status: 200,
        } as Response)
      }
      return Promise.resolve({
        json: () => Promise.resolve(mockImageItems),
        ok: true,
        status: 200,
      } as Response)
    })

    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Turn on queue toggle
    const queueToggle = screen.getByRole('switch', { name: /Use queue/i })
    await user.click(queueToggle)

    // Upload base image
    const baseFile = new File(['base content'], 'base.png', { type: 'image/png' })
    const baseInput = screen.getByLabelText(/Base Image/i)
    await user.upload(baseInput, baseFile)

    // Update prompt
    const promptTextarea = screen.getByLabelText(/Prompt/i)
    await user.clear(promptTextarea)
    await user.type(promptTextarea, 'Edit this image with queue')

    // Submit form
    const submitButton = screen.getByText(/Generate \/ Edit/i)
    await user.click(submitButton)

    // Check that error toast was called
    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Job processing failed')
    })
  })

  test('updates gallery when job completes', async () => {
    // Mock queue submission
    mockedAxios.post.mockImplementation((url: string) => {
      if (url.includes('/jobs/submit')) {
        return Promise.resolve({ status: 200, data: mockJobResponse })
      }
      return Promise.resolve({ status: 200, data: mockImageItems })
    })

    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Turn on queue toggle
    const queueToggle = screen.getByRole('switch', { name: /Use queue/i })
    await user.click(queueToggle)

    // Upload base image
    const baseFile = new File(['base content'], 'base.png', { type: 'image/png' })
    const baseInput = screen.getByLabelText(/Base Image/i)
    await user.upload(baseInput, baseFile)

    // Update prompt
    const promptTextarea = screen.getByLabelText(/Prompt/i)
    await user.clear(promptTextarea)
    await user.type(promptTextarea, 'Edit this image with queue')

    // Submit form
    const submitButton = screen.getByText(/Generate \/ Edit/i)
    await user.click(submitButton)

    // Wait for job completion and gallery update
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/images'),
        expect.any(Object)
      )
    })

    // Check that gallery shows the new images
    expect(screen.getByAltText(/test-image/i)).toBeInTheDocument()
  })

  test('uses direct API when queue toggle is off', async () => {
    // Mock direct API call
    mockedAxios.post.mockResolvedValue({ status: 200, data: mockImageItems })

    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Ensure queue toggle is off (default)
    const queueToggle = screen.getByRole('switch', { name: /Use queue/i })
    expect(queueToggle).not.toBeChecked()

    // Upload base image
    const baseFile = new File(['base content'], 'base.png', { type: 'image/png' })
    const baseInput = screen.getByLabelText(/Base Image/i)
    await user.upload(baseInput, baseFile)

    // Update prompt
    const promptTextarea = screen.getByLabelText(/Prompt/i)
    await user.clear(promptTextarea)
    await user.type(promptTextarea, 'Edit this image directly')

    // Submit form
    const submitButton = screen.getByText(/Generate \/ Edit/i)
    await user.click(submitButton)

    // Check that direct edit endpoint was called
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/images/edit'),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      )
    })

    // Check that jobs/submit was NOT called
    expect(mockedAxios.post).not.toHaveBeenCalledWith(
      expect.stringContaining('/jobs/submit'),
      expect.any(Object),
      expect.any(Object)
    )
  })
})