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
    vi.clearAllMocks()

    // Mock the initial images fetch
    mockedAxios.get.mockResolvedValue({ data: mockImageItems })
  })

  test('renders all preset options', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    // Check for preset dropdown
    const presetSelect = screen.getByRole('combobox', { name: /preset/i })
    expect(presetSelect).toBeInTheDocument()

    // Open the dropdown
    await userEvent.click(presetSelect)

    // Check for all preset options
    expect(screen.getByRole('option', { name: /none/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /blur background/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /change clothes/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /remove object/i })).toBeInTheDocument()
  })

  test('selects blur background preset', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Find and open the preset dropdown
    const presetSelect = screen.getByRole('combobox', { name: /preset/i })
    await user.click(presetSelect)

    // Select blur background
    await user.click(screen.getByRole('option', { name: /blur background/i }))

    // Verify the selection
    expect(screen.getByRole('combobox', { name: /preset/i })).toHaveTextContent(/blur background/i)
  })

  test('selects change clothes preset', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Find and open the preset dropdown
    const presetSelect = screen.getByRole('combobox', { name: /preset/i })
    await user.click(presetSelect)

    // Select change clothes
    await user.click(screen.getByRole('option', { name: /change clothes/i }))

    // Verify the selection
    expect(screen.getByRole('combobox', { name: /preset/i })).toHaveTextContent(/change clothes/i)
  })

  test('selects remove object preset', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Find and open the preset dropdown
    const presetSelect = screen.getByRole('combobox', { name: /preset/i })
    await user.click(presetSelect)

    // Select remove object
    await user.click(screen.getByRole('option', { name: /remove object/i }))

    // Verify the selection
    expect(screen.getByRole('combobox', { name: /preset/i })).toHaveTextContent(/remove object/i)
  })

  test('renders all provider options', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    // Check for provider dropdown
    const providerSelect = screen.getByRole('combobox', { name: /provider/i })
    expect(providerSelect).toBeInTheDocument()

    // Open the dropdown
    await userEvent.click(providerSelect)

    // Check for all provider options
    expect(screen.getByRole('option', { name: /auto/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /OpenRouter/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Gemini/i })).toBeInTheDocument()
  })

  test('selects auto provider', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Find and open the provider dropdown
    const providerSelect = screen.getByRole('combobox', { name: /provider/i })
    await user.click(providerSelect)

    // Select auto
    await user.click(screen.getByRole('option', { name: /auto/i }))

    // Verify the selection
    expect(screen.getByRole('combobox', { name: /provider/i })).toHaveTextContent(/auto/i)
  })

  test('selects OpenRouter provider', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Find and open the provider dropdown
    const providerSelect = screen.getByRole('combobox', { name: /provider/i })
    await user.click(providerSelect)

    // Select OpenRouter
    await user.click(screen.getByRole('option', { name: /OpenRouter/i }))

    // Verify the selection
    expect(screen.getByRole('combobox', { name: /provider/i })).toHaveTextContent(/OpenRouter/i)
  })

  test('selects Gemini provider', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Find and open the provider dropdown
    const providerSelect = screen.getByRole('combobox', { name: /provider/i })
    await user.click(providerSelect)

    // Select Gemini
    await user.click(screen.getByRole('option', { name: /Gemini/i }))

    // Verify the selection
    expect(screen.getByRole('combobox', { name: /provider/i })).toHaveTextContent(/Gemini/i)
  })

  test('renders all format options', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    // Check for format dropdown
    const formatSelect = screen.getByRole('combobox', { name: /format/i })
    expect(formatSelect).toBeInTheDocument()

    // Open the dropdown
    await userEvent.click(formatSelect)

    // Check for all format options
    expect(screen.getByRole('option', { name: /png/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /webp/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /jpg/i })).toBeInTheDocument()
  })

  test('selects png format', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Find and open the format dropdown
    const formatSelect = screen.getByRole('combobox', { name: /format/i })
    await user.click(formatSelect)

    // Select png
    await user.click(screen.getByRole('option', { name: /png/i }))

    // Verify the selection
    expect(screen.getByRole('combobox', { name: /format/i })).toHaveTextContent(/png/i)
  })

  test('selects webp format', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Find and open the format dropdown
    const formatSelect = screen.getByRole('combobox', { name: /format/i })
    await user.click(formatSelect)

    // Select webp
    await user.click(screen.getByRole('option', { name: /webp/i }))

    // Verify the selection
    expect(screen.getByRole('combobox', { name: /format/i })).toHaveTextContent(/webp/i)
  })

  test('selects jpg format', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Find and open the format dropdown
    const formatSelect = screen.getByRole('combobox', { name: /format/i })
    await user.click(formatSelect)

    // Select jpg
    await user.click(screen.getByRole('option', { name: /jpg/i }))

    // Verify the selection
    expect(screen.getByRole('combobox', { name: /format/i })).toHaveTextContent(/jpg/i)
  })

  test('adjusts width slider', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Find width slider using role-based query
    const widthSlider = screen.getByRole('slider', { name: /width/i })

    // Check initial value
    expect(widthSlider).toHaveAttribute('aria-valuenow', '1024')

    // Move slider to the right
    await user.click(widthSlider)
    await user.keyboard('{ArrowRight}')

    // Check updated value
    await waitFor(() => {
      expect(widthSlider).toHaveAttribute('aria-valuenow', '1088') // 1024 + 64
    })
  })

  test('adjusts height slider', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Find height slider using role-based query
    const heightSlider = screen.getByRole('slider', { name: /height/i })

    // Check initial value
    expect(heightSlider).toHaveAttribute('aria-valuenow', '1024')

    // Move slider to the right
    await user.click(heightSlider)
    await user.keyboard('{ArrowRight}')

    // Check updated value
    await waitFor(() => {
      expect(heightSlider).toHaveAttribute('aria-valuenow', '1088') // 1024 + 64
    })
  })

  test('adjusts outputs slider', async () => {
    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Find outputs slider using role-based query
    const outputsSlider = screen.getByRole('slider', { name: /outputs/i })

    // Check initial value
    expect(outputsSlider).toHaveAttribute('aria-valuenow', '1')

    // Move slider to the right
    await user.click(outputsSlider)
    await user.keyboard('{ArrowRight}')

    // Check updated value
    await waitFor(() => {
      expect(outputsSlider).toHaveAttribute('aria-valuenow', '2')
    })
  })

  test('toggles queue switch', async () => {
    await act(async () => {
      render(<EditPage />)
    })

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
    mockedAxios.post.mockResolvedValue({ status: 200, data: mockImageItems })

    await act(async () => {
      render(<EditPage />)
    })

    const user = userEvent.setup()

    // Select blur background preset
    const presetSelect = screen.getByRole('combobox', { name: /preset/i })
    await user.click(presetSelect)
    await user.click(screen.getByRole('option', { name: /blur background/i }))

    // Select OpenRouter provider
    const providerSelect = screen.getByRole('combobox', { name: /provider/i })
    await user.click(providerSelect)
    await user.click(screen.getByRole('option', { name: /OpenRouter/i }))

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