import { NodeItem, LinkItem, FlashcardItem, FlashcardStats, Breadcrumb } from '../types';

const BASE_URL = '/api';

export const api = {
  // Nodes API
  async getNodes(): Promise<NodeItem[]> {
    const res = await fetch(`${BASE_URL}/nodes`);
    const data = await res.json();
    return data.nodes || [];
  },

  async getNode(id: string): Promise<{
    node: NodeItem;
    breadcrumbs: Breadcrumb[];
    children: NodeItem[];
    backlinks: LinkItem[];
  }> {
    const res = await fetch(`${BASE_URL}/nodes/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch node');
    return data;
  },

  async createNode(payload: {
    id?: string;
    parent_id?: string | null;
    content?: string;
    is_expanded?: boolean;
    sort_order?: number;
  }): Promise<NodeItem> {
    const res = await fetch(`${BASE_URL}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create node');
    return data.node;
  },

  async updateNode(id: string, payload: Partial<NodeItem>): Promise<NodeItem> {
    const res = await fetch(`${BASE_URL}/nodes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update node');
    return data.node;
  },

  async indentNode(id: string): Promise<{ node: NodeItem; newParentId?: string }> {
    const res = await fetch(`${BASE_URL}/nodes/${id}/indent`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!data.success && data.error) throw new Error(data.error);
    return data;
  },

  async outdentNode(id: string): Promise<{ node: NodeItem; newParentId?: string | null }> {
    const res = await fetch(`${BASE_URL}/nodes/${id}/outdent`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!data.success && data.error) throw new Error(data.error);
    return data;
  },

  async deleteNode(id: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/nodes/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to delete node');
    return data.deletedId;
  },

  async getBacklinks(id: string): Promise<LinkItem[]> {
    const res = await fetch(`${BASE_URL}/nodes/${id}/backlinks`);
    const data = await res.json();
    return data.backlinks || [];
  },

  async searchNodes(query: string): Promise<NodeItem[]> {
    const res = await fetch(`${BASE_URL}/nodes/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.results || [];
  },

  // Flashcards API
  async generateFlashcards(nodeId: string): Promise<FlashcardItem[]> {
    const res = await fetch(`${BASE_URL}/flashcards/generate/${nodeId}`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to generate flashcards');
    return data.cards || [];
  },

  async getDueFlashcards(): Promise<FlashcardItem[]> {
    const res = await fetch(`${BASE_URL}/flashcards/due`);
    const data = await res.json();
    return data.cards || [];
  },

  async getAllFlashcards(): Promise<FlashcardItem[]> {
    const res = await fetch(`${BASE_URL}/flashcards/all`);
    const data = await res.json();
    return data.cards || [];
  },

  async reviewFlashcard(cardId: string, rating: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/flashcards/${cardId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to review flashcard');
    return data.result;
  },

  async getFlashcardStats(): Promise<FlashcardStats> {
    const res = await fetch(`${BASE_URL}/flashcards/stats`);
    const data = await res.json();
    return data.stats || { totalCards: 0, dueCards: 0, masteredCards: 0 };
  }
};
