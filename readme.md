# Cybersecurity Blog

Backend REST API for a cybersecurity blog built with Rust. Frontend implementation has begun.

## Tech Stack

- **Backend**: Rust, Actix-Web, SQLx, PostgreSQL
- **Frontend**: React, TypeScript, Tailwind
- **Authentication**: JWT, Argon2 password hashing
- **Deployment**: Docker

## Features

- User authentication & authorisation
- Blog post management (CRUD operations)
- Comments system
- Admin-only content creation

## Quick Start

```bash
# Clone repository
git clone https://github.com/username/cyber-blog.git

# Configure environment
cp .env.example .env

# Run with Docker
docker-compose up --build

# Or run locally (requires PostgreSQL)
cargo run
```

## API Endpoints (WIP)

- **Auth**: `/api/auth/login`, `/api/auth/register`
- **Posts**: `/api/posts`, `/api/posts/{slug}`
- **Comments**: `/api/comments`, `/api/posts/{id}/comments`

## Project Status

Currently implementing backend functionality. Frontend with React planned after backend reaches a functional state.

## To-do
- [ ] Implement profile page
- [ ] Implement create post component
- [ ] Implement forgot password function
- [ ] Implement search functionality
- [ ] Implement post page
- [ ] Implement post edit (and published on:off)
- [ ] Scale down all elements by around 30%
