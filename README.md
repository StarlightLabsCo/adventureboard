# Adventureboard

Adventureboard is a multiplayer collaborative canvas built specifically for Dungeons & Dragons campaigns. It provides a real-time, interactive environment for Dungeon Masters and players to visualize and manage their adventures.

## Project Structure

Adventureboard is composed of two main components:

1. **Client Application**: A React/Vite/TypeScript project located in the `@client` directory.
2. **Server Application**: Cloudflare Durable Objects code to manage multiplayer aspects in the `@backend` directory.

## Features

- Real-time collaborative canvas
- D&D-specific tools and assets
- Multiplayer support for seamless group interaction
- Responsive design for various devices

## Getting Started

### Prerequisites

- Bun (1.1.17)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/adventureboard.git
   cd adventureboard
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Start the development server:
   ```
   bun run dev
   ```

## Development

### Client Application

The client application is built with React, Vite, and TypeScript. It's located in the `@client` directory.

To start the client development server:

```
cd apps/client
bun run dev
```

### Server Application

The server application uses Cloudflare Durable Objects. Deployment and development instructions for the server component can be found in the server directory.

## Building for Production

To build the client application for production:

```
cd apps/client
bun run build
```

## More Info

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
