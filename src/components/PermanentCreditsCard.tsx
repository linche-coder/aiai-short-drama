import {Coins,ArrowUpRight} from 'lucide-react';
import {Link} from '../navigation/Router';
import type {MeOverviewDTO} from '../services/pointsModel';

export function PermanentCreditsCard({credits}:{credits:MeOverviewDTO['credits']}){
 return <section className="me-benefit-card permanent-credits" aria-labelledby="permanent-credits-title">
  <header className="me-benefit-heading"><Coins aria-hidden="true"/><h2 id="permanent-credits-title">永久积分</h2></header>
  <div className="me-benefit-main"><span className="me-benefit-kicker">当前余额</span><div className="me-benefit-metric"><strong>{credits.balance.toLocaleString('zh-CN')}</strong><span>积分</span></div><span className="me-benefit-validity">永久有效</span></div>
  <Link className="secondary-button me-benefit-action" href="/membership#credits">购买永久积分 <ArrowUpRight size={16}/></Link>
 </section>;
}
