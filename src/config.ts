export const timing = { intro: 4000, logoMoveAt: 2100, logoMoveDuration: 1150, carousel: 5000, carouselMove: 440, reducedIntro: 220, results: 420, searchDebounce: 180, modalClose: 260 };
export interface AdConfig { id: string; enabled: boolean; title: string; subtitle: string; image?: string; href?: string; mode: 'placeholder' | 'image' }
export const ads: AdConfig[] = [
  { id: 'home-top', enabled: true, title: '品牌合作展示位', subtitle: '让精彩故事，遇见更多可能', mode: 'placeholder' },
  { id: 'home-middle', enabled: false, title: '品牌合作展示位', subtitle: '与好故事，一同被看见', mode: 'placeholder' },
];
