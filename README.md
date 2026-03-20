# OneOfOne Marketplace

OneOfOne is the central hub for the AI Shorts pipeline and its licensing system.

## Project Structure

- `worker/`: Cloudflare Worker for licensing API.
- `src/`: Core AI Shorts pipeline logic.

## Licensing API

The licensing API handles key generation, activation, and verification for the Empire's software suite.

- **Endpoints**:
  - `/admin/generate`: Generate a new license key (requires `ADMIN_PASSWORD`).
  - `/activate`: Activate a machine with a license key.
  - `/verify`: Verify license status.
  - `/admin/keys`: List all licenses.

## Tech Stack

- **Cloudflare Workers**: Licensing API.
- **Next.js / TypeScript**: AI Shorts pipeline.
- **Remotion**: Video generation.
