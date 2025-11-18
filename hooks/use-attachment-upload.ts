'use client';

import { useMemo, useState } from 'react';

export function useAttachmentUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [fileId, setFileId] = useState<string | undefined>(undefined);

  return useMemo(
    () => ({
      isOpen,
      setIsOpen,
      imageUrl,
      setImageUrl,
      fileId,
      setFileId,
    }),
    [isOpen, setIsOpen, imageUrl, setImageUrl, fileId, setFileId]
  );
}

export type UseAttachmentUploadType = ReturnType<typeof useAttachmentUpload>;
