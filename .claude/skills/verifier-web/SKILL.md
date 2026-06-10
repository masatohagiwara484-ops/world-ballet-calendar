---
name: verifier-web
description: Visual verification protocol for this Next.js site. Use after any UI change to prove the page actually renders (the repeated failure mode of this project was "compiles fine, renders blank").
---

# Web Verifier — World Ballet & Opera Calendar

## Why this exists
This project shipped a blank hero three times because verification stopped at "build succeeded". Build success proves nothing about pixels. This protocol produces screenshot evidence.

## Protocol

1. Start the dev server (idempotent):
   ```bash
   pkill -f "next dev" || true
   npm run dev > /tmp/dev-server.log 2>&1 &
   sleep 6
   ```
2. Confirm HTTP 200 and check the log for compile errors:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
   grep -iE "error|failed" /tmp/dev-server.log | grep -v ENOTFOUND || true
   ```
   (`placeholder.supabase.co ENOTFOUND` is expected in the sandbox — the static
   dataset fallback must cover it.)
3. Screenshot every changed route — **wait for client JS** (globe/canvas needs time):
   ```bash
   playwright screenshot --wait-for-timeout 6000 --viewport-size 1440,900 \
     http://localhost:3000 /tmp/verify-home.png
   playwright screenshot --wait-for-timeout 4000 --viewport-size 390,844 \
     http://localhost:3000 /tmp/verify-home-mobile.png
   ```
4. **Read the screenshot with the Read tool and look at it.** Checklist:
   - Hero: globe visible (textured sphere, not blank/white)?
   - Data: real company/performance names visible (not empty states)?
   - Typography: Playfair Display headlines rendering?
   - Mobile: no horizontal overflow, nav usable?
5. Verdict must cite the screenshot. "Compiled successfully" is NOT a pass.

## Routes to cover
`/` · `/companies/royal-ballet` (any slug) · `/calendar` (if present) · one performance detail
