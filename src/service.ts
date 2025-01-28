// 导入所需类型
import { QAPairNode, NodeID } from './qa-models';

// 定义请求参数接口
interface AIRequestConfig {
  apiUrl: string;
  modelName: string;
  apiKey?: string;
}

// 定义请求响应接口
interface AIResponse {
  message: {
    content: string;
  };
}

export class AIService {
  private static instance: AIService;
  private config: AIRequestConfig | null = null;

  private constructor() {
    // 从本地存储加载配置
    this.loadConfig();
  }

  // 单例模式获取实例
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // 从本地存储加载配置
  private loadConfig(): void {
    const configKey = localStorage.getItem('currentConfig');
    if (configKey) {
      const config = localStorage.getItem(`config_${configKey}`);
      if (config) {
        this.config = JSON.parse(config);
      }
    }
  }

  // 更新配置
  public updateConfig(config: AIRequestConfig): void {
    this.config = config;
  }

  // 发送请求到 AI 服务
  public async sendRequest(question: string): Promise<string> {
    if (!this.config) {
      throw new Error('未配置 AI 服务参数');
    }

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          model: this.config.modelName,
          messages: [
            {
              role: "user",
              content: question
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI 服务请求失败: ${response.status} ${errorText}`);
      }

      const data: AIResponse = await response.json();
      return data.message.content;

    } catch (error) {
      console.error('AI 服务请求错误:', error);
      throw error;
    }
  }

  // 获取所有保存的配置
  public getStoredConfigs(): Record<string, AIRequestConfig> {
    const configs: Record<string, AIRequestConfig> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('config_')) {
        const config = localStorage.getItem(key);
        if (config) {
          configs[key.replace('config_', '')] = JSON.parse(config);
        }
      }
    }
    return configs;
  }

  // 保存新配置
  public saveConfig(name: string, config: AIRequestConfig): void {
    localStorage.setItem(`config_${name}`, JSON.stringify(config));
    localStorage.setItem('currentConfig', name);
    this.config = config;
  }

  // 删除配置
  public deleteConfig(name: string): void {
    localStorage.removeItem(`config_${name}`);
    if (localStorage.getItem('currentConfig') === name) {
      localStorage.removeItem('currentConfig');
      this.config = null;
    }
  }

  // 清除所有配置
  public clearAllConfigs(): void {
    const keys = Object.keys(this.getStoredConfigs());
    keys.forEach(key => {
      localStorage.removeItem(`config_${key}`);
    });
    localStorage.removeItem('currentConfig');
    this.config = null;
  }
}

// 导出单例实例
export const aiService = AIService.getInstance();