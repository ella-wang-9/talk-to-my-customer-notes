# 🚀 Claude Code + Databricks App Template

A modern, full-stack application template for building Databricks Apps with Python FastAPI backend and React TypeScript frontend. 

**[Claude Code](https://claude.ai/code)-centric workflow** - a single `/dba` command transforms your ideas into deployed applications. Claude guides you through product requirements, technical design, implementation, and deployment. It knows the entire Databricks Apps ecosystem and self-heals by automatically diagnosing and fixing issues.

The `/dba` workflow acts as your product strategist and development architect - brainstorming ideas with you, then building everything all the way to deployment.

![Databricks Apps](https://img.shields.io/badge/Databricks-Apps-orange)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![Claude](https://img.shields.io/badge/Claude-Ready-purple)

## 🚀 Getting Started

### 1. Use This Template

Click **"Use this template"** on GitHub to create your own Databricks app repository.

### 2. Clone Your New Repository

```bash
git clone https://github.com/yourusername/your-databricks-app
cd your-databricks-app
```

### 3. Choose Your Development Approach

#### Option A: Automatic Workflow with `/dba` (Recommended)

Open your repository in [Claude Code](https://claude.ai/code) and run the fully automated, opinionated workflow:

```
/dba describe your app here
```

The `/dba` command will:
- ✅ **Set up your development environment** with interactive configuration
- ✅ **Test your app locally** before deployment to catch issues early
- ✅ **Create or verify your Databricks app** exists
- ✅ **Deploy successfully** to Databricks Apps platform
- ✅ **Guide you through product requirements** with collaborative iteration
- ✅ **Design your technical architecture** with ultrathinking approach
- ✅ **Generate documentation** (`docs/product.md` and `docs/design.md`)
- ✅ **Optionally implement your design** or provide guidance for later implementation

This provides a complete guided experience from idea to deployed app.

#### Option B: Manual Setup with Full Control

If you prefer to have full control over the development process:

1. **Run the setup script** to configure your environment:
   ```bash
   ./setup.sh
   ```

2. **Open in Claude Code** and develop normally. Claude will:
   - Know about your entire repository structure
   - Understand the Databricks Apps framework
   - Help with any development tasks you request
   - Use the natural language commands documented below

This approach gives you complete flexibility while still benefiting from Claude's knowledge of the codebase and all available commands.

---

## 🎬 Demo

This is a [40-minute walkthrough demo](https://youtu.be/jDBTfxk1r7Q) of making an app from start to finish using the `/dba` command in Claude Code.

**Working Example**: [trace-summary-dashboard branch](https://github.com/databricks-solutions/claude-databricks-app-template/tree/trace-summary-dashboard) - Complete implementation from the video  
**See the Changes**: [View diff](https://github.com/databricks-solutions/claude-databricks-app-template/compare/trace-summary-dashboard?expand=1) - All code changes made during the demo

[![claude_dba_hero](https://github.com/user-attachments/assets/75492599-e5a1-4855-a9d1-c76d45c48da8)](https://youtu.be/jDBTfxk1r7Q)

---

## 📋 Prerequisites

Before using this template, ensure you have:

### Required Tools
- **Git** - Version control
- **uv** - Ultra-fast Python package manager (auto-manages Python versions)
- **bun** - Fast JavaScript package manager
- **Node.js 18+** - Required for Playwright
- **Homebrew** - Package manager (macOS only, auto-checked)
- **Playwright** - Browser automation and testing (optional but recommended)

Note: Python 3.11+ and Databricks CLI are automatically managed by uv

The `setup.sh` script will help you install any missing dependencies with interactive prompts.

### Databricks Setup
- Valid Databricks workspace
- Personal Access Token (PAT) or CLI profile configured
- Appropriate permissions for app deployment

---

## ✨ Features

- **🔥 Hot Reloading** - Instant updates for both Python backend and React frontend
- **🔄 Auto-Generated API Client** - TypeScript client automatically generated from FastAPI OpenAPI spec
- **🔐 Databricks Authentication** - Integrated with Databricks SDK for seamless workspace integration
- **🎨 Modern UI** - Beautiful components using shadcn/ui + Tailwind CSS
- **📦 Package Management** - uv for Python, bun for frontend
- **🚀 Databricks Apps Ready** - Pre-configured for deployment to Databricks Apps platform
- **🤖 Claude Integration** - Natural language development commands documented

## 🏗️ Project Structure

```
├── server/                    # FastAPI backend
│   ├── app.py                 # Main application
│   ├── routers/               # API route handlers
│   │   └── __init__.py        # Example router
│   └── services/              # Business logic
│
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/       # UI components
│   │   ├── lib/             # Utilities
│   │   └── fastapi_client/  # Generated API client
│   ├── package.json         # Frontend dependencies
│   └── vite.config.ts       # Vite configuration
│
├── setup_utils/               # Modular setup system
│   ├── utils.sh              # Shared utilities
│   ├── check_git.sh          # Git dependency check
│   ├── check_uv.sh           # uv package manager check
│   ├── check_bun.sh          # Bun package manager check
│   ├── check_node.sh         # Node.js 18+ check
│   └── check_homebrew.sh     # Homebrew check (macOS)
│
├── scripts/                   # Development automation
│   ├── watch.sh             # Development server
│   ├── fix.sh               # Code formatting
│   └── deploy.sh            # Deployment
│
├── setup.sh                  # Main setup script
├── pyproject.toml            # Python dependencies
├── app.yaml                  # Databricks Apps config
└── CLAUDE.md                 # Development guide
```

## 🚀 Quick Start (Manual Setup)

> **Note:** This section is for manual setup. For the automated workflow, use the `/dba` command described above.

### 1. Setup Environment

```bash
./setup.sh
```

This interactive script will:
- **Check system dependencies** (Git, uv, Bun, Node.js 18+)
- **Install missing dependencies** with interactive prompts and OS-specific commands
- **Set up Databricks authentication** (PAT or profile)
- **Install Python dependencies** with uv (including Python 3.11+ if needed)
- **Install frontend dependencies** with bun
- **Configure environment variables**

The setup script uses a modular design with individual dependency checkers in the `setup_utils/` directory for better maintainability.

### 2. Start Development

```bash
./watch.sh
```

This runs both servers in the background:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 3. View Your App

Open http://localhost:5173 to see the beautiful welcome page with:
- Getting Started guide
- Claude Commands reference
- Tech Stack overview
- Project Structure visualization
- Current user information from Databricks

## 🧠 Claude Commands

This template includes natural language commands that Claude understands:

### Development Lifecycle
- `"start the devserver"` → Runs development servers
- `"kill the devserver"` → Stops background processes
- `"fix the code"` → Formats Python and TypeScript code
- `"deploy the app"` → Deploys to Databricks Apps

### Development Tasks
- `"add a new API endpoint"` → Creates FastAPI routes
- `"create a new React component"` → Builds UI components
- `"open the UI in playwright"` → Opens app in browser for testing
- `"debug this error"` → Analyzes logs and fixes issues

See `CLAUDE.md` for the complete development guide.

## 🛠️ Development Commands

| Command | Description | Flags |
|---------|-------------|-------|
| `./setup.sh` | Interactive environment setup | `--auto-close` |
| `./watch.sh` | Start dev servers (background) | `--prod` |
| `./fix.sh` | Format code (Python + TypeScript) | None |
| `./deploy.sh` | Deploy to Databricks Apps | `--verbose`, `--create` |
| `./app_status.sh` | Check deployed app status | `--verbose` |
| `./run_app_local.sh` | Run app locally for debugging | `--verbose` |

### Script Details

#### Core Development Scripts
- **`./setup.sh`** - Configures authentication, installs dependencies, sets up environment
- **`./watch.sh`** - Starts both frontend and backend with hot reloading and auto-client generation
- **`./fix.sh`** - Formats Python (ruff) and TypeScript (prettier) code

#### Deployment & Monitoring
- **`./deploy.sh`** - Builds, syncs, and deploys to Databricks Apps
  - `--create` - Creates app if it doesn't exist
  - `--verbose` - Shows detailed deployment logs
- **`./app_status.sh`** - Shows app status with nice formatting
  - `--verbose` - Includes full JSON response and workspace files

#### Debugging Tools
- **`./run_app_local.sh`** - Runs app locally with debug mode for troubleshooting deployment issues
- **`scripts/make_fastapi_client.py`** - Generates TypeScript client from OpenAPI spec
- **`scripts/generate_semver_requirements.py`** - Creates requirements.txt from pyproject.toml

## 🧪 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **uv** - Ultra-fast Python package management
- **Databricks SDK** - Workspace integration and API access
- **Databricks Connect** - Local development with remote compute
- **MLflow[databricks]** - Experiment tracking, model management, and AI agents
- **Automatic OpenAPI** - Generated documentation

### Frontend
- **React 18** - Modern React with TypeScript
- **Vite** - Lightning-fast build tool
- **shadcn/ui** - Beautiful, accessible components
- **Tailwind CSS** - Utility-first styling
- **React Query** - Server state management
- **bun** - Fast package manager

### Development
- **Hot Reloading** - Instant feedback loop
- **Type Safety** - Full TypeScript coverage
- **Code Quality** - ruff (Python) + prettier (TypeScript)
- **Background Processes** - nohup with comprehensive logging

## 🔐 Authentication & Configuration

### Environment Variables (`.env.local`)

The setup script creates `.env.local` with your configuration:

```bash
# Authentication Type
DATABRICKS_AUTH_TYPE=pat  # or "profile"

# For PAT Authentication
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=your-personal-access-token

# For Profile Authentication  
DATABRICKS_CONFIG_PROFILE=your-profile-name

# App Configuration
DATABRICKS_APP_NAME=your-app-name
DBA_SOURCE_CODE_PATH=/Workspace/Users/you@company.com/your-app-name
```

### Authentication Methods

#### 1. Personal Access Token (PAT) - Recommended for Development
- **Pros**: Simple setup, works everywhere
- **Cons**: Token needs periodic renewal
- **Setup**: Generate PAT in Databricks workspace → User Settings → Access Tokens

#### 2. CLI Profile - Recommended for Production
- **Pros**: More secure, supports OAuth
- **Cons**: Requires CLI configuration
- **Setup**: Run `databricks auth login --host <workspace-url> --profile <profile-name>`

### Validation
The setup script automatically validates your configuration and tests connectivity.

## 🚀 Deployment

### Deploy to Databricks Apps

```bash
# Deploy existing app
./deploy.sh

# Create and deploy new app
./deploy.sh --create

# Deploy with verbose logging
./deploy.sh --verbose
```

### Deployment Process

The deployment script automatically:
1. **Authenticates** with Databricks using your `.env.local` configuration
2. **Creates app** (if using `--create` flag and app doesn't exist)
3. **Builds frontend** using Vite for production
4. **Generates requirements.txt** from pyproject.toml (avoids editable installs)
5. **Syncs source code** to Databricks workspace
6. **Deploys app** via Databricks CLI
7. **Verifies deployment** and shows app URL

### Monitoring Your App

#### Check App Status
```bash
./app_status.sh          # Basic status with nice formatting
./app_status.sh --verbose # Includes full JSON + workspace files
```

#### View App Logs
- **Visit your app URL + `/logz`** in browser (requires OAuth authentication)
- **Example**: `https://your-app-url.databricksapps.com/logz`
- **Cannot be accessed via curl** - browser authentication required

#### Debug Deployment Issues
```bash
./run_app_local.sh        # Test app locally first
./run_app_local.sh --verbose # Detailed local debugging
```

### Deployment Troubleshooting

**Common Issues:**
- **Import errors**: Run `./run_app_local.sh` to test locally first
- **Missing files**: Check with `./app_status.sh --verbose`
- **Authentication**: Verify `.env.local` configuration
- **CLI outdated**: Since we use `databricks`, the CLI is always up-to-date

## 📝 Customization

1. **Update branding** in `client/src/pages/WelcomePage.tsx`
2. **Add new API endpoints** in `server/routers/`
3. **Create UI components** in `client/src/components/`
4. **Modify authentication** in `scripts/setup.sh`

## 🐛 Troubleshooting

### Development Server Issues

#### Check Development Server Status
```bash
# View logs
tail -f /tmp/databricks-app-watch.log

# Check running processes
ps aux | grep databricks-app

# Check PID file
cat /tmp/databricks-app-watch.pid
```

#### Restart Development Servers
```bash
# Stop servers
kill $(cat /tmp/databricks-app-watch.pid) || pkill -f watch.sh

# Start servers
nohup ./watch.sh > /tmp/databricks-app-watch.log 2>&1 &
```

### Common Error Solutions

#### Port Already in Use
```bash
# Kill processes using ports 5173/8000
pkill -f "uvicorn server.app:app"
pkill -f "vite"
```

#### TypeScript Client Missing
```bash
# Regenerate TypeScript client
uv run python scripts/make_fastapi_client.py
```

#### Import Errors (like `@/lib/utils`)
```bash
# Check if utils.ts exists in correct location
ls -la src/lib/utils.ts
ls -la client/src/lib/utils.ts

# Copy if missing
cp client/src/lib/utils.ts src/lib/utils.ts
```

#### Authentication Issues
```bash
# Test authentication (works for both PAT and profile)
source .env.local && export DATABRICKS_HOST && export DATABRICKS_TOKEN && databricks current-user me

# Reconfigure if needed
./setup.sh
```

### Deployment Issues

#### App Status Troubleshooting
```bash
# Check app status
./app_status.sh

# Get detailed information
./app_status.sh --verbose

# Check workspace files
source .env.local && export DATABRICKS_HOST && export DATABRICKS_TOKEN && databricks workspace list "$DBA_SOURCE_CODE_PATH"
```

#### Local Testing Before Deployment
```bash
# Test locally to catch issues
./run_app_local.sh

# Debug mode
./run_app_local.sh --verbose
```

### Advanced Debugging

#### FastAPI Development
- **API Documentation**: http://localhost:8000/docs
- **OpenAPI Spec**: http://localhost:8000/openapi.json
- **Health Check**: http://localhost:8000/health

#### Frontend Development
- **Development Server**: http://localhost:5173
- **Network Tab**: Check browser dev tools for API calls
- **React Query DevTools**: Available in development mode

#### Log Files
- **Development**: `/tmp/databricks-app-watch.log`
- **Local App Test**: `/tmp/local-app-test.log`
- **Deployment**: Visit app URL + `/logz` in browser

### Reset Everything
```bash
# Nuclear option - reset everything
pkill -f watch.sh
rm -f /tmp/databricks-app-watch.pid
rm -f /tmp/databricks-app-watch.log
./setup.sh
```

## 🔒 Security & Legal

### Security
- **Security Policy**: See [SECURITY.md](SECURITY.md) for reporting vulnerabilities
- **Authentication**: Uses Databricks SDK with proper credential management
- **Environment Variables**: Stored in `.env.local` (excluded from version control)
- **Best Practices**: Follow secure coding practices in all contributions

### Legal & Licensing
- **License**: Custom Databricks license - see [LICENSE.md](LICENSE.md)
- **Code Ownership**: See [CODEOWNERS.txt](CODEOWNERS.txt) for maintainer information
- **Notice**: See [NOTICE.md](NOTICE.md) for third-party notices

### Privacy
- **Data Handling**: App runs in your Databricks workspace with your data governance
- **Credentials**: Stored locally, never transmitted except to Databricks
- **Logging**: Development logs stored locally in `/tmp/` directory

## 📚 Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Databricks Apps](https://docs.databricks.com/en/dev-tools/databricks-apps/index.html)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `./fix.sh` to format code
5. Submit a pull request

---

**Ready to build something amazing?** 🎉

Start with `./setup.sh` and let this template accelerate your Databricks app development!
