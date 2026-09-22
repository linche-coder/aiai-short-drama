import horizontalCoverManifest from '../dev/horizontalCoverManifest.json';

const covers=import.meta.glob('../dev/assets/landscape/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;

export const adultBanners=horizontalCoverManifest.slice(0,6).map(item=>({
 id:item.id,
 title:item.title,
 image:covers[`../dev/assets/landscape/${item.asset}`],
 genre:'成人短剧',
 synopsis:'',
 focus:'center',
}));
