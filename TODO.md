# Trello MCP Server - TODO List

This document outlines the tasks that need to be completed to improve the Trello MCP server.

## High-Priority Tasks

### 1. Implement Unit Tests (Completed)

- **Description:** The project currently lacks unit tests, which is a critical issue. We need to add a testing framework (Jest is already in `package.json`) and write tests for all the tools and the Trello API client.
- **Acceptance Criteria:**
  - A `tests` directory is created. (Done)
  - Unit tests are written for all tools in the `src/tools` directory. (Done)
  - The Trello API client (`src/trello-client.ts`) is tested.
  - Test coverage is at least 80%.

### 2. Add Rate Limiting and Caching (Done)

- **Description:** The Trello API has rate limits, and the server currently has no mechanism to handle them. We need to add a rate-limiting mechanism with a retry strategy and a caching layer to reduce the number of API calls.
- **Acceptance Criteria:**
  - The `trello-client.ts` file is updated to include a rate-limiting mechanism (e.g., using an exponential backoff strategy). (Done)
  - A caching layer is added to the `trello-client.ts` file to cache responses from the Trello API. (Done)

## Medium-Priority Tasks

### 3. Refactor Error Handling and Validation (Done)

- **Description:** The project plan called for separate files for error handling and validation schemas, but the current implementation has this logic scattered throughout the codebase. We should refactor this to improve modularity and maintainability.
- **Acceptance Criteria:**
  - An `src/error-handler.ts` file is created to handle all error-related logic. (Done)
  - An `src/validation` directory is created to store all Zod validation schemas. (Done)

### 4. Add `delete_checklist` Tool (Done)

- **Description:** The `checklists.ts` tool is missing a `delete_checklist` tool. This needs to be added to complete the CRUD functionality for checklists.
- **Acceptance Criteria:**
  - A `deleteChecklist` method is added to the `TrelloClient` class in `src/trello-client.ts`. (Done)
  - A `delete_checklist` tool is added to the `src/tools/checklists.ts` file. (Done)
  - Unit tests are written for the new `delete_checklist` tool. (Done)

## Low-Priority Tasks

### 5. Standardize Response Formatting (Completed)

- **Description:** The success messages in the tool responses are not consistently formatted. We should standardize the response format to make the tool's output easier to parse.
- **Acceptance Criteria:**
  - All tool responses follow a consistent format. (Done)

### 6. Review and Address Potential Unhandled Promise Rejections (Completed)

- **Description:** There might be unhandled promise rejections within the tool handlers that could crash the server. We need to review the code and ensure that all promises are properly handled.
- **Acceptance Criteria:**
  - All promises in the tool handlers are properly handled with `.catch()` blocks. (Done)
