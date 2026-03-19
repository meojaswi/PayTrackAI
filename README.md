# PayTrackAI

PayTrackAI is a debt follow-up dashboard for businesses that need a simple way to track pending payments, review debtor accounts, and prepare WhatsApp or SMS reminders.

## Current scope

This repository currently includes the frontend dashboard prototype built with React and Vite.

Features in the current UI:
- login screen
- debt recovery dashboard
- debtors page
- messages page
- payments page
- import excel page
- settings page

## Tech stack

- React
- Vite
- JavaScript
- HTML
- CSS

## Project structure

```text
PayTrackAI/
  frontend/
    src/
    .env
    .env.example
    index.html
    package.json
```

## Getting started

1. Go to the frontend app:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Copy the example environment file:

```bash
copy .env.example .env
```

4. Start the development server:

```bash
npm run dev
```

5. Open the local URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Environment variables

The frontend uses Vite environment variables from `frontend/.env`.

Available variables:
- `VITE_APP_NAME`
- `VITE_APP_ENV`
- `VITE_API_BASE_URL`
- `VITE_OPENAI_API_KEY`
- `VITE_TWILIO_ACCOUNT_SID`
- `VITE_TWILIO_AUTH_TOKEN`
- `VITE_TWILIO_WHATSAPP_NUMBER`
- `VITE_SMS_FROM_NUMBER`

## Notes

- `frontend/.env` is ignored by git.
- Use `frontend/.env.example` as the public template.
- `frontend/node_modules` and build files are ignored by git.

## Next planned steps

- connect the dashboard to a backend API
- add real authentication
- support Excel upload parsing
- integrate WhatsApp and SMS sending
- add AI-generated debt reminder drafts
