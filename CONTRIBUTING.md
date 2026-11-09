# Contributing

Thanks for taking an interest in NRS. Bug reports, ideas and pull requests are all welcome.

## Setup

Follow the **Getting started** section of the [README](README.md) to run the backend and the frontend locally.

## Before you open a pull request

Run the checks for the part you changed.

```bash
cd backend
.venv/Scripts/python -m pytest
```

```bash
cd frontend
npm test
npm run lint
npm run build
```

## Guidelines

- Keep a pull request focused on one change.
- Add or update tests when you change algorithm or API behavior.
- Keep the algorithms in `backend/app/algorithms/` dependency-free. They are plain Python on purpose.
- Match the style of the surrounding code.
- Do not commit secrets or `.env` files. Use the `.env.example` files as a reference.

## Reporting issues

Open an issue with the steps to reproduce, what you expected and what happened. A screenshot or a saved topology JSON helps for visual or algorithm bugs.
