import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import type { AdConfig } from '../config';
export function AdSlot({ config }: { config: AdConfig }) {
  const [failed, setFailed] = useState(false);
  if (!config.enabled) return null;
  const validHref = config.href && /^https?:\/\//i.test(config.href) ? config.href : undefined;
  const content = <><span className="ad-mark">广告</span>{config.mode === 'image' && config.image && !failed ? <img className="ad-image" src={config.image} alt={config.title} onError={() => setFailed(true)} /> : <><div className="ad-copy"><span className="ad-eyebrow">BRAND PARTNERSHIP</span><strong>{config.title}</strong><span className="ad-subtitle">{config.subtitle}</span></div><span className="ad-art" aria-hidden="true"><i /><i /><i /></span></>}{validHref && <ArrowUpRight className="ad-link-icon" size={20} />}</>;
  return <aside className="ad-slot" aria-label={`${config.title}，广告`} data-ad-slot={config.id}>{validHref ? <a href={validHref} target="_blank" rel="noopener noreferrer">{content}</a> : <div className="ad-placeholder">{content}</div>}</aside>;
}
