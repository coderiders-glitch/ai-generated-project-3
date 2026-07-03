const AWS = require('aws-sdk');

class LoggingService {
  constructor() {
    this.dynamodb = new AWS.DynamoDB.DocumentClient();
    this.tableName = process.env.INTERACTION_LOGS_TABLE || 'InteractionLogs';
    this.enableCloudWatch = process.env.ENABLE_CLOUDWATCH_LOGS === 'true';
  }

  async logInteraction(interactionData) {
    try {
      const logEntry = {
        id: this.generateId(),
        userId: interactionData.userId || 'anonymous',
        message: interactionData.message,
        timestamp: interactionData.timestamp || new Date().toISOString(),
        type: interactionData.type || 'unknown',
        metadata: interactionData.metadata || {}
      };

      // Log to DynamoDB
      await this.dynamodb.put({
        TableName: this.tableName,
        Item: logEntry
      }).promise();

      // Log to CloudWatch if enabled
      if (this.enableCloudWatch) {
        console.log('Interaction logged:', JSON.stringify(logEntry));
      }

      return logEntry.id;

    } catch (error) {
      console.error('Failed to log interaction:', error);
      // Don't throw - logging failures shouldn't break the main flow
      return null;
    }
  }

  async logError(errorType, error, context = {}) {
    try {
      const errorEntry = {
        id: this.generateId(),
        errorType,
        message: error.message || 'Unknown error',
        stack: error.stack,
        timestamp: new Date().toISOString(),
        context
      };

      // Log to DynamoDB
      await this.dynamodb.put({
        TableName: this.tableName,
        Item: {
          ...errorEntry,
          type: 'error'
        }
      }).promise();

      // Always log errors to CloudWatch
      console.error('Error logged:', JSON.stringify(errorEntry));

    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
      console.error('Original error:', error);
    }
  }

  async getInteractionHistory(userId, limit = 50) {
    try {
      const params = {
        TableName: this.tableName,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        Limit: limit,
        ScanIndexForward: false // Most recent first
      };

      const result = await this.dynamodb.scan(params).promise();
      return result.Items || [];

    } catch (error) {
      console.error('Failed to retrieve interaction history:', error);
      return [];
    }
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = { LoggingService };