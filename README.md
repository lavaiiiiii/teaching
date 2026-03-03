# Teacher Supporter AI (OpenClaw-ready)

A simple web app to support teachers with two daily tasks:

1. **Email Helper**
   - Drafts kind, clear emails quickly.
   - Can call an online AI API (OpenClaw endpoint + key).
   - Falls back to a built-in local draft when no API is configured.

2. **7-Day Meeting Scheduler**
   - Generates available meeting slots for the next 7 days.
   - Lets you select times and instantly builds a ready-to-send message.

Designed for low-tech users: big buttons, plain language, and minimal setup.

## Run locally

```bash
python3 -m http.server 4173
```

Then open: <http://localhost:4173>

## OpenClaw setup

In the app:
- Add **OpenClaw API Endpoint** (example: `https://api.openclaw.ai/v1/chat/completions`)
- Add **OpenClaw API Key**

If these are blank, the app still works with a local template.
