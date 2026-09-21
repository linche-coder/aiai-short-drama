import{useEffect,useLayoutEffect,useRef,useState}from'react';
import{Eye,EyeOff,LockKeyhole,Mail,UserRound,X}from'lucide-react';
import{accountService}from'../services/membership';
import{ApiError}from'../services/backend';
import{Link}from'../navigation/Router';

export type AccountMode='login'|'register'|'forgot';
type Errors=Partial<Record<'account'|'password'|'confirm'|'email'|'form',string>>;
const username=/^[A-Za-z0-9_]{4,20}$/;
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function requestMessage(error:unknown){if(error instanceof DOMException&&error.name==='AbortError')return'请求超时，请检查网络后重试。';if(error instanceof ApiError){if(error.code==='invalid_credentials')return'账号或密码错误，请重新输入。';if(error.code==='account_exists')return'该账号已被使用，请更换账号。';if(error.code==='rate_limited')return'操作过于频繁，请稍后再试。';}return'账号服务暂时不可用，请稍后再试。';}
export function AccountModal({mode,returnTo,notice,onMode,onClose,onSuccess}:{mode:AccountMode;returnTo:string;notice?:string;onMode:(mode:AccountMode)=>void;onClose:()=>void;onSuccess:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLElement|null>(null);
 const[account,setAccount]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[email,setEmail]=useState(''),[showPassword,setShowPassword]=useState(false),[showConfirm,setShowConfirm]=useState(false),[busy,setBusy]=useState(false),[errors,setErrors]=useState<Errors>({}),[sent,setSent]=useState(false);
 useLayoutEffect(()=>{const node=dialog.current!;trigger.current=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';node.showModal();return()=>{node.close();document.body.style.overflow=overflow;trigger.current?.isConnected&&trigger.current.focus({preventScroll:true});};},[]);
 useEffect(()=>{setPassword('');setConfirm('');setShowPassword(false);setShowConfirm(false);setErrors({});setSent(false);},[mode]);
 const changeMode=(next:AccountMode)=>{if(busy)return;onMode(next);};
 const close=()=>{if(!busy)onClose();};
 const submit=async(event:React.FormEvent)=>{event.preventDefault();if(busy)return;const next:Errors={};
  if(mode!=='forgot'&&!account.trim())next.account='请输入账号。';
  if(mode==='register'&&account&&!username.test(account))next.account='账号需为 4–20 位英文、数字或下划线。';
  if(mode!=='forgot'&&!password)next.password='请输入密码。';
  if(mode==='register'&&password.length<8)next.password='密码需为 8–64 个字符。';
  if(mode==='register'&&password.length>64)next.password='密码不能超过 64 个字符。';
  if(mode==='register'&&password!==confirm)next.confirm='两次输入的密码不一致。';
  if(((mode==='register'&&email)||mode==='forgot')&&!emailPattern.test(email))next.email='请输入有效的电子邮箱。';
  if(Object.keys(next).length){setErrors(next);return;}setBusy(true);setErrors({});const controller=new AbortController(),timer=window.setTimeout(()=>controller.abort(),10000);
  try{if(mode==='login'){await accountService.signIn({account:account.trim(),password,returnTo},controller.signal);onSuccess();}else if(mode==='register'){await accountService.register({account:account.trim(),password,...(email.trim()?{email:email.trim()}: {})},controller.signal);onSuccess();}else{await accountService.requestPasswordReset(email.trim(),controller.signal);setSent(true);}}
  catch(error){setErrors({form:requestMessage(error)});}finally{window.clearTimeout(timer);setBusy(false);}
 };
 return <dialog ref={dialog} className="account-modal" aria-label="登录注册" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget)close();}} onKeyDown={event=>{if(event.key!=='Tab')return;const controls=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]')].filter(item=>item.getClientRects().length);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}}>
  <section className="account-modal-panel" onClick={event=>event.stopPropagation()}>
   <button className="account-modal-close" aria-label="关闭账号窗口" onClick={close} disabled={busy}><X/></button>
   <img className="account-modal-logo" src="/assets/brand/logo.svg" alt="爱爱短剧"/>
   <div className="account-mode-tabs" role="tablist" aria-label="账号操作"><button role="tab" aria-selected={mode!=='register'} onClick={()=>changeMode('login')}>登录</button><button role="tab" aria-selected={mode==='register'} onClick={()=>changeMode('register')}>注册</button></div>
   {mode==='forgot'?<form className="account-form" onSubmit={submit} noValidate><div className="account-form-heading"><h2>找回密码</h2><p>输入账号绑定的邮箱，我们将向你发送密码重置指引。</p></div><Field label="电子邮箱" error={errors.email}><Mail/><input type="email" autoComplete="email" placeholder="请输入绑定邮箱" value={email} onChange={e=>setEmail(e.target.value)} autoFocus/></Field>{errors.form&&<p className="account-form-error" role="alert">{errors.form}</p>}{sent&&<p className="account-form-success" role="status">重置指引已发送，请检查邮箱。</p>}<button className="account-submit" disabled={busy||sent}>{busy?'正在发送…':sent?'已发送':'发送重置指引'}</button><button type="button" className="account-back" onClick={()=>changeMode('login')}>返回登录</button></form>:
   <form className="account-form" onSubmit={submit} noValidate>
    <Field label="账号" error={errors.account}><UserRound/><input autoComplete="username" placeholder={mode==='login'?'请输入账号':'请输入英文、数字或下划线组合'} value={account} onChange={e=>setAccount(e.target.value)} autoFocus/></Field>
    <Field label="密码" error={errors.password}><LockKeyhole/><input type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} placeholder={mode==='login'?'请输入密码':'8–64 个字符'} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="password-toggle" aria-label={showPassword?'隐藏密码':'显示密码'} aria-pressed={showPassword} onClick={()=>setShowPassword(value=>!value)}>{showPassword?<EyeOff/>:<Eye/>}</button></Field>
    {mode==='login'?<button type="button" className="forgot-link" onClick={()=>changeMode('forgot')}>忘记密码</button>:<><Field label="确认密码" error={errors.confirm}><LockKeyhole/><input type={showConfirm?'text':'password'} autoComplete="new-password" placeholder="再次输入密码" value={confirm} onChange={e=>setConfirm(e.target.value)}/><button type="button" className="password-toggle" aria-label={showConfirm?'隐藏确认密码':'显示确认密码'} aria-pressed={showConfirm} onClick={()=>setShowConfirm(value=>!value)}>{showConfirm?<EyeOff/>:<Eye/>}</button></Field><Field label="电子邮箱（选填）" error={errors.email}><Mail/><input type="email" autoComplete="email" placeholder="请输入电子邮箱" value={email} onChange={e=>setEmail(e.target.value)}/></Field><p className="account-recovery-note">未绑定邮箱，忘记密码后将无法通过邮箱找回。</p></>}
    <p className="account-assist">{mode==='login'?'登录后可收藏短剧、发表评论，继续你的观看记录。':'注册成功后将自动登录。'}</p>
    {notice==='password-changed'&&mode==='login'&&<p className="account-form-success" role="status">密码已修改，请重新登录。</p>}{errors.form&&<p className="account-form-error" role="alert">{errors.form}</p>}
    <button className="account-submit" disabled={busy}>{busy?(mode==='login'?'正在登录…':'正在创建…'):(mode==='login'?'登录':'创建账号')}</button>
    {mode==='register'&&<p className="account-legal">创建账号即表示你已阅读并同意 <Link href="/terms">服务协议</Link> 与 <Link href="/privacy">隐私政策</Link></p>}
   </form>}
  </section>
 </dialog>;
}
function Field({label,error,children}:{label:string;error?:string;children:React.ReactNode}){return <label className={`account-field ${error?'has-error':''}`}><span>{label}</span><div>{children}</div>{error&&<small role="alert">{error}</small>}</label>}
