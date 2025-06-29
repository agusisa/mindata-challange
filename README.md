# Mindata Challenge - Angular 17 Modern Architecture

This project showcases a modern Angular 17 application with current best practices, including standalone components, signals, and modern development patterns.

## Project Structure

```
mindata-challenge/
├── .devcontainer/          # Development container configuration
├── app/                    # Angular application
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── ...
├── .vscode/               # VS Code settings
└── README.md
```

## Development Setup

### Using Dev Container (Recommended)

1. **Prerequisites**: Docker and VS Code with Dev Containers extension
2. **Setup**: Open in VS Code and select "Reopen in Container"
3. **Start**: The container will automatically install dependencies
4. **Serve**: Run `ng serve` in the `/workspace/app` directory

### Local Development

```bash
cd app
npm install
ng serve
```

Navigate to `http://localhost:4200/`

## Angular 17 Features Implemented

- ✅ **Standalone Components**: No NgModules, modern architecture
- ✅ **Signals**: Reactive state management with native signals
- ✅ **Modern DI**: Using `inject()` function instead of constructor injection
- ✅ **Control Flow**: Native `@if`, `@for`, `@switch` syntax
- ✅ **OnPush Strategy**: Optimized change detection
- ✅ **Reactive Forms**: Type-safe form handling
- ✅ **Accessibility**: ARIA labels and semantic HTML
- ✅ **Performance**: TrackBy functions and optimizations

## Application Features

- **Hero Management**: CRUD operations for superhero data
- **Search & Filter**: Real-time search functionality
- **Pagination**: Efficient data pagination
- **Form Validation**: Reactive forms with validation
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliant interface

## Commands

```bash
# Development server
ng serve

# Build for production
ng build

# Run unit tests
ng test

# Generate component
ng generate component component-name
```

## Architecture Highlights

- **Signals**: Native Angular 17 signals for state management
- **Standalone**: No NgModules, modern component architecture
- **Type Safety**: Strict TypeScript configuration
- **Modern Patterns**: Latest Angular best practices
- **Container Ready**: Optimized for containerized development
