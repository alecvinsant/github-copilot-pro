# DPC Practice Directory

A modern, responsive web application for browsing Direct Primary Care (DPC) practices across the United States.

## Features

### Practice Listings
- Browse DPC practices organized by state
- View detailed practice information including:
  - Practice name and provider
  - Location and contact details
  - Membership fees
  - Services offered
  - Patient capacity status
  - Insurance acceptance

### Advanced Filtering
- **Search**: Search by practice name or city
- **State & City**: Filter by specific locations
- **Insurance**: Filter by insurance acceptance
- **Practice Type**: DPC Only or Hybrid DPC
- **Patient Capacity**: Accepting new patients, limited capacity, or full
- **Membership Fee Range**: Adjustable slider to filter by monthly fees
- **Services Offered**: Multi-select checkboxes for specific services

### Practice Comparison
- Select up to 5 practices for side-by-side comparison
- Compare key features including:
  - Location and provider information
  - Contact details
  - Membership fees
  - Insurance acceptance
  - Services offered
  - Verification status

### Modern UI/UX
- Responsive design that works on mobile, tablet, and desktop
- Smooth animations with Framer Motion
- Clean, modern interface with Tailwind CSS
- Accessible components built with Radix UI

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (shadcn/ui)
- **Animations**: Framer Motion
- **State Management**: TanStack Query (React Query)
- **Icons**: Lucide React

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── api/              # API client and data models
├── components/
│   ├── ui/          # Reusable UI components (shadcn/ui)
│   ├── directory/   # Directory-specific components
│   └── SEO.tsx      # SEO component
├── pages/           # Page components
├── lib/             # Utility functions
└── main.tsx         # Application entry point
```

## Features in Detail

### Practice Cards
Each practice is displayed in a card with:
- Verification badge for verified practices
- Provider information
- Complete address and contact details
- Membership fee range
- Status badges (Insurance, Practice Type, Patient Capacity)
- List of services offered
- Comparison selection button

### Filtering System
- Multiple filter criteria can be applied simultaneously
- Active filter count indicator
- Easy filter reset functionality
- Real-time results update

### Comparison Feature
- Floating comparison bar at bottom of screen
- Add/remove practices from comparison
- Side-by-side comparison table
- Easy navigation between comparison and browsing

## License

MIT