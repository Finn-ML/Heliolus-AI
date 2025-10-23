# Heliolus Platform

A full-stack application with React TypeScript frontend and Fastify TypeScript backend.

## Project Structure

```
heliolus-platform/
├── frontend/          # React + TypeScript + Vite + ShadCN UI
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Fastify + TypeScript API
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
└── package.json       # Root workspace configuration
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

Install all dependencies for both frontend and backend:

```bash
npm run setup
```

Or install manually:

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

## Development

### Run Both Frontend and Backend

```bash
npm run dev
```

This will start:

- Frontend on http://localhost:5000
- Backend on http://localhost:3001

### Run Individual Services

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

## Building

### Build Both

```bash
npm run build
```

### Build Individual Services

```bash
# Frontend only
npm run build:frontend

# Backend only
npm run build:backend
```

## Production

### Start Both Services

```bash
npm run start
```

### Start Individual Services

```bash
# Frontend only (preview mode)
npm run start:frontend

# Backend only
npm run start:backend
```

## API Endpoints

- Health Check: `GET /health`
- Test Endpoint: `GET /api/v1/test`

## Frontend Features

- React 18 with TypeScript
- Vite for fast development and building
- ShadCN UI component library
- Tailwind CSS for styling
- React Router for navigation
- React Query for data fetching
- Form validation with React Hook Form + Zod

## Backend Features

- Fastify with TypeScript
- CORS support
- Security headers (Helmet)
- Rate limiting
- Swagger documentation (planned)
- ESM modules

## Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both services for production
- `npm run start` - Start both services in production mode
- `npm run lint` - Lint both frontend and backend
- `npm run clean` - Remove all node_modules and dist folders
- `npm run setup` - Install dependencies for all services

## Environment Variables

### Backend

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

### Frontend

Environment variables should be prefixed with `VITE_` to be accessible in the frontend.
