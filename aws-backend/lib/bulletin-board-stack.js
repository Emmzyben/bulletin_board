const { Stack, Duration } = require('aws-cdk-lib');
const { Table, AttributeType, BillingMode } = require('aws-cdk-lib/aws-dynamodb');
const { Function, Runtime, Code } = require('aws-cdk-lib/aws-lambda');
const { RestApi, LambdaIntegration } = require('aws-cdk-lib/aws-apigateway');
const { UserPool, UserPoolClient } = require('aws-cdk-lib/aws-cognito');

class BulletinBoardStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // DynamoDB Tables
    const tables = {};

    // User table
    tables.User = new Table(this, 'UserTable', {
      tableName: 'BulletinBoard-User',
      partitionKey: { name: 'email', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Workspace table
    tables.Workspace = new Table(this, 'WorkspaceTable', {
      tableName: 'BulletinBoard-Workspace',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Post table
    tables.Post = new Table(this, 'PostTable', {
      tableName: 'BulletinBoard-Post',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      sortKey: { name: 'created_date', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Comment table
    tables.Comment = new Table(this, 'CommentTable', {
      tableName: 'BulletinBoard-Comment',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      sortKey: { name: 'created_date', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Channel table
    tables.Channel = new Table(this, 'ChannelTable', {
      tableName: 'BulletinBoard-Channel',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Message table
    tables.Message = new Table(this, 'MessageTable', {
      tableName: 'BulletinBoard-Message',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      sortKey: { name: 'created_date', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Vote table
    tables.Vote = new Table(this, 'VoteTable', {
      tableName: 'BulletinBoard-Vote',
      partitionKey: { name: 'post_id', type: AttributeType.STRING },
      sortKey: { name: 'voter_email', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Reaction table
    tables.Reaction = new Table(this, 'ReactionTable', {
      tableName: 'BulletinBoard-Reaction',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Follow table
    tables.Follow = new Table(this, 'FollowTable', {
      tableName: 'BulletinBoard-Follow',
      partitionKey: { name: 'follower_email', type: AttributeType.STRING },
      sortKey: { name: 'following_email', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // SavedPost table
    tables.SavedPost = new Table(this, 'SavedPostTable', {
      tableName: 'BulletinBoard-SavedPost',
      partitionKey: { name: 'user_email', type: AttributeType.STRING },
      sortKey: { name: 'post_id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Subscription table
    tables.Subscription = new Table(this, 'SubscriptionTable', {
      tableName: 'BulletinBoard-Subscription',
      partitionKey: { name: 'user_email', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Presence table
    tables.Presence = new Table(this, 'PresenceTable', {
      tableName: 'BulletinBoard-Presence',
      partitionKey: { name: 'user_email', type: AttributeType.STRING },
      sortKey: { name: 'workspace_id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // B2BSpace table
    tables.B2BSpace = new Table(this, 'B2BSpaceTable', {
      tableName: 'BulletinBoard-B2BSpace',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Cognito User Pool
    const userPool = new UserPool(this, 'BulletinBoardUserPool', {
      userPoolName: 'BulletinBoardUserPool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
      },
    });

    const userPoolClient = new UserPoolClient(this, 'BulletinBoardUserPoolClient', {
      userPool,
      generateSecret: false,
    });

    // Lambda Functions
    const lambdaFunctions = {};

    // getPublicPosts function
    lambdaFunctions.getPublicPosts = new Function(this, 'GetPublicPostsFunction', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lambda'),
      handler: 'getPublicPosts.handler',
      timeout: Duration.seconds(30),
      environment: {
        USER_TABLE: tables.User.tableName,
        POST_TABLE: tables.Post.tableName,
      },
    });

    // startTrial function
    lambdaFunctions.startTrial = new Function(this, 'StartTrialFunction', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lambda'),
      handler: 'startTrial.handler',
      timeout: Duration.seconds(30),
      environment: {
        SUBSCRIPTION_TABLE: tables.Subscription.tableName,
        WORKSPACE_TABLE: tables.Workspace.tableName,
      },
    });

    // checkTrialUpgrade function
    lambdaFunctions.checkTrialUpgrade = new Function(this, 'CheckTrialUpgradeFunction', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lambda'),
      handler: 'checkTrialUpgrade.handler',
      timeout: Duration.seconds(30),
      environment: {
        SUBSCRIPTION_TABLE: tables.Subscription.tableName,
        WORKSPACE_TABLE: tables.Workspace.tableName,
      },
    });

    // fetchNews function
    lambdaFunctions.fetchNews = new Function(this, 'FetchNewsFunction', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lambda'),
      handler: 'fetchNews.handler',
      timeout: Duration.seconds(30),
    });

    // Grant permissions
    Object.values(tables).forEach(table => {
      Object.values(lambdaFunctions).forEach(func => {
        table.grantReadWriteData(func);
      });
    });

    // API Gateway
    const api = new RestApi(this, 'BulletinBoardApi', {
      restApiName: 'BulletinBoardApi',
      description: 'API for Bulletin Board application',
    });

    // API Routes
    const postsResource = api.root.addResource('posts');
    postsResource.addMethod('GET', new LambdaIntegration(lambdaFunctions.getPublicPosts));

    const trialResource = api.root.addResource('trial');
    trialResource.addMethod('POST', new LambdaIntegration(lambdaFunctions.startTrial));

    const checkTrialResource = api.root.addResource('check-trial');
    checkTrialResource.addMethod('GET', new LambdaIntegration(lambdaFunctions.checkTrialUpgrade));

    const newsResource = api.root.addResource('news');
    newsResource.addMethod('GET', new LambdaIntegration(lambdaFunctions.fetchNews));

    // Outputs
    this.apiUrl = api.url;
    this.userPoolId = userPool.userPoolId;
    this.userPoolClientId = userPoolClient.userPoolClientId;
  }
}

module.exports = { BulletinBoardStack };