import { Button } from '@/components/ui/button';
import { useThread } from '@/providers/ThreadProvider';
import { MessageSquareText, Pencil } from 'lucide-react';

interface toolbarProps {
  messageId: string;
  canEdit: boolean;
  onEdit: () => void;
}

export function MessageHoverToolbar({
  messageId,
  canEdit,
  onEdit,
}: toolbarProps) {

  const {toggleThread} = useThread()

  return (
    <div className="absolute -right-2 -top-3 flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-1 shadow-sm backdrop-blur transition-opacity opacity-0 group-hover:opacity-100">
      {canEdit && (
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={() => toggleThread(messageId)}>
        <MessageSquareText className="size-4" />
      </Button>
    </div>
  );
}
