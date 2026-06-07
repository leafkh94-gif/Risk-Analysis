#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# your-script-name.sh
#
# This is a no-op build script. This project is a static site
# (public/) plus Vercel serverless functions (api/), so there is
# NOTHING to build.
#
# It exists only because the Vercel project's dashboard Build
# Command was left as the default placeholder "bash your-script-name.sh".
# With no such file in the repo, every build died with:
#     exit code 127: bash: your-script-name.sh: No such file or directory
#
# By providing the file the dashboard is asking for, the build now
# succeeds (exit 0) without anyone needing to touch Vercel settings.
# ─────────────────────────────────────────────────────────────
echo "No build step needed — static site (public/) + serverless functions (api/). Skipping."
exit 0
