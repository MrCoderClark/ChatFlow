import { baseExtensions } from '@/components/richt-text-editor/extensions';
import { generateHTML, type JSONContent } from '@tiptap/react';

export function convertJsonToHtml(jsonContent: JSONContent | string | null | undefined): string {
  // Gracefully handle empty / null / undefined content
  if (jsonContent == null) {
    return '';
  }

  if (typeof jsonContent === 'string' && jsonContent.trim() === '') {
    return '';
  }

  try {
    const content =
      typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;

    return generateHTML(content, baseExtensions);
  } catch {
    // Silently ignore invalid JSON and render nothing instead of spamming errors
    return '';
  }
}
