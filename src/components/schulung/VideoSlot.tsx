import { Clock, PlayCircle } from "lucide-react";

export function VideoSlot({
  videoUrl,
  title,
  pendingLabel,
}: {
  videoUrl?: string;
  title: string;
  pendingLabel: string;
}) {
  if (videoUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
        <iframe
          src={videoUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-2 text-center">
      <PlayCircle className="h-8 w-8 text-muted" />
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Clock className="h-3 w-3" />
        {pendingLabel}
      </div>
    </div>
  );
}
