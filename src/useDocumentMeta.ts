import { useEffect } from 'react';

type DocumentMeta = { title: string; description: string };

export default function useDocumentMeta({ title, description }: DocumentMeta) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    const previousTitle = document.title;
    const previousDescription = meta?.content;
    document.title = title;
    if (meta) {
      meta.content = description;
    }
    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== undefined) {
        meta.content = previousDescription;
      }
    };
  }, [title, description]);
}
