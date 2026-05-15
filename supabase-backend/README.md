# Bulletin Board Supabase Backend

This is a Supabase backend implementation for the Bulletin Board application, migrated from Base44.

## Architecture

The backend consists of:

- **PostgreSQL Database**: 13 tables for storing application data
- **Edge Functions**: 4 serverless functions (equivalent to AWS Lambda)
- **Authentication**: Supabase Auth for user management
- **Real-time**: Built-in real-time subscriptions
- **Storage**: File storage capabilities

## Database Tables

Based on the Base44 entity schema analysis, the following PostgreSQL tables are created:

1. **users** - User profiles and settings
2. **workspaces** - Organization workspaces
3. **posts** - Main content posts
4. **comments** - Comments on posts
5. **channels** - Communication channels
6. **messages** - Chat messages
7. **votes** - Up/down votes on posts
8. **reactions** - Emoji reactions
9. **follows** - User following relationships
10. **saved_posts** - Saved posts by users
11. **subscriptions** - User subscription plans
12. **presence** - User presence/status
13. **b2b_spaces** - B2B relationships

## Edge Functions

1. **get-public-posts** - Retrieve public posts ordered by creation date
2. **start-trial** - Start a 14-day free trial for users
3. **check-trial-upgrade** - Check and upgrade expired trials
4. **fetch-news** - Parse RSS feeds from BBC and NY Times

## API Endpoints

- `POST /functions/v1/get-public-posts` - Get public posts
- `POST /functions/v1/start-trial` - Start trial
- `POST /functions/v1/check-trial-upgrade` - Check trial status
- `POST /functions/v1/fetch-news` - Get news feed

## Setup Instructions

### Prerequisites

1. **Install Docker Desktop** (required for local development):
   - Download from: https://docs.docker.com/desktop/install/windows-install/
   - Start Docker Desktop after installation

2. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

### Local Development

1. **Start Supabase locally**:
   ```bash
   npm run dev
   # or
   npx supabase start
   ```

2. **Reset database** (if needed):
   ```bash
   npm run reset
   ```

3. **Generate TypeScript types**:
   ```bash
   npm run generate-types
   ```

4. **Type checking**:
   ```bash
   npm run type-check
   ```

1. Install Supabase CLI: `npm install -g supabase`
2. Create a Supabase account at [supabase.com](https://supabase.com)
3. Install Node.js and npm

### Local Development Setup

1. **Clone/Navigate to the project:**
   ```bash
   cd supabase-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Login to Supabase:**
   ```bash
   supabase login
   ```

4. **Initialize Supabase project:**
   ```bash
   supabase init
   ```

5. **Start local development server:**
   ```bash
   npm run dev
   ```

   This will start:
   - PostgreSQL database on port 54322
   - Supabase API on port 54321
   - Supabase Studio on port 54323
   - Inbucket (email testing) on port 54324

6. **Run database migrations:**
   ```bash
   supabase db reset
   ```

7. **Deploy edge functions locally:**
   ```bash
   supabase functions serve
   ```

### Production Deployment

1. **Create a new Supabase project:**
   ```bash
   supabase projects create bulletin-board
   ```

2. **Link to your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Push database schema:**
   ```bash
   supabase db push
   ```

4. **Deploy edge functions:**
   ```bash
   supabase functions deploy get-public-posts
   supabase functions deploy start-trial
   supabase functions deploy check-trial-upgrade
   supabase functions deploy fetch-news
   ```

## Environment Variables

The edge functions automatically have access to:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Database Schema Features

- **UUID Primary Keys**: Using `uuid_generate_v4()` for unique identifiers
- **Foreign Key Relationships**: Proper referential integrity
- **Indexes**: Optimized for common query patterns
- **Row Level Security (RLS)**: Basic security policies implemented
- **Triggers**: Automatic `updated_at` timestamp updates
- **JSONB Fields**: For flexible data like poll options and reactions

## Migration from Base44

This Supabase backend replicates the functionality of the original Base44 implementation:

- **Entities**: All Base44 entities mapped to PostgreSQL tables
- **Functions**: Base44 serverless functions converted to Supabase Edge Functions
- **Authentication**: Base44 auth replaced with Supabase Auth
- **Database**: Base44's built-in database replaced with PostgreSQL
- **Real-time**: Added real-time capabilities for live features

## Key Differences from AWS Implementation

- **Database**: DynamoDB → PostgreSQL (relational)
- **Functions**: AWS Lambda → Supabase Edge Functions (Deno runtime)
- **Auth**: AWS Cognito → Supabase Auth
- **Real-time**: Not available in AWS → Built-in with Supabase
- **File Storage**: AWS S3 → Supabase Storage

## Development Workflow

1. **Make schema changes:** Edit migration files in `supabase/migrations/`
2. **Update functions:** Modify TypeScript files in `supabase/functions/`
3. **Test locally:** Use `supabase start` and test with your frontend
4. **Deploy:** Push changes to Supabase with `supabase db push` and `supabase functions deploy`

## Next Steps

1. **Customize RLS Policies**: Implement proper access control based on your requirements
2. **Add Real-time Subscriptions**: Enable live updates for posts, comments, etc.
3. **Implement File Uploads**: Use Supabase Storage for images and attachments
4. **Add Database Functions**: Create stored procedures for complex operations
5. **Set up Monitoring**: Configure logging and error tracking
6. **Add API Documentation**: Document all available endpoints and their usage