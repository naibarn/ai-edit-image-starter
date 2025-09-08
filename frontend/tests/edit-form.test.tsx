/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditPage from '../app/edit/page'
import axios from 'axios'

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);
mockedAxios.get = vi.fn();
mockedAxios.post = vi.fn();

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock the API response
const mockImageItems = [
  {
    filename: 'test-image.png',
    url: '/static/images/test-image.png',
    size_bytes: 1024,
    created_at: Date.now() / 1000,
  },
]

describe('Edit Form', () => {
  beforeEach(() => {
    // Clear all mocks
    (mockedAxios.get as any).mockClear()
    (mockedAxios.post as any).mockClear()
    
    // Mock the initial images fetch
    (mockedAxios.get as any).mockResolvedValue({ data: mockImageItems })
  })

  test('renders form with all required fields', () => {
    render(<EditPage />)
    
    // Check for main form elements
    expect(screen.getByLabelText(/Base Image/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mask/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Reference Images/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Prompt/i)).toBeInTheDocument()
    expect(screen.getByText(/Generate \/ Edit/i)).toBeInTheDocument()
    
    // Check for mode radio buttons
    expect(screen.getByLabelText(/Composite/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Garment Transfer/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Inpaint/i)).toBeInTheDocument()
  })

  test('validates prompt length', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    const submitButton = screen.getByText(/Generate \/ Edit/i)
    const promptTextarea = screen.getByLabelText(/Prompt/i)
    
    // Clear the default prompt
    await user.clear(promptTextarea)
    
    // Try to submit with empty prompt
    await user.click(submitButton)
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/must be at least 3 characters/i)).toBeInTheDocument()
    })
  })

  test('handles file uploads correctly', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Create mock files
    const baseFile = new File(['base content'], 'base.png', { type: 'image/png' })
    const refFile1 = new File(['ref1 content'], 'ref1.png', { type: 'image/png' })
    const refFile2 = new File(['ref2 content'], 'ref2.png', { type: 'image/png' })
    const maskFile = new File(['mask content'], 'mask.png', { type: 'image/png' })
    
    // Upload base image
    const baseInput = screen.getByLabelText(/Base Image/i)
    await user.upload(baseInput, baseFile)
    
    // Upload reference images
    const refsInput = screen.getByLabelText(/Reference Images/i)
    await user.upload(refsInput, [refFile1, refFile2])
    
    // Upload mask
    const maskInput = screen.getByLabelText(/Mask/i)
    await user.upload(maskInput, maskFile)
    
    // Check that previews are shown
    await waitFor(() => {
      expect(screen.getAllByAltText(/base/i)).toHaveLength(1)
      expect(screen.getAllByAltText(/ref-/i)).toHaveLength(2)
      expect(screen.getAllByAltText(/mask/i)).toHaveLength(1)
    })
  })

  test('limits reference images to 7', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Create 8 mock files (more than the limit)
    const refFiles = Array.from({ length: 8 }, (_, i) => 
      new File([`ref${i} content`], `ref${i}.png`, { type: 'image/png' })
    )
    
    // Upload reference images
    const refsInput = screen.getByLabelText(/Reference Images/i)
    await user.upload(refsInput, refFiles)
    
    // Should only show 7 previews
    await waitFor(() => {
      expect(screen.getAllByAltText(/ref-/i)).toHaveLength(7)
    })
  })

  test('submits form with correct data for generate', async () => {
    // Mock successful API response
    (mockedAxios.post as any).mockResolvedValue({ status: 200, data: mockImageItems })
    
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Update prompt
    const promptTextarea = screen.getByLabelText(/Prompt/i)
    await user.clear(promptTextarea)
    await user.type(promptTextarea, 'A beautiful landscape')
    
    // Submit form
    const submitButton = screen.getByText(/Generate \/ Edit/i)
    await user.click(submitButton)
    
    // Check that axios was called with correct data
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/images/generate'),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      )
    })
    
    // Check that success toast was called
    expect(require('sonner').toast.success).toHaveBeenCalled()
  })

  test('submits form with correct data for edit', async () => {
    // Mock successful API response
    (mockedAxios.post as any).mockResolvedValue({ status: 200, data: mockImageItems })
    
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Create and upload base image
    const baseFile = new File(['base content'], 'base.png', { type: 'image/png' })
    const baseInput = screen.getByLabelText(/Base Image/i)
    await user.upload(baseInput, baseFile)
    
    // Update prompt
    const promptTextarea = screen.getByLabelText(/Prompt/i)
    await user.clear(promptTextarea)
    await user.type(promptTextarea, 'Edit this image')
    
    // Submit form
    const submitButton = screen.getByText(/Generate \/ Edit/i)
    await user.click(submitButton)
    
    // Check that axios was called with edit endpoint
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
    
    // Check that success toast was called
    expect(require('sonner').toast.success).toHaveBeenCalled()
  })

  test('handles API errors gracefully', async () => {
    // Mock API error
    (mockedAxios.post as any).mockRejectedValue(new Error('API Error'))
    
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Update prompt
    const promptTextarea = screen.getByLabelText(/Prompt/i)
    await user.clear(promptTextarea)
    await user.type(promptTextarea, 'Test prompt')
    
    // Submit form
    const submitButton = screen.getByText(/Generate \/ Edit/i)
    await user.click(submitButton)
    
    // Check that error toast was called
    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalled()
    })
    
    // Check that client error was logged
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/logs/client'),
      expect.objectContaining({
        message: expect.stringContaining('API Error'),
        path: '/edit',
      }),
      expect.any(Object)
    )
  })

  test('displays image gallery with download links', async () => {
    render(<EditPage />)
    
    // Wait for images to load
    await waitFor(() => {
      expect(screen.getByAltText(/test-image/i)).toBeInTheDocument()
    })
    
    // Check for download link
    const downloadLink = screen.getByText(/Download/i)
    expect(downloadLink).toBeInTheDocument()
    expect(downloadLink).toHaveAttribute('href', expect.stringContaining('/static/images/test-image.png'))
    expect(downloadLink).toHaveAttribute('download')
  })

  test('updates width and height sliders', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find width slider
    const widthSlider = screen.getByLabelText(/Width/i).nextSibling
    const widthLabel = screen.getByText(/Width:/i)
    
    // Move slider
    if (widthSlider && widthSlider instanceof Element) {
      await user.click(widthSlider)
      await user.keyboard('{ArrowRight}')
      
      // Check that label updates
      await waitFor(() => {
        expect(widthLabel.textContent).toContain('1088') // 1024 + 64
      })
    }
  })
})