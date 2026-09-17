import{useState}from'react';
import{KeyRound,ShieldCheck}from'lucide-react';
import{PageHeading}from'../components/content/PageParts';
import{Link,useRouter}from'../navigation/Router';

export function AuthPage({kind}:{kind:'reset'|'verify'}){const{route}=useRouter(),[message,setMessage]=useState('');const token=route.params.get('token')||'';const usable=token.length>=24;return <main className="container page narrow-page"><PageHeading title={kind==='verify'?'验证邮箱':'设置新密码'} description={usable?'请完成最后一步。':'这个链接无效或已经过期。'}/><section className="auth-card surface-panel">{usable?<><ShieldCheck className="auth-icon"/><h2>{kind==='verify'?'确认邮箱地址':'创建新密码'}</h2><p>{kind==='verify'?'验证完成后即可返回登录。':'新密码需为 8–64 个字符。'}</p><button className="primary-button" onClick={()=>setMessage('账号服务暂时不可用，请稍后再试。')}>{kind==='verify'?'完成验证':'保存新密码'}</button>{message&&<p role="alert" className="field-error">{message}</p>}</>:<><KeyRound className="auth-icon"/><h2>无法继续</h2><p>请重新申请密码重置邮件，或返回首页稍后再试。</p><Link className="primary-button" href="/account/forgot-password?returnTo=%2F%23home">重新申请</Link></>}</section></main>}
