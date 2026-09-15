import type { DramaMedia, VideoSource } from './videoSources';

export const usableSources = (sources?: VideoSource[]) => sources?.filter(source => !!source.src.trim()) ?? [];
export const playableEpisodes = (media?: DramaMedia) => media?.episodes?.filter(episode => episode.id && episode.title && usableSources(episode.sources).length > 0) ?? [];
export const hasPlayableMedia = (media?: DramaMedia) => playableEpisodes(media).length > 0 || usableSources(media?.sources).length > 0;
export const watchLabel = (media?: DramaMedia) => hasPlayableMedia(media) ? '立即观看' : '查看详情';
