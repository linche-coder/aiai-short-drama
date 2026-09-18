import{Link,useRouter}from'../navigation/Router';
const items=[['/me','概览'],['/me/favorites','追剧'],['/me/history','历史'],['/me/orders','订单'],['/me/comments','评论'],['/me/messages','消息'],['/me/profile','资料'],['/me/privacy','隐私']] as const;
export function AccountNav(){const{route}=useRouter();return <nav className="account-subnav" aria-label="个人中心导航">{items.map(([href,label])=><Link key={href} href={href} aria-current={route.path===href?'page':undefined}>{label}</Link>)}</nav>}
