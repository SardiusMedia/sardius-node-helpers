# sardius-node-helpers

## Useful information for humans

- Keep version numbers in sync between:
  - `package.json`
  - `build/package.json`
- When preparing a release, increment both files to the same version value in the same change.
- `build/package.json` represents the published build artifact metadata and should always match the root package version.

## Useful information for AI

- If a user requests a version bump for this repo, update both `package.json` and `build/package.json`.
- Do not leave these version values mismatched.
- After version changes, report both resulting versions explicitly.
