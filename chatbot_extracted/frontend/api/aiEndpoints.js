/**
 * Annadhara AI — Frontend API Endpoints Definition
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * This snippet defines the API calls required by the Annadhara AI Chatbot.
 * To integrate into the original Annadhara project, copy this object into
 * your existing `src/api/endpoints.js` (or `client/src/api/endpoints.js`) file.
 */

import api from './axios';

export const aiApi = {
  /**
   * Send a message to the AI Chatbot
   * @param {Object} data - { message, conversationId, language, conversationHistory }
   * @param {string} [role] - Optional simulated role header for test studio ('DONOR'|'RECIPIENT'|'VOLUNTEER'|'ADMIN')
   */
  chat: (data, role) =>
    api.post('/ai/chat', data, {
      headers: role ? { 'x-test-role': role } : {},
    }),

  /**
   * Get assistant service status, LLM model info, and quota/rate-limit metadata
   */
  getStatus: () => api.get('/ai/status'),

  /**
   * Retrieve multi-turn conversation list for the authenticated user
   * @param {string} [role] - Optional simulated role header
   */
  getConversations: (role) =>
    api.get('/ai/conversations', {
      headers: role ? { 'x-test-role': role } : {},
    }),

  /**
   * Retrieve full messages of a specific conversation
   * @param {string} id - Conversation ID
   * @param {string} [role] - Optional simulated role header
   */
  getConversationById: (id, role) =>
    api.get(`/ai/conversations/${id}`, {
      headers: role ? { 'x-test-role': role } : {},
    }),

  /**
   * Delete a conversation
   * @param {string} id - Conversation ID
   * @param {string} [role] - Optional simulated role header
   */
  deleteConversation: (id, role) =>
    api.delete(`/ai/conversations/${id}`, {
      headers: role ? { 'x-test-role': role } : {},
    }),
};

export default aiApi;
