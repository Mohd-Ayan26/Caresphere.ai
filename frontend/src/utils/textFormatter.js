// src/utils/textFormatter.js — Utility to clean raw markdown symbols (** or *) for human-friendly UI presentation

/**
 * Strips raw markdown formatting symbols like **, *, or ### from plain string content
 * @param {string} text 
 * @returns {string}
 */
export function cleanMarkdownText(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Convert **bold** to clean text
    .replace(/\*(.*?)\*/g, '$1')     // Convert *italic* to clean text
    .replace(/^#+\s*/gm, '')        // Strip header signs like ###
    .replace(/```[a-z]*/g, '')      // Strip code fences
    .replace(/```/g, '');
}
