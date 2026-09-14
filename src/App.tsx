import{lazy,Suspense,useEffect,useRef,useState}from'react';
import{Router,useRouter}from'./navigation/Router';import{HomePage}from'./HomePage';import{Header}from'./components/Header';import{Footer}from'./components/Footer';import{Modal}from'./components/Modal';import{PlayPage}from'./components/PlayPage';import{CatalogPage,CollectionsPage,RankingsPage}from'./pages/CatalogPages';import{AdultBoundary,AdultPage,AdultSearch,WishlistPage}from'./pages/AdultPages';import{MembershipPage}from'./pages/MembershipPage';import{MePage,OrdersPage,PrivacyPage}from'./pages/AccountPages';import{NotFound,LoadingState}from'./components/content/PageParts';import{Link}from'./navigation/Router';
const AdminPage=import.meta.env.DEV?lazy(()=>import('./dev/AdminPage')):null;
const PreviewControls=import.meta.env.DEV?lazy(()=>import('./dev/PreviewControls')):null;
function Pages(){const{route}=useRouter(),[account,setAccount]=useState(false),logo=useRef<HTMLImageElement>(null);useEffect(()=>{setAccount(false);if(route.path.startsWith('/18plus'))document.title='爱爱短剧 · 访问确认';else if(!route.path.startsWith('/play/'))document.title='爱爱短剧 · 好故事，一眼入戏';},[route.key,route.path]);const onAccount=()=>setAccount(true);
 let page:React.ReactNode;const play=route.path.match(/^\/(play|read)\/([^/]+)$/),privatePlay=route.path.match(/^\/18plus\/play\/([^/]+)$/),collection=route.path.match(/^\/collections\/([^/]+)$/);const decode=(id:string)=>{try{return decodeURIComponent(id);}catch{return '';}};
 const needsAdult=route.path.startsWith('/18plus')||(route.path==='/membership'&&route.params.get('context')==='adult')||!!(play&&/^private-preview-|^legacy-adult-preview$/.test(decode(play[2])));
 if(route.path==='/')return <><HomePage key={route.key} onAccount={onAccount} blocked={account}/>{account&&<Modal content={{kind:'account'}} onClose={()=>setAccount(false)}/>}</>;
 if(route.path==='/shorts'||route.path==='/comics'||route.path==='/free'||route.path==='/search')page=<CatalogPage kind={route.path.slice(1) as 'shorts'|'comics'|'free'|'search'}/>;
 else if(route.path==='/__debug'&&PreviewControls)page=<main className="container page"><Suspense fallback={<LoadingState/>}><PreviewControls/></Suspense></main>;
 else if(route.path==='/rankings')page=<RankingsPage/>;
 else if(route.path==='/collections'||collection)page=<CollectionsPage id={collection?decode(collection[1]):undefined}/>;
 else if(route.path==='/18plus')page=<AdultPage/>;
 else if(route.path==='/18plus/search')page=<AdultSearch/>;
 else if(route.path==='/18plus/wishlist')page=<WishlistPage/>;
 else if(privatePlay)page=<PlayPage key={privatePlay[1]} id={decode(privatePlay[1])} adult/>;
 else if(play)page=<PlayPage key={play[2]} id={play[2]==='legacy-adult-preview'?'private-preview-1':decode(play[2])} adult={needsAdult} reading={play[1]==='read'}/>;
 else if(route.path==='/membership')page=<MembershipPage/>;
 else if(route.path==='/me')page=<MePage onAccount={onAccount}/>;
 else if(route.path==='/me/privacy')page=<PrivacyPage/>;
 else if(route.path==='/me/orders')page=<OrdersPage/>;
 else if(route.path==='/admin/content'||route.path==='/admin/analytics')page=AdminPage?<Suspense fallback={<LoadingState/>}><AdminPage analytics={route.path==='/admin/analytics'}/></Suspense>:<NotFound/>;
 else page=<NotFound/>;
 return <div className="app">{route.path.startsWith('/admin')?<header className="admin-header container"><Link className="brand" href="/me"><img src="/assets/brand/logo.svg" alt="爱爱短剧"/></Link><span>管理工作台</span><Link className="text-button" href="/me">返回用户端</Link></header>:<Header logoRef={logo} onAccount={onAccount}/>}<div key={route.path}>{needsAdult?<AdultBoundary key={route.key}>{page}</AdultBoundary>:page}</div><Footer/>{account&&<Modal content={{kind:'account'}} onClose={()=>setAccount(false)}/>}</div>;
}
export default function App(){return <Router><Pages/></Router>;}
