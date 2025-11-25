'use client';

import { useCallback, useMemo, useState } from 'react';

export function useAttachmentUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [fileId, setFileId] = useState<string | undefined>(undefined);

  const clear = useCallback(() => {
    setImageUrl(undefined);
    setFileId(undefined);
    setIsOpen(false);
  }, []);

  return useMemo(
    () => ({
      isOpen,
      setIsOpen,
      imageUrl,
      setImageUrl,
      fileId,
      setFileId,
      clear,
    }),
    [isOpen, imageUrl, fileId, clear]
  );
}

export type UseAttachmentUploadType = ReturnType<typeof useAttachmentUpload>;
