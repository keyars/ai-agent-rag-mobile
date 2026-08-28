import { AIProvider, ChatOptions } from './types';
import { ToolAwareAIProvider, ToolAwareChatOptions, ToolAwareChatResult } from './tool_types';

interface ResponsesFunctionCall {
  type?: string;
  id?: string;
  call_id?: string;
  name?: string;
  arguments?: string;
}

interface ResponsesPayload {
  id?: string;
  output_text?: string;
  output?: ResponsesFunctionCall[];
}

export class OpenAIProvider implements AIProvider, ToolAwareAIProvider {
  readonly name = 'openai';

  constructor(
    private readonly apiKey: string,
    private readonly model = 'gpt-5.6-luna',
    private readonly embeddingModel = 'text-embedding-3-small',
  ) {}

  async embed(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: this.embeddingModel, input: text }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI embeddings failed (${response.status}).`);
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };
    const vector = data.data?.[0]?.embedding;
    if (!vector) throw new Error('OpenAI returned no embedding.');
    return vector;
  }

  async chat(prompt: string, options: ChatOptions = {}): Promise<string> {
    const result = await this.request(prompt, { system: options.system });
    if (result.text) return result.text;
    throw new Error('OpenAI returned no text.');
  }

  async chatWithTools(
    prompt: string,
    options: ToolAwareChatOptions = {},
  ): Promise<ToolAwareChatResult> {
    return this.request(prompt, options);
  }

  private async request(
    prompt: string,
    options: ToolAwareChatOptions = {},
  ): Promise<ToolAwareChatResult> {
    const tools = options.tools?.map((tool) => ({
      type: 'function',
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      strict: true,
    }));

    const input = options.toolOutputs?.map((toolOutput) => ({
      type: 'function_call_output',
      call_id: toolOutput.toolCallId,
      output: toolOutput.output,
    })) ?? options.prompt ?? prompt;

    const body: Record<string, unknown> = {
      model: this.model,
      instructions: options.system,
      input,
      tools,
      tool_choice: options.toolChoice,
    };

    if (options.previousResponseId) {
      body.previous_response_id = options.previousResponseId;
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI response failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as ResponsesPayload;
    if (!data.id) throw new Error('OpenAI returned no response id.');

    const toolCalls = (data.output ?? [])
      .filter((item) => item.type === 'function_call' && item.name)
      .map((item) => {
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(item.arguments ?? '{}') as Record<string, unknown>;
        } catch {
          throw new Error(`OpenAI returned invalid arguments for tool ${item.name}.`);
        }
        return {
          id: item.call_id ?? item.id ?? `call_${Date.now()}`,
          name: item.name!,
          arguments: args,
        };
      });

    return {
      responseId: data.id,
      text: data.output_text || undefined,
      toolCalls,
    };
  }
}
