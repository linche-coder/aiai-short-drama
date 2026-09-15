import type {Content} from '../types/content';
const covers=import.meta.glob('./assets/catalog/ui-*.jpg',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
// Local display fixtures only; category and date fields are not verified release metadata.
const entries=[
  {
    "id": "private-preview-1",
    "title": "高三爱情故事",
    "asset": "ui-0.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "private-preview-2",
    "title": "神瞳觉醒 第一季",
    "asset": "ui-1.jpg",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": false
  },
  {
    "id": "private-preview-3",
    "title": "半兽人公司",
    "asset": "ui-2.jpg",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "private-preview-4",
    "title": "鸡榜啼鸣",
    "asset": "ui-3.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": false
  },
  {
    "id": "private-preview-5",
    "title": "日勤病栋",
    "asset": "ui-4.jpg",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "private-preview-6",
    "title": "末日神舟",
    "asset": "ui-5.jpg",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": false
  },
  {
    "id": "adult-cover-1",
    "title": "乡村爱情之骚妇秀云",
    "asset": "ui-6.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-2",
    "title": "回村逍遥",
    "asset": "ui-7.jpg",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-3",
    "title": "欲望公路",
    "asset": "ui-8.jpg",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-4",
    "title": "我的十八岁女友",
    "asset": "ui-9.jpg",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-6",
    "title": "朱颜血系列之长途列车",
    "asset": "ui-10.jpg",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-7",
    "title": "出差",
    "asset": "ui-11.jpg",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-9",
    "title": "深夜出租车",
    "asset": "ui-12.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-10",
    "title": "少妇白洁",
    "asset": "ui-13.jpg",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-11",
    "title": "最后一节车厢",
    "asset": "ui-14.jpg",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-12",
    "title": "妻夜怪谈",
    "asset": "ui-15.jpg",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-13",
    "title": "胖哥的传奇人生",
    "asset": "ui-16.jpg",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-14",
    "title": "哑妃难训：摄政王的掌心娇",
    "asset": "ui-17.jpg",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-16",
    "title": "谎言",
    "asset": "ui-18.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-17",
    "title": "AI极品家丁",
    "asset": "ui-19.jpg",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-18",
    "title": "大漠遗孤",
    "asset": "ui-20.jpg",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-19",
    "title": "少年阿宾",
    "asset": "ui-21.jpg",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-20",
    "title": "现代都市丽人第一季",
    "asset": "ui-22.jpg",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-21",
    "title": "保姆调教中",
    "asset": "ui-23.jpg",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-22",
    "title": "美女的多样人生",
    "asset": "ui-24.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-23",
    "title": "寄宿日记",
    "asset": "ui-25.jpg",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-24",
    "title": "美丽新世界",
    "asset": "ui-26.jpg",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-26",
    "title": "毕业季",
    "asset": "ui-27.jpg",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-27",
    "title": "她们的禁忌游戏",
    "asset": "ui-28.jpg",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-28",
    "title": "霍总的掌心娇",
    "asset": "ui-29.jpg",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-29",
    "title": "重生之揭穿学姐的另一幅面孔",
    "asset": "ui-30.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-31",
    "title": "禁忌的召唤",
    "asset": "ui-31.jpg",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-32",
    "title": "妹妹的日常",
    "asset": "ui-32.jpg",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-33",
    "title": "时尚禁果",
    "asset": "ui-33.jpg",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-34",
    "title": "我的AI女友",
    "asset": "ui-34.jpg",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-35",
    "title": "我睡了三年的女人竟是黑道大小姐",
    "asset": "ui-35.jpg",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-36",
    "title": "大奉打更人",
    "asset": "ui-36.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-37",
    "title": "废柴杂役",
    "asset": "ui-37.jpg",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-38",
    "title": "恶鬼新娘",
    "asset": "ui-38.jpg",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-39",
    "title": "喜欢你的心变大了",
    "asset": "ui-39.jpg",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-40",
    "title": "妖孽小村医",
    "asset": "ui-40.jpg",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-41",
    "title": "秘书",
    "asset": "ui-41.jpg",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-42",
    "title": "韦大人奉旨寻女",
    "asset": "ui-42.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-43",
    "title": "我的宅男男友",
    "asset": "ui-43.jpg",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-44",
    "title": "校园吴晶晶",
    "asset": "ui-44.jpg",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-45",
    "title": "一起去爬山吗",
    "asset": "ui-45.jpg",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-46",
    "title": "同学姐姐",
    "asset": "ui-46.jpg",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-47",
    "title": "女明星的日常",
    "asset": "ui-47.jpg",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-48",
    "title": "古寺艳鬼录",
    "asset": "ui-48.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-49",
    "title": "沈府密事",
    "asset": "ui-49.jpg",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-50",
    "title": "狐小六下山记",
    "asset": "ui-50.jpg",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-51",
    "title": "女大和室友爸爸的雨夜故事",
    "asset": "ui-51.jpg",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-52",
    "title": "花烛夜之解禁新娘",
    "asset": "ui-52.jpg",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-53",
    "title": "小白花的堕落",
    "asset": "ui-53.jpg",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-54",
    "title": "禁忌游戏",
    "asset": "ui-54.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-55",
    "title": "荒岛美人劫",
    "asset": "ui-55.jpg",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-56",
    "title": "金鳞岂是池中物",
    "asset": "ui-56.jpg",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-57",
    "title": "我的炮友是妇科医生",
    "asset": "ui-57.jpg",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-58",
    "title": "系统让我攻略弟弟",
    "asset": "ui-58.jpg",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-59",
    "title": "生役",
    "asset": "ui-59.jpg",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-60",
    "title": "迷情居酒屋",
    "asset": "ui-60.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-61",
    "title": "周六的一天",
    "asset": "ui-61.jpg",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-62",
    "title": "秘色临界",
    "asset": "ui-62.jpg",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-63",
    "title": "艳福风流传",
    "asset": "ui-63.jpg",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-64",
    "title": "深夜潜入女大学生宿舍",
    "asset": "ui-64.jpg",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-65",
    "title": "绝色女友给我的绿帽回忆录",
    "asset": "ui-65.jpg",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-66",
    "title": "贱婢翻身独揽深宅荣宠",
    "asset": "ui-66.jpg",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  }
];
export const adultPreview:Content[]=entries.map((c,i)=>({id:c.id,title:c.title,synopsis:'一封迟到的信，让原本平静的生活发生了变化。追寻线索的途中，他们与旧友重逢，也遇见新的伙伴，在误会与理解之间寻找真相，最终学会珍惜身边的人。',tagline:'',tags:[c.genre],genre:c.genre,format:c.format as 'live_action_drama'|'motion_comic',content_zone:'adult',age_rating:null,region_allowlist:[],rights_status:'pending',rights:null,series_id:null,publication_status:'draft',cover:covers['./assets/catalog/'+c.asset],thumbnail:covers['./assets/catalog/'+c.asset],largeCover:covers['./assets/catalog/'+c.asset],ambient:covers['./assets/catalog/'+c.asset],cover_origin:'provided',access_tier:'free',original:c.original,published_at:new Date(Date.UTC(2026,8,15)-i*3600000).toISOString(),update_status:'unknown',is_demo:true}));
export const adultCampaigns:import('../types/content').Campaign[]=[];
