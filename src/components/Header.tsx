import { Crown, Search, UserRound, X } from 'lucide-react';
import type { RefObject } from 'react';
import { Link } from '../navigation/Router';
export function Header({ query='', onSearch, onAccount, onMembership, logoRef }: { query?: string; onSearch?: (value: string) => void; onAccount: () => void; onMembership: () => void; logoRef: RefObject<HTMLImageElement | null> }) {
  return <header className="site-header"><div className="header-inner container">
    <Link className="brand" href="/#home" aria-label="爱爱短剧首页"><img ref={logoRef} className="nav-logo" src="/assets/brand/logo.svg" width="1000" height="301" alt="爱爱短剧" /></Link>
    <nav aria-label="主导航"><Link href="/#home" className={onSearch?'nav-home':undefined}>首页</Link><Link href="/#popular">热门</Link><Link href="/#latest">最新</Link></nav>
    {onSearch ? <form className="search-box" role="search" onSubmit={event => { event.preventDefault(); document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' }); }}>
      <Search size={17} aria-hidden="true" /><input aria-label="搜索剧名" value={query} placeholder="搜索你心动的短剧" onChange={event => onSearch(event.target.value)} />
      {query ? <button type="button" className="icon-button search-clear" aria-label="清空搜索" onClick={() => onSearch('')}><X size={15} /></button> : <span className="search-hint">搜索</span>}
    </form> : <span className="header-spacer"/>}
    <div className="header-actions"><button className="membership-button" aria-label="会员" onClick={onMembership}><Crown size={18} /><span>会员</span></button><span className="header-divider" /><button className="account-button" aria-label="登录 / 注册" onClick={onAccount}><UserRound size={19} /><span>登录 / 注册</span></button></div>
  </div></header>;
}
