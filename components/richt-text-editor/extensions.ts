import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { all, createLowlight } from 'lowlight';
import CodeBlock from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions/placeholder';

const lowlight = createLowlight(all);

export const baseExtensions = [
  StarterKit.configure({
    codeBlock: false,
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  CodeBlock.configure({
    lowlight,
  }),
  Image,
];

export const editorExtensions = [
  ...baseExtensions,
  Placeholder.configure({
    placeholder: 'Type your message',
  }),
];
