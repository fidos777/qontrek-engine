# KuasaTurbo Frontend

Next.js 14 frontend for KuasaTurbo AI microservices platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Font**: Inter (Google Fonts)

## Project Structure

```
kuasaturbo-frontend/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with Navbar + Footer
│   ├── page.tsx             # Home page
│   ├── pricing/             # Pricing page
│   ├── credits/             # Credit system info
│   ├── verticals/           # Verticals listing + detail
│   ├── consultant/          # Consultant program
│   ├── reseller/            # Reseller program
│   ├── partners/            # Partnership overview
│   ├── trust/               # Trust & security
│   ├── docs/                # Documentation
│   ├── api-access/          # API access request
│   └── playground/          # Interactive demo
├── components/
│   ├── shared/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   └── Select.tsx
│   ├── layout/              # Layout components
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── playground/          # Playground-specific components
│       ├── TaskSelector.tsx
│       ├── StyleSelector.tsx
│       ├── ImageUploader.tsx
│       ├── GenerateButton.tsx
│       ├── OutputDisplay.tsx
│       └── WorkerAnimation.tsx
├── lib/
│   ├── types.ts             # TypeScript type definitions
│   ├── constants.ts         # App constants (tasks, styles, verticals)
│   └── api.ts               # API client (stub)
└── public/                  # Static assets

```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Features

### Pages

- **Home** (`/`) - Landing page with hero and features
- **Pricing** (`/pricing`) - Credit-based pricing plans
- **Credits** (`/credits`) - Credit system explanation
- **Verticals** (`/verticals`) - Industry vertical listing
- **Vertical Detail** (`/verticals/[slug]`) - Individual vertical info
- **Consultant** (`/consultant`) - Consultant program details
- **Reseller** (`/reseller`) - Reseller program details
- **Partners** (`/partners`) - Partnership overview
- **Trust** (`/trust`) - Security and compliance info
- **Docs** (`/docs`) - Documentation hub
- **API Access** (`/api-access`) - API key request form
- **Playground** (`/playground`) - Interactive creative demo

### Components

**Shared Components:**
- `Button` - Primary/secondary button variants
- `Card` - Content container with shadow
- `Badge` - Status/label pills
- `Input` - Form input with label
- `Select` - Dropdown with label

**Layout Components:**
- `Navbar` - Top navigation with links
- `Footer` - Footer with link groups

**Playground Components:**
- `TaskSelector` - Creative task picker
- `StyleSelector` - Style preset picker
- `ImageUploader` - File upload input
- `GenerateButton` - Generate action button
- `OutputDisplay` - Result display
- `WorkerAnimation` - Loading animation

## Design System

### Colors

- **Primary**: `#FE4800` (Orange)
- **Secondary**: `#262A3B` (Dark blue-gray)
- **Background**: `#F8FAFC` (Slate 50)
- **Text**: `#0F172A` (Slate 900)

### Typography

- **Font**: Inter (Google Fonts)
- **Headings**: Bold, various sizes
- **Body**: Regular, 16px base

### Spacing

- Container: `max-w-7xl mx-auto px-4`
- Sections: `py-16` vertical padding
- Cards: `p-6` internal padding

## API Integration

Currently using mock data. To connect to real backend:

1. Update `lib/api.ts` with actual API endpoints
2. Add environment variables for API URL
3. Implement authentication flow
4. Handle real responses in playground

## Language Mix

Content uses 70% Bahasa Malaysia / 30% English mix to match target audience (Malaysian SMEs).

## Status

**Phase XXIII-A**: Frontend skeleton complete
- ✅ All 12 routes implemented
- ✅ All shared components created
- ✅ All playground components created
- ✅ Responsive design with Tailwind
- ✅ TypeScript types defined
- ⏳ Real API integration (pending)
- ⏳ Authentication (pending)
- ⏳ Advanced animations (pending)

## Next Steps

1. Connect to KuasaTurbo backend API
2. Implement authentication flow
3. Add real creative generation
4. Enhance playground with more features
5. Add user dashboard
6. Implement credit purchase flow
