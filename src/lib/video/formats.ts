export interface VideoFormat {
  key: string;
  label: string;
  ratio: string;
  width: number;
  height: number;
  platforms: string[];
}

export const VIDEO_FORMATS: VideoFormat[] = [
  {
    key: "vertical",
    label: "Vertikal",
    ratio: "9:16",
    width: 1080,
    height: 1920,
    platforms: ["TikTok", "Instagram Reels", "YouTube Shorts"],
  },
  {
    key: "horizontal",
    label: "Horizontal",
    ratio: "16:9",
    width: 1920,
    height: 1080,
    platforms: ["YouTube", "Website"],
  },
  {
    key: "square",
    label: "Quadratisch",
    ratio: "1:1",
    width: 1080,
    height: 1080,
    platforms: ["Social Posts"],
  },
  {
    key: "feed",
    label: "Feed",
    ratio: "4:5",
    width: 1080,
    height: 1350,
    platforms: ["Instagram Feed"],
  },
];

export function formatForPlatform(platform: string): VideoFormat {
  const match = VIDEO_FORMATS.find((f) =>
    f.platforms.some((p) => p.toLowerCase().includes(platform.toLowerCase()))
  );
  return match ?? VIDEO_FORMATS[0];
}
