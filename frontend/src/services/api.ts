const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  message: string;
}

interface HealthResponse {
  status: string;
}

interface ApiError {
  error: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/');
  }

  async sendChatMessage(message: string): Promise<ChatResponse> {
    const requestBody: ChatRequest = { message };
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }
}

const apiClient = new ApiClient();

export const healthCheck = () => apiClient.healthCheck();
export const sendChatMessage = (message: string) => apiClient.sendChatMessage(message);

export default apiClient;