---
name: code-review
description: Comprehensive pre-PR code review that analyzes git branch changes to catch code quality issues, security vulnerabilities, performance concerns, and architecture problems. Suggests refactorings and improvements based on project conventions. Use when user wants to review code before submitting a PR, needs feedback on changes, or asks to "review my code", "check my changes", "what did I miss", or similar code review requests.
---

# Code Review

This skill performs a thorough code review of changes on the current git branch, identifying issues and suggesting improvements before submitting a PR.

## Review Process

Follow this workflow to perform a comprehensive code review:

### 1. Gather Context

**Understand the changes:**

```bash
# Get current branch and diff stats
git branch --show-current
git diff dev --stat
git log dev..HEAD --oneline
```

**Read project conventions:**

- Check for `CLAUDE.md` or `AGENTS.md` in the repository root
- If present, read it to understand:
  - Project architecture and patterns
  - Technology stack and conventions
  - Testing requirements
  - Code style guidelines
  - Common pitfalls to avoid

**Analyze the full diff:**

```bash
# Get complete diff of changes
git diff dev
```

For large diffs (>1000 lines), review files in logical groups rather than all at once.

### 2. Identify Changed File Patterns

Group changed files by type to focus the review:

- UI components (React/Vue/etc.)
- API routes and handlers
- Database queries and migrations
- Configuration files
- Tests
- Documentation

### 3. Perform Category Reviews

Load the detailed checklist:

```bash
Read references/review-checklist.md
```

Review changes against each category:

1. **Code Quality & Style** - Consistency, cleanliness, readability
2. **Security Vulnerabilities** - Input validation, auth, XSS, sensitive data
3. **Performance Concerns** - Re-renders, queries, bundle size
4. **Architecture & Design** - Component design, state management, patterns

### 4. Check Against Codebase Patterns

Compare changes with existing code:

- Search for similar components/functions to check consistency
- Verify new patterns match established approaches
- Identify deviations from project conventions

Example searches:

```bash
# Find similar components
Glob **/*ComponentName*.tsx

# Find similar API patterns
Grep "pattern" --type=ts src/api/

# Find usage of similar libraries
Grep "import.*library" --type=ts
```

### 5. Identify Refactoring Opportunities

Look for:

- Code duplication across changed files
- Complex logic that could be simplified
- Opportunities to use existing abstractions
- Type improvements or better error handling

### 6. Generate Review Report

Structure the output as a detailed review with these sections:

#### Summary

- Branch name and commit count
- Files changed (grouped by type)
- Overall assessment (approve, needs changes, or blocking issues)

#### Critical Issues (if any)

- Security vulnerabilities
- Breaking changes
- Performance problems that would impact users
- Each issue includes: severity, file:line reference, description, suggested fix

#### Code Quality Issues (if any)

- Style inconsistencies
- Missing error handling
- Type safety improvements
- Each issue includes: file:line reference, description, suggested fix

#### Refactoring Suggestions (if any)

- Duplication to address
- Simplification opportunities
- Better abstractions to use
- Each suggestion includes: file:line reference, current approach, improved approach, rationale

#### Project Convention Notes (if any)

- Deviations from CLAUDE.md guidelines
- Inconsistencies with established patterns
- Suggestions to align with project standards

#### Positive Highlights

- Well-structured code
- Good test coverage
- Clever solutions
- Proper use of project patterns

## Output Format

Use this structure for the review output:

```markdown
# Code Review: [branch-name]

**Changes:** X files, Y commits
**Overall:** ✅ Approve / ⚠️ Needs Changes / 🚫 Blocking Issues

---

## Critical Issues

### 🔴 [Issue Type]: [Brief Description]

**File:** `path/to/file.ts:123`
**Severity:** High/Medium/Low

[Detailed explanation of the issue]

**Current code:**
\`\`\`typescript
// problematic code
\`\`\`

**Suggested fix:**
\`\`\`typescript
// improved code
\`\`\`

**Why this matters:** [Impact explanation]

---

## Code Quality Issues

[Same structure as Critical Issues, but for non-blocking issues]

---

## Refactoring Suggestions

### 💡 [Refactoring Type]: [Brief Description]

**Files:** `path/to/file1.ts`, `path/to/file2.ts`

[Explanation of the duplication or improvement opportunity]

**Current approach:**
\`\`\`typescript
// current code
\`\`\`

**Suggested refactoring:**
\`\`\`typescript
// improved approach
\`\`\`

**Benefits:** [Why this is better]

---

## Positive Highlights

- ✅ [Something done well]
- ✅ [Another positive aspect]

---

## Next Steps

[Prioritized list of actions to take before submitting PR]
```

## Tips

- **Be specific**: Always reference file:line locations for issues
- **Be constructive**: Frame suggestions as improvements, not criticisms
- **Prioritize**: Clearly distinguish blocking issues from suggestions
- **Provide examples**: Show both problematic and improved code
- **Consider context**: Not all "issues" are problems in their specific context
- **Balance thoroughness with pragmatism**: Focus on impactful issues over nitpicks
