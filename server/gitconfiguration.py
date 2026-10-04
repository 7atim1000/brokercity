# git init
# git status #

# Step 2: Create .gitignore in Your Project Root
# 1. Create .gitignore
# New-Item .gitignore -ItemType File

# # 2. Open it in Notepad (or your editor of choice)
# notepad .gitignore
# and COPY next : 
# # ============================================
# # ENVIRONMENT VARIABLES
# # ============================================
# .env
# .env.*
# !.env.example
# *.env

# # ============================================
# # PYTHON / DJANGO
# # ============================================
# __pycache__/
# *.py[cod]
# *$py.class
# *.so
# .Python
# venv/
# env/
# ENV/
# .venv/
# build/
# develop-eggs/
# dist/
# downloads/
# eggs/
# .eggs/
# lib/
# lib64/
# parts/
# sdist/
# var/
# wheels/
# *.egg-info/
# .installed.cfg
# *.egg
# pip-log.txt
# pip-delete-this-directory.txt
# .pytest_cache/
# .coverage
# htmlcov/
# .tox/
# .mypy_cache/
# db.sqlite3
# db.sqlite3-journal
# /staticfiles/
# /media/
# /logs/
# *.log

# # ============================================
# # NODE / REACT
# # ============================================
# node_modules/
# npm-debug.log*
# yarn-debug.log*
# yarn-error.log*
# pnpm-debug.log*
# .pnpm-store/
# dist/
# build/
# .vite/
# .cache/
# .parcel-cache/

# # ============================================
# # EDITORS / OS
# # ============================================
# .vscode/
# .idea/
# *.swp
# *.swo
# .DS_Store
# Thumbs.db
# desktop.ini

# # ============================================
# # MISC
# # ============================================
# *.bak
# *.tmp
# *.orig

# Verify .env is protected:

# powershell
# git check-ignore -v .env

############################################
# Then continue
# git add .
# git diff --cached --name-only   # make sure .env is NOT listed
# git commit -m "Initial commit"
# git branch -M main
# git remote add origin https://github.com/yourusername/your-repo.git
# git push -u origin main