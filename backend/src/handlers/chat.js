const { LLMService } = require('../services/llm');
const { LoggingService } = require('../services/logging');

const llmService = new LLMService();
const loggingService = new LoggingService();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

exports.health = async (event, context) => {
  try {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    await loggingService.logError('health-check-error', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error'
      })
    };
  }
};

exports.chat = async (event, context) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    // Validate request
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Request body is required'
        })
      };
    }

    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Invalid JSON in request body'
        })
      };
    }

    const { message, userId } = requestBody;

    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Message is required and must be a string'
        })
      };
    }

    // Log interaction start
    await loggingService.logInteraction({
      userId: userId || 'anonymous',
      message,
      timestamp: new Date().toISOString(),
      type: 'user_message'
    });

    // Process chat message with LLM
    const response = await llmService.processMessage(message, userId);

    // Log interaction response
    await loggingService.logInteraction({
      userId: userId || 'anonymous',
      message: response,
      timestamp: new Date().toISOString(),
      type: 'assistant_response'
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        response,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    await loggingService.logError('chat-processing-error', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to process chat message'
      })
    };
  }
};