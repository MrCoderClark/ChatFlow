'use client';

import { useMemo, useState } from 'react';

export function useAttachmentUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  return useMemo(
    () => ({
      isOpen,
      setIsOpen,
      imageUrl,
      setImageUrl,
    }),
    [isOpen, setIsOpen, imageUrl, setImageUrl]
  );
}

export type UseAttachmentUploadType = ReturnType<typeof useAttachmentUpload>;
