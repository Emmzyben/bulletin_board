const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    // For now, we'll assume the user email comes from the request context or body
    // In a real implementation, this would come from Cognito authorizer
    const body = JSON.parse(event.body || '{}');
    const userEmail = body.user_email || event.requestContext?.authorizer?.claims?.email;

    if (!userEmail) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Check if user already has a subscription
    const existingSubParams = {
      TableName: process.env.SUBSCRIPTION_TABLE,
      KeyConditionExpression: 'user_email = :email',
      ExpressionAttributeValues: {
        ':email': userEmail,
      },
    };

    const existingSubCommand = new QueryCommand(existingSubParams);
    const existingResult = await docClient.send(existingSubCommand);

    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    if (existingResult.Items.length > 0 && existingResult.Items[0].plan === 'pro') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Already on Pro plan' }),
      };
    }

    if (existingResult.Items.length > 0) {
      // Update existing subscription
      const updateParams = {
        TableName: process.env.SUBSCRIPTION_TABLE,
        Key: { user_email: userEmail },
        UpdateExpression: 'SET plan = :plan, trial_started_date = :start, trial_end_date = :end',
        ExpressionAttributeValues: {
          ':plan': 'free',
          ':start': trialStartDate.toISOString(),
          ':end': trialEndDate.toISOString(),
        },
      };

      await docClient.send(new UpdateCommand(updateParams));
    } else {
      // Create new subscription
      const putParams = {
        TableName: process.env.SUBSCRIPTION_TABLE,
        Item: {
          user_email: userEmail,
          plan: 'free',
          trial_started_date: trialStartDate.toISOString(),
          trial_end_date: trialEndDate.toISOString(),
        },
      };

      await docClient.send(new PutCommand(putParams));
    }

    // Update workspace plan (assuming user owns a workspace)
    // This is simplified - in reality you'd need to find the user's workspace
    const workspaceParams = {
      TableName: process.env.WORKSPACE_TABLE,
      FilterExpression: 'owner_email = :email',
      ExpressionAttributeValues: {
        ':email': userEmail,
      },
    };

    // For simplicity, we'll skip workspace update in this demo
    // In a real implementation, you'd query and update the workspace

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      },
      body: JSON.stringify({
        success: true,
        trial_ends: trialEndDate.toISOString(),
        message: `14-day free trial started! You'll be upgraded to Pro on ${trialEndDate.toLocaleDateString()}`,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};