# Spec-Driven Development & Automated Evaluation Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a robust xUnit testing project and solutions structure, with mandatory Spec & TDD guidelines inside `.agent/rules/` to ensure all subsequent agent work is rigorously verified.

**Architecture:** Create a C# xUnit test project side-by-side with the main project, bind them together via a newly created Solution (`.sln`) file, and configure the `.agent/rules/spec-and-eval-loop.md` and `agents.md` files to enforce Spec & TDD development.

**Tech Stack:** .NET 9.0, xUnit, Microsoft.NET.Test.Sdk, C#

---

### Task 1: Initialize Solution and Test Project

**Files:**
- Create: `DoAn-CSharp.sln`
- Create: `DoAn-CSharp.Tests/DoAn-CSharp.Tests.csproj`
- Create: `DoAn-CSharp.Tests/Usings.cs`

- [ ] **Step 1: Create Solution file at the root**
  Run: `dotnet new sln -n DoAn-CSharp`
  Expected: Success output creating `DoAn-CSharp.sln`

- [ ] **Step 2: Add the main project to the Solution**
  Run: `dotnet sln DoAn-CSharp.sln add DoAn-CSharp.csproj`
  Expected: Success output adding project to solution

- [ ] **Step 3: Create the xUnit Test Project**
  Run: `dotnet new xunit -o DoAn-CSharp.Tests --framework net9.0`
  Expected: Success output creating xUnit project under `DoAn-CSharp.Tests`

- [ ] **Step 4: Add the Test project to the Solution**
  Run: `dotnet sln DoAn-CSharp.sln add DoAn-CSharp.Tests/DoAn-CSharp.Tests.csproj`
  Expected: Success output adding test project to solution

- [ ] **Step 5: Reference the main project from the Test project**
  Run: `dotnet add DoAn-CSharp.Tests/DoAn-CSharp.Tests.csproj reference DoAn-CSharp.csproj`
  Expected: Success output adding reference

- [ ] **Step 6: Create/Update global usings in Test project**
  Create `DoAn-CSharp.Tests/Usings.cs` with standard global usings:
  ```csharp
  global using Xunit;
  ```

- [ ] **Step 7: Verify solution build**
  Run: `dotnet build`
  Expected: Build succeeds with 0 errors.

- [ ] **Step 8: Commit (if auto_commit enabled)**
  Check `.agent/config.yml` for `auto_commit` setting.
  If `auto_commit: false`: skip commit and staging. Print: "Skipping commit (auto_commit: false)."

---

### Task 2: Define Agent TDD & Spec Rules

**Files:**
- Create: `.agent/rules/spec-and-eval-loop.md`
- Modify: `agents.md`

- [ ] **Step 1: Create Agent Spec & TDD Rule File**
  Create `file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/.agent/rules/spec-and-eval-loop.md` with the following content:
  ```markdown
  # Spec-Driven & Automated xUnit Test Evaluation Loop Rules

  You MUST strictly follow these rules before making any modifications to codebase files:

  1. **Phase 1: Specification (Spec-First)**
     - Create a spec file in `.agent/specs/YYYY-MM-DD-feature-name.md` detailing changes, input/output structures, and test assertions.
     - Seek explicit User approval on the spec before writing code.

  2. **Phase 2: Test-First (TDD)**
     - Write the failing unit or integration tests inside the `DoAn-CSharp.Tests` project.
     - Run `dotnet test` and verify that the new tests fail.

  3. **Phase 3: Implementation**
     - Write the minimal logic code in the main project to satisfy the new tests.

  4. **Phase 4: Evaluation Loop**
     - Run `dotnet test`.
     - Analyze log failures, fix logic, and repeat until all tests pass 100%.
  ```

- [ ] **Step 2: Update `agents.md` to reference the rule file**
  Add a reference section in `file:///c:/Users/NguyenNguyen/Documents/GitHub/DoAn-CSharp/agents.md` under a new header `## 🔄 Spec-Driven & TDD Evaluation Loop`:
  ```markdown
  ## 🔄 Spec-Driven & TDD Evaluation Loop
  Agents MUST strictly adhere to the Spec-First and TDD workflow defined in [.agent/rules/spec-and-eval-loop.md](file:///.agent/rules/spec-and-eval-loop.md).
  Always generate specs under `.agent/specs/` and run `dotnet test` as the automated evaluation loop.
  ```

- [ ] **Step 3: Commit (if auto_commit enabled)**
  Check `.agent/config.yml` for `auto_commit` setting.
  If `auto_commit: false`: skip commit and staging. Print: "Skipping commit (auto_commit: false)."

---

### Task 3: Implement HomeController Test

**Files:**
- Create: `DoAn-CSharp.Tests/HomeControllerTests.cs`

- [ ] **Step 1: Write a failing/placeholder test**
  Create `DoAn-CSharp.Tests/HomeControllerTests.cs` testing `HomeController.Index`:
  ```csharp
  using Microsoft.AspNetCore.Mvc;
  using DoAn_CSharp.Controllers;
  using Microsoft.Extensions.Logging;
  using NSubstitute; // Or standard mock if NSubstitute isn't installed. Let's use direct construction or mock.

  namespace DoAn_CSharp.Tests;

  public class HomeControllerTests
  {
      [Fact]
      public void Index_ReturnsViewResult()
      {
          // Arrange
          var logger = Substitute.For<ILogger<HomeController>>(); // We can mock ILogger
          var controller = new HomeController(logger);

          // Act
          var result = controller.Index();

          // Assert
          var viewResult = Assert.IsType<ViewResult>(result);
          Assert.Null(viewResult.ViewName); // Standard Index action usually returns View() (null name)
      }
  }
  ```
  Wait! Let's check dependencies. To use NSubstitute, we should add it, or we can use a simple mock logger implementation to avoid adding packages unnecessarily to save quota. Let's write a simple dummy logger:
  ```csharp
  using Microsoft.AspNetCore.Mvc;
  using DoAn_CSharp.Controllers;
  using Microsoft.Extensions.Logging;
  using System;

  namespace DoAn_CSharp.Tests;

  public class DummyLogger<T> : ILogger<T>
  {
      public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
      public bool IsEnabled(LogLevel logLevel) => false;
      public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) {}
  }

  public class HomeControllerTests
  {
      [Fact]
      public void Index_ReturnsViewResult()
      {
          // Arrange
          var logger = new DummyLogger<HomeController>();
          var controller = new HomeController(logger);

          // Act
          var result = controller.Index();

          // Assert
          var viewResult = Assert.IsType<ViewResult>(result);
          Assert.Null(viewResult.ViewName);
      }
  }
  ```

- [ ] **Step 2: Run the test to verify it passes**
  Run: `dotnet test`
  Expected: Test passes successfully.

- [ ] **Step 3: Commit (if auto_commit enabled)**
  Check `.agent/config.yml` for `auto_commit` setting.
  If `auto_commit: false`: skip commit and staging. Print: "Skipping commit (auto_commit: false)."
