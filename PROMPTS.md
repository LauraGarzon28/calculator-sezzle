# Prompts Used

AI assistance was used as a development aid during the implementation of this project. The final architecture, implementation, integration, testing, and verification were reviewed and completed by me.

The following are representative prompts used during development.

## Testing

### Backend tests

> Review the current Go calculator service and suggest unit test cases that cover the main operation paths, including valid calculations, invalid operands, incorrect arity, division by zero, and invalid numeric results. Do not change the production code; focus on identifying meaningful test cases.

> Review these Go tests and identify missing edge cases or scenarios that could improve coverage and reliability. Keep the existing architecture and interfaces unchanged.

### Frontend tests

> Review the current React calculator state machine and suggest unit tests for the main user interactions. Include entering numbers, decimal values, operators, equals, clear, backspace, repeated equals, errors, and edge cases. Focus on behavior rather than implementation details.

> Analyze the current frontend test suite and suggest additional cases that would increase confidence in the calculator behavior without unnecessarily duplicating existing tests.

### Test quality

> Review the existing test suite as if you were a code reviewer. Identify missing important scenarios, flaky tests, duplicated cases, or tests that are too coupled to implementation details. Suggest improvements without rewriting the application architecture.

## Frontend UI

### Responsive design

> Review the current CSS for the calculator and identify potential responsive design issues. Suggest changes so the calculator remains usable on smaller screens while preserving the existing visual structure.

### Usability

> Review the calculator interface from a user's perspective. Identify any usability issues with the display, buttons, error states, history, and keyboard interactions, and suggest practical improvements.

## Code Review

> Review this implementation as a technical-assessment submission. Look for bugs, unnecessary complexity, unclear naming, error-handling issues, and maintainability concerns. Prioritize practical improvements and explain the reasoning behind each suggestion.

> Review the project structure and separation of responsibilities between the React frontend and Go backend. Identify any architectural concerns while keeping the current approach as simple as possible.

## AI Usage

AI assistance was primarily used for test-case brainstorming, test coverage review, UI/UX feedback, responsive-design suggestions, code review, and documentation review. The AI was not used as a substitute for understanding or verifying the implementation. Generated suggestions were reviewed, adapted, and tested before being incorporated into the project.
