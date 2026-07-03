class LLMService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.maxTokens = parseInt(process.env.MAX_TOKENS) || 150;
    this.temperature = parseFloat(process.env.TEMPERATURE) || 0.7;
  }

  async processMessage(message, userId = null) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated from LLM');
      }

      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('LLM processing error:', error);
      throw new Error(`Failed to process message: ${error.message}`);
    }
  }

  async validateConfiguration() {
    return {
      hasApiKey: !!this.apiKey,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature
    };
  }
}

module.exports = { LLMService };