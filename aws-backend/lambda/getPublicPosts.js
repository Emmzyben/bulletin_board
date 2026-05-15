const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    // Get posts sorted by created_date descending
    const params = {
      TableName: process.env.POST_TABLE,
      ScanIndexForward: false, // Sort descending
      Limit: 50,
    };

    const command = new ScanCommand(params);
    const result = await docClient.send(command);

    // Transform items to match expected format
    const posts = result.Items.map(item => ({
      id: item.id,
      title: item.title,
      body: item.body,
      flair: item.flair,
      ecosystem: item.ecosystem,
      image_url: item.image_url,
      upvotes: item.upvotes || 0,
      downvotes: item.downvotes || 0,
      vote_score: item.vote_score || 0,
      author_name: item.author_name,
      author_email: item.author_email,
      comment_count: item.comment_count || 0,
      poll_options: item.poll_options || [],
      saves_count: item.saves_count || 0,
      created_date: item.created_date,
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      },
      body: JSON.stringify({ posts }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};