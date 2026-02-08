/**
 * GLM Configuration
 * Reads GLM API configuration from ~/agents/glm/config.json
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface GLMConfig {
  agent_id: string;
  agent_name: string;
  model: string;
  provider: string;
  base_url: string;
  api_key: string;
  max_tokens: number;
  temperature: number;
  supports_tools: boolean;
}

let cachedConfig: GLMConfig | null = null;

/**
 * Get GLM configuration from config.json
 */
export function getGLMConfig(): GLMConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const configPath = join(process.cwd(), '../agents/glm/config.json');
    const configData = readFileSync(configPath, 'utf8');
    cachedConfig = JSON.parse(configData);
    return cachedConfig!;
  } catch (error) {
    throw new Error(`Failed to load GLM config: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}