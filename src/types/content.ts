import type { DramaMedia } from '../data/videoSources';
export type ContentZone = 'green' | 'adult';
export type Format = 'live_action_drama' | 'motion_comic' | 'short_film' | 'article';
export type Tier = 'free' | 'basic' | 'premium';
export type AccessTier = Tier | 'coin_reserved';
export type Publication = 'draft' | 'in_review' | 'published' | 'offline';
export interface Rating { system: string; value: string; minimum_age: number }
export interface Rights { proof_id: string; scope: string[]; regions: string[]; valid_from: string; valid_until: string }
export interface ContentBase {
  id: string; title: string; synopsis: string; tagline: string; tags: string[]; genre: string;
  content_zone: ContentZone; format: Format; age_rating: Rating | null; region_allowlist: string[];
  rights_status: 'pending' | 'verified' | 'rejected' | 'expired'; rights: Rights | null;
  series_id: string | null; publication_status: Publication;
  cover_origin?:'provided'|'concept'; cover: string; thumbnail: string; largeCover: string; ambient: string;
  access_tier: AccessTier; original: boolean; published_at: string | null;
  update_status: 'unknown' | 'ongoing' | 'completed'; is_demo: boolean;
  free_scope?: 'whole' | 'episodes' | 'limited'; free_until?: string; preview_episode_ids?: string[];
}
export interface VideoContent extends ContentBase { format: Exclude<Format,'article'>; media?: DramaMedia; body?: never }
export interface ArticleContent extends ContentBase { format: 'article'; body: string; media?: never }
export type Content = VideoContent | ArticleContent;
export interface AccessContext { zone: ContentZone; channel: 'preview'|'release'; adultGranted: boolean; region: string | null; tier: Tier; sessionVerified: boolean; verifiedRights?:readonly Rights[]; approvedSeries?:string[] }
export interface Collection { id: string; name: string; description: string; theme: string; cover: string; content_ids: string[]; updated_at: string; content_zone: ContentZone; is_demo: boolean }
export interface Campaign { id: string; title: string; description: string; content_zone: ContentZone; starts_at: string; ends_at: string; status: 'preview'|'active'|'disabled'; visibility: 'public'|'qualified'; target: string; is_demo: boolean }
export const formatLabels: Record<Format,string> = {live_action_drama:'真人短剧',motion_comic:'漫剧',short_film:'短片',article:'文章'};
export const tierLabels: Record<AccessTier,string> = {free:'免费',basic:'基础权益',premium:'高级权益',coin_reserved:'暂未开放'};
