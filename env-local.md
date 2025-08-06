# Local Environment Setup

Create a `.env` file in your project root with:

```
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_SECRET_KEY=your_supabase_anon_key

# R2 Worker Configuration
REACT_APP_R2_WORKER_URL=https://wedding-photos-r2-worker.nate-huse1023.workers.dev
```

## Steps:
1. Create a `.env` file in your project root
2. Add the above content
3. Replace the Supabase URLs with your actual values
4. Restart your development server

The worker URL is already correct in the code, but you need the environment variable for local development. 