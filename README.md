# 🚀 Korir Workspace

> **An AI-powered digital workspace for knowledge management, intelligent document retrieval, project collaboration, and productivity automation.**

Korir Workspace is a modern SaaS platform that centralizes documents, AI assistants, knowledge bases, projects, and business workflows into a single intelligent workspace. Powered by Retrieval-Augmented Generation (RAG) and cloud integrations, it enables users to securely organize information, ask questions in natural language, and automate everyday tasks.

---

## 🌟 Vision

To build an intelligent digital workspace where users can manage knowledge, collaborate on projects, automate workflows, and interact with AI to access information quickly and accurately.

---

## ✨ Core Features

### 🤖 AI Knowledge Assistant

- Natural language conversations
- Context-aware responses
- Multi-turn chat
- AI-powered document Q&A
- Source citations
- Conversation history

### 📚 Knowledge Base

- Create and organize knowledge collections
- Upload and index documents
- Semantic search with AI
- Categories and tags
- Version management

### 📄 Document Management

- Upload PDFs, Word, Excel, CSV, Markdown, and text files
- Drag-and-drop interface
- OCR support for images
- File preview and organization
- Version history

### ☁️ Cloud Storage Integration

- Google Drive
- Microsoft OneDrive
- Dropbox
- Supabase Storage

### 🔍 Intelligent Search

- Semantic search
- Keyword search
- Hybrid search
- AI-generated summaries
- Fast document retrieval

### 📋 Workspace Management

- Projects
- Tasks
- Notes
- Knowledge bases
- Saved prompts
- AI conversations

### 👥 Collaboration

- Shared workspaces
- Team roles and permissions
- Comments
- Notifications
- Activity history

### 📊 Analytics Dashboard

- Workspace overview
- AI usage insights
- Storage statistics
- Recent activity
- Productivity metrics

### 🔐 Authentication & Security

- Email and password login
- Google authentication
- GitHub authentication
- Secure user sessions
- Role-based access control

---

# 🛠 Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend

- Node.js
- Express.js

## Database

- PostgreSQL
- Supabase

## AI

- OpenAI API
- Retrieval-Augmented Generation (RAG)
- Embeddings
- Semantic Search

## Authentication

- Supabase Auth

## Storage

- Supabase Storage

## Deployment

- Vercel
- GitHub Actions

---

# 📂 Project Structure

```text
korir-workspace/
│
├── app/
├── components/
├── hooks/
├── lib/
├── services/
├── types/
├── public/
├── prisma/
├── supabase/
├── docs/
├── tests/
├── styles/
├── package.json
├── README.md
└── .env.example
```

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone https://github.com/Korir88/korir-workspace.git
```

## Navigate to the project

```bash
cd korir-workspace
```

## Install dependencies

```bash
npm install
```

## Configure environment variables

### Supabase setup

1. Create a project in [Supabase](https://supabase.com/dashboard).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql).
3. In **Authentication → URL Configuration**, set the Site URL to your Vercel URL and add that URL to Redirect URLs.
4. Copy `.env.example` to `.env.local` and add the project URL plus its publishable key. Do not use a service-role key in this app.

For Vercel, add the same values in **Project Settings → Environment Variables** for Production, Preview, and Development, then redeploy.

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

## Start the development server

```bash
npm run dev
```

Open your browser and visit:

```text
http://localhost:5000
```

---

# 🗺 Development Roadmap

## Phase 1 — MVP

- User authentication
- AI chat interface
- File upload
- Knowledge base
- Semantic search
- Dashboard

## Phase 2

- Google Drive integration
- OneDrive integration
- Dropbox integration
- AI memory
- Collections and folders

## Phase 3

- Team collaboration
- AI agents
- Workflow automation
- Mobile support
- Public API

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

Please follow consistent coding standards and include meaningful commit messages.

---

# 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.

---

# 👨‍💻 Author

**Emmanuel Korir**

IT Support Specialist • Full-Stack Developer • AI & Cloud Enthusiast

- GitHub: https://github.com/Korir88
- Portfolio: *Coming Soon*

---

# ⭐ Support

If you find this project useful, please consider giving it a **⭐ Star** on GitHub. Your support helps improve the project and encourages future development.
