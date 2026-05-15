# Bulletin Board AWS Backend

This is an AWS backend implementation for the Bulletin Board application, migrated from Base44.

## Architecture

The backend consists of:

- **DynamoDB Tables**: 11 tables for storing application data
- **Lambda Functions**: 4 serverless functions
- **API Gateway**: REST API for frontend integration
- **Cognito User Pool**: User authentication and management

## DynamoDB Tables

1. **User** - User profiles and settings
2. **Workspace** - Organization workspaces
3. **Post** - Main content posts
4. **Comment** - Comments on posts
5. **Channel** - Communication channels
6. **Message** - Chat messages
7. **Vote** - Up/down votes on posts
8. **Reaction** - Emoji reactions
9. **Follow** - User following relationships
10. **SavedPost** - Saved posts by users
11. **Subscription** - User subscription plans
12. **Presence** - User presence/status
13. **B2BSpace** - B2B relationships

## Lambda Functions

1. **getPublicPosts** - Retrieve public posts
2. **startTrial** - Start a 14-day free trial
3. **checkTrialUpgrade** - Check and upgrade expired trials
4. **fetchNews** - Fetch news from RSS feeds

## API Endpoints

- `GET /posts` - Get public posts
- `POST /trial` - Start trial
- `GET /check-trial` - Check trial status
- `GET /news` - Get news feed

## Deployment

### Prerequisites

1. Install AWS CLI and configure credentials
2. Install Node.js and npm
3. Install AWS CDK CLI: `npm install -g aws-cdk`

### Deploy

1. Clone or navigate to the aws-backend directory
2. Install dependencies: `npm install`
3. Bootstrap CDK (first time only): `cdk bootstrap`
4. Deploy: `cdk deploy`

### Environment Variables

The Lambda functions use the following environment variables:
- `USER_TABLE` - DynamoDB User table name
- `POST_TABLE` - DynamoDB Post table name
- `SUBSCRIPTION_TABLE` - DynamoDB Subscription table name
- `WORKSPACE_TABLE` - DynamoDB Workspace table name

## Migration from Base44

This AWS backend replicates the functionality of the original Base44 implementation:

- **Entities**: All Base44 entities are mapped to DynamoDB tables
- **Functions**: Base44 serverless functions are converted to AWS Lambda
- **Authentication**: Base44 auth is replaced with AWS Cognito
- **Database**: Base44's built-in database is replaced with DynamoDB

## Schema Mapping

The Base44 JSON schemas have been analyzed and mapped to DynamoDB table structures:

- Primary keys use appropriate partition/sort keys
- Required fields are enforced at application level
- Default values are handled in Lambda functions
- Relationships are maintained through foreign keys

## Next Steps

1. Add authentication middleware to Lambda functions
2. Implement remaining CRUD operations for all entities
3. Add data validation and error handling
4. Set up monitoring and logging
5. Configure CORS properly for frontend integration
6. Add rate limiting and security measures