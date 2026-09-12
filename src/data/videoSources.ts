/** Configure only actual, authorized drama media here. No demo media is shipped. */
export interface VideoSource { src: string; type?: string }
export interface Episode { id: string; title: string; sources: VideoSource[] }
export interface DramaMedia { sources?: VideoSource[]; episodes?: Episode[] }
export const videoSources: Record<string, DramaMedia> = {};
