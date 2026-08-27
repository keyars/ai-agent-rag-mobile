import { SearchResult } from '../../types';

export interface ChatOptions { system?: string; context?: SearchResult[]; }
export interface AIProvider { readonly name: string; embed(text: string): Promise<number[]>; chat(prompt: string, options?: ChatOptions): Promise<string>; }
