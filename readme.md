# Cybersecurity Blog

A full-stack cybersecurity blog platform built with Rust (backend) and React TypeScript (frontend). Features secure authentication, content management, and real-time commenting with comprehensive input sanitization.

## Tech Stack

### Backend

- **Framework**: Rust, Actix-Web
- **Database**: PostgreSQL with SQLx
- **Authentication**: JWT tokens, Argon2 password hashing
- **Security**: HTML sanitization (Ammonia), CORS protection
- **File Handling**: Image upload and URL-based fetching

### Frontend

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Rich Text**: EditorJS for blog content creation
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors

### Development & Deployment

- **Containerization**: Docker & Docker Compose
- **Environment**: Development and production configurations
- **Build System**: Cargo (Rust) + Vite (React)

## Features

### 🔐 Authentication & Security

- JWT-based authentication with token validation
- Argon2 password hashing
- Role-based access control (Admin/User)
- Input sanitization and XSS protection
- CORS configuration for secure cross-origin requests

### 📝 Content Management

- Rich text blog post creation with EditorJS
- Image upload and URL-based image insertion
- Draft/publish post management
- SEO-friendly URL slugs
- Post editing and deletion (admin only)

### 💬 Commenting System

- User authentication required for commenting
- Real-time comment posting and editing
- Comment moderation (edit/delete by author or admin)
- HTML sanitization for safe comment rendering
- Character limits and validation

### 👤 User Management

- User registration and profile management
- Profile picture upload (file or URL)
- User information updates
- Admin dashboard for content oversight

### 🎨 User Interface

- Responsive design for all screen sizes
- Dark theme with modern aesthetics
- Mobile-friendly navigation
- Loading states and error handling
- Smooth animations and transitions

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── handlers/          # API route handlers
│   │   │   ├── posts.rs       # Blog post operations
│   │   │   ├── comments.rs    # Comment management
│   │   │   ├── users.rs       # User authentication
│   │   │   └── files.rs       # File upload handling
│   │   ├── models/            # Data structures
│   │   ├── auth/              # Authentication logic
│   │   ├── db/                # Database configuration
│   │   ├── sanitize.rs        # Input sanitization
│   │   └── main.rs            # Application entry point
│   └── Cargo.toml
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Comments.tsx   # Comment system
│   │   │   ├── CreatePost.tsx # Post creation
│   │   │   ├── EditPost.tsx   # Post editing
│   │   │   └── Navigation.tsx # App navigation
│   │   ├── contexts/          # React contexts
│   │   │   └── authContext.tsx
│   │   ├── pages/             # Page components
│   │   └── services/          # API services
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Rust 1.70+ (for local development)
- PostgreSQL (for local development)

### Using Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/faranse82/cyber-blog.git
cd cyber-blog

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Build and run
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8443
```

### Local Development

```bash
# Backend setup
cd backend
cp .env.example .env
# Configure your PostgreSQL connection in .env
cargo run

# Frontend setup (in another terminal)
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Posts

- `GET /api/posts` - Get all posts
- `GET /api/posts/{slug}` - Get post by slug
- `POST /api/posts` - Create post (admin only)
- `PUT /api/posts/{id}` - Update post (admin only)
- `DELETE /api/posts/{id}` - Delete post (admin only)

### Comments

- `GET /api/comments/post/{post_id}` - Get comments for post
- `POST /api/comments` - Create comment (authenticated users)
- `PUT /api/comments/{id}` - Update comment (author/admin only)
- `DELETE /api/comments/{id}` - Delete comment (author/admin only)

### Users

- `GET /api/users/me` - Get current user info
- `PUT /api/users/profile` - Update user profile

### Files

- `POST /api/files/upload` - Upload image file (authenticated users)
- `POST /api/files/fetchUrl` - Upload image from URL (authenticated users)
- `GET /api/files/{filename}` - Serve uploaded files

## Environment Configuration

### Backend (.env)

```env
DATABASE_URL=postgresql://username:password@localhost/cyber_blog
JWT_SECRET=your-key
RUST_LOG=info
```

### Frontend (services/api.ts)

```
API_BASE_URL=http://localhost:8443/api
```

## Security Features

### Input Sanitization

- HTML sanitization using Ammonia library
- EditorJS content validation and sanitization
- Comment content filtering and validation
- File upload validation (type, size, safety)

### Authentication Security

- JWT tokens with expiration
- Secure password hashing with Argon2
- Role-based access control
- Request authentication middleware

### CORS & Headers

- Configured CORS for frontend domain
- Security headers for XSS protection
- File size limits and type validation

## Database Schema

### Users Table

- `id` (UUID, Primary Key)
- `username` (Unique)
- `email` (Unique)
- `password_hash`
- `is_admin` (Boolean)
- `profile_pic_url`
- `created_at`, `updated_at`

### Posts Table

- `id` (UUID, Primary Key)
- `title`, `slug` (Unique)
- `content` (EditorJS JSON)
- `excerpt`
- `published` (Boolean)
- `author_id` (Foreign Key)
- `created_at`, `updated_at`

### Comments Table

- `id` (UUID, Primary Key)
- `content`
- `post_id` (Foreign Key, Cascade Delete)
- `author_id` (Foreign Key)
- `created_at`, `updated_at`

### Files Table

- `id` (UUID, Primary Key)
- `filename`, `original_name`
- `mime_type`, `size`
- `url`
- `uploader_id` (Foreign Key)
- `created_at`

## Development Roadmap

### ✅ Completed Features

- [x] User authentication and authorization
- [x] Blog post CRUD operations
- [x] Rich text editor integration
- [x] Comment system implementation
- [x] File upload functionality
- [x] User profile management
- [x] Admin dashboard
- [x] Responsive UI design
- [x] Input sanitization and security

### 📋 To-Do List

#### Core Features

- [ ] **Admin user management** - User role management, user deletion, account suspension
- [ ] **Forgot password functionality** - Password reset via email with secure tokens
- [ ] **Multi-factor authentication (MFA)** - TOTP/SMS-based 2FA for enhanced security
- [ ] **Search functionality** - Full-text search across posts and comments
- [ ] **Post categorization** - Tags and categories for better content organization
- [ ] **Post analytics** - View counts, engagement metrics

#### Enhanced User Experience

- [ ] **Email notifications** - Comment notifications, post updates
- [ ] **Social sharing** - Share posts on social media platforms
- [ ] **Post reactions** - Like/dislike system for posts and comments
- [ ] **User profiles** - Public user profiles with post history

#### Technical Improvements

- [x] **Rate limiting** - Prevent API abuse and spam
- [ ] **Image optimization** - Automatic image compression and thumbnails
- [ ] **Backup system** - Automated database backups
- [ ] **Monitoring & Analytics** - Application performance monitoring

#### Security Enhancements

- [ ] **Audit logging** - Track admin actions and security events
- [ ] **Content moderation** - Automated content filtering and flagging

## Contact

- **Author**: Faran Sepehri
- **Email Address**: faransepehri1382@gmail.com
- **LinkedIn**: [Faran Sepehri](https://www.linkedin.com/in/faran-sepehri-b82716278/)
- **GitHub**: [faranse82](https://github.com/faranse82)

---

_This project is a learning exercise focused on secure development practices, modern web technologies, and cybersecurity principles._
