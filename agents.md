# AGENTS.md - AI Coding Agent Guidelines & Project Context

This file is a dedicated configuration and reference guide for AI Coding Agents (such as Antigravity, Claude Code, Cursor, Copilot, Aider, and others) working on the **DoAn-CSharp** project. 

It contains general behavioral guardrails inspired by **Andrej Karpathy's LLM coding observations** alongside project-specific rules, tech stack details, and command reference to ensure precise, correct, and high-quality changes.

---

## 🚀 Key Shell Commands (Reference)

Agents must use these exact commands to build, run, and test the project:

- **Build Project**: `dotnet build`
- **Run Locally**: `dotnet run`
- **Clean Artifacts**: `dotnet clean`

---

## 🏗️ Project Architecture & Tech Stack

This is a standard **ASP.NET Core MVC (Model-View-Controller)** web application targeting **.NET 9.0**.

- **Target Framework**: `net9.0`
- **Nullable Context**: Enabled (`<Nullable>enable</Nullable>`)
- **Implicit Usings**: Enabled (`<ImplicitUsings>enable</ImplicitUsings>`)
- **Root Namespace**: `DoAn_CSharp`

### Directory Structure:
- [Program.cs](file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/Program.cs): Application entry point, services registration, and middleware configuration.
- [DoAn-CSharp.csproj](file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/DoAn-CSharp.csproj): Project file specifying SDK, target framework, and dependencies.
- [Controllers/](file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/Controllers): Contains ASP.NET MVC Controllers handling user requests and returning Views.
  - [HomeController.cs](file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/Controllers/HomeController.cs): Default controller for home page, privacy page, and error handling.
- [Models/](file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/Models): Data structures and view models.
- [Views/](file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/Views): Razor View (`.cshtml`) pages for UI rendering.
  - `Home/`: Views associated with `HomeController`.
  - `Shared/`: Shared layouts (e.g., `_Layout.cshtml`, `_ValidationScriptsPartial.cshtml`).
- [wwwroot/](file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/wwwroot): Static files (CSS, JS, images, lib).
- [appsettings.json](file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/appsettings.json): Configuration file for database connections, logging, and environment settings.

---

## 🧠 Andrej Karpathy's Core Behavioral Guidelines

All agents must strictly adhere to the following four principles to avoid common AI coding pitfalls:

### 1. Think Before Coding (Suy nghĩ trước khi Code)
**Don't assume. Don't hide confusion. Surface tradeoffs.**
- **State assumptions explicitly**: If you are uncertain about requirements, code behavior, or edge cases, ask the user rather than guessing.
- **Present multiple interpretations**: If ambiguity exists, describe alternative ways to implement and let the user decide.
- **Push back when warranted**: If a simpler, more elegant approach exists, suggest it.
- **Stop when confused**: Name what is unclear and seek immediate clarification.

### 2. Simplicity First (Đơn giản là trên hết)
**Minimum code that solves the problem. Nothing speculative.**
- **No extra features**: Implement exactly what was asked, nothing more.
- **No speculative abstractions**: Avoid introducing complex design patterns, base classes, or configurations that are not strictly necessary.
- **No unused configurability**: Write concrete implementations rather than generalized systems unless explicitly requested.
- **If 200 lines could be 50, rewrite it**: Review and simplify your implementation before finishing.

### 3. Surgical Changes (Can thiệp chuẩn xác)
**Touch only what you must. Clean up only your own mess.**
- **No drive-by improvements**: Do not reformat, refactor, or "improve" adjacent code, comments, or formatting that are unrelated to the task.
- **Match existing style**: Adhere strictly to the project's coding style, conventions, and formatting, even if you would personally write it differently.
- **Do not delete unrelated dead code**: If you notice unused imports or code, mention it to the user instead of deleting it.
- **Clean up your orphans**: Only remove imports/variables/functions that *your* changes made unused.

### 4. Goal-Driven Execution (Làm việc hướng mục tiêu)
**Define success criteria. Loop until verified.**
- **Transform tasks into verifiable goals**:
  - Instead of "Add validation" ➡️ "Write validation logic, verify invalid cases fail, and valid cases succeed."
  - Instead of "Fix the bug" ➡️ "Identify exact root cause, write a reproduction step or test, apply fix, and verify it passes."
- **State a brief step-by-step verification plan** before making changes:
  ```
  1. [Step to execute] ➡️ verify: [Check behavior/output]
  2. [Step to execute] ➡️ verify: [Check behavior/output]
  ```
- **Self-correct**: If a build fails or tests fail, diagnose the compiler/test error carefully and fix it incrementally.
---

## 🔄 Spec-Driven & TDD Evaluation Loop

All AI agents working on this project MUST strictly follow the Spec-First and TDD workflow defined in [.agent/rules/spec-and-eval-loop.md](file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/.agent/rules/spec-and-eval-loop.md):
1. **Spec-First**: Write technical specifications in `.agent/specs/` before writing any codebase implementation.
2. **Test-First**: Write xUnit tests in `DoAn-CSharp.Tests` first.
3. **Loop & Self-Correct**: Run `dotnet test` continuously to evaluate changes and self-correct until 100% of tests pass.

---

## 🛠️ C# / ASP.NET Core Coding Rules

- **Naming Conventions**:
  - Classes, Interfaces, Methods, Properties: `PascalCase`
  - Local variables, Parameters: `camelCase`
  - Private readonly fields: `_camelCase` with a leading underscore (e.g., `_logger`)
- **Nullable Context**: Nullability is enabled by default. Use nullable annotations (`string?`, `object?`) appropriately. Do not ignore null warnings or use `!` unconditionally without checking.
- **Asynchronous Code**: Prefer `async`/`await` for I/O operations (database, network, file read/write).
- **Dependency Injection**: Always inject dependencies (such as loggers, services, database contexts) via constructor injection. Do not instantiate them manually.
