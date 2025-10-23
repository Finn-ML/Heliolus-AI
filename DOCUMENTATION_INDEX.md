# Documentation Index - Heliolus Platform

This file provides an index of all documentation files in the project.

---

## Core Documentation

### 📘 CLAUDE.md
**Main project context file** - Comprehensive technical overview of the entire platform.

**Contains**:
- Complete tech stack (Frontend, Backend, Infrastructure)
- Project structure (file tree with descriptions)
- Core services architecture (16 backend services)
- API routes documentation (11 route files)
- Database schema (Prisma models and enums)
- Development commands
- API architecture patterns
- Security implementation
- Infrastructure & deployment info
- Data flow patterns
- Performance considerations
- Environment configuration
- Development workflow
- Current development status
- Architecture principles

**Last Updated**: 2025-10-13
**Use When**: You need complete technical context about the platform

---

## Change Documentation

### 📝 CHANGELOG.md
**Project changelog** - All notable changes to the platform.

**Contains**:
- Version history
- Fixed issues with dates
- New features added
- Known issues
- Change categories (Added, Changed, Fixed, Security, etc.)

**Format**: Keep a Changelog 1.0.0
**Last Updated**: 2025-10-13
**Use When**: You need to track what changed and when

---

## Technical Issue Documentation

### 🐛 REPORTS_PAGE_FIX.md
**Complete technical deep-dive** into the Reports page bug fix.

**Contains**:
- Problem summary
- Root cause analysis (3 distinct issues)
- Solutions implemented (with code examples)
- Verification tests
- Lessons learned
- API documentation updates
- Files modified with line numbers
- Testing checklist
- Future improvements
- Related issues

**Size**: ~500 lines of detailed technical documentation
**Last Updated**: 2025-10-13
**Use When**:
- Debugging similar Fastify schema validation issues
- Understanding Prisma `take` limitations
- Learning from this specific bug fix
- Training new developers on the codebase

**Key Takeaway**: Fastify removes fields not in response schema, even if they're in the response object.

---

## API Documentation

### 🔌 API_CHANGES_2025-10-13.md
**API changes reference** for October 13, 2025 updates.

**Contains**:
- Summary of API changes
- GET /v1/assessments response schema update (before/after)
- DELETE /v1/assessments/:id new endpoint documentation
- Request/response examples
- Error response documentation
- Security & authorization details
- Example usage (cURL, JavaScript, Frontend client)
- What gets deleted (cascade behavior)
- Breaking changes (none!)
- Client library updates
- Testing verification checklist
- Performance impact analysis
- Rollback procedure

**Last Updated**: 2025-10-13
**Use When**:
- Integrating with the updated API
- Understanding the DELETE endpoint
- Migrating client code
- Troubleshooting API issues

---

## Project Documentation (Other)

### 📋 README.md
Main project readme file.

**Last Updated**: (Check file timestamp)
**Use When**: First time setup, overview of project

---

### 📦 HANDOVER_*.md Files
Various handover documents for project transitions.

**Files**:
- HANDOVER_DOCUMENT.md
- HANDOVER_SOLUTION.md
- HANDOVER_STATUS_UPDATE.md
- FINAL_STATUS.md
- HANDOVER_SUMMARY.md

**Use When**: Understanding project history and transitions

---

## Quick Reference

### Where to Find Information

| What You Need | Document to Check |
|--------------|------------------|
| Complete tech stack | CLAUDE.md |
| API endpoints | CLAUDE.md → API Routes section |
| Database models | CLAUDE.md → Database Schema section |
| Recent changes | CHANGELOG.md |
| Bug fix details | REPORTS_PAGE_FIX.md |
| API changes | API_CHANGES_2025-10-13.md |
| Development commands | CLAUDE.md → Development Commands |
| Environment variables | CLAUDE.md → Environment Configuration |
| Feature implementation | CLAUDE.md → Key Features Implemented |
| Security setup | CLAUDE.md → Security Implementation |

---

## Documentation Standards

### When to Create New Documentation

**Always create documentation when**:
1. Fixing a critical bug (like REPORTS_PAGE_FIX.md)
2. Adding new API endpoints
3. Making breaking changes
4. Discovering important gotchas/limitations
5. Implementing major features

**Documentation should include**:
- Clear problem/solution statement
- Code examples (before/after)
- File paths and line numbers
- Testing verification
- Impact analysis
- Migration/rollback procedures

### Where to Add Documentation

| Type of Change | Primary Doc | Secondary Doc |
|---------------|-------------|---------------|
| New API endpoint | API_CHANGES_*.md | CLAUDE.md (brief mention) |
| Bug fix | *_FIX.md | CHANGELOG.md |
| New feature | CLAUDE.md | CHANGELOG.md |
| Architecture change | CLAUDE.md | Dedicated doc if complex |
| Breaking change | CHANGELOG.md + API_CHANGES_*.md | All affected docs |

### Documentation File Naming

**Pattern**: `{TOPIC}_{DATE}.md` for time-sensitive docs

**Examples**:
- `REPORTS_PAGE_FIX.md` (no date - evergreen reference)
- `API_CHANGES_2025-10-13.md` (dated - specific changes)
- `MIGRATION_GUIDE_V2.md` (version-based)

---

## Test Scripts & Diagnostics

### Backend Test Scripts

**Location**: `/backend/`

**Scripts**:
1. `test-specific-completed.mjs` - Tests API endpoint for completed assessments
2. `check-gaps-risks.mjs` - Verifies database has gaps/risks
3. `check-all-assessments.mjs` - Counts assessments by status

**Usage**:
```bash
cd backend
node test-specific-completed.mjs
node check-gaps-risks.mjs
node check-all-assessments.mjs
```

**Purpose**: Verify Reports page fix and diagnose data issues

---

## Documentation Maintenance

### Update Frequency

| Document | Update Frequency |
|----------|-----------------|
| CLAUDE.md | After major changes, quarterly reviews |
| CHANGELOG.md | After every fix/feature |
| *_FIX.md files | One-time (created when needed) |
| API_CHANGES_*.md | Per release or major API update |
| README.md | As needed for setup changes |

### Review Process

**Quarterly Review** (Every 3 months):
1. Update CLAUDE.md with new features
2. Archive old API_CHANGES_*.md files
3. Update tech stack versions
4. Review "Known Issues" sections
5. Update "Last Updated" timestamps

**Per-Feature Review**:
1. Update CHANGELOG.md immediately
2. Update CLAUDE.md if major feature
3. Create dedicated doc if complex fix/feature
4. Update API docs if endpoints changed

---

## Contributing to Documentation

### Documentation Checklist

When making significant changes:

- [ ] Update CHANGELOG.md with change summary
- [ ] Update CLAUDE.md if architecture/tech stack changed
- [ ] Create *_FIX.md if fixing critical bug
- [ ] Create API_CHANGES_*.md if API changed
- [ ] Update test scripts if needed
- [ ] Add examples and code snippets
- [ ] Include file paths and line numbers
- [ ] Add verification/testing steps
- [ ] Update this index if adding new docs

### Documentation Style Guide

**Writing Style**:
- Use clear, concise language
- Include code examples
- Show before/after comparisons
- Provide file paths with line numbers
- Add testing verification steps
- Include impact analysis

**Code Examples**:
- Always include language tags (```typescript, ```json, etc.)
- Show full context, not just snippets
- Include comments explaining key parts
- Use actual values from the codebase when possible

**Structure**:
- Use markdown headers (##, ###)
- Include a table of contents for long docs
- Add timestamps and dates
- Include "Last Updated" at end
- Use emoji sparingly (only in headers)

---

## Archived Documentation

**Location**: TBD - Consider creating `/docs/archive/` folder

**When to Archive**:
- API changes docs older than 6 months
- Bug fix docs for resolved issues (>1 year old)
- Outdated handover documents
- Superseded documentation

---

## Contact & Questions

**For Documentation Questions**:
1. Check this index first
2. Review CLAUDE.md for technical context
3. Check CHANGELOG.md for recent changes
4. Review specific *_FIX.md or API_CHANGES_*.md files

**Documentation Feedback**:
- Create GitHub issue with label `documentation`
- Suggest improvements via pull request
- Update docs directly (then PR)

---

**Index Last Updated**: 2025-10-13
**Documentation Status**: ✅ Up to Date
**Total Documentation Files**: 10+ (including handover docs)
**Critical Docs**: CLAUDE.md, CHANGELOG.md, REPORTS_PAGE_FIX.md, API_CHANGES_2025-10-13.md
