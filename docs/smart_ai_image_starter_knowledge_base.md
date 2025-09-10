# Smart AI Image Starter Knowledge Base

## Project Overview
A modern web application for AI-powered image editing and generation, built with Next.js, FastAPI, and shadcn/ui.

## Architecture

### Frontend (Next.js + TypeScript)
- **Framework**: Next.js 15 with App Router
- **UI Library**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Testing**: Vitest + Testing Library

### Backend (FastAPI + Python)
- **Framework**: FastAPI with async support
- **Database**: SQLite with SQLAlchemy
- **Queue**: Built-in queue system for job management
- **Providers**: OpenRouter, Gemini Direct API
- **Storage**: Local file system with static serving

## Key Features

### 1. Image Processing Modes
- **Composite**: Combine multiple images
- **Garment Transfer**: Apply clothing from reference images
- **Inpaint**: Fill masked areas with AI generation

### 2. Advanced Controls
- **Presets**: Blur background, change clothes, remove objects
- **Provider Selection**: Auto, OpenRouter, Gemini Direct
- **Queue System**: Background processing for large jobs
- **Progress Tracking**: Real-time progress updates

### 3. Modern UI Components
- **Grid-based Layout**: Responsive design with sidebar and main panel
- **Dark/Light Mode**: System preference detection with manual toggle
- **Animated Gallery**: Hover effects and smooth transitions
- **Accessible Design**: ARIA labels, keyboard navigation, screen reader support

## Development Guidelines

### Frontend Development
- Use TypeScript for type safety
- Follow shadcn/ui component patterns
- Implement proper error boundaries
- Add comprehensive unit tests
- Ensure accessibility compliance

### Backend Development
- Use async/await for all I/O operations
- Implement proper error handling and logging
- Add input validation with Pydantic
- Write unit tests for all endpoints
- Follow REST API conventions

## File Structure

```
├── frontend/
│   ├── app/                 # Next.js app router
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Header.tsx      # App header with dark mode toggle
│   │   ├── Sidebar.tsx     # Settings and controls sidebar
│   │   ├── MainPanel.tsx   # Main upload and control panel
│   │   └── Gallery.tsx     # Results gallery with animations
│   ├── tests/              # Unit and integration tests
│   └── public/             # Static assets
├── backend/
│   ├── main.py             # FastAPI application
│   ├── provider/           # AI provider adapters
│   ├── storage/            # File storage management
│   ├── tests/              # Backend unit tests
│   └── utils/              # Utility functions
└── docs/                   # Documentation
```

## Component Architecture

### Header Component
- Displays app title and description
- Contains dark/light mode toggle switch
- Responsive design for mobile and desktop

### Sidebar Component
- Tabbed interface for different control groups
- Mode selection with radio buttons
- Preset and provider dropdowns
- Collapsible on mobile devices

### MainPanel Component
- File upload areas for base, mask, and reference images
- Form controls for prompt, dimensions, format
- Progress bar and status indicators
- Generate button with loading states

### Gallery Component
- Grid layout for generated images
- Hover animations with Framer Motion
- Download buttons for each image
- Empty state handling
- Responsive card design

## Testing Strategy

### Frontend Tests
- Unit tests for individual components
- Integration tests for component interactions
- Accessibility testing with axe-core
- Visual regression tests (future)

### Backend Tests
- API endpoint testing with pytest
- Database operation testing
- Provider adapter mocking
- Error handling verification

## Deployment

### Frontend Deployment
- Build with `npm run build`
- Static export for CDN deployment
- Environment variable configuration
- CI/CD pipeline integration

### Backend Deployment
- Docker containerization
- Environment-based configuration
- Database migration handling
- Health check endpoints

## Performance Considerations

### Frontend
- Image lazy loading
- Component code splitting
- Bundle size optimization
- Caching strategies

### Backend
- Async processing for long-running tasks
- Connection pooling
- Rate limiting
- Memory management

## Security

### Frontend
- Input sanitization
- XSS prevention
- Secure API communication
- Environment variable protection

### Backend
- Request validation
- Authentication (future)
- File upload restrictions
- Rate limiting

## Known Issues & Fixes

### Backend CI Fixes (2025-09-10)
- **Issue**: Job processing logging test failing due to worker not running
- **Fix**: Use `client_with_worker` fixture instead of `client` for job-related tests
- **Issue**: Logger not capturing exception messages in job failure logs
- **Fix**: Updated `logger.error` to include exception message: `logger.error("job %s failed: %s", job_id, str(e))`
- **Result**: All 66 backend tests now passing

### Frontend Hydration & Styling Fixes (2025-09-10)
- **Issue**: Hydration mismatch due to nested html/body tags in segment layouts
- **Fix**: Convert app/edit/layout.tsx to segment layout with only `<div className="min-h-dvh">{children}</div>`
- **Issue**: Tailwind CSS not properly configured for shadcn/ui components
- **Fix**: Updated tailwind.config.js with proper color definitions and darkMode: "class"
- **Issue**: Missing root CSS variables for color scheme
- **Fix**: Added `:root { color-scheme: light dark; }` and `body { @apply antialiased; }` to globals.css
- **Result**: Hydration warnings eliminated, Tailwind styles working correctly

## Future Enhancements

### Short Term
- User authentication
- Image history and favorites
- Batch processing
- Advanced filter options

### Long Term
- Real-time collaboration
- Plugin system for custom models
- Mobile app development
- Cloud storage integration