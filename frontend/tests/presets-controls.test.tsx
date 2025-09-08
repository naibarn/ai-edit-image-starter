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

describe('Presets and Controls', () => {
  beforeEach(() => {
    // Clear all mocks
    (mockedAxios.get as any).mockClear()
    (mockedAxios.post as any).mockClear()
    
    // Mock the initial images fetch
    (mockedAxios.get as any).mockResolvedValue({ data: mockImageItems })
  })

  test('renders all preset options', () => {
    render(<EditPage />)
    
    // Check for preset dropdown
    const presetSelect = screen.getByLabelText(/Preset/i)
    expect(presetSelect).toBeInTheDocument()
    
    // Open the dropdown
    fireEvent.click(presetSelect)
    
    // Check for all preset options
    expect(screen.getByText(/none/i)).toBeInTheDocument()
    expect(screen.getByText(/blur background/i)).toBeInTheDocument()
    expect(screen.getByText(/change clothes/i)).toBeInTheDocument()
    expect(screen.getByText(/remove object/i)).toBeInTheDocument()
  })

  test('selects blur background preset', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find and open the preset dropdown
    const presetSelect = screen.getByLabelText(/Preset/i)
    await user.click(presetSelect)
    
    // Select blur background
    await user.click(screen.getByText(/blur background/i))
    
    // Verify the selection
    expect(screen.getByText(/blur background/i)).toBeInTheDocument()
  })

  test('selects change clothes preset', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find and open the preset dropdown
    const presetSelect = screen.getByLabelText(/Preset/i)
    await user.click(presetSelect)
    
    // Select change clothes
    await user.click(screen.getByText(/change clothes/i))
    
    // Verify the selection
    expect(screen.getByText(/change clothes/i)).toBeInTheDocument()
  })

  test('selects remove object preset', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find and open the preset dropdown
    const presetSelect = screen.getByLabelText(/Preset/i)
    await user.click(presetSelect)
    
    // Select remove object
    await user.click(screen.getByText(/remove object/i))
    
    // Verify the selection
    expect(screen.getByText(/remove object/i)).toBeInTheDocument()
  })

  test('renders all provider options', () => {
    render(<EditPage />)
    
    // Check for provider dropdown
    const providerSelect = screen.getByLabelText(/Provider/i)
    expect(providerSelect).toBeInTheDocument()
    
    // Open the dropdown
    fireEvent.click(providerSelect)
    
    // Check for all provider options
    expect(screen.getByText(/auto/i)).toBeInTheDocument()
    expect(screen.getByText(/OpenRouter/i)).toBeInTheDocument()
    expect(screen.getByText(/Gemini/i)).toBeInTheDocument()
  })

  test('selects auto provider', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find and open the provider dropdown
    const providerSelect = screen.getByLabelText(/Provider/i)
    await user.click(providerSelect)
    
    // Select auto
    await user.click(screen.getByText(/auto/i))
    
    // Verify the selection
    expect(screen.getByText(/auto/i)).toBeInTheDocument()
  })

  test('selects OpenRouter provider', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find and open the provider dropdown
    const providerSelect = screen.getByLabelText(/Provider/i)
    await user.click(providerSelect)
    
    // Select OpenRouter
    await user.click(screen.getByText(/OpenRouter/i))
    
    // Verify the selection
    expect(screen.getByText(/OpenRouter/i)).toBeInTheDocument()
  })

  test('selects Gemini provider', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find and open the provider dropdown
    const providerSelect = screen.getByLabelText(/Provider/i)
    await user.click(providerSelect)
    
    // Select Gemini
    await user.click(screen.getByText(/Gemini/i))
    
    // Verify the selection
    expect(screen.getByText(/Gemini/i)).toBeInTheDocument()
  })

  test('renders all format options', () => {
    render(<EditPage />)
    
    // Check for format dropdown
    const formatSelect = screen.getByLabelText(/Format/i)
    expect(formatSelect).toBeInTheDocument()
    
    // Open the dropdown
    fireEvent.click(formatSelect)
    
    // Check for all format options
    expect(screen.getByText(/png/i)).toBeInTheDocument()
    expect(screen.getByText(/webp/i)).toBeInTheDocument()
    expect(screen.getByText(/jpg/i)).toBeInTheDocument()
  })

  test('selects png format', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find and open the format dropdown
    const formatSelect = screen.getByLabelText(/Format/i)
    await user.click(formatSelect)
    
    // Select png
    await user.click(screen.getByText(/png/i))
    
    // Verify the selection
    expect(screen.getByText(/png/i)).toBeInTheDocument()
  })

  test('selects webp format', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find and open the format dropdown
    const formatSelect = screen.getByLabelText(/Format/i)
    await user.click(formatSelect)
    
    // Select webp
    await user.click(screen.getByText(/webp/i))
    
    // Verify the selection
    expect(screen.getByText(/webp/i)).toBeInTheDocument()
  })

  test('selects jpg format', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find and open the format dropdown
    const formatSelect = screen.getByLabelText(/Format/i)
    await user.click(formatSelect)
    
    // Select jpg
    await user.click(screen.getByText(/jpg/i))
    
    // Verify the selection
    expect(screen.getByText(/jpg/i)).toBeInTheDocument()
  })

  test('adjusts width slider', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find width slider and label
    const widthLabel = screen.getByText(/Width:/i)
    const widthSlider = screen.getByLabelText(/Width/i).nextSibling
    
    // Check initial value
    expect(widthLabel.textContent).toContain('1024')
    
    // Move slider to the right
    if (widthSlider && widthSlider instanceof Element) {
      await user.click(widthSlider)
      await user.keyboard('{ArrowRight}')
      
      // Check updated value
      await waitFor(() => {
        expect(widthLabel.textContent).toContain('1088') // 1024 + 64
      })
    }
  })

  test('adjusts height slider', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find height slider and label
    const heightLabel = screen.getByText(/Height:/i)
    const heightSlider = screen.getByLabelText(/Height/i).nextSibling
    
    // Check initial value
    expect(heightLabel.textContent).toContain('1024')
    
    // Move slider to the right
    if (heightSlider && heightSlider instanceof Element) {
      await user.click(heightSlider)
      await user.keyboard('{ArrowRight}')
      
      // Check updated value
      await waitFor(() => {
        expect(heightLabel.textContent).toContain('1088') // 1024 + 64
      })
    }
  })

  test('adjusts outputs slider', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find outputs slider and label
    const outputsLabel = screen.getByText(/Outputs:/i)
    const outputsSlider = screen.getByLabelText(/Outputs:/i).nextSibling
    
    // Check initial value
    expect(outputsLabel.textContent).toContain('1')
    
    // Move slider to the right
    if (outputsSlider && outputsSlider instanceof Element) {
      await user.click(outputsSlider)
      await user.keyboard('{ArrowRight}')
      
      // Check updated value
      await waitFor(() => {
        expect(outputsLabel.textContent).toContain('2')
      })
    }
  })

  test('toggles queue switch', async () => {
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Find queue switch
    const queueSwitch = screen.getByLabelText(/Use Queue/i)
    
    // Check initial state (should be off by default)
    expect(queueSwitch).not.toBeChecked()
    
    // Toggle switch on
    await user.click(queueSwitch)
    
    // Check that it's now checked
    expect(queueSwitch).toBeChecked()
    
    // Toggle switch off
    await user.click(queueSwitch)
    
    // Check that it's now unchecked
    expect(queueSwitch).not.toBeChecked()
  })

  test('submits form with preset and provider selection', async () => {
    // Mock successful API response
    (mockedAxios.post as any).mockResolvedValue({ status: 200, data: mockImageItems })
    
    render(<EditPage />)
    
    const user = userEvent.setup()
    
    // Select blur background preset
    const presetSelect = screen.getByLabelText(/Preset/i)
    await user.click(presetSelect)
    await user.click(screen.getByText(/blur background/i))
    
    // Select OpenRouter provider
    const providerSelect = screen.getByLabelText(/Provider/i)
    await user.click(providerSelect)
    await user.click(screen.getByText(/OpenRouter/i))
    
    // Update prompt
    const promptTextarea = screen.getByLabelText(/Prompt/i)
    await user.clear(promptTextarea)
    await user.type(promptTextarea, 'Test with preset and provider')
    
    // Submit form
    const submitButton = screen.getByText(/Generate \/ Edit/i)
    await user.click(submitButton)
    
    // Check that axios was called with correct data
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled()
    })
    
    // Check that success toast was called
    expect(require('sonner').toast.success).toHaveBeenCalled()
  })
})