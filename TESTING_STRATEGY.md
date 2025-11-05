# Testing Strategy

This project uses a **hybrid testing approach** with both unit tests and integration tests.

## Test Types

### 1. **Unit Tests** (Vitest) - Fast, Isolated
- **Location**: `src/**/*.test.ts` or `src/**/*.spec.ts`
- **Purpose**: Test individual functions/components in isolation
- **Speed**: Fast (milliseconds)
- **Dependencies**: Mocked (no network calls)
- **When to use**: 
  - Testing business logic
  - Testing API service functions with mocked responses
  - Testing React components/hooks
  - Fast feedback during development

**Run unit tests:**
```bash
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:ui       # UI mode
npm run test:coverage # With coverage
```

### 2. **Integration/E2E Tests** (Playwright) - Real Backend
- **Location**: `tests/**/*.spec.ts`
- **Purpose**: Test actual API endpoints and full user flows
- **Speed**: Slower (seconds)
- **Dependencies**: Real backend API
- **When to use**:
  - Verify actual deployed endpoints work
  - Test full user journeys
  - Catch deployment/environment issues
  - CI/CD pipeline validation

**Run integration tests:**
```bash
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui           # UI mode
npm run test:e2e:headed       # Headed browser
npm run test:all              # Run both unit + E2E
```

## Current Test Coverage

### Unit Tests (`src/services/__tests__/api.test.ts`)
✅ Tests API service functions with mocked responses:
- Health endpoint
- Welcome endpoint  
- Add numbers endpoint
- Error handling
- Custom base URL support

### Integration Tests (`tests/api-endpoints.spec.ts`)
✅ Tests real backend API at `https://d1tdizimiz2qsf.cloudfront.net/api`:
- GET /api/health
- GET /api/
- GET /api/add (success and error cases)

## Best Practices

1. **Write unit tests first** - Fast feedback during development
2. **Use integration tests** - Verify the real API works in CI/CD
3. **Keep tests separate** - Unit tests in `src/`, E2E in `tests/`
4. **Mock in unit tests** - Don't make real network calls
5. **Test real endpoints** - Integration tests hit the actual backend

## Project Structure

```
src/
  services/
    api.ts                    # API service functions
    __tests__/
      api.test.ts            # Unit tests (mocked)
tests/
  api-endpoints.spec.ts      # Integration tests (real API)
  counter.spec.ts            # E2E UI tests
```

