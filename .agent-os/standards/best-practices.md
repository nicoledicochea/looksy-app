# Development Best Practices

## Context

Global development guidelines for Agent OS projects.

<conditional-block context-check="core-principles">
IF this Core Principles section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Core Principles already in context"
ELSE:
  READ: The following principles

## Core Principles

### Keep It Simple
- Implement code in the fewest lines possible
- Avoid over-engineering solutions
- Choose straightforward approaches over clever ones

### Optimize for Readability
- Prioritize code clarity over micro-optimizations
- Write self-documenting code with clear variable names
- Add comments for "why" not "what"

### DRY (Don't Repeat Yourself)
- Extract repeated business logic to private methods
- Extract repeated UI markup to reusable components
- Create utility functions for common operations

### File Structure
- Keep files focused on a single responsibility
- Group related functionality together
- Use consistent naming conventions

### TypeScript Best Practices
- Always use explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Use strict TypeScript configuration
- Avoid `any` type - use `unknown` or proper typing instead

### React Best Practices
- Use functional components with hooks
- Extract custom hooks for reusable logic
- Keep components small and focused
- Use proper dependency arrays in useEffect
- Prefer composition over inheritance

### API Design
- Use RESTful conventions for endpoints
- Always validate input data
- Return consistent response formats
- Use proper HTTP status codes
- Handle errors gracefully with try/catch
</conditional-block>

<conditional-block context-check="dependencies" task-condition="choosing-external-library">
IF current task involves choosing an external library:
  IF Dependencies section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Dependencies guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Dependencies section not relevant to current task

## Dependencies

### Choose Libraries Wisely
When adding third-party dependencies:
- Select the most popular and actively maintained option
- Check the library's GitHub repository for:
  - Recent commits (within last 6 months)
  - Active issue resolution
  - Number of stars/downloads
  - Clear documentation

### Testing
- Write tests for business logic and utility functions
- Test user interactions and component behavior
- Use descriptive test names that explain the scenario
- Keep tests simple and focused on one behavior
- Mock external dependencies and API calls

### Security
- Never commit API keys or secrets to version control
- Use environment variables for configuration
- Validate and sanitize all user input
- Use HTTPS in production
- Implement proper authentication and authorization
- Keep dependencies updated for security patches
</conditional-block>
