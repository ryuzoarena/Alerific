# Architecture rules

- Use DesktopShell as the single responsive application shell; keep global playback and dialogs in Index so navigation cannot interrupt audio.
- Define shell and category visual values in global CSS semantic tokens; category configuration selects a token family and icon together.
- Reuse existing playlist actions and store calls in the responsive playlist presentation so ownership and persistence stay centralized.