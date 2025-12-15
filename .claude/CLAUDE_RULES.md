# Claude Code Rules for This Project

## DO NOT:
- Start, stop, restart, or kill dev servers (`npm run dev`, etc.)
- Start, stop, or interfere with build processes (`npm run build`, etc.)
- Start, stop, or interfere with file watchers or hot reload
- Run any long-running processes without explicit user request

## DO:
- Run type checking (`npx tsc --noEmit`) to verify code compiles
- Run linting if needed
- Make code changes as requested
- Assume the user is managing their own dev environment
