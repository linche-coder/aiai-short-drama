import './styles/festival.css';
import './styles/festival-campaign.css';
import './styles/festival-refresh.css';
import {FestivalPage} from './pages/FestivalPage';
import {PointsPage} from './pages/PointsPage';
import{lazy,Suspense,useEffect,useRef}from'react';
import{Router,RouteView,useRouter,Link}from'./navigation/Router';import{HomePage}from'./HomePage';import{Header}from'./components/Header';import{Footer}from'./components/Footer';import{PlayPage}from'./components/PlayPage';import{CatalogPage,CollectionsPage,RankingsPage}from'./pages/CatalogPages';import{AdultBoundary,AdultPage,AdultSearch,WishlistPage}from'./pages/AdultPages';import{MembershipPage}from'./pages/MembershipPage';import{MePage,OrdersPage,PrivacyPage}from'./pages/AccountPages';import{AuthPage}from'./pages/AuthPages';import{AccountModal,type AccountMode}from'./components/AccountModal';import{CheckoutPage,OrderDetailPage,PaymentResultPage}from'./pages/CommercePages';import{FavoritesPage,HistoryPage,MessagesPage,MyCommentsPage,ProfilePage}from'./pages/RetentionPages';import{FeedbackPage,HelpPage,PolicyPage,TicketsPage}from'./pages/SupportPages';import{NotFound,LoadingState}from'./components/content/PageParts';import{accessService}from'./services/access';import{trustedPath}from'./services/rules';import{accountService}from'./services/membership';
import {MembershipGuidePage} from './pages/MembershipGuidePage';
const AdminPage=import.meta.env.DEV?lazy(()=>import('./dev/AdminPage')):null;
const AdminOpsPage=import.meta.env.DEV?lazy(()=>import('./dev/AdminOpsPage')):null;
const PreviewControls=import.meta.env.DEV?lazy(()=>import('./dev/PreviewControls')):null;
const authPath:Record<AccountMode,string>={login:'login',register:'register',forgot:'forgot-password'};
function safeAuthReturn(value:string|null){if(!value||!value.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return'/#home';const target=trustedPath(value);return target.startsWith('/account/')?'/#home':target;}
function Pages(){
 const{route,navigate}=useRouter(),match=route.path.match(/^\/account\/(login|register|forgot-password|session-expired)$/);
 const returnTo=match?safeAuthReturn(route.params.get('returnTo')):route.path+route.search+route.hash;
 // Keep the background mounted, including its route key, across auth overlays.
 const background=useRef({url:returnTo,key:route.key,auth:!!match,sourceKey:route.key});
 if(background.current.sourceKey!==route.key){
  const preserve=background.current.url===returnTo&&(!!match||background.current.auth);
  background.current={url:returnTo,key:preserve?background.current.key:route.key,auth:!!match,sourceKey:route.key};
 }
 const mode:AccountMode=match?.[1]==='register'?'register':match?.[1]==='forgot-password'?'forgot':'login';
 const go=(next:AccountMode)=>navigate(`/account/${authPath[next]}?returnTo=${encodeURIComponent(returnTo)}`,{replace:true,preserveScroll:true});
 const finish=()=>navigate(returnTo,{replace:true,preserveScroll:true});
 return <><RouteView url={returnTo} routeKey={background.current.key}><SitePages/></RouteView>{match&&<AccountModal mode={mode} returnTo={returnTo} notice={route.params.get('notice')||''} onMode={go} onClose={finish} onSuccess={finish}/>}</>;
}
function SitePages(){const{route,navigate}=useRouter(),logo=useRef<HTMLImageElement>(null);useEffect(()=>{if(route.path==='/me')document.title='我的';else if(route.path.startsWith('/18plus')&&!accessService.isConfirmed())document.title='爱爱短剧 · 访问确认';else if(!route.path.startsWith('/18plus')&&!route.path.startsWith('/play/'))document.title='爱爱短剧 · 好故事，一眼入戏';},[route.key,route.path]);const onAccount=()=>navigate(`/account/login?returnTo=${encodeURIComponent(route.path+route.search+route.hash)}`);
 let page:React.ReactNode;const play=route.path.match(/^\/(play|read)\/([^/]+)$/),privatePlay=route.path.match(/^\/18plus\/play\/([^/]+)$/),collection=route.path.match(/^\/collections\/([^/]+)$/),order=route.path.match(/^\/me\/orders\/([^/]+)$/),ticket=route.path.match(/^\/support\/tickets\/([^/]+)$/),supportTopic=route.path.match(/^\/support\/(account|playback|membership|orders|privacy)$/),auth=route.path.match(/^\/account\/(reset-password|verify)$/);const decode=(id:string)=>{try{return decodeURIComponent(id);}catch{return '';}};
 const needsAdult=route.path.startsWith('/18plus')||(route.path==='/membership'&&route.params.get('context')==='adult')||!!(play&&/^private-preview-|^legacy-adult-preview$/.test(decode(play[2])));
 if(route.path==='/')return <HomePage key={route.key} onAccount={onAccount} blocked={false}/>;
 if(route.path==='/shorts'||route.path==='/videos'||route.path==='/comics'||route.path==='/free'||route.path==='/search')page=<CatalogPage kind={(route.path==='/videos'?'shorts':route.path.slice(1)) as 'shorts'|'comics'|'free'|'search'}/>;
 else if(route.path==='/__debug'&&PreviewControls)page=<main className="container page"><Suspense fallback={<LoadingState/>}><PreviewControls/></Suspense></main>;
 else if(route.path==='/rankings')page=<RankingsPage/>;
 else if(route.path==='/collections'||collection)page=<CollectionsPage id={collection?decode(collection[1]):undefined}/>;
 else if(route.path==='/18plus')page=<AdultPage/>;
 else if(route.path==='/18plus/search')page=<AdultSearch/>;
 else if(route.path==='/18plus/wishlist')page=<WishlistPage/>;
 else if(privatePlay)page=<PlayPage key={privatePlay[1]} id={decode(privatePlay[1])} adult/>;
 else if(play)page=<PlayPage key={play[2]} id={play[2]==='legacy-adult-preview'?'private-preview-1':decode(play[2])} adult={needsAdult} reading={play[1]==='read'}/>;
 else if(auth)page=<AuthPage kind={auth[1]==='verify'?'verify':'reset'}/>;
 else if(route.path==='/festival')page=<FestivalPage/>;
 else if(route.path==='/membership')page=<MembershipPage/>;
 else if(route.path==='/checkout')page=<CheckoutPage/>;
 else if(route.path==='/payment-result')page=<PaymentResultPage/>;
 else if(route.path==='/me/points')page=<PointsPage/>;
 else if(route.path==='/me')page=<MePage/>;
 else if(route.path==='/me/privacy')page=<PrivacyPage/>;
 else if(route.path==='/me/orders')page=<OrdersPage/>;
 else if(order)page=<OrderDetailPage id={decode(order[1])}/>;
 else if(route.path==='/me/favorites')page=<FavoritesPage/>;
 else if(route.path==='/me/history')page=<HistoryPage/>;
 else if(route.path==='/me/profile')page=<ProfilePage/>;
 else if(route.path==='/me/comments')page=<MyCommentsPage/>;
 else if(route.path==='/me/messages')page=<MessagesPage/>;
 else if(route.path==='/support'||route.path==='/help')page=<HelpPage/>;
 else if(route.path==='/contact')page=<FeedbackPage/>;
 else if(supportTopic)page=<HelpPage topic={supportTopic[1]}/>;
 else if(route.path==='/support/feedback')page=<FeedbackPage/>;
 else if(route.path==='/support/tickets')page=<TicketsPage/>;
 else if(ticket)page=<TicketsPage id={decode(ticket[1])}/>;
 else if(route.path==='/terms')page=<PolicyPage kind="terms"/>;
 else if(route.path==='/privacy')page=<PolicyPage kind="privacy"/>;
 else if(route.path==='/membership-guide')page=<MembershipGuidePage/>;
 else if(route.path==='/copyright')page=<PolicyPage kind="copyright"/>;
 else if(route.path==='/about')page=<PolicyPage kind="about"/>;
 else if(route.path==='/admin/content'||route.path==='/admin/analytics')page=AdminPage?<Suspense fallback={<LoadingState/>}><AdminPage analytics={route.path==='/admin/analytics'}/></Suspense>:<NotFound/>;
 else if(route.path==='/admin/moderation'||route.path==='/admin/support')page=AdminOpsPage?<Suspense fallback={<LoadingState/>}><AdminOpsPage kind={route.path==='/admin/support'?'support':'moderation'}/></Suspense>:<NotFound/>;
 else page=<NotFound/>;
 if(needsAdult)return <AdultBoundary>{page}</AdultBoundary>;
 return <div className="app">{route.path.startsWith('/admin')?<header className="admin-header container"><Link className="brand" href="/me"><img src="/assets/brand/logo.svg" alt="爱爱短剧"/></Link><span>管理工作台</span><Link className="text-button" href="/me">返回用户端</Link></header>:<Header logoRef={logo} onAccount={onAccount}/>}<div key={route.path}>{page}</div><Footer/></div>;
}
export default function App(){useEffect(()=>{void accountService.refresh();},[]);return <Router><Pages/></Router>}
