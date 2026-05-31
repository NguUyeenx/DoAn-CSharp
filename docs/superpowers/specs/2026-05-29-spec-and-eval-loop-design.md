# Design Spec: Spec-Driven Development & Automated Evaluation Loop

## Goal
Establish a clear, rigid specification-driven development workflow and automated xUnit test evaluation loop for Antigravity on the DoAn-CSharp project, ensuring all code changes are fully validated, robust, and safe.

## Solution Architecture
1. **Solution File (`DoAn-CSharp.sln`)**: Created at root to manage both the MVC project and the Test project.
2. **xUnit Test Project (`DoAn-CSharp.Tests`)**: Created under `DoAn-CSharp.Tests/` targeting `.NET 9.0`, referencing the main project.
3. **Agent Rules (`.agent/rules/spec-and-eval-loop.md`)**: Configured to mandate Spec-driven & TDD development.

## Proposed Components & Files

### [NEW] Solution File
- File: `DoAn-CSharp.sln`
- Coordinates all projects within the solution.

### [NEW] xUnit Test Project
- Path: `DoAn-CSharp.Tests/`
- Contains:
  - `DoAn-CSharp.Tests.csproj` (Target: `net9.0`, references `DoAn-CSharp.csproj`, xUnit SDK).
  - `Usings.cs` (Global using statements for standard xUnit testing).
  - `HomeControllerTests.cs` (First test class verifying standard MVC controllers).

### [NEW] Agent Rule File
- Path: `file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/.agent/rules/spec-and-eval-loop.md`
- Guides Antigravity on creating specs and running the evaluation loop before modifying codebase files.

## Verification Plan
1. **Build Verification**: Run `dotnet build` on the solution to verify seamless compilation.
2. **Test Execution**: Run `dotnet test` to execute xUnit tests and ensure they pass successfully.
