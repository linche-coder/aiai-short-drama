import{isDemoAvailable}from'./demoPlayback';
import type{Content}from'../types/content';
import{hasPlayableMedia}from'./media';
export const contentLabel=(item:Content)=>item.format==='article'?'阅读全文':isDemoAvailable(item)?'立即观看':hasPlayableMedia(item.media)?'立即观看':'查看详情';
export const contentCount=(items:Content[])=>items.length&&items.every(c=>c.format==='article')?`${items.length} 篇文章`:`${items.length} 部作品`;
export const availability=(item:Content)=>item.format==='article'?'文章':isDemoAvailable(item)?'可播放':hasPlayableMedia(item.media)?'片源已配置':'即将上线';
