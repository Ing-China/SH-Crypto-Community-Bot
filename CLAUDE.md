# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers project built with Hono framework for creating a cryptocurrency community bot. The project uses TypeScript and is configured for deployment on Cloudflare's edge computing platform.

## Architecture

- **Framework**: Hono - a lightweight web framework for edge computing
- **Runtime**: Cloudflare Workers (V8 isolates)
- **Language**: TypeScript with strict mode enabled
- **Build Tool**: Wrangler (Cloudflare's CLI tool)
- **Package Manager**: Uses Bun (based on bun.lock presence)

## Development Commands

### Setup and Development
```bash
npm install          # Install dependencies
npm run dev          # Start development server with hot reload
```

### Type Generation
```bash
npm run cf-typegen   # Generate types based on Worker configuration
```

### Deployment
```bash
npm run deploy       # Deploy to Cloudflare Workers with minification
```

## Key Configuration Files

- `wrangler.jsonc` - Cloudflare Workers configuration with commented examples for KV, R2, D1, and AI bindings
- `tsconfig.json` - TypeScript configuration with ESNext target and Hono JSX support
- `src/index.ts` - Main application entry point

## Development Notes

When adding Cloudflare bindings (KV, R2, D1, AI), remember to:
1. Uncomment and configure the relevant sections in `wrangler.jsonc`
2. Run `npm run cf-typegen` to generate TypeScript types
3. Pass `CloudflareBindings` as generics when instantiating Hono: `new Hono<{ Bindings: CloudflareBindings }>()`

The project is configured for edge computing with strict TypeScript settings and modern ESNext features.