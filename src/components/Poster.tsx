import { memo, useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { Drama } from '../data/dramas';
export const Poster = memo(function Poster({ drama, priority = false, small = false }: { drama: Drama; priority?: boolean; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  const large = `/assets/covers/${drama.id}-large.webp`;
  return <span className="poster-image">{failed ? <span className="image-fallback"><ImageOff size={26} /><span>{drama.title}</span><small>封面暂不可用</small></span> : <img src={small ? drama.cover : large} srcSet={small ? `${drama.thumbnail} 300w, ${drama.cover} 540w, ${large} 651w` : undefined} sizes={small ? '(max-width: 540px) 45vw, (max-width: 900px) 30vw, 260px' : undefined} alt={`${drama.title}封面`} width="651" height="868" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" onError={() => setFailed(true)} />}</span>;
});
