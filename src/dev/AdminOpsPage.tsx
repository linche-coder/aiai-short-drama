import{useSyncExternalStore}from'react';
import{Link}from'../navigation/Router';
import{PageHeading,EmptyState}from'../components/content/PageParts';
import{accountService}from'../services/membership';

export default function AdminOpsPage({kind}:{kind:'moderation'|'support'}){const account=useSyncExternalStore(accountService.subscribe,accountService.getSnapshot);if(account.role!=='content_editor')return <main className="container page"><EmptyState title="无后台权限" description="该页面仅向获得授权的运营人员开放。"><Link className="primary-button" href="/me">返回我的</Link></EmptyState></main>;return <main className="admin-layout container page"><nav className="admin-nav" aria-label="后台导航"><Link href="/admin/content">内容</Link><Link href="/admin/moderation" aria-current={kind==='moderation'?'page':undefined}>评论与举报</Link><Link href="/admin/support" aria-current={kind==='support'?'page':undefined}>用户反馈</Link><Link href="/admin/analytics">数据</Link></nav><PageHeading title={kind==='moderation'?'评论与举报审核':'用户反馈处理'} description="暂无待处理内容。"/><EmptyState title="暂无待处理内容" description="新内容会在这里出现。"/></main>}
