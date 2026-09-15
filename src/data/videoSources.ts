/** Formal, authorized drama media only. Internal test clips are separate in demoPlayback.ts. */
export interface VideoSource { src: string; type?: string }
export interface Episode { id: string; title: string; sources: VideoSource[] }
export interface DramaMedia { sources?: VideoSource[]; episodes?: Episode[] }
export const videoSources: Record<string, DramaMedia> = {};
