import{Breadcrumb}from'../Breadcrumb';
import type{ReactNode}from'react';import{SearchX,ArrowLeft,RotateCcw}from'lucide-react';import{Link}from'../../navigation/Router';
export function PageHeading({title,description,children}:{eyebrow?:string;title:string;description:string;children?:ReactNode}){return <div className="page-heading"><div><Breadcrumb current={title}/><h1>{title}</h1>{description&&<p>{description}</p>}</div>{children}</div>;}
export function EmptyState({title='这里还没有故事',description='试试其他筛选条件，或稍后再来看看。',onReset,children}:{title?:string;description?:string;onReset?:()=>void;children?:ReactNode}){return <section className="empty-state" role="status"><SearchX size={36}/><h2>{title}</h2>{description&&<p>{description}</p>}{onReset&&<button className="primary-button" onClick={onReset}>重置筛选</button>}{children}</section>;}
export function LoadingState({label='正在准备内容…'}:{label?:string}){return <div className="loading-state" role="status"><span className="loading-ring"/>{label}</div>;}
export function ErrorState({message,retry}:{message:string;retry:()=>void}){return <EmptyState title="暂时无法加载" description={message}><button className="primary-button" onClick={retry}><RotateCcw size={16}/>重试</button></EmptyState>;}
export function NotFound(){return <main className="container page"><Breadcrumb current="页面未找到"/><EmptyState title="没有找到这个页面" description="链接可能已变更，回到首页继续发现好故事。"><Link className="primary-button" href="/#home"><ArrowLeft size={17}/>返回首页</Link></EmptyState></main>;}
export function PreviewNote(){return null;}
