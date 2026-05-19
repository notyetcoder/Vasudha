# Contributing to Relationship Finder

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help each other grow
- Focus on the problem, not the person

## How to Contribute

### Reporting Bugs

1. Check if the bug is already reported in Issues
2. Include:
   - Description of the bug
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment (OS, browser, Node version)

### Suggesting Enhancements

1. Describe the enhancement
2. Explain why it would be useful
3. Provide examples or mockups if possible

### Pull Requests

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m "Add feature: description"`
6. Push: `git push origin feature/your-feature`
7. Create Pull Request with description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/kutumb-relationship-finder.git
cd kutumb-relationship-finder

# Install dependencies (if standalone)
npm install

# Or copy to your Kutumb project and develop there
```

## Coding Standards

### TypeScript
- Use strict mode
- Type all parameters and returns
- Avoid `any` type
- Export interfaces for public APIs

### React Components
- Use functional components
- Use hooks (useState, useEffect, useMemo)
- Prop destructuring
- JSDoc comments for complex logic

### Naming Conventions
- Components: PascalCase (e.g., `UserSelector.tsx`)
- Functions/variables: camelCase (e.g., `findRelationship`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_DEPTH`)

### Documentation
- Add JSDoc comments to functions
- Explain complex algorithms
- Update README if adding features

## Testing

Before submitting PR:
- [ ] Test locally with `npm run dev`
- [ ] Test on mobile view
- [ ] No console errors
- [ ] Test with edge cases
- [ ] Check performance impact

## Commit Messages

Format: `type: description`

Examples:
- `feat: add relationship export feature`
- `fix: correct cousin relationship detection`
- `docs: update installation instructions`
- `perf: optimize search algorithm`
- `refactor: simplify path finding logic`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `perf`: Performance improvement
- `refactor`: Code restructuring
- `test`: Test additions
- `chore`: Maintenance

## Areas for Contribution

### High Priority
- [ ] Additional relationship types (great-uncle, etc.)
- [ ] Performance optimizations
- [ ] Accessibility improvements
- [ ] Error handling enhancements

### Medium Priority
- [ ] UI/UX improvements
- [ ] Documentation expansion
- [ ] Code examples
- [ ] Test coverage

### Low Priority
- [ ] Code style improvements
- [ ] Comment enhancements
- [ ] Minor refactoring

## Questions?

- Check documentation in `/docs/`
- Review existing issues
- Start a discussion

## License

By contributing, you agree your work is licensed under MIT License.

Thank you for contributing! 🙏
