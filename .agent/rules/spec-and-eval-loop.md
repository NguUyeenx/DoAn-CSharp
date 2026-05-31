# Spec-Driven & Automated xUnit Test Evaluation Loop Rules

You MUST strictly follow these rules before making any modifications to codebase files:

1. **Phase 1: Specification (Spec-First)**
   - Before writing any code, create a spec file under `.agent/specs/YYYY-MM-DD-feature-name.md`.
   - The spec MUST detail:
     - Clear goals and requirements.
     - Input and output data structures.
     - Specific test cases (Success Paths and Edge Cases/Error conditions).
   - Seek explicit User approval on the spec before writing code.

2. **Phase 2: Test-First (TDD)**
   - Write the failing unit or integration tests inside the `DoAn-CSharp.Tests` project.
   - Run `dotnet test` and verify that the newly added tests fail as expected (red status).

3. **Phase 3: Implementation**
   - Write the minimal logic code in the main project (`DoAn-CSharp`) to satisfy the tests.

4. **Phase 4: Evaluation Loop**
   - Run `dotnet test` to verify the tests.
   - If any test fails, analyze the test run logs, fix the codebase logic, and run `dotnet test` again.
   - Loop and self-correct until all tests pass 100% (green status).
