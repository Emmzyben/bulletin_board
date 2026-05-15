const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    // Get user email from request
    const body = JSON.parse(event.body || '{}');
    const userEmail = body.user_email || event.requestContext?.authorizer?.claims?.email;

    if (!userEmail) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Get user subscription
    const subParams = {
      TableName: process.env.SUBSCRIPTION_TABLE,
      KeyConditionExpression: 'user_email = :email',
      ExpressionAttributeValues: {
        ':email': userEmail,
      },
    };

    const subCommand = new QueryCommand(subParams);
    const subResult = await docClient.send(subCommand);

    if (!subResult.Items.length) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        },
        body: JSON.stringify({ plan: 'free', trial_active: false }),
      };
    }

    const sub = subResult.Items[0];
    const now = new Date();
    const trialEndDate = sub.trial_end_date ? new Date(sub.trial_end_date) : null;

    // If trial has expired and plan is still "free", upgrade to pro
    if (trialEndDate && now >= trialEndDate && sub.plan === 'free') {
      const updateParams = {
        TableName: process.env.SUBSCRIPTION_TABLE,
        Key: { user_email: userEmail },
        UpdateExpression: 'SET plan = :plan, pro_since_date = :proDate',
        ExpressionAttributeValues: {
          ':plan': 'pro',
          ':proDate': now.toISOString(),
        },
      };

      await docClient.send(new UpdateCommand(updateParams));

      // Update workspace (simplified)
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        },
        body: JSON.stringify({
          plan: 'pro',
          trial_active: false,
          upgraded: true,
          message: 'Trial ended - you\'ve been upgraded to Pro!',
        }),
      };
    }

    // Return current status
    const daysLeft = trialEndDate ? Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)) : 0;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      },
      body: JSON.stringify({
        plan: sub.plan,
        trial_active: sub.plan === 'free' && daysLeft > 0,
        days_left: Math.max(0, daysLeft),
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