import type {Content} from '../types/content';
const covers=import.meta.glob('./assets/catalog/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
// Local display fixtures only; category and date fields are not verified release metadata.
const entries=[
  {
    "id": "private-preview-1",
    "title": "撞上千金大小姐的吻",
    "asset": "cover-15.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "private-preview-2",
    "title": "别相信完美婚姻",
    "asset": "cover-0.webp",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": false
  },
  {
    "id": "private-preview-3",
    "title": "先婚后爱，爱你成瘾",
    "asset": "cover-5.webp",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "private-preview-4",
    "title": "请勿打扰，前妻幸福中",
    "asset": "cover-8.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": false
  },
  {
    "id": "private-preview-5",
    "title": "我家古董会说爱你",
    "asset": "cover-25.webp",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "private-preview-6",
    "title": "少爷逃婚，大佬亲娶",
    "asset": "cover-30.webp",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": false
  },
  {
    "id": "adult-cover-1",
    "title": "灰姑娘孕事：王子的失落后裔",
    "asset": "cover-1.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-2",
    "title": "盖世雄父",
    "asset": "cover-2.webp",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-3",
    "title": "一日一载，武定乾坤",
    "asset": "cover-3.webp",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-4",
    "title": "凋零前，请对我偏执",
    "asset": "cover-4.webp",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-6",
    "title": "废柴学徒有蹊跷",
    "asset": "cover-6.webp",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-7",
    "title": "月色不晚",
    "asset": "cover-7.webp",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-9",
    "title": "上东区的谎言游戏",
    "asset": "cover-9.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-10",
    "title": "战神覆妻：杀出豪门",
    "asset": "cover-10.webp",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-11",
    "title": "神经40%的战神",
    "asset": "cover-11.webp",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-12",
    "title": "黑白相悖，爱欲焚心",
    "asset": "cover-12.webp",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-13",
    "title": "油门踩到底！废柴车神逆袭",
    "asset": "cover-13.webp",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-14",
    "title": "皇帝微服出巡，捡旧爱",
    "asset": "cover-14.webp",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-16",
    "title": "兽世重生：这次换我疼你",
    "asset": "cover-16.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-17",
    "title": "来自继父的成年礼",
    "asset": "cover-17.webp",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-18",
    "title": "凡人皮囊，神祇血脉",
    "asset": "cover-18.webp",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-19",
    "title": "湖里真的有鳄鱼",
    "asset": "cover-19.webp",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-20",
    "title": "玫瑰不为任何人二度绽放",
    "asset": "cover-20.webp",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-21",
    "title": "荆棘女王：与宿敌的婚约",
    "asset": "cover-21.webp",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-22",
    "title": "辣妈翻身：陆长官的强制爱",
    "asset": "cover-22.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-23",
    "title": "披着黑夜爱你",
    "asset": "cover-23.webp",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-24",
    "title": "人鱼公主归海",
    "asset": "cover-24.webp",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-26",
    "title": "拒当顾太太后，我惊艳全城",
    "asset": "cover-26.webp",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-27",
    "title": "SSS级废柴神力",
    "asset": "cover-27.webp",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-28",
    "title": "消失的厨神",
    "asset": "cover-28.webp",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-29",
    "title": "甩掉四分卫后我成了啦啦队神话",
    "asset": "cover-29.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-31",
    "title": "吾家有女镇河山",
    "asset": "cover-31.webp",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-32",
    "title": "龙王的失忆娇妻",
    "asset": "cover-32.webp",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-33",
    "title": "长风踏歌",
    "asset": "cover-33.webp",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-34",
    "title": "铁拳无敌杨芊芊",
    "asset": "cover-34.webp",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-35",
    "title": "后座风暴2",
    "asset": "cover-35.webp",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-36",
    "title": "真强者，假废物",
    "asset": "cover-36.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-37",
    "title": "虫族入侵：人类反击",
    "asset": "cover-37.webp",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-38",
    "title": "幼龙心声，萌翻全族！",
    "asset": "cover-38.webp",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-39",
    "title": "独臂少主",
    "asset": "cover-39.webp",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-40",
    "title": "乞丐夫君万岁爷",
    "asset": "cover-40.webp",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-41",
    "title": "在全校面前攻略他",
    "asset": "cover-41.webp",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-42",
    "title": "为她花钱我成首富",
    "asset": "cover-42.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-43",
    "title": "我的狼王雇主超黏人",
    "asset": "cover-43.webp",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-44",
    "title": "后座风暴",
    "asset": "cover-44.webp",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-45",
    "title": "霸道总裁竟是我逃婚对象",
    "asset": "cover-45.webp",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-46",
    "title": "辞尽风月无人间",
    "asset": "cover-46.webp",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-47",
    "title": "替嫁入蛮荒，渣男心慌慌",
    "asset": "cover-47.webp",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-48",
    "title": "逆袭吧，王牌四分卫",
    "asset": "cover-48.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-49",
    "title": "我们曾经有过家",
    "asset": "cover-49.webp",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-50",
    "title": "古皇陵的无能少爷",
    "asset": "cover-50.webp",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-51",
    "title": "人鱼断尾，情尽沧海",
    "asset": "cover-51.webp",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-52",
    "title": "长公主驾到",
    "asset": "cover-52.webp",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-53",
    "title": "我靠抽盲盒，撩上双面权臣",
    "asset": "cover-53.webp",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-54",
    "title": "甩掉渣总带球跑，前夫别来乱",
    "asset": "cover-54.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-55",
    "title": "当年闪人，现在闪婚？",
    "asset": "cover-55.webp",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-56",
    "title": "隐婚天价老公",
    "asset": "cover-56.webp",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-57",
    "title": "逆境崛起破苍穹",
    "asset": "cover-57.webp",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-58",
    "title": "一执笔量因果",
    "asset": "cover-58.webp",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-59",
    "title": "赌场来的妈妈",
    "asset": "cover-59.webp",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-60",
    "title": "退亲当天，将军爹爹带我斩断孽缘",
    "asset": "cover-60.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-61",
    "title": "烈火婚契",
    "asset": "cover-61.webp",
    "genre": "悬疑",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-62",
    "title": "铁幕少年凤凰魂",
    "asset": "cover-62.webp",
    "genre": "奇幻",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-63",
    "title": "我要找到你",
    "asset": "cover-63.webp",
    "genre": "都市情感",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-64",
    "title": "女儿认贼做母后，我笑了",
    "asset": "cover-64.webp",
    "genre": "悬疑",
    "format": "live_action_drama",
    "original": true
  },
  {
    "id": "adult-cover-65",
    "title": "凤鸣九霄，众生静",
    "asset": "cover-65.webp",
    "genre": "奇幻",
    "format": "motion_comic",
    "original": false
  },
  {
    "id": "adult-cover-66",
    "title": "拳",
    "asset": "cover-66.webp",
    "genre": "都市情感",
    "format": "live_action_drama",
    "original": true
  }
];
export const adultPreview:Content[]=entries.map((c,i)=>({id:c.id,title:c.title,synopsis:'一封迟到的信，让原本平静的生活发生了变化。追寻线索的途中，他们与旧友重逢，也遇见新的伙伴，在误会与理解之间寻找真相，最终学会珍惜身边的人。',tagline:'',tags:[c.genre],genre:c.genre,format:c.format as 'live_action_drama'|'motion_comic',content_zone:'adult',age_rating:null,region_allowlist:[],rights_status:'pending',rights:null,series_id:null,publication_status:'draft',cover:covers['./assets/catalog/'+c.asset],thumbnail:covers['./assets/catalog/'+c.asset],largeCover:covers['./assets/catalog/'+c.asset],ambient:covers['./assets/catalog/'+c.asset],cover_origin:'provided',access_tier:'free',original:c.original,published_at:new Date(Date.UTC(2026,8,15)-i*3600000).toISOString(),update_status:'unknown',is_demo:true}));
export const adultCampaigns:import('../types/content').Campaign[]=[];
