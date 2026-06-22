# Contributing to ClubSpace

Thank you for considering contributing to ClubSpace! We welcome contributions from the community.

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

## How to Contribute

### Reporting Bugs

Before submitting a bug report, please check if it has already been reported by searching existing issues. When you are creating a bug report, please include as much detail as possible:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots or screen recordings if applicable
- Your environment (browser, OS, etc.)

### Suggesting Features

Feature requests are welcome! Please open an issue describing:
- The problem your feature would solve
- How the feature would work
- Any potential drawbacks or considerations

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bug fix (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure your code follows the project's coding standards
5. Add or update tests as needed
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Setup

Please refer to the [README.md](README.md) for local setup instructions.

## Coding Standards

### TypeScript
- Use TypeScript strict mode
- Avoid `any` type when possible
- Use interfaces for object shapes
- Prefer type inference when types are obvious

### React Components
- Use functional components with hooks
- Add "use client" directive to components that use React hooks
- Use Tailwind CSS for styling
- Follow accessibility best practices (ARIA labels, keyboard navigation)
- Components should be reusable and configurable

### API Routes
- All API routes must use authentication middleware (`requireAuth` or `requireRole`)
- Validate all input data with Zod schemas
- Handle errors gracefully without leaking internal information
- Use proper HTTP status codes

### Database
- All tables use UUID primary keys
- Follow the existing naming conventions
- Consider performance when adding indexes
- Respect Row Level Security policies

## Pull Request Process

1. Update the README.md if needed with details of changes
2. The PR will be reviewed by maintainers
3. You may be asked to make changes to your PR
4. Once approved, your PR will be merged
5. Please delete your branch after merging

## Reporting Security Vulnerabilities

Please do not report security vulnerabilities through public GitHub issues. Instead, send an email to security@clubspace.example. We will respond within 48 hours.

## License

By contributing to ClubSpace, you agree that your contributions will be licensed under the MIT License.