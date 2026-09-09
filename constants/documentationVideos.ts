/** YouTube video ID for the general introduction. */
export const DOCUMENTATION_GENERAL_INTRODUCTION_YOUTUBE_ID = "Ac95jJ7KyZE";

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export type DocumentationVideoKey = "generalIntroduction";

export type DocumentationVideo = {
  key: DocumentationVideoKey;
  youtubeId: string;
};

export const DOCUMENTATION_VIDEOS: DocumentationVideo[] = [
  {
    key: "generalIntroduction",
    youtubeId: DOCUMENTATION_GENERAL_INTRODUCTION_YOUTUBE_ID,
  },
];
