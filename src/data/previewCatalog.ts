import type {Content, Collection, Campaign} from '../types/content';
// Restored from the pre-M4 local snapshot. Editorial metadata remains preview-only.
const entries=[
  {
    "n": 5,
    "title": "凋零前，请对我偏执",
    "genre": "古装",
    "tagline": "一纸姻缘，将两个人的命运悄然牵起。"
  },
  {
    "n": 8,
    "title": "月色不晚",
    "genre": "都市情感",
    "tagline": "把未说出口的心事，交给今晚的月色。"
  },
  {
    "n": 3,
    "title": "盖世雄父",
    "genre": "热血逆袭",
    "tagline": "平凡身份之下，藏着不平凡的守护。"
  },
  {
    "n": 17,
    "title": "兽世重生：这次换我疼你",
    "genre": "奇幻",
    "tagline": "跨越陌生世界，再一次奔向你。"
  },
  {
    "n": 4,
    "title": "一日一载，武定乾坤",
    "genre": "热血逆袭",
    "tagline": "于方寸之间，见少年意气与江湖风云。"
  },
  {
    "n": 14,
    "title": "油门踩到底！废柴车神逆袭",
    "genre": "热血逆袭",
    "tagline": "握紧方向盘，驶向属于自己的答案。"
  },
  {
    "n": 15,
    "title": "皇帝微服出巡捡旧爱",
    "genre": "古装",
    "tagline": "走出宫墙，一场意料之外的相逢。"
  },
  {
    "n": 23,
    "title": "辣妈翻身：陆长官的强制爱",
    "genre": "都市情感",
    "tagline": "生活翻开新页，也让心动重新发生。"
  },
  {
    "n": 26,
    "title": "我家古董会说爱你",
    "genre": "奇幻",
    "tagline": "旧物藏着时光，也藏着未完的故事。"
  },
  {
    "n": 27,
    "title": "拒当顾太太后，我惊艳全城",
    "genre": "都市情感",
    "tagline": "从告别开始，找回闪闪发光的自己。"
  },
  {
    "n": 29,
    "title": "消失的厨神",
    "genre": "其他",
    "tagline": "烟火升起的地方，总有温暖的故事。"
  },
  {
    "n": 34,
    "title": "长风踏歌",
    "genre": "古装",
    "tagline": "长风起，踏歌行；一程山河，一场相知。"
  },
  {
    "n": 1,
    "title": "别相信完美婚姻",
    "genre": "悬疑",
    "tagline": "看似完美的日常，藏着怎样的另一面？"
  },
  {
    "n": 2,
    "title": "灰姑娘孕事：王子的失落后裔",
    "genre": "奇幻",
    "tagline": "命运写下伏笔，故事从一次相遇开始。"
  },
  {
    "n": 6,
    "title": "先婚后爱，爱你成瘾",
    "genre": "都市情感",
    "tagline": "在日复一日的相处里，读懂心动。"
  },
  {
    "n": 11,
    "title": "战神护妻，杀出豪门",
    "genre": "热血逆袭",
    "tagline": "风云变幻之间，守护是坚定的选择。"
  },
  {
    "n": 20,
    "title": "湖里真的有鳄鱼",
    "genre": "悬疑",
    "tagline": "平静的水面之下，未知正在靠近。"
  },
  {
    "n": 25,
    "title": "人鱼公主归海",
    "genre": "奇幻",
    "tagline": "循着海的回响，寻找真正的归处。"
  }
];
export const previewCatalog:Content[]=entries.map(({n,title,genre,tagline})=>{const id=`drama-${String(n).padStart(2,'0')}`;return{id,title,genre,tagline,synopsis:tagline,tags:[genre],format:'live_action_drama',content_zone:'green',cover_origin:'provided',age_rating:{system:'本地封面预览（非发行评级）',value:'封面预览',minimum_age:0},region_allowlist:[],rights_status:'pending',rights:null,series_id:null,publication_status:'draft',cover:`/assets/covers/${id}.webp`,thumbnail:`/assets/covers/${id}-small.webp`,largeCover:`/assets/covers/${id}-large.webp`,ambient:`/assets/covers/${id}-ambient.webp`,access_tier:'coin_reserved',original:false,published_at:null,update_status:'unknown',is_demo:true};});
export const collections:Collection[]=[{id:'everyday-light',name:'都市心事',description:'沿着都市情感题材，发现不同故事。',theme:'都市情感',cover:previewCatalog[1].cover,content_ids:previewCatalog.filter(c=>c.genre==='都市情感').map(c=>c.id),updated_at:'2026-09-14',content_zone:'green',is_demo:true},{id:'imaginary-journey',name:'想象，正在远行',description:'探索奇幻题材的故事。',theme:'奇幻',cover:previewCatalog[3].cover,content_ids:previewCatalog.filter(c=>c.genre==='奇幻').map(c=>c.id),updated_at:'2026-09-14',content_zone:'green',is_demo:true}];
export const greenCampaigns: Campaign[]=[{id:'first-story',title:'从一部免费故事开始',description:'发现免费范围内的故事。',content_zone:'green',starts_at:'2026-01-01',ends_at:'2027-01-01',status:'preview',visibility:'public',target:'/free',is_demo:true},{id:'genre-discovery',title:'循着题材，发现好故事',description:'循着喜欢的题材，发现值得关注的故事。',content_zone:'green',starts_at:'2026-01-01',ends_at:'2027-01-01',status:'preview',visibility:'public',target:'/rankings',is_demo:true}];
