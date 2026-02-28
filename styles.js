import { supabase } from './src/supabase.js'
import { parseDealText as _parseDealText, parseMethodText as _parseMethodText } from './src/parser.js'

/* ============================================================
   Deal Flow Hub — single-file React app
   All styles injected via _st; no external CSS file needed.
   ============================================================ */

// ── CSS injection ────────────────────────────────────────────
const _st = document.createElement("style");
_st.textContent = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --p:#6c63ff;--p2:#8b85ff;--bg:#0d0d14;--surf:#16161f;--surf2:#1e1e2a;
  --txt:#e8e8f0;--muted:#7a7a9a;--bdr:#2a2a3a;--sh:0 4px 24px #6c63ff44;
  --err:#ff4d6d;--ok:#4dffb4;--warn:#ffd166;--rad:14px;
}
body{background:var(--bg);color:var(--txt);font-family:'Inter',sans-serif;min-height:100vh}
a{color:inherit;text-decoration:none}
button{cursor:pointer;border:none;outline:none;background:none;font-family:inherit}
input,select,textarea{font-family:inherit;background:var(--surf2);color:var(--txt);border:1.5px solid var(--bdr);border-radius:10px;padding:10px 14px;width:100%;outline:none}
input:focus,select:focus,textarea:focus{border-color:var(--p)}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:10px;font-weight:600;font-size:14px;transition:all .2s}
.btn-p{background:var(--p);color:#fff}.btn-p:hover{background:var(--p2)}
.btn-o{border:1.5px solid var(--p);color:var(--p)}.btn-o:hover{background:var(--p);color:#fff}
.btn-d{background:var(--surf2);color:var(--txt)}.btn-d:hover{background:var(--bdr)}
.card{background:var(--surf);border:1.5px solid var(--bdr);border-radius:var(--rad);padding:20px}
.tag{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}
.tag-p{background:#6c63ff22;color:var(--p)}
.tag-ok{background:#4dffb422;color:var(--ok)}
.tag-warn{background:#ffd16622;color:var(--warn)}
.tag-err{background:#ff4d6d22;color:var(--err)}
.toast-wrap{position:fixed;bottom:24px;right:24px;display:flex;flex-direction:column;gap:10px;z-index:9999}
.toast{padding:12px 20px;border-radius:12px;font-size:14px;font-weight:500;animation:tslide .3s ease;backdrop-filter:blur(8px)}
.toast-ok{background:#4dffb422;border:1px solid var(--ok);color:var(--ok)}
.toast-err{background:#ff4d6d22;border:1px solid var(--err);color:var(--err)}
.toast-info{background:#6c63ff22;border:1px solid var(--p);color:var(--p2)}
@keyframes tslide{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
.modal-bg{position:fixed;inset:0;background:#0009;display:flex;align-items:center;justify-content:center;z-index:999;backdrop-filter:blur(4px)}
.modal{background:var(--surf);border:1.5px solid var(--bdr);border-radius:20px;padding:32px;max-width:440px;width:90%}
.nav{display:flex;align-items:center;gap:16px;padding:14px 24px;background:var(--surf);border-bottom:1.5px solid var(--bdr);position:sticky;top:0;z-index:100}
.nav-logo{font-size:20px;font-weight:700;color:var(--p);flex:1}
.page{max-width:1100px;margin:0 auto;padding:24px 16px}
.grid2{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.deal-card{background:var(--surf);border:1.5px solid var(--bdr);border-radius:var(--rad);overflow:hidden;transition:all .2s;cursor:pointer}
.deal-card:hover{border-color:var(--p);box-shadow:var(--sh);transform:translateY(-2px)}
.deal-img{width:100%;height:160px;background:var(--surf2);overflow:hidden;position:relative}
.deal-body{padding:14px}
.stat{background:var(--surf2);border-radius:12px;padding:18px;text-align:center}
.stat-v{font-size:28px;font-weight:700;margin:6px 0}
.sidebar{width:240px;flex-shrink:0}
.deals-layout{display:flex;gap:24px;align-items:flex-start}
.cat-card{cursor:pointer;padding:18px 12px;border-radius:12px;border:1.5px solid var(--bdr);background:var(--surf2);display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;transition:all .2s}
.cat-card:hover{border-color:var(--p);box-shadow:var(--sh);}
#mob-filter-btn{display:none}
@media(max-width:700px){
  .deals-layout{flex-direction:column}
  .sidebar{width:100%}
  #mob-filter-btn{display:inline-flex}
  #deals-sidebar{display:none}
  #deals-sidebar.open{display:block}
}
@media(max-width:600px){
  .page{padding:16px 12px}
  .btn{font-size:13px;padding:9px 16px}
  h1{font-size:24px!important}
  .grid2{grid-template-columns:1fr}
  .nav{padding:10px 16px;gap:10px}
  .nav-logo{font-size:17px}
}
img{max-width:100%;display:block}
/* Voting buttons */
.vote-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid var(--bdr);background:var(--surf2);color:var(--muted);transition:all .15s}
.vote-btn:hover{border-color:var(--p);color:var(--p)}
/* Accordion */
.accordion-header{width:100%;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:none;border:none;cursor:pointer;text-align:left}
.accordion-header:hover{background:rgba(255,255,255,.03)}
`;
document.head.appendChild(_st);
document.title = "Deal Flow Hub";

// ── React imports ────────────────────────────────────────────
const {
  useState, useEffect, useContext, createContext,
  useCallback, useRef, useMemo
} = React;

// ── Tiny icon component ──────────────────────────────────────
const ICONS = {
  home:"🏠", deals:"🏷️", admin:"⚙️", logout:"🚪", login:"🔑",
  tag:"🎫", sale:"💸", fire:"🔥", clock:"⏰", eye:"👁️",
  copy:"📋", link:"🔗", check:"✅", star:"⭐", lock:"🔒",
  user:"👤", search:"🔍", filter:"⚡", plus:"➕", trash:"🗑️",
  edit:"✏️", up:"🔺", chart:"📊", gift:"🎁", shield:"🛡️",
};
const I = ({n, s=16, c, style})=>
  <span style={{fontSize:s, color:c, lineHeight:1, ...style}}>{ICONS[n]||"•"}</span>;

// ── Helpers ──────────────────────────────────────────────────
const now = new Date(); // used only for ad() and sd() seed data helpers

const ad = (days) => { const d=new Date(now); d.setDate(d.getDate()+days); return d.toISOString(); };
const sd = (days) => { const d=new Date(now); d.setDate(d.getDate()-days); return d.toISOString(); };

// Bug 2 fixed: tu() now computes current time fresh on every call
const tu = (d)=>{
  const diff = new Date(d) - new Date(); // always current time
  if(diff<0) return "Expired";
  const days=Math.floor(diff/864e5), hrs=Math.floor((diff%864e5)/36e5);
  return days>0?`${days}d ${hrs}h left`:`${hrs}h left`;
};

const timeSince = (d) => {
  if (!d) return "Added recently";
  const diffMs = Date.now() - new Date(d).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "Added recently";
  const hours = Math.floor(diffMs / 36e5);
  if (hours < 1) return "Added less than 1 hour ago";
  if (hours < 24) return `Added ${hours} hour${hours===1?"":"s"} ago`;
  const days = Math.floor(hours / 24);
  return `Added ${days} day${days===1?"":"s"} ago`;
};

const fmtDate = (s) => new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
export const PRIZE_AMOUNT_USD = 10;

// ── Seed data ────────────────────────────────────────────────
const CATS = [
  {id:"electronics",              label:"Electronics",              emoji:"📱", adult:false},
  {id:"home-and-kitchen",         label:"Home & Kitchen",           emoji:"🏠", adult:false},
  {id:"clothing",                 label:"Clothing",                 emoji:"👗", adult:false},
  {id:"beauty-and-personal-care", label:"Beauty & Personal Care",   emoji:"💄", adult:false},
  {id:"health-and-household",     label:"Health & Wellness",        emoji:"💊", adult:false},
  {id:"tools-and-home-improvement",label:"Tools & Home Improvement",emoji:"🔧", adult:false},
  {id:"baby",                     label:"Baby & Kids",              emoji:"👶", adult:false},
  {id:"toys-and-games",           label:"Toys & Games",             emoji:"🎮", adult:false},
  {id:"sports-and-outdoors",      label:"Sports & Outdoors",        emoji:"⛺", adult:false},
  {id:"automotive",               label:"Automotive",               emoji:"🚗", adult:false},
  {id:"pet-supplies",             label:"Pet Supplies",             emoji:"🐾", adult:false},
  {id:"arts-and-crafts",          label:"Arts, Crafts & DIY",       emoji:"🎨", adult:false},
  {id:"other",                    label:"Other",                    emoji:"🏷️", adult:false},
  {id:"adult-products",           label:"Adult Products",           emoji:"🔞", adult:true },
];

const ADULT_OK_STORAGE_KEY = "dfh_adult_ok";
const isAdultCategory = (catId)=>CATS.some(c=>c.id===catId&&c.adult);

// ── DB field mapping ──────────────────────────────────────────
const fromDb = (d) => ({
  id:               d.id,
  title:            d.title,
  description:      d.description || '',
  link:             d.link,
  dealType:         d.deal_type,
  code:             d.code || '',
  cat:              d.category,
  clicks:           d.clicks ?? 0,
  saved:            d.saved ?? 0,
  expires:          d.expires,
  createdAt:        d.created_at,
  featured:         d.featured ?? false,
  active:           (d.status || 'ACTIVE') === 'ACTIVE',
  voteUp:           d.vote_up ?? 0,
  voteDown:         d.vote_down ?? 0,
  status:           d.status || 'ACTIVE',
  imageUrl:         d.image_url || '',
  stackInstructions:d.stack_instructions || '',
  isStackable:      d.is_stackable ?? ["STACKABLE","BOTH"].includes(d.deal_type),
  stackOptions:     Array.isArray(d.stack_options) ? d.stack_options : [],
  currentPrice:     d.current_price  ?? null,
  originalPrice:    d.original_price ?? null,
  percentOff:       d.percent_off    ?? null,
});

const toDb = (d) => ({
  title:             d.title,
  description:       d.description || '',
  link:              d.link,
  deal_type:         d.dealType,
  code:              d.code || '',
  category:          d.cat,
  clicks:            d.clicks ?? 0,
  saved:             d.saved ?? 0,
  expires:           d.expires,
  featured:          d.featured ?? false,
  vote_up:           d.voteUp ?? 0,
  vote_down:         d.voteDown ?? 0,
  status:            d.status || 'ACTIVE',
  image_url:         d.imageUrl || '',
  stack_instructions:d.stackInstructions || '',
  is_stackable:      d.isStackable ?? ["STACKABLE","BOTH"].includes(d.dealType),
  stack_options:     d.stackOptions ?? [],
  current_price:     d.currentPrice  ?? null,
  original_price:    d.originalPrice ?? null,
  percent_off:       d.percentOff    ?? null,
});

// ── Methods DB field mapping ──────────────────────────────────
const fromMethodDb = (r) => ({
  id:             r.id,
  title:          r.title,
  tabType:        r.tab_type,
  summary:        r.summary || '',
  description:    r.description || '',
  steps:          r.steps || [],
  potentialRange: r.potential_range || '',
  requirements:   r.requirements || '',
  tips:           r.tips || '',
  links:          r.links || [],
  order:          r.sort_order ?? 0,
  createdAt:      r.created_at,
});

const toMethodDb = (m) => ({
  title:           m.title,
  tab_type:        m.tabType,
  summary:         m.summary || '',
  description:     m.description || '',
  steps:           m.steps || [],
  potential_range: m.potentialRange || '',
  requirements:    m.requirements || '',
  tips:            m.tips || '',
  links:           m.links || [],
  sort_order:      m.order ?? 0,
});

// ── Vote helpers ──────────────────────────────────────────────
const DELETE_AFTER_DOWNVOTES = 10;

const getVotes = ()=>{ try{ return JSON.parse(localStorage.getItem("dfh_votes")||"{}"); }catch{ return {}; } };
const setVoteForDeal = (dealId, vote)=>{
  const v=getVotes(); v[dealId]=vote; localStorage.setItem("dfh_votes",JSON.stringify(v));
};
const getVoteForDeal = (dealId)=>getVotes()[dealId]||null;

// ── Methods data ──────────────────────────────────────────────
let _methods = [
  {
    id:"m1",
    title:"Rakuten Cashback",
    tabType:"earn_more",
    summary:"Earn cashback on purchases at 3,500+ stores.",
    description:"Rakuten (formerly Ebates) gives you a percentage of your purchase back as cash every quarter.",
    steps:["Sign up for a free Rakuten account","Install the Rakuten browser extension","Activate cashback before shopping at any participating store","Get paid via PayPal or check every quarter"],
    potentialRange:"$50–$500/year",
    requirements:"Free to join. Must activate before shopping.",
    tips:"Stack with store sales and promo codes for maximum savings. Refer friends for bonus cashback.",
    links:["https://www.rakuten.com"],
    order:0,
    createdAt:new Date().toISOString(),
  },
  {
    id:"m2",
    title:"Ibotta Grocery Cashback",
    tabType:"earn_more",
    summary:"Earn cashback on groceries at major supermarkets.",
    description:"Ibotta lets you earn cashback on groceries by selecting offers before you shop, then scanning your receipt.",
    steps:["Download the free Ibotta app","Browse and unlock offers before shopping","Shop at a participating store","Scan your receipt or link your loyalty card","Cash out via PayPal or gift card ($20 minimum)"],
    potentialRange:"$20–$150/month",
    requirements:"Smartphone required. Available at most US grocery chains.",
    tips:"Check the app weekly — offers refresh. Combine with store sales.",
    links:["https://home.ibotta.com"],
    order:1,
    createdAt:new Date().toISOString(),
  },
  {
    id:"m3",
    title:"Use a Cashback Credit Card",
    tabType:"save_more",
    summary:"Earn 1.5–5% back on every purchase automatically.",
    description:"Cashback credit cards give you a percentage of every purchase back, automatically. No activation needed per purchase.",
    steps:["Compare cashback credit cards (Chase Freedom, Discover it, Citi Double Cash, etc.)","Apply for a card that matches your spending habits","Use it for everyday purchases","Pay the balance in full each month to avoid interest","Redeem cashback as statement credit, direct deposit, or gift cards"],
    potentialRange:"Save 1.5–5% on all spending",
    requirements:"Good to excellent credit recommended. Must pay balance in full to benefit.",
    tips:"Never carry a balance — interest charges will erase cashback gains.",
    links:[],
    order:0,
    createdAt:new Date().toISOString(),
  },
];

const getMethods    = ()=>[..._methods];
const getMethod     = (id)=>_methods.find(m=>m.id===id)||null;
const addMethod     = (m)=>{ _methods=[..._methods,{...m,id:"m"+Date.now(),order:_methods.filter(x=>x.tabType===m.tabType).length,createdAt:new Date().toISOString()}]; };
const updateMethod  = (id,patch)=>{ _methods=_methods.map(m=>m.id===id?{...m,...patch}:m); };
const deleteMethod  = (id)=>{ _methods=_methods.filter(m=>m.id!==id); };

// ── Toast context ─────────────────────────────────────────────
const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);

function ToastProvider({children}){
  const [toasts,setToasts]=useState([]);
  const toast=(msg,type="info")=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  };
  return(
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-wrap">
        {/* Bug 1 fixed: render t.msg directly instead of msg(t.msg); removed wrapper function */}
        {toasts.map(t=>(
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ── Age-gate context ──────────────────────────────────────────
const AgeCtx = createContext(null);
const useAge = () => useContext(AgeCtx);

function AgeProvider({children}){
  const [ok,setOk]=useState(()=>localStorage.getItem(ADULT_OK_STORAGE_KEY)==="true");
  const [show,setShow]=useState(false);
  const [handlers,setHandlers]=useState({onConfirm:null,onDeny:null});

  const ageReq=(onConfirm,onDeny=null)=>{
    setHandlers({onConfirm,onDeny});
    setShow(true);
  };

  const confirm=()=>{
    localStorage.setItem(ADULT_OK_STORAGE_KEY,"true");
    setOk(true);
    setShow(false);
    handlers.onConfirm?.();
    setHandlers({onConfirm:null,onDeny:null});
  };
  const deny=()=>{
    setShow(false);
    handlers.onDeny?.();
    setHandlers({onConfirm:null,onDeny:null});
  };

  return(
    <AgeCtx.Provider value={{ageOk:ok,ageReq}}>
      {children}
      {show&&(
        <div className="modal-bg">
          <div className="modal" style={{textAlign:"center"}}>
            <I n="shield" s={40} c="var(--warn)" style={{marginBottom:16}}/>
            <h2 style={{marginBottom:8}}>Adults only (18+). Are you 18 or older?</h2>
            <p style={{color:"var(--muted)",marginBottom:24}}>
              This category contains adult content.
            </p>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <button className="btn btn-p" onClick={confirm}>Yes, I’m 18+</button>
              <button className="btn btn-d" onClick={deny}>No</button>
            </div>
          </div>
        </div>
      )}
    </AgeCtx.Provider>
  );
}

// ── Auth context ──────────────────────────────────────────────
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

function AuthProvider({children}){
  const [user,setUser]=useState(null);
  const [role,setRole]=useState(null);
  const [authReady,setAuthReady]=useState(false);
  const toast=useToast();
  const safeToast=(msg,type)=>{ if(toast) toast(msg,type); };
  // Prevent concurrent / duplicate redemption attempts across events
  const redeemLockRef=useRef(false);

  const loadRole=async(userId)=>{
    const {data}=await supabase.from('profiles').select('role').eq('id',userId).single();
    setRole(data?.role||null);
  };

  const redeemPendingRef=async(userId)=>{
    // Guard: skip if another call is already in progress
    if(redeemLockRef.current) return;
    const code=localStorage.getItem("dfh_pending_ref");
    if(!code) return;
    // Guard: never retry on subsequent logins for the same user
    const attemptKey=`dfh_ref_attempted_for_user_${userId}`;
    if(localStorage.getItem(attemptKey)) return;
    // Claim the lock and mark the attempt *before* any async work to prevent
    // race conditions between SIGNED_IN and INITIAL_SESSION firing in quick succession
    redeemLockRef.current=true;
    localStorage.setItem(attemptKey,'1');
    try {
      const {data,error}=await supabase.rpc('redeem_referral',{p_ref_code:code});
      // Always clear the pending code after the first attempt so it never spams
      localStorage.removeItem("dfh_pending_ref");
      if(error){
        console.warn('[redeemPendingRef] RPC error:',error);
        safeToast("⚠️ Could not apply referral bonus — please contact support.","err");
        return;
      }
      // `data` is the TEXT return value of the SQL function
      console.log('[redeemPendingRef] RPC result:',data);
      if(data==='ok'){
        safeToast("🎁 Referral bonus applied! You've each earned a raffle entry.","ok");
        window.dispatchEvent(new CustomEvent('dfh:referral-redeemed'));
      } else if(data==='already_referred'){
        // Already credited — silently clean up
      } else if(data==='self_referral'){
        safeToast("⚠️ Self-referrals are not allowed.","err");
      } else if(data==='invalid_code'){
        safeToast("⚠️ Referral code not found.","err");
      } else {
        console.warn('[redeemPendingRef] unexpected response:',data);
        safeToast("⚠️ Referral status unknown — please contact support.","err");
      }
    } finally {
      redeemLockRef.current=false;
    }
  };

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      const u=session?.user??null;
      setUser(u);
      if(u) loadRole(u.id).catch(()=>{}).then(()=>setAuthReady(true));
      else setAuthReady(true);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      const u=session?.user??null;
      setUser(u);
      if(u){
        loadRole(u.id).catch(()=>{});
        // Handle both SIGNED_IN (manual login / password confirm) and INITIAL_SESSION
        // (email-confirmation redirect: Supabase processes the URL tokens during client
        // initialisation and fires INITIAL_SESSION by the time our listener registers)
        if(event==='SIGNED_IN'||event==='INITIAL_SESSION') redeemPendingRef(u.id).catch(()=>{});
      }
      else setRole(null);
    });
    return()=>subscription.unsubscribe();
  },[]);

  const login=async(email,password)=>{
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){ safeToast(error.message,"err"); return false; }
    safeToast("Welcome back!","ok");
    return true;
  };

  const signup=async(email,password)=>{
    const {error}=await supabase.auth.signUp({email,password});
    if(error){ safeToast(error.message,"err"); return false; }
    const hasPendingRef=!!localStorage.getItem("dfh_pending_ref");
    safeToast(
      hasPendingRef
        ? "Check your email to confirm your account. Your referral bonus will be applied after you confirm and log in."
        : "Check your email to confirm your account.",
      "info"
    );
    return true;
  };

  const logout=async()=>{
    await supabase.auth.signOut();
    setRole(null);
    safeToast("Logged out","info");
  };

  const isAdmin=role==="ADMIN";

  if(!authReady) return null;

  return(
    <AuthCtx.Provider value={{user,login,signup,logout,isAdmin}}>
      {children}
    </AuthCtx.Provider>
  );
}

// ── Router (minimal hash-based) ───────────────────────────────
const RouterCtx = createContext(null);

function RouterProvider({children}){
  const [path,setPath]=useState(()=>location.hash.slice(1)||"home");
  const [params,setParams]=useState({});

  useEffect(()=>{
    const onHash=()=>{
      const raw=location.hash.slice(1)||"home";
      const [p,...rest]=raw.split("?");
      const q=Object.fromEntries(new URLSearchParams(rest.join("?")));
      setPath(p);
      setParams(q);
      // Store pending referral code from URL
      if(q.ref) localStorage.setItem("dfh_pending_ref",q.ref);
    };
    window.addEventListener("hashchange",onHash);
    onHash();
    return()=>window.removeEventListener("hashchange",onHash);
  },[]);

  const nav=(to,p={})=>{
    const qs=Object.keys(p).length?"?"+new URLSearchParams(p).toString():"";
    location.hash=to+qs;
  };

  return(
    <RouterCtx.Provider value={{path,params,nav}}>
      {children}
    </RouterCtx.Provider>
  );
}
const useRouter=()=>useContext(RouterCtx);

// ── Guard ─────────────────────────────────────────────────────
function Guard({children,adm=false}){
  const {user,isAdmin}=useAuth();
  const {nav}=useRouter();

  // Bug 4 fixed: added nav and adm to dependency array
  useEffect(()=>{
    if(!user) nav("auth");
    else if(adm&&!isAdmin) nav("home");
  },[user,isAdmin,nav,adm]);

  if(!user) return null;
  if(adm&&!isAdmin) return null;
  return children;
}

// ── Navbar ────────────────────────────────────────────────────
function Navbar(){
  const {nav,path}=useRouter();
  const {user,logout,isAdmin}=useAuth();
  return(
    <nav className="nav">
      <span className="nav-logo" style={{cursor:"pointer"}} onClick={()=>nav("home")}>
        <I n="fire" s={18}/> Deal Flow Hub
      </span>
      <button className="btn btn-d" style={{padding:"7px 14px"}} onClick={()=>nav("deals")}>
        <I n="deals" s={14}/> Deals
      </button>
      <button className="btn btn-d" style={{padding:"7px 14px"}} onClick={()=>nav("otherways")}>
        💡 Save &amp; Earn
      </button>
      <button className="btn btn-d" style={{padding:"7px 14px"}} onClick={()=>nav("raffle")}>
        <I n="gift" s={14}/> Raffle
      </button>
      {isAdmin&&(
        <button className="btn btn-d" style={{padding:"7px 14px"}} onClick={()=>nav("admin")}>
          <I n="admin" s={14}/> Admin
        </button>
      )}
      {user?(
        <button className="btn btn-d" style={{padding:"7px 14px"}} onClick={logout}>
          <I n="logout" s={14}/> Logout
        </button>
      ):(
        <button className="btn btn-p" style={{padding:"7px 14px"}} onClick={()=>nav("auth")}>
          <I n="login" s={14}/> Login
        </button>
      )}
    </nav>
  );
}

// ── DealCard ──────────────────────────────────────────────────
const DT_LABEL = {SALE:"On Sale 💸", PROMO:"Promo Code 🎟️", BOTH:"Sale + Code 🏷️", STACKABLE:"Stackable 💰"};
function DealCard({deal}){
  const {nav}=useRouter();
  const toast=useToast();
  const [imgErr,setImgErr]=useState(false);
  const [,setNowTick]=useState(Date.now());
  const typeTag={SALE:"tag-ok",PROMO:"tag-p",BOTH:"tag-warn",STACKABLE:"tag-ok"};
  const isStackable = deal.isStackable || deal.dealType==="STACKABLE" || deal.dealType==="BOTH";
  const fallbackEmoji=deal.dealType==="SALE"?"💸":deal.dealType==="PROMO"?"🎫":"🎁";

  useEffect(()=>{
    const id = setInterval(()=>setNowTick(Date.now()), 60000);
    return ()=>clearInterval(id);
  },[]);

  const handleCopyCode=(e)=>{
    e.stopPropagation();
    if(deal.code){
      const p=navigator.clipboard?.writeText(deal.code);
      if(p) p.then(()=>toast?.(`Code copied: ${deal.code}`,"ok"))
              .catch(()=>toast?.("Failed to copy code. Please copy manually.","err"));
      else toast?.("Failed to copy code. Please copy manually.","err");
    }
  };

  const handleCopyLink=(e)=>{
    e.stopPropagation();
    if(deal.link){
      const p=navigator.clipboard?.writeText(deal.link);
      if(p) p.then(()=>toast?.("Link copied!","ok"))
              .catch(()=>toast?.("Failed to copy link. Please copy manually.","err"));
      else toast?.("Failed to copy link. Please copy manually.","err");
    }
  };

  const handleLinkClick=(e)=>{
    e.stopPropagation();
    supabase.rpc('increment_deal_clicks',{p_deal_id:deal.id});
  };

  return(
    <div className="deal-card" onClick={()=>nav("deal",{id:deal.id})}>
      <div className="deal-img" style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,overflow:"hidden"}}>
        {deal.imageUrl&&!imgErr
          ?<img src={deal.imageUrl} alt={deal.title} referrerPolicy="no-referrer" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",alignSelf:"stretch"}} onError={()=>setImgErr(true)}/>
          :fallbackEmoji
        }
      </div>
      <div className="deal-body">
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
          <span className={`tag ${typeTag[deal.dealType]||"tag-p"}`}>
            {DT_LABEL[deal.dealType]||deal.dealType}
          </span>
          {deal.featured&&<span className="tag tag-warn"><I n="star" s={11}/> Featured</span>}
          {isStackable&&(
            <span className="tag tag-ok">Stackable</span>
          )}
        </div>
        <h3 style={{fontSize:15,marginBottom:6,lineHeight:1.3}}>{deal.title}</h3>
        <p style={{
          fontSize:13,color:"var(--muted)",marginBottom:10,lineHeight:1.4,
          display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",minHeight:"2.8em"
        }}>{deal.description}</p>
        {(deal.currentPrice != null || deal.originalPrice != null) && (
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            {deal.currentPrice != null && (
              <span style={{fontSize:16,fontWeight:700,color:"var(--p)"}}>
                ${Number(deal.currentPrice).toFixed(2)}
              </span>
            )}
            {deal.originalPrice != null && (
              <span style={{fontSize:13,color:"var(--muted)",textDecoration:"line-through"}}>
                ${Number(deal.originalPrice).toFixed(2)}
              </span>
            )}
            {deal.percentOff != null && (
              <span className="tag tag-ok" style={{fontSize:12}}>
                {Number(deal.percentOff).toFixed(0)}% OFF
              </span>
            )}
          </div>
        )}
        <div style={{display:"flex",gap:12,fontSize:12,color:"var(--muted)"}}>
          <span><I n="clock" s={11}/> {timeSince(deal.createdAt)}</span>
          <span><I n="clock" s={11}/> {tu(deal.expires)}</span>
        </div>
        {isStackable && deal.stackOptions?.length>0 && (
          <p style={{fontSize:12,color:"var(--muted)",marginTop:8}}>
            {deal.stackOptions.slice(0,2).join(" • ")}
          </p>
        )}
        <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid var(--bdr)"}}>
          <VoteBar deal={deal} compact={true}/>
        </div>
        <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
          {(deal.dealType==="SALE"||deal.dealType==="STACKABLE")&&deal.link&&(
            <a className="btn btn-p" href={deal.link} target="_blank" rel="noopener noreferrer" style={{flex:1,justifyContent:"center",fontSize:12,padding:"6px 10px"}} onClick={handleLinkClick}>
              <I n="link" s={12}/> Shop Deal
            </a>
          )}
          {(deal.dealType==="PROMO"||deal.dealType==="BOTH")&&(
            <>
              {deal.code&&(
                <button className="btn btn-o" style={{flex:1,justifyContent:"center",fontSize:12,padding:"6px 10px"}} onClick={handleCopyCode}>
                  <I n="copy" s={12}/> Copy Code
                </button>
              )}
              {deal.link&&(
                <a className="btn btn-p" href={deal.link} target="_blank" rel="noopener noreferrer" style={{flex:1,justifyContent:"center",fontSize:12,padding:"6px 10px"}} onClick={handleLinkClick}>
                  <I n="link" s={12}/> Go to Site
                </a>
              )}
            </>
          )}
          {deal.link&&(
            <button className="btn btn-d" style={{padding:"6px 10px",fontSize:12}} onClick={handleCopyLink}>
              <I n="copy" s={12}/> Copy Link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── VoteBar ───────────────────────────────────────────────────
function VoteBar({deal, onVoted, compact=false}){
  const toast=useToast();
  const [localVote,setLocalVote]=useState(()=>getVoteForDeal(deal.id));
  const [up,setUp]=useState(deal.voteUp||0);
  const [dn,setDn]=useState(deal.voteDown||0);

  const vote=async(type)=>{
    const prev=localVote;
    let newUp=up, newDn=dn;

    if(prev===type){
      if(type==="up") newUp=Math.max(0,up-1);
      else newDn=Math.max(0,dn-1);
      setLocalVote(null);
      setVoteForDeal(deal.id,null);
    } else {
      if(prev==="up") newUp=Math.max(0,up-1);
      if(prev==="down") newDn=Math.max(0,dn-1);
      if(type==="up") newUp=newUp+1;
      else newDn=newDn+1;
      setLocalVote(type);
      setVoteForDeal(deal.id,type);
    }

    setUp(newUp);
    setDn(newDn);
    const {error}=await supabase.from('deals').update({vote_up:newUp,vote_down:newDn}).eq('id',deal.id);
    if(error){ toast?.("Failed to save vote","err"); return; }

    if(newDn>=DELETE_AFTER_DOWNVOTES){
      await supabase.from('deals').update({status:'INACTIVE'}).eq('id',deal.id);
      if(!compact) toast?.(`⚠️ Deal flagged due to ${newDn} downvotes`,"warn");
    }

    if(onVoted) onVoted();
    if(!compact) toast?.(type==="up"?"Thanks for the feedback! 👍":"Thanks for the feedback! 👎","info");
  };

  const btnStyle=(type)=>({
    padding: compact?"4px 8px":"6px 12px",
    fontSize: compact?11:13,
    fontWeight:600,
    border:`1.5px solid ${localVote===type?(type==="up"?"var(--ok)":"var(--err)"):"var(--bdr)"}`,
    background: localVote===type?(type==="up"?"#4dffb422":"#ff4d6d22"):"var(--surf2)",
    color: localVote===type?(type==="up"?"var(--ok)":"var(--err)"):"var(--muted)",
    borderRadius:8,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,transition:"all .15s"
  });

  return(
    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
      {!compact&&<span style={{fontSize:12,color:"var(--muted)",marginRight:2}}>Did it work?</span>}
      <button style={btnStyle("up")} onClick={e=>{e.stopPropagation();vote("up");}}>
        👍 {up}
      </button>
      <button style={btnStyle("down")} onClick={e=>{e.stopPropagation();vote("down");}}>
        👎 {dn}
      </button>
    </div>
  );
}

// ── RaffleBanner ─────────────────────────────────────────────
function RaffleBanner(){
  const {nav}=useRouter();
  const [open,setOpen]=useState(false);
  const prizeAmount = `$${PRIZE_AMOUNT_USD}`;
  return(
    <div style={{background:"linear-gradient(90deg,#4338ca,#7c3aed)",color:"#fff",padding:"12px 24px",textAlign:"center",fontSize:14}}>
      <strong>🎁 Refer friends & family for a chance to win {prizeAmount} cash.</strong> Winner picked every week.{" "}
      <span
        style={{cursor:"pointer",textDecoration:"underline",color:"#fde68a",fontWeight:700}}
        onClick={()=>setOpen(o=>!o)}
      >
        {open?"Hide details ▲":"Learn more ▼"}
      </span>
      {open&&(
        <div style={{background:"rgba(0,0,0,.35)",borderRadius:10,padding:"16px 20px",marginTop:10,textAlign:"left",maxWidth:680,margin:"10px auto 0",fontSize:13,lineHeight:1.75}}>
          <p><strong>Who can enter:</strong> Open to US residents 18 years of age or older.</p>
          <p><strong>No purchase necessary</strong> to enter or win.</p>
          <p><strong>How to enter:</strong> Share your unique referral link from the Raffle page. When someone signs up using your link, confirms their email, and logs in, you both get +1 raffle entry for the current week.</p>
          <p><strong>Winner selection:</strong> One winner is randomly selected every Sunday at 11:59 PM CT from all valid entries for that week.</p>
          <p><strong>How winner is contacted:</strong> By email within 24 hours of the drawing. Winner must respond within 7 days to claim the {prizeAmount} prize (via PayPal or Venmo).</p>
          <p><strong>Void where prohibited by law.</strong></p>
          <p style={{fontSize:11,opacity:.8,marginTop:8}}>This is a general summary. Please review the <span style={{textDecoration:"underline",cursor:"pointer"}} onClick={()=>nav("raffle")}>Full Official Rules</span> for complete details. Deal Flow Hub reserves the right to modify or cancel the promotion at any time.</p>
        </div>
      )}
    </div>
  );
}

// ── HomePage ──────────────────────────────────────────────────
function HomePage(){
  const {nav}=useRouter();
  const {ageOk}=useAge();
  const [featured,setFeatured]=useState([]);

  const handleCategoryClick=(category)=>{
    if(category.adult && !ageOk){
      ageReq(()=>nav("deals",{cat:category.id}));
      return;
    }
    nav("deals",{cat:category.id});
  };

  useEffect(()=>{
    supabase.from('deals').select('*')
      .eq('featured',true).eq('status','ACTIVE')
      .order('created_at',{ascending:false}).limit(4)
      .then(({data})=>{
        const list=(data||[]).map(fromDb);
        setFeatured(ageOk?list:list.filter(d=>!isAdultCategory(d.cat)));
      });
  },[ageOk]);

  return(
    <div>
      <RaffleBanner/>
      <div className="page">
      {/* Hero */}
      <div style={{textAlign:"center",padding:"48px 0 36px"}}>
        <h1 style={{fontSize:40,fontWeight:800,marginBottom:12}}>
          <I n="fire" s={36}/> Deal Flow Hub
        </h1>
        <p style={{color:"var(--muted)",fontSize:18,marginBottom:28}}>
          The best deals, promo codes and offers — curated daily.
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn btn-p" onClick={()=>nav("deals")}>Browse All Deals</button>
        </div>
      </div>

      {/* Categories */}
      <h2 style={{marginBottom:16,fontSize:18}}>Shop by Category</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:12,marginBottom:36}}>
        {CATS.map(c=>(
          // Issue 10 fixed: use .cat-card CSS class with :hover instead of onMouseOver/onMouseOut
          <div
            key={c.id}
            className="cat-card"
            onClick={()=>handleCategoryClick(c)}
          >
            <span style={{fontSize:28}}>{c.emoji}</span>
            <div style={{fontSize:13,fontWeight:600}}>{c.label}</div>
            {c.adult&&<span className="tag tag-err" style={{fontSize:10}}>18+</span>}
          </div>
        ))}
      </div>

      {/* Featured */}
      {featured.length>0&&(
        <>
          <h2 style={{marginBottom:16,fontSize:18}}><I n="star" s={16}/> Featured Deals</h2>
          <div className="grid2">
            {featured.map(d=><DealCard key={d.id} deal={d}/>)}
          </div>
        </>
      )}
      </div>
    </div>
  );
}

// ── DealsPage ─────────────────────────────────────────────────
function DealsPage(){
  const {params,nav}=useRouter();
  const {ageOk,ageReq}=useAge();

  const [dealType,setDealType]=useState(params.dt||"ALL");
  const [cat,setCat]=useState(params.cat||"");
  const [stack,setStack]=useState(!!params.stack);
  const [q,setQ]=useState(params.q||"");
  const [price,setPrice]=useState("ALL");
  const [discount,setDiscount]=useState("ALL");
  const [freshness,setFreshness]=useState("ALL");
  const [sortBy,setSortBy]=useState("POPULAR");
  const [sideOpen,setSideOpen]=useState(false);
  const [allDeals,setAllDeals]=useState([]);
  const lastNonAdultCatRef=useRef("");

  useEffect(()=>{
    supabase.from('deals').select('*').order('created_at',{ascending:false})
      .then(({data})=>setAllDeals((data||[]).map(fromDb)));
  },[]);

  // Bug 5 fixed: sync filter state when params change (e.g. navigating from Home → different filter)
  useEffect(()=>{
    const nextCat=params.cat||"";
    setDealType(params.dt||"ALL");
    if(nextCat&&isAdultCategory(nextCat)&&!ageOk){
      ageReq(
        ()=>setCat(nextCat),
        ()=>setCat(lastNonAdultCatRef.current||"")
      );
      setCat(lastNonAdultCatRef.current||"");
    } else {
      setCat(nextCat);
    }
    setStack(!!params.stack);
    setQ(params.q||"");
  },[params.dt,params.cat,params.stack,params.q,ageOk]);

  useEffect(()=>{
    if(cat&&!isAdultCategory(cat)) lastNonAdultCatRef.current=cat;
  },[cat]);

  const isNewToday=(createdAt)=>{
    const now=new Date();
    const created=new Date(createdAt);
    return now.toDateString()===created.toDateString();
  };

  const isNewThisWeek=(createdAt)=>{
    const now=new Date();
    const created=new Date(createdAt);
    const createdTime=created.getTime();
    if(Number.isNaN(createdTime)) return false;
    const diff=now-created;
    return diff>=0&&diff<=7*24*60*60*1000;
  };

  const getPopularityScore=(deal)=>(deal.saved||0)*5+(deal.voteUp||0)*3-(deal.voteDown||0)*2+(deal.clicks||0);

  const dealTypeMatches=(d)=>{
    if(dealType==="ALL") return true;
    if(dealType==="INSTANT") return ["SALE","STACKABLE"].includes(d.dealType);
    if(dealType==="PROMO_REQUIRED") return ["PROMO","BOTH"].includes(d.dealType);
    return true;
  };

  const priceMatches=(d)=>{
    const p=d.currentPrice;
    if(price==="ALL") return true;
    if(p==null) return false;
    if(price==="UNDER_20") return p<20;
    if(price==="UNDER_50") return p<50;
    if(price==="BETWEEN_50_100") return p>=50&&p<=100;
    if(price==="OVER_100") return p>=100;
    return true;
  };

  const discountMatches=(d)=>{
    const off=d.percentOff;
    if(discount==="ALL") return true;
    if(off==null) return false;
    if(discount==="OFF_25") return off>=25;
    if(discount==="OFF_50") return off>=50;
    if(discount==="OFF_70") return off>=70;
    if(discount==="OFF_80") return off>=80;
    return true;
  };

  const freshnessMatches=(d)=>{
    if(freshness==="ALL") return true;
    if(freshness==="TODAY") return isNewToday(d.createdAt);
    if(freshness==="WEEK") return isNewThisWeek(d.createdAt);
    return true;
  };

  const pickCat=(id)=>{
    const found=CATS.find(c=>c.id===id);
    if(found?.adult&&!ageOk){
      const fallback=(cat&&!isAdultCategory(cat))?cat:lastNonAdultCatRef.current||"";
      ageReq(()=>setCat(id),()=>setCat(fallback));
    } else {
      setCat(id);
    }
  };

  const deals=useMemo(()=>{
    let list=allDeals.filter(d=>d.status==="ACTIVE");
    if(!ageOk) list=list.filter(d=>!isAdultCategory(d.cat));
    list=list.filter(dealTypeMatches);
    if(cat)  list=list.filter(d=>d.cat===cat);
    if(stack)list=list.filter(d=>d.isStackable===true);
    list=list.filter(priceMatches);
    list=list.filter(discountMatches);
    list=list.filter(freshnessMatches);
    if(q){
      const needle=q.toLowerCase();
      list=list.filter(d=>`${d.title||""} ${(d.description||"")}`.toLowerCase().includes(needle));
    }
    const getCreatedAtTime=(value)=>{
      const t=new Date(value).getTime();
      return Number.isNaN(t)?0:t;
    };
    list=[...list].sort((a,b)=>{
      if(sortBy==="NEWEST") return getCreatedAtTime(b.createdAt)-getCreatedAtTime(a.createdAt);
      if(sortBy==="HIGHEST_DISCOUNT") return (b.percentOff??-1)-(a.percentOff??-1);
      if(sortBy==="LOWEST_PRICE") return (a.currentPrice??Infinity)-(b.currentPrice??Infinity);
      if(sortBy==="PRICE_HIGH_TO_LOW") return (b.currentPrice??-1)-(a.currentPrice??-1);
      return getPopularityScore(b)-getPopularityScore(a);
    });
    return list;
  },[allDeals,dealType,cat,stack,price,discount,freshness,q,sortBy]);

  const Sidebar=()=>(
    <div id="deals-sidebar" className={`sidebar card${sideOpen?" open":""}`}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:13,color:"var(--muted)",marginBottom:6}}>Deal Type</div>
        {[
          {value:"ALL",label:"All"},
          {value:"INSTANT",label:"Instant Deals"},
          {value:"PROMO_REQUIRED",label:"Promo Code Required"},
        ].map(v=>(
          <label key={v.value} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer",fontSize:14}}>
            <input type="radio" name="dt" checked={dealType===v.value} onChange={()=>setDealType(v.value)} style={{width:"auto"}}/>
            {v.label}
          </label>
        ))}
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:13,color:"var(--muted)",marginBottom:6}}>Price</div>
        {[
          {value:"ALL",label:"All"},
          {value:"UNDER_20",label:"Under $20"},
          {value:"UNDER_50",label:"Under $50"},
          {value:"BETWEEN_50_100",label:"$50–$100"},
          {value:"OVER_100",label:"$100+"},
        ].map(v=>(
          <label key={v.value} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer",fontSize:14}}>
            <input type="radio" name="price" checked={price===v.value} onChange={()=>setPrice(v.value)} style={{width:"auto"}}/>
            {v.label}
          </label>
        ))}
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:13,color:"var(--muted)",marginBottom:6}}>Discount</div>
        {[
          {value:"ALL",label:"All"},
          {value:"OFF_25",label:"25%+"},
          {value:"OFF_50",label:"50%+"},
          {value:"OFF_70",label:"70%+"},
          {value:"OFF_80",label:"80%+"},
        ].map(v=>(
          <label key={v.value} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer",fontSize:14}}>
            <input type="radio" name="discount" checked={discount===v.value} onChange={()=>setDiscount(v.value)} style={{width:"auto"}}/>
            {v.label}
          </label>
        ))}
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:13,color:"var(--muted)",marginBottom:6}}>Category</div>
        {[{id:"",label:"All Categories",adult:false},...CATS].map(c=>(
          <label key={c.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer",fontSize:14}}>
            {/* Bug 8 fixed: use onChange with pickCat instead of readOnly */}
            <input type="radio" name="cat" checked={cat===c.id} onChange={()=>pickCat(c.id||"")} style={{width:"auto"}}/>
            {c.label}{c.adult&&<span className="tag tag-err" style={{fontSize:10}}>18+</span>}
          </label>
        ))}
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:13,color:"var(--muted)",marginBottom:6}}>Freshness</div>
        {[
          {value:"ALL",label:"All"},
          {value:"TODAY",label:"New Today"},
          {value:"WEEK",label:"New This Week"},
        ].map(v=>(
          <label key={v.value} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer",fontSize:14}}>
            <input type="radio" name="freshness" checked={freshness===v.value} onChange={()=>setFreshness(v.value)} style={{width:"auto"}}/>
            {v.label}
          </label>
        ))}
      </div>
      <label style={{display:"flex",alignItems:"center",gap:8,fontSize:14,cursor:"pointer"}}>
        <input type="checkbox" checked={stack} onChange={e=>setStack(e.target.checked)} style={{width:"auto"}}/>
        Stackable Only
      </label>
    </div>
  );

  return(
    <div className="page">
      {/* Issue 9 fixed: removed inline <style> tag; media query rules are in _st.textContent above */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <h1 style={{fontSize:22,fontWeight:700,flex:1}}><I n="deals" s={18}/> All Deals</h1>
        <button id="mob-filter-btn" className="btn btn-d" onClick={()=>setSideOpen(o=>!o)}>
          <I n="filter" s={14}/> Filters
        </button>
        <div style={{position:"relative",minWidth:200}}>
          <input
            placeholder="Search deals, brands, products…"
            value={q}
            onChange={e=>setQ(e.target.value)}
            style={{paddingLeft:36}}
          />
          <I n="search" s={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
        </div>
        <div style={{minWidth:190}}>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="POPULAR">Most Popular</option>
            <option value="NEWEST">Newest</option>
            <option value="HIGHEST_DISCOUNT">Highest Discount</option>
            <option value="LOWEST_PRICE">Lowest Price</option>
            <option value="PRICE_HIGH_TO_LOW">Price: High to Low</option>
          </select>
        </div>
      </div>
      <div className="deals-layout">
        <Sidebar/>
        <div style={{flex:1}}>
          {deals.length===0?(
            <div style={{textAlign:"center",padding:48,color:"var(--muted)"}}>
              <I n="search" s={32}/>
              <p style={{marginTop:12}}>No deals found. Try adjusting your filters.</p>
            </div>
          ):(
            <div className="grid2">
              {deals.map(d=><DealCard key={d.id} deal={d}/>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DealPage ──────────────────────────────────────────────────
function DealPage(){
  const {params,nav}=useRouter();
  const {ageOk,ageReq}=useAge();
  const toast=useToast();
  const [deal,setDeal]=useState(null);
  const [loading,setLoading]=useState(true);
  const [revealed,setRevealed]=useState(false);
  const [imgErr,setImgErr]=useState(false);

  useEffect(()=>{
    setLoading(true);
    setRevealed(false);
    setImgErr(false);
    supabase.from('deals').select('*').eq('id',params.id).single()
      .then(({data})=>{ setDeal(data?fromDb(data):null); setLoading(false); });
  },[params.id]);

  const cat=CATS.find(c=>c.id===deal?.cat);

  // Bug 3 fixed: added ageOk to dependency array
  useEffect(()=>{
    if(cat?.adult&&!ageOk) ageReq(()=>{});
  },[deal?.id,ageOk]);

  if(loading) return(
    <div className="page" style={{textAlign:"center",paddingTop:80}}>
      <p style={{color:"var(--muted)"}}>Loading…</p>
    </div>
  );

  if(!deal) return(
    <div className="page" style={{textAlign:"center",paddingTop:80}}>
      <I n="search" s={48}/>
      <p style={{marginTop:16,color:"var(--muted)"}}>Deal not found.</p>
      <button className="btn btn-p" style={{marginTop:16}} onClick={()=>nav("deals")}>Browse Deals</button>
    </div>
  );

  if(cat?.adult&&!ageOk) return(
    <div className="page" style={{textAlign:"center",paddingTop:80}}>
      <I n="lock" s={48}/>
      <p style={{marginTop:16,color:"var(--muted)"}}>Age verification required.</p>
    </div>
  );

  const refreshDeal=()=>{
    supabase.from('deals').select('*').eq('id',deal.id).single()
      .then(({data})=>{ if(data) setDeal(fromDb(data)); });
  };

  const copyCode=()=>{
    if(deal.code){
      const p=navigator.clipboard?.writeText(deal.code);
      if(p) p.then(()=>toast?.(`Code copied: ${deal.code}`,"ok"))
              .catch(()=>toast?.("Failed to copy code. Please copy manually.","err"));
      else toast?.("Failed to copy code. Please copy manually.","err");
    }
  };

  const copyLink=()=>{
    if(deal.link){
      const p=navigator.clipboard?.writeText(deal.link);
      if(p) p.then(()=>toast?.("Link copied!","ok"))
              .catch(()=>toast?.("Failed to copy link. Please copy manually.","err"));
      else toast?.("Failed to copy link. Please copy manually.","err");
    }
  };

  const incrementClicks=async()=>{
    const {error}=await supabase.rpc('increment_deal_clicks',{p_deal_id:deal.id});
    if(!error) setDeal(d=>({...d,clicks:d.clicks+1}));
  };

  // mainAction: copy code and reveal for PROMO/BOTH deals
  const mainAction=()=>{
    // PROMO or BOTH: copy code AND reveal
    copyCode();
    setRevealed(true);
    incrementClicks();
  };

  const typeTag={SALE:"tag-ok",PROMO:"tag-p",BOTH:"tag-warn",STACKABLE:"tag-ok"};
  const isStackable = deal.isStackable || deal.dealType==="STACKABLE" || deal.dealType==="BOTH";

  return(
    <div className="page" style={{maxWidth:700}}>
      <button className="btn btn-d" style={{marginBottom:20}} onClick={()=>nav("deals")}>
        ← Back to Deals
      </button>
      <div className="card">
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <span className={`tag ${typeTag[deal.dealType]||"tag-p"}`}>{DT_LABEL[deal.dealType]||deal.dealType}</span>
          {deal.featured&&<span className="tag tag-warn"><I n="star" s={11}/> Featured</span>}
          {cat&&<span className="tag tag-p">{cat.label}</span>}
        </div>
        <h1 style={{fontSize:24,marginBottom:10}}>{deal.title}</h1>

        {(deal.currentPrice != null || deal.originalPrice != null) && (
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            {deal.currentPrice != null && (
              <span style={{fontSize:22,fontWeight:700,color:"var(--p)"}}>
                ${Number(deal.currentPrice).toFixed(2)}
              </span>
            )}
            {deal.originalPrice != null && (
              <span style={{fontSize:16,color:"var(--muted)",textDecoration:"line-through"}}>
                ${Number(deal.originalPrice).toFixed(2)}
              </span>
            )}
            {deal.percentOff != null && (
              <span className="tag tag-ok" style={{fontSize:14,padding:"4px 10px"}}>
                {Number(deal.percentOff).toFixed(0)}% OFF
              </span>
            )}
          </div>
        )}

        {deal.imageUrl&&!imgErr&&(
          <div style={{borderRadius:12,overflow:"hidden",marginBottom:20}}>
            <img src={deal.imageUrl} alt={deal.title} referrerPolicy="no-referrer" style={{width:"100%",maxHeight:340,objectFit:"cover"}} onError={()=>setImgErr(true)}/>
          </div>
        )}

        <p style={{color:"var(--muted)",marginBottom:20,lineHeight:1.6}}>{deal.description}</p>

        <div style={{background:"var(--surf2)",border:"1.5px solid var(--bdr)",borderRadius:10,padding:"14px 18px",marginBottom:20}}>
          <VoteBar deal={deal} onVoted={refreshDeal}/>
        </div>

        <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap",fontSize:14,color:"var(--muted)"}}>
          <span><I n="clock" s={13}/> {timeSince(deal.createdAt)}</span>
          <span><I n="clock" s={13}/> {tu(deal.expires)}</span>
          <span>Expires {fmtDate(deal.expires)}</span>
        </div>

        {isStackable&&deal.stackInstructions&&(
          <div style={{background:"var(--surf2)",border:"1.5px solid var(--ok)",borderRadius:10,padding:"14px 18px",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,color:"var(--ok)",marginBottom:6}}>💰 Cashback Stack Instructions</div>
            <p style={{fontSize:14,color:"var(--txt)",lineHeight:1.6}}>{deal.stackInstructions}</p>
          </div>
        )}

        {isStackable && deal.stackOptions?.length>0 && (
          <div style={{background:"var(--surf2)",border:"1.5px solid var(--bdr)",borderRadius:10,padding:"14px 18px",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Can be stacked with</div>
            <p style={{fontSize:14,color:"var(--muted)",lineHeight:1.6}}>{deal.stackOptions.join(" • ")}</p>
          </div>
        )}

        {deal.dealType!=="SALE"&&deal.dealType!=="STACKABLE"&&(
          <div style={{marginBottom:20}}>
            {revealed?(
              <div style={{background:"var(--surf2)",border:"1.5px solid var(--p)",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <span style={{fontWeight:700,fontSize:18,letterSpacing:2,color:"var(--p)"}}>{deal.code}</span>
                <button className="btn btn-o" onClick={copyCode}><I n="copy" s={14}/> Copy</button>
              </div>
            ):(
              <button className="btn btn-p" onClick={mainAction} style={{width:"100%",justifyContent:"center",padding:"14px"}}>
                <I n="tag" s={16}/> Copy Code &amp; Shop
              </button>
            )}
          </div>
        )}

        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {(deal.dealType==="SALE"||deal.dealType==="STACKABLE")&&deal.link&&(
            <a className="btn btn-p" href={deal.link} target="_blank" rel="noopener noreferrer" style={{flex:1,justifyContent:"center"}} onClick={incrementClicks}>
              <I n="link" s={14}/> Shop Deal
            </a>
          )}
          {(deal.dealType==="PROMO"||deal.dealType==="BOTH")&&revealed&&deal.link&&(
            <a className="btn btn-p" href={deal.link} target="_blank" rel="noopener noreferrer" style={{flex:1,justifyContent:"center"}} onClick={incrementClicks}>
              <I n="link" s={14}/> Go to Product
            </a>
          )}
          {deal.link&&(
            <button className="btn btn-d" style={{padding:"10px 22px"}} onClick={copyLink}>
              <I n="copy" s={14}/> Copy Link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AuthPage ──────────────────────────────────────────────────
function AuthPage(){
  const {user,login,signup,isAdmin}=useAuth();
  const {nav}=useRouter();
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [mode,setMode]=useState("login");
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    if(user) nav(isAdmin?"admin":"dashboard");
  },[user,isAdmin]);

  if(user) return null;

  const submit=async(e)=>{
    e.preventDefault();
    setLoading(true);
    mode==="signup"?await signup(email,pass):await login(email,pass);
    setLoading(false);
    // Navigation handled by useEffect watching user + isAdmin
  };

  return(
    <div className="page" style={{display:"flex",justifyContent:"center",paddingTop:60}}>
      <div className="card" style={{width:"100%",maxWidth:400}}>
        <h2 style={{marginBottom:4,textAlign:"center"}}><I n="user" s={20}/> {mode==="signup"?"Create Account":"Sign In"}</h2>
        <p style={{textAlign:"center",color:"var(--muted)",fontSize:13,marginBottom:24}}>
          {mode==="signup"?"Join Deal Flow Hub to save and share deals.":"Welcome back! Sign in to your account."}
        </p>
        <form onSubmit={submit}>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:13,color:"var(--muted)",marginBottom:4,display:"block"}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:13,color:"var(--muted)",marginBottom:4,display:"block"}}>Password</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" required/>
          </div>
          <button className="btn btn-p" type="submit" disabled={loading} style={{width:"100%",justifyContent:"center",padding:"12px"}}>
            {loading?(mode==="signup"?"Creating account…":"Signing in…"):(mode==="signup"?<><I n="user" s={14}/> Create Account</>:<><I n="login" s={14}/> Sign In</>)}
          </button>
        </form>
        <div style={{marginTop:16,textAlign:"center",fontSize:13,color:"var(--muted)"}}>
          {mode==="login"?(
            <>Don&apos;t have an account? <span style={{color:"var(--p)",cursor:"pointer"}} onClick={()=>setMode("signup")}>Sign up</span></>
          ):(
            <>Already have an account? <span style={{color:"var(--p)",cursor:"pointer"}} onClick={()=>setMode("login")}>Sign in</span></>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DashPage (placeholder) ────────────────────────────────────
function DashPage(){
  const {user}=useAuth();
  return(
    <Guard>
      <div className="page">
        <h1 style={{marginBottom:8}}>Welcome, {user?.email}</h1>
        <p style={{color:"var(--muted)"}}>Your saved deals and preferences will appear here.</p>
      </div>
    </Guard>
  );
}

// ── DealForm ──────────────────────────────────────────────────
// ── Deal-text parser: Markdown table or "Field: Value" plaintext ──
// Thin wrapper so the parser can reference the app's CATS for category matching.
const parseDealText = (raw) => _parseDealText(raw, CATS);
const parseMethodText = (raw) => _parseMethodText(raw);

// ── Product image auto-fetch ──────────────────────────────────
const fetchProductImage = async (url) => {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), 8000);
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy, {signal: ctrl.signal});
    clearTimeout(timer);
    if (!res.ok) return null;
    const {contents} = await res.json();
    if (!contents) return null;
    // 1) og:image — universal standard (works for Amazon and most e-commerce sites)
    const og = contents.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
            || contents.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    if (og?.[1]) {
      // Use DOMParser to decode all HTML entities (e.g. &amp; in query strings)
      try {
        const txt = new DOMParser().parseFromString(og[1],'text/html').documentElement.textContent;
        if (txt) return txt;
      } catch {}
      return og[1];
    }
    // 2) Amazon-specific: data-old-hires — full-resolution direct URL
    const hiRes = contents.match(/data-old-hires="([^"]+)"/);
    if (hiRes?.[1]) return hiRes[1];
    // 3) Amazon-specific: data-a-dynamic-image JSON map — first key is the largest image
    const dyn = contents.match(/data-a-dynamic-image="([^"]+)"/);
    if (dyn?.[1]) {
      try {
        const map = JSON.parse(dyn[1].replace(/&quot;/g,'"').replace(/&#34;/g,'"'));
        const urls = Object.keys(map);
        if (urls.length) return urls[0];
      } catch {}
    }
    // 4) Amazon-specific: landingImage src fallback
    const landing = contents.match(/id="landingImage"[^>]+src="([^"]+)"/);
    if (landing?.[1]) return landing[1];
    return null;
  } catch { return null; }
};

function DealForm({initial,onSave,onCancel}){
  const toast=useToast();
  const [s,setS]=useState(initial||{
    title:"",description:"",link:"https://",dealType:"SALE",code:"",
    cat:"electronics",expires:ad(7).slice(0,10),featured:false,status:"ACTIVE",
    imageUrl:"", stackInstructions:"",
    isStackable:false, stackOptions:[],
    currentPrice: null, originalPrice: null, percentOff: null,
  });

  const set=(k,v)=>setS(p=>({...p,[k]:v}));

  // Shared helper: try to auto-fetch the product image for a URL, then set imageUrl state.
  const autoFetchImage = async (url) => {
    if (!url || !/^https?:\/\/[^/\s]+/i.test(url)) return;
    setParsing(true);
    try {
      const img = await fetchProductImage(url);
      if (img) set("imageUrl", img);
    } catch {
      // Silent failure — image auto-fetch is best-effort
    } finally {
      setParsing(false);
    }
  };

  const [pasteText,setPasteText]=useState('');
  const [parsing,setParsing]=useState(false);
  const handleParse=async()=>{
    const parsed=parseDealText(pasteText);
    const count=Object.keys(parsed).length;
    if(count===0){ toast?.("Could not parse any fields — check the format and try again","err"); return; }
    if(parsed.percentOff==null&&parsed.currentPrice!=null&&parsed.originalPrice!=null&&parsed.originalPrice>0){
      parsed.percentOff=Math.max(0,Math.round(((parsed.originalPrice-parsed.currentPrice)/parsed.originalPrice)*100));
    }
    const targetLink = parsed.link || s.link;
    if (!parsed.imageUrl && /^https?:\/\/[^/\s]+/i.test(targetLink)) {
      setParsing(true);
      try {
        const img = await fetchProductImage(targetLink);
        if (img) parsed.imageUrl = img;
      } finally {
        setParsing(false);
      }
    }
    setS(p=>({...p,...parsed}));
    setPasteText('');
    if(count<3) toast?.(`Partially filled ${count} field${count>1?"s":""}. Please review.`,"info");
    else toast?.(`Auto-filled ${count} field${count>1?"s":""}. Review before saving.`,"ok");
  };

  const submit=(e)=>{
    e.preventDefault();
    if(!s.title||!s.link){ toast?.("Title and link are required","err"); return; }
    if((s.dealType==="PROMO"||s.dealType==="BOTH")&&!s.code.trim()){
      toast?.("Promo code is required for Promo and Sale+Code deal types","err");
      return;
    }
    if((s.isStackable||s.dealType==="STACKABLE")&&!(s.stackInstructions||"").trim()){
      toast?.("Stack instructions are required for stackable deals","err");
      return;
    }
    onSave(s);
  };

  return(
    <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{background:"var(--surf2)",border:"1.5px solid var(--bdr)",borderRadius:10,padding:12}}>
        <label style={{fontSize:12,color:"var(--muted)",marginBottom:6,display:"block",fontWeight:600}}>⚡ Paste deal info (Markdown table or Field: Value)</label>
        <textarea
          value={pasteText}
          onChange={e=>setPasteText(e.target.value)}
          rows={4}
          placeholder="| Field | Suggested Entry |
| Title | My Deal Title |
| Deal Type | SALE |
— or —
Title: My Deal Title
Deal Type: SALE"
          style={{fontFamily:"monospace",fontSize:12,marginBottom:8}}
        />
        <button type="button" className="btn btn-o" onClick={handleParse} disabled={parsing} style={{fontSize:13,padding:"6px 14px"}}>
          <I n="check" s={13}/> {parsing?"Fetching image…":"Parse & Autofill"}
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Title *</label>
          <input value={s.title} onChange={e=>set("title",e.target.value)} placeholder="Deal title" required/>
        </div>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Deal Type</label>
          <select value={s.dealType} onChange={e=>set("dealType",e.target.value)}>
            <option value="SALE">SALE</option>
            <option value="PROMO">PROMO</option>
            <option value="BOTH">BOTH</option>
            <option value="STACKABLE">STACKABLE</option>
          </select>
        </div>
      </div>
      <div>
        <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Description</label>
        <textarea value={s.description} onChange={e=>set("description",e.target.value)} rows={2} placeholder="Brief description"/>
      </div>
      <div>
        <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Product Image URL</label>
        <input value={s.imageUrl||""} onChange={e=>set("imageUrl",e.target.value)} placeholder="https://images.unsplash.com/..."/>
        {s.imageUrl&&(
          <img src={s.imageUrl} alt="preview" referrerPolicy="no-referrer" style={{marginTop:8,width:"100%",maxHeight:140,objectFit:"cover",borderRadius:8,border:"1px solid var(--bdr)"}} onError={e=>{e.target.style.display="none";}}/>
        )}
      </div>
      {/* Pricing fields */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Current Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={s.currentPrice ?? ""}
            onChange={e => {
              const val = e.target.value;
              const cur = val === "" ? null : parseFloat(val);
              const orig = s.originalPrice;
              const pct = (cur != null && orig != null && orig > 0)
                ? Math.max(0, Math.round(((orig - cur) / orig) * 100))
                : s.percentOff;
              setS(p => ({...p, currentPrice: cur, percentOff: pct}));
            }}
            placeholder="e.g. 19.99"
          />
        </div>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Original Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={s.originalPrice ?? ""}
            onChange={e => {
              const val = e.target.value;
              const orig = val === "" ? null : parseFloat(val);
              const cur = s.currentPrice;
              const pct = (cur != null && orig != null && orig > 0)
                ? Math.max(0, Math.round(((orig - cur) / orig) * 100))
                : s.percentOff;
              setS(p => ({...p, originalPrice: orig, percentOff: pct}));
            }}
            placeholder="e.g. 39.99"
          />
        </div>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>% Off (auto-calculated)</label>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={s.percentOff ?? ""}
            onChange={e => set("percentOff", e.target.value === "" ? null : parseFloat(e.target.value))}
            placeholder="e.g. 50"
          />
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Product URL *</label>
          <input value={s.link} onChange={e=>set("link",e.target.value)} onBlur={e=>{ if(!s.imageUrl) autoFetchImage(e.target.value); }} required/>
        </div>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Promo Code</label>
          <input value={s.code} onChange={e=>set("code",e.target.value)} placeholder="e.g. SAVE20"/>
        </div>
      </div>
      {(s.isStackable||s.dealType==="STACKABLE"||s.dealType==="BOTH")&&(
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>
            Stack Instructions * <span style={{fontWeight:400}}>(required for stackable deals)</span>
          </label>
          <textarea
            value={s.stackInstructions||""}
            onChange={e=>set("stackInstructions",e.target.value)}
            rows={2}
            placeholder="e.g. Activate Rakuten before clicking through for 5% back on top of the sale price."
          />
        </div>
      )}
      <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:14}}>
          <input type="checkbox" checked={!!s.isStackable} onChange={e=>set("isStackable",e.target.checked)} style={{width:"auto"}}/>
          Stackable
        </label>
      </div>
      {(s.isStackable||s.dealType==="STACKABLE"||s.dealType==="BOTH")&&(
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Stack Options (comma separated)</label>
          <input
            value={(s.stackOptions||[]).join(", ")}
            onChange={e=>set("stackOptions",e.target.value.split(",").map(v=>v.trim()).filter(Boolean))}
            placeholder="Cashback, Rewards Points, Free Shipping"
          />
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Category</label>
          <select value={s.cat} onChange={e=>set("cat",e.target.value)}>
            {CATS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Expires</label>
          <input type="date" value={s.expires?.slice(0,10)} onChange={e=>set("expires",e.target.value)}/>
        </div>
      </div>
      <div style={{display:"flex",gap:16,alignItems:"center"}}>
        <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:14}}>
          <input type="checkbox" checked={s.featured} onChange={e=>set("featured",e.target.checked)} style={{width:"auto"}}/>
          Featured
        </label>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:14}}>
          <label style={{color:"var(--muted)"}}>Status</label>
          <select value={s.status||"ACTIVE"} onChange={e=>set("status",e.target.value)} style={{width:"auto",padding:"4px 10px",fontSize:13}}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        {onCancel&&<button type="button" className="btn btn-d" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn btn-p"><I n="check" s={14}/> Save Deal</button>
      </div>
    </form>
  );
}

const PARSER_SNIPPET = `// src/parser.js – copy this file locally to test the parser independently.
// Usage:
//   import { parseDealText } from './src/parser.js';
//   const deal = parseDealText(rawText, CATS);

// ── Accepted input formats ────────────────────────────────────
// 1) Markdown table:
//    | Field          | Suggested Entry                  |
//    | Title          | My Deal Title                    |
//    | Deal Type      | SALE                             |
//    | Description    | Short description here           |
//    | Image URL      | https://example.com/img.jpg      |
//    | Product URL    | https://example.com/product      |
//    | Promo Code     | SAVE10                           |
//    | Category       | Electronics                      |
//    | Expires        | 2025-12-31                       |
//    | Featured       | true                             |
//    | Status         | ACTIVE                           |
//    | Current Price  | $29.99                           |
//    | Original Price | $39.99                           |
//    | Percent Off    | 25                               |
//
// 2) Plaintext "Field: Value":
//    Title: My Deal Title
//    Deal Type: SALE
//    image: https://example.com/img.jpg
//    url: https://example.com/product
//    promo: SAVE10
//    cat: electronics
//    Expires: 2025-12-31
//    Featured: yes
//    Status: ACTIVE
//    Current Price: $29.99
//    Original price: $39.99
//    Percent Off: 25
//
// ── Field-label aliases ───────────────────────────────────────
//   All field names are case-insensitive (punctuation is stripped).
//   imageUrl      ← "Product Image URL" | "imageUrl"      | "image"
//   link          ← "Product URL"       | "link"          | "url"
//   code          ← "Promo Code"        | "code"          | "promo"
//   cat           ← "Category"          | "cat"
//   currentPrice  ← "Current Price"     | "price"         | "sale price"  | "deal price"  | "current_price"  | "currentPrice"
//   originalPrice ← "Original Price"    | "price before"  | "price before deals" | "regular price" | "MSRP" | "list price" | "original_price" | "originalPrice"
//   percentOff    ← "% off"             | "percent off"   | "discount"    | "discount percent" | "percent_off" | "percentOff"
//
// ── Return value ─────────────────────────────────────────────
//   Normalized deal object, e.g.:
//   {
//     title: "My Deal Title",
//     dealType: "SALE",
//     description: "Short description here",
//     imageUrl: "https://example.com/img.jpg",
//     link: "https://example.com/product",
//     code: "SAVE10",
//     cat: "electronics",
//     expires: "2025-12-31",
//     featured: true,
//     status: "ACTIVE",
//     currentPrice: 29.99,
//     originalPrice: 39.99,
//     percentOff: 25
//   }
//   Returns {} (empty object) if no fields can be parsed.`;

// ── ListingReference ─────────────────────────────────────────
const METHOD_LISTING_SNIPPET = `// Save & Earn Method — field reference
// Each entry in _methods must follow this shape:

{
  // ── Required ──────────────────────────────────────────────
  "id":            "m1",              // Unique ID (auto-assigned: "m" + Date.now()).
  "title":         "Rakuten Cashback",// Display name shown on the card heading.
  "tabType":       "earn_more",       // Tab bucket (see valid values below).
  "summary":       "Earn cashback on purchases at 3,500+ stores.",
                                      // One-sentence hook shown in the card preview.
  "description":   "Rakuten (formerly Ebates) gives you a percentage of your purchase back as cash every quarter.",
                                      // Full explanation rendered in the detail view.

  // ── Guidance ──────────────────────────────────────────────
  "steps": [                          // Ordered list of how-to instructions.
    "Sign up for a free Rakuten account",
    "Install the Rakuten browser extension",
    "Activate cashback before shopping at any participating store",
    "Get paid via PayPal or check every quarter"
  ],
  "potentialRange": "$50–$500/year",  // Expected earnings / savings range (string).
  "requirements":  "Free to join. Must activate before shopping.",
                                      // Prerequisites or eligibility notes.
  "tips":          "Stack with store sales and promo codes for maximum savings.",
                                      // Pro tips shown below the steps.
  "links": [                          // Array of resource URLs (can be empty []).
    "https://www.rakuten.com"
  ],

  // ── System ────────────────────────────────────────────────
  "order":         0,                 // Sort position within the same tabType group (0-based, auto-set).
  "createdAt":     "2025-01-01T00:00:00.000Z" // ISO timestamp (auto-assigned on creation).
}

// ── Valid tabType values ──────────────────────────────────────
// "earn_more"  →  💰 Earn More   tab  (methods that generate income / cashback)
// "save_more"  →  🏷️ Save More   tab  (methods that reduce spend / find discounts)`;

function ListingReference(){
  const toast=useToast();
  const [copied,setCopied]=useState(false);
  const copy=()=>{
    navigator.clipboard.writeText(METHOD_LISTING_SNIPPET).then(()=>{
      setCopied(true); toast?.("Snippet copied to clipboard","ok");
      setTimeout(()=>setCopied(false),2000);
    }).catch(()=>toast?.("Copy failed — select and copy manually","err"));
  };

  const FIELDS=[
    {name:"id",          req:"auto",     desc:'Unique method ID. Auto-assigned as "m" + Date.now() on creation.'},
    {name:"title",       req:"required", desc:"Display name shown on the card heading."},
    {name:"tabType",     req:"required", desc:'Tab bucket. Valid: "earn_more" (💰 Earn More) or "save_more" (🏷️ Save More).'},
    {name:"summary",     req:"required", desc:"One-sentence hook displayed in the card preview."},
    {name:"description", req:"required", desc:"Full explanation rendered in the method detail view."},
    {name:"steps",       req:"required", desc:"Ordered string array of how-to instructions."},
    {name:"potentialRange",req:"required",desc:'Expected earnings or savings range, e.g. "$50–$500/year".'},
    {name:"requirements",req:"optional", desc:"Prerequisites or eligibility notes shown below the description."},
    {name:"tips",        req:"optional", desc:"Pro tips displayed beneath the steps."},
    {name:"links",       req:"optional", desc:"Array of resource URLs. Use [] when there are no links."},
    {name:"order",       req:"auto",     desc:"Sort position within the same tabType group (0-based). Auto-set on creation."},
    {name:"createdAt",   req:"auto",     desc:"ISO 8601 timestamp. Auto-assigned on creation."},
  ];

  const badgeStyle=(req)=>({
    display:"inline-block",padding:"1px 8px",borderRadius:20,fontSize:11,fontWeight:600,
    background: req==="required"?"#6c63ff22":req==="auto"?"#4dffb422":"#ffd16622",
    color:       req==="required"?"var(--p)":  req==="auto"?"var(--ok)":   "var(--warn)",
  });

  return(
    <div style={{maxWidth:860,display:"flex",flexDirection:"column",gap:20}}>
      <div className="card">
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <h3 style={{flex:1,fontSize:17}}>📋 Save &amp; Earn — Listing Reference</h3>
          <button className="btn btn-o" style={{fontSize:13,padding:"6px 14px"}} onClick={copy}>
            <I n="copy" s={13}/> {copied?"Copied!":"Copy JSON"}
          </button>
        </div>
        <p style={{fontSize:13,color:"var(--muted)",marginBottom:20,lineHeight:1.6}}>
          Every entry in <code>_methods</code> (in <code>styles.js</code>) must follow the shape below.
          Use the table to understand each field, then copy the annotated JSON example as a starting point.
        </p>
        <div style={{overflowX:"auto",marginBottom:0}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{borderBottom:"1.5px solid var(--bdr)",color:"var(--muted)",fontSize:12}}>
                {["Field","Status","Description"].map(h=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:600}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FIELDS.map(f=>(
                <tr key={f.name} style={{borderBottom:"1px solid var(--bdr)"}}>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",fontSize:13,color:"var(--p)",whiteSpace:"nowrap"}}>
                    {f.name}
                  </td>
                  <td style={{padding:"9px 12px",whiteSpace:"nowrap"}}>
                    <span style={badgeStyle(f.req)}>{f.req}</span>
                  </td>
                  <td style={{padding:"9px 12px",color:"var(--txt)",lineHeight:1.5}}>{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h4 style={{fontSize:15,marginBottom:12}}>Annotated JSON Example</h4>
        <pre style={{
          background:"var(--bg)",border:"1.5px solid var(--bdr)",borderRadius:10,
          padding:"16px 18px",fontSize:12,lineHeight:1.7,overflowX:"auto",
          color:"var(--txt)",fontFamily:"'Fira Code','Cascadia Code',monospace",
          whiteSpace:"pre",maxHeight:520,
        }}>{METHOD_LISTING_SNIPPET}</pre>
      </div>
    </div>
  );
}

// ── ParserReference ───────────────────────────────────────────
function ParserReference(){
  const toast=useToast();
  const [copied,setCopied]=useState(false);
  const copy=()=>{
    navigator.clipboard.writeText(PARSER_SNIPPET).then(()=>{
      setCopied(true); toast?.("Snippet copied to clipboard","ok");
      setTimeout(()=>setCopied(false),2000);
    }).catch(()=>toast?.("Copy failed — select and copy manually","err"));
  };
  return(
    <div className="card" style={{maxWidth:860}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <h3 style={{flex:1,fontSize:17}}>⚡ Deal Info Parser — <code style={{fontSize:14,color:"var(--p)"}}>src/parser.js</code></h3>
        <button className="btn btn-o" style={{fontSize:13,padding:"6px 14px"}} onClick={copy}>
          <I n="copy" s={13}/> {copied?"Copied!":"Copy Snippet"}
        </button>
      </div>
      <p style={{fontSize:13,color:"var(--muted)",marginBottom:16,lineHeight:1.6}}>
        Paste deal info as a Markdown table or plaintext <code>Field: Value</code> list into
        the autofill box in the Add / Edit Deal form to auto-populate all fields.
        Copy the snippet below to test the parser locally before deployment.
      </p>
      <pre style={{
        background:"var(--bg)",border:"1.5px solid var(--bdr)",borderRadius:10,
        padding:"16px 18px",fontSize:12,lineHeight:1.7,overflowX:"auto",
        color:"var(--txt)",fontFamily:"'Fira Code','Cascadia Code',monospace",
        whiteSpace:"pre",maxHeight:500,
      }}>{PARSER_SNIPPET}</pre>
    </div>
  );
}

const BULK_CSV_COLUMNS = [
  "title","description","price","original_price","category","deal_url","deal_type",
  "promo_code","is_stackable","stack_options","created_at",
];

const splitCsvLine = (line='') => {
  const out=[];
  let cur='';
  let inQuotes=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){
      if(inQuotes && line[i+1]==='"'){
        cur+='"';
        i++;
      } else inQuotes=!inQuotes;
    } else if(ch===',' && !inQuotes){
      out.push(cur.trim());
      cur='';
    } else cur+=ch;
  }
  out.push(cur.trim());
  return out;
};

const parseBulkCsv = (text='') => {
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.trim().length>0);
  if(!lines.length) return [];
  const headers=splitCsvLine(lines[0]).map(h=>h.trim().toLowerCase());
  return lines.slice(1).map((line,idx)=>{
    const vals=splitCsvLine(line);
    const row={};
    headers.forEach((h,i)=>{ row[h]=vals[i]??''; });
    return {index:idx+2,row};
  });
};

const parseBool = (v)=>{
  const value=String(v??'').trim().toLowerCase();
  if(!value) return null;
  if(["true","1","yes","y"].includes(value)) return true;
  if(["false","0","no","n"].includes(value)) return false;
  return null;
};

const parseNum = (v)=>{
  const cleaned=String(v??'').trim().replace(/[$,]/g,'');
  if(!cleaned) return null;
  const n=Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const validateBulkRow = ({index,row}) => {
  const errors=[];
  const title=String(row.title||'').trim();
  const description=String(row.description||'').trim();
  const category=normalizeCategory(row.category);
  const link=String(row.deal_url||'').trim();
  const price=parseNum(row.price);
  const originalPrice=parseNum(row.original_price);
  const rawType=String(row.deal_type||'').trim().toLowerCase();
  const dealType=rawType==='instant' ? 'SALE' : rawType==='promo_code' ? 'PROMO' : null;
  const promoCode=String(row.promo_code||'').trim();
  const isStackable=parseBool(row.is_stackable);
  const stackOptions=String(row.stack_options||'').split('|').map(s=>s.trim()).filter(Boolean);
  const createdRaw=String(row.created_at||'').trim();
  const createdAt=createdRaw ? new Date(createdRaw) : new Date();

  if(!title) errors.push('title is required');
  if(price==null) errors.push('price is required and must be numeric');
  if(!category) errors.push('category is required and must map to a known category');
  if(!link) errors.push('deal_url is required');
  if(!dealType) errors.push('deal_type must be instant or promo_code');
  if(rawType==='promo_code' && !promoCode) errors.push('promo_code is required when deal_type=promo_code');
  if(String(row.original_price||'').trim() && originalPrice==null) errors.push('original_price must be numeric when provided');
  if(String(row.is_stackable||'').trim() && isStackable==null) errors.push('is_stackable must be true or false when provided');
  if(createdRaw && Number.isNaN(createdAt.getTime())) errors.push('created_at must be a valid date when provided');

  return {
    index,
    row,
    errors,
    valid: errors.length===0,
    deal: {
      title,
      description,
      link,
      dealType,
      code: rawType==='promo_code' ? promoCode : '',
      cat: category,
      isStackable: isStackable ?? false,
      stackOptions,
      currentPrice: price,
      originalPrice,
      status: 'ACTIVE',
      featured: false,
    },
    createdAt: createdAt.toISOString(),
  };
};

function BulkAddDealsPage(){
  const toast=useToast();
  const [csvText,setCsvText]=useState('');
  const [previewRows,setPreviewRows]=useState([]);
  const [importing,setImporting]=useState(false);
  const [result,setResult]=useState(null);

  const runPreview=()=>{
    const parsed=parseBulkCsv(csvText).map(validateBulkRow);
    setPreviewRows(parsed);
    setResult(null);
    if(!parsed.length) toast?.('No CSV rows found.','err');
    else toast?.(`Preview ready: ${parsed.length} row(s).`,'ok');
  };

  const onFileUpload=(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>setCsvText(String(reader.result||''));
    reader.readAsText(file);
  };

  const handleImport=async()=>{
    const rows=(previewRows.length?previewRows:parseBulkCsv(csvText).map(validateBulkRow));
    setPreviewRows(rows);
    const validRows=rows.filter(r=>r.valid);
    const invalidRows=rows.filter(r=>!r.valid);
    if(!validRows.length){
      setResult({imported:0,failed:invalidRows.length,failedRows:invalidRows});
      toast?.('No valid rows to import.','err');
      return;
    }

    setImporting(true);
    try{
      const payload=validRows.map(r=>({
        ...toDb(r.deal),
        created_at: r.createdAt,
      }));
      const {error}=await supabase.from('deals').insert(payload);
      if(error){
        toast?.(error.message,'err');
        setResult({imported:0,failed:rows.length,failedRows:rows.map(r=>({...r,errors:r.errors.length?r.errors:[error.message]}))});
        return;
      }
      setResult({imported:validRows.length,failed:invalidRows.length,failedRows:invalidRows});
      toast?.(`Imported ${validRows.length} deals.`,'ok');
    } finally {
      setImporting(false);
    }
  };

  return(
    <Guard adm>
      <div className="page">
        <h1 style={{fontSize:28,marginBottom:8}}>Bulk Add Deals</h1>
        <p style={{color:'var(--muted)',marginBottom:16,fontSize:14}}>
          Paste CSV or upload a file, preview rows, then import valid deals.
        </p>

        <div className="card" style={{marginBottom:18}}>
          <div style={{display:'grid',gap:12}}>
            <div>
              <label style={{display:'block',marginBottom:6,fontSize:13,color:'var(--muted)'}}>Paste CSV</label>
              <textarea
                rows={10}
                value={csvText}
                onChange={e=>setCsvText(e.target.value)}
                placeholder={BULK_CSV_COLUMNS.join(',')}
                style={{resize:'vertical'}}
              />
            </div>
            <div>
              <label style={{display:'block',marginBottom:6,fontSize:13,color:'var(--muted)'}}>Upload CSV file</label>
              <input type="file" accept=".csv,text/csv" onChange={onFileUpload}/>
            </div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <button className="btn btn-o" onClick={runPreview}>Preview</button>
              <button className="btn btn-p" onClick={handleImport} disabled={importing}>
                {importing?'Importing…':'Import'}
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{marginBottom:18,overflowX:'auto'}}>
          <h3 style={{marginBottom:12}}>Preview (first 20 rows)</h3>
          {!previewRows.length?(
            <p style={{color:'var(--muted)',fontSize:13}}>No rows previewed yet.</p>
          ):(
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--bdr)'}}>
                  <th style={{padding:'8px',textAlign:'left'}}>Row</th>
                  <th style={{padding:'8px',textAlign:'left'}}>Title</th>
                  <th style={{padding:'8px',textAlign:'left'}}>Category</th>
                  <th style={{padding:'8px',textAlign:'left'}}>Type</th>
                  <th style={{padding:'8px',textAlign:'left'}}>Price</th>
                  <th style={{padding:'8px',textAlign:'left'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0,20).map(r=>(
                  <tr key={r.index} style={{borderBottom:'1px solid var(--bdr)'}}>
                    <td style={{padding:'8px'}}>#{r.index}</td>
                    <td style={{padding:'8px'}}>{r.deal.title||'—'}</td>
                    <td style={{padding:'8px'}}>{r.deal.cat||String(r.row.category||'—')}</td>
                    <td style={{padding:'8px'}}>{String(r.row.deal_type||'—')}</td>
                    <td style={{padding:'8px'}}>{r.deal.currentPrice??'—'}</td>
                    <td style={{padding:'8px',color:r.valid?'var(--ok)':'var(--err)'}}>{r.valid?'Valid':r.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {result&&(
          <div className="card">
            <h3 style={{marginBottom:10}}>Import Result</h3>
            <p style={{marginBottom:6}}>Imported: <strong>{result.imported}</strong></p>
            <p style={{marginBottom:10}}>Failed: <strong>{result.failed}</strong></p>
            {result.failedRows?.length>0&&(
              <div>
                <h4 style={{fontSize:14,marginBottom:8}}>Failed Rows</h4>
                <ul style={{paddingLeft:20,display:'grid',gap:6}}>
                  {result.failedRows.map(r=>(
                    <li key={r.index} style={{fontSize:13,color:'var(--err)'}}>Row {r.index}: {r.errors.join('; ')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Guard>
  );
}

// ── AdminDash ─────────────────────────────────────────────────
function AdminDash(){
  const toast=useToast();
  const {nav}=useRouter();
  const [deals,setDeals]=useState([]);
  const [editing,setEditing]=useState(null);
  const [adding,setAdding]=useState(false);
  const [adminSection,setAdminSection]=useState("deals");
  const [methods,setMethods]=useState([]);
  const [dealFilter,setDealFilter]=useState("all");

  const refresh=async()=>{
    const {data}=await supabase.from('deals').select('*').order('created_at',{ascending:false});
    setDeals((data||[]).map(fromDb));
  };
  const refreshMethods=async()=>{
    const {data}=await supabase.from('methods').select('*').order('sort_order',{ascending:true});
    setMethods((data||[]).map(fromMethodDb));
  };

  useEffect(()=>{ refresh(); refreshMethods(); },[]);

  const handleAdd=async(d)=>{
    const {error}=await supabase.from('deals').insert([toDb(d)]);
    if(error){ toast?.(error.message,"err"); return; }
    await refresh(); setAdding(false); toast?.("Deal added","ok");
  };

  const handleEdit=async(d)=>{
    const {error}=await supabase.from('deals').update(toDb(d)).eq('id',editing.id);
    if(error){ toast?.(error.message,"err"); return; }
    await refresh(); setEditing(null); toast?.("Deal updated","ok");
  };

  const handleDelete=async(id)=>{
    const {error}=await supabase.from('deals').delete().eq('id',id);
    if(error){ toast?.(error.message,"err"); return; }
    await refresh(); toast?.("Deal deleted","info");
  };

  const handleStatusChange=async(id,newStatus)=>{
    const {error}=await supabase.from('deals').update({status:newStatus}).eq('id',id);
    if(error){ toast?.(error.message,"err"); return; }
    await refresh();
  };

  const stats=[
    {l:"Total Deals",  v:deals.length,                                ic:"deals", c:"var(--p)"},
    {l:"Active",       v:deals.filter(d=>d.status==="ACTIVE").length, ic:"check", c:"var(--ok)"},
    {l:"Total Clicks", v:deals.reduce((a,d)=>a+d.clicks,0),          ic:"eye",   c:"var(--warn)"},
    {l:"Featured",     v:deals.filter(d=>d.featured).length,          ic:"star",  c:"var(--p2)"},
  ];

  const displayedDeals = dealFilter==="inactive"
    ? deals.filter(d=>d.status==="INACTIVE")
    : deals;

  return(
    <Guard adm>
      <div className="page">
        <div style={{display:"flex",alignItems:"center",marginBottom:24}}>
          <h1 style={{flex:1,fontSize:22}}><I n="admin" s={18}/> Admin Dashboard</h1>
          {adminSection==="deals"&&<button className="btn btn-p" onClick={()=>setAdding(true)}><I n="plus" s={14}/> Add Deal</button>}
          <button className="btn btn-o" onClick={()=>nav("admin/bulk-add")}>Bulk Add CSV</button>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:24}}>
          <button className={`btn ${adminSection==="deals"?"btn-p":"btn-d"}`} onClick={()=>setAdminSection("deals")}>
            🏷️ Deals
          </button>
          <button className={`btn ${adminSection==="methods"?"btn-p":"btn-d"}`} onClick={()=>setAdminSection("methods")}>
            💡 Save &amp; Earn Methods
          </button>
          <button className={`btn ${adminSection==="parser"?"btn-p":"btn-d"}`} onClick={()=>setAdminSection("parser")}>
            ⚡ Parser Reference
          </button>
          <button className={`btn ${adminSection==="listing"?"btn-p":"btn-d"}`} onClick={()=>setAdminSection("listing")}>
            📋 Listing Reference
          </button>
        </div>

        {adminSection==="methods" ? (
          <MethodsAdmin methods={methods} refresh={refreshMethods} toast={toast}/>
        ) : adminSection==="parser" ? (
          <ParserReference/>
        ) : adminSection==="listing" ? (
          <ListingReference/>
        ) : (
          <>
            {/* Issue 13 fixed: renamed map variable from `s` to `stat` to avoid shadowing DealForm's `s` setter */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14,marginBottom:28}}>
              {stats.map(stat=>(
                <div key={stat.l} className="stat">
                  <I n={stat.ic} s={18} c={stat.c} style={{marginBottom:6}}/>
                  <div className="stat-v" style={{color:stat.c}}>{stat.v}</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>{stat.l}</div>
                </div>
              ))}
            </div>

            {adding&&(
              <div className="card" style={{marginBottom:24}}>
                <h3 style={{marginBottom:16}}>Add New Deal</h3>
                <DealForm
                  onSave={handleAdd}
                  onCancel={()=>setAdding(false)}
                />
              </div>
            )}

            {editing&&(
              <div className="modal-bg">
                <div className="modal" style={{maxWidth:560,width:"95%"}}>
                  <h3 style={{marginBottom:16}}>Edit Deal</h3>
                  <DealForm
                    initial={editing}
                    onSave={handleEdit}
                    onCancel={()=>setEditing(null)}
                  />
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
              <span style={{fontSize:13,color:"var(--muted)"}}>Filter:</span>
              {[["all","All Deals"],["inactive","⛔ Inactive"]].map(([v,l])=>(
                <button key={v} className={`btn ${dealFilter===v?"btn-p":"btn-d"}`} style={{padding:"5px 12px",fontSize:13}}
                  onClick={()=>setDealFilter(v)}>{l}</button>
              ))}
              {deals.filter(d=>d.status==="INACTIVE").length>0&&(
                <span className="tag tag-err" style={{fontSize:12}}>
                  {deals.filter(d=>d.status==="INACTIVE").length} inactive
                </span>
              )}
            </div>

            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                <thead>
                  <tr style={{borderBottom:"1.5px solid var(--bdr)",color:"var(--muted)",fontSize:12}}>
                    {["Title","Type","Cat","Clicks","Expires","Status",""].map(h=>(
                      <th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:600}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedDeals.map(d=>(
                    <tr key={d.id} style={{borderBottom:"1px solid var(--bdr)"}}>
                      <td style={{padding:"10px 12px",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {d.title}
                      </td>
                      <td style={{padding:"10px 12px"}}><span className={`tag ${d.dealType==="SALE"?"tag-ok":d.dealType==="PROMO"?"tag-p":"tag-warn"}`}>{d.dealType}</span></td>
                      <td style={{padding:"10px 12px",color:"var(--muted)"}}>{d.cat}</td>
                      <td style={{padding:"10px 12px"}}>{d.clicks}</td>
                      <td style={{padding:"10px 12px",color:"var(--muted)",fontSize:12}}>{fmtDate(d.expires)}</td>
                      <td style={{padding:"10px 12px"}}>
                        <select
                          value={d.status||"ACTIVE"}
                          onChange={e=>handleStatusChange(d.id,e.target.value)}
                          style={{width:"auto",padding:"3px 8px",fontSize:12,background:"var(--surf2)",color:"var(--txt)",border:"1.5px solid var(--bdr)",borderRadius:6}}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </td>
                      <td style={{padding:"10px 12px"}}>
                        <div style={{display:"flex",gap:6}}>
                          <button className="btn btn-d" style={{padding:"4px 10px",fontSize:12}} onClick={()=>setEditing(d)}>
                            <I n="edit" s={12}/>
                          </button>
                          <button className="btn btn-d" style={{padding:"4px 10px",fontSize:12,color:"var(--err)"}} onClick={()=>handleDelete(d.id)}>
                            <I n="trash" s={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Guard>
  );
}

// ── MethodForm ────────────────────────────────────────────────
function MethodForm({initial,onSave,onCancel}){
  const toast=useToast();
  const [s,setS]=useState(()=>{
    if(initial){
      return {
        ...initial,
        stepsRaw:(initial.steps||[]).join("\n"),
        linksRaw:(initial.links||[]).join("\n"),
      };
    }
    return {
      title:"",tabType:"earn_more",summary:"",description:"",
      stepsRaw:"",potentialRange:"",requirements:"",tips:"",linksRaw:"",
    };
  });
  const set=(k,v)=>setS(p=>({...p,[k]:v}));

  const [pasteText,setPasteText]=useState('');
  const handleParse=()=>{
    const parsed=parseMethodText(pasteText);
    const count=Object.keys(parsed).length;
    if(count===0){ toast?.("Could not parse any fields — check the format and try again","err"); return; }
    const update={...parsed};
    if(parsed.steps){ update.stepsRaw=parsed.steps.join("\n"); delete update.steps; }
    if(parsed.links){ update.linksRaw=parsed.links.join("\n"); delete update.links; }
    setS(p=>({...p,...update}));
    setPasteText('');
    if(count<3) toast?.(`Partially filled ${count} field${count>1?"s":""}. Please review.`,"info");
    else toast?.(`Auto-filled ${count} field${count>1?"s":""}. Review before saving.`,"ok");
  };

  const submit=(e)=>{
    e.preventDefault();
    if(!s.title.trim()){ toast?.("Title is required","err"); return; }
    if(!s.potentialRange.trim()){ toast?.("Potential range is required","err"); return; }
    const steps=(s.stepsRaw||"").split("\n").map(x=>x.trim()).filter(Boolean);
    if(steps.length===0){ toast?.("At least one step is required","err"); return; }
    const links=(s.linksRaw||"").split("\n").map(x=>x.trim()).filter(Boolean);
    onSave({...s,steps,links});
  };

  return(
    <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{background:"var(--surf2)",border:"1.5px solid var(--bdr)",borderRadius:10,padding:12}}>
        <label style={{fontSize:12,color:"var(--muted)",marginBottom:6,display:"block",fontWeight:600}}>⚡ Paste method info (Markdown table or Field: Value)</label>
        <textarea
          value={pasteText}
          onChange={e=>setPasteText(e.target.value)}
          rows={4}
          placeholder={"| Field | Value |\n| Title | Rakuten Cashback |\n| Tab Type | earn_more |\n— or —\nTitle: Rakuten Cashback\nSteps: Sign up; Activate cashback; Shop; Get paid\nPotential Range: $50–$500/year"}
          style={{fontFamily:"monospace",fontSize:12,marginBottom:8}}
        />
        <button type="button" className="btn btn-o" onClick={handleParse} style={{fontSize:13,padding:"6px 14px"}}>
          <I n="check" s={13}/> Parse &amp; Autofill
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Title *</label>
          <input value={s.title} onChange={e=>set("title",e.target.value)} placeholder="Method name" required/>
        </div>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Tab *</label>
          <select value={s.tabType} onChange={e=>set("tabType",e.target.value)}>
            <option value="earn_more">💰 Earn More</option>
            <option value="save_more">🏷️ Save More</option>
          </select>
        </div>
      </div>
      <div>
        <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Short Summary</label>
        <input value={s.summary} onChange={e=>set("summary",e.target.value)} placeholder="One-line summary shown when collapsed"/>
      </div>
      <div>
        <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Description</label>
        <textarea value={s.description} onChange={e=>set("description",e.target.value)} rows={2} placeholder="Full explanation"/>
      </div>
      <div>
        <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Steps * (one per line)</label>
        <textarea value={s.stepsRaw} onChange={e=>set("stepsRaw",e.target.value)} rows={4} placeholder={"Sign up\nActivate cashback\nShop\nGet paid"}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Potential Range *</label>
          <input value={s.potentialRange} onChange={e=>set("potentialRange",e.target.value)} placeholder="e.g. $50–$300/month"/>
        </div>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Requirements</label>
          <input value={s.requirements} onChange={e=>set("requirements",e.target.value)} placeholder="e.g. Free to join"/>
        </div>
      </div>
      <div>
        <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Tips</label>
        <textarea value={s.tips} onChange={e=>set("tips",e.target.value)} rows={2} placeholder="Pro tips for this method"/>
      </div>
      <div>
        <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Links (one URL per line)</label>
        <textarea value={s.linksRaw} onChange={e=>set("linksRaw",e.target.value)} rows={2} placeholder={"https://www.rakuten.com\nhttps://home.ibotta.com"}/>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        {onCancel&&<button type="button" className="btn btn-d" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn btn-p">✅ Save Method</button>
      </div>
    </form>
  );
}

// ── MethodsAdmin ──────────────────────────────────────────────
function MethodsAdmin({methods,refresh,toast}){
  const [adding,setAdding]=useState(false);
  const [editing,setEditing]=useState(null);

  const handleAdd=async(m)=>{
    const sameTab=methods.filter(x=>x.tabType===m.tabType).length;
    const {error}=await supabase.from('methods').insert([{...toMethodDb(m),sort_order:sameTab}]);
    if(error){ toast?.(error.message,"err"); return; }
    await refresh(); setAdding(false); toast?.("Method added","ok");
  };

  const handleEdit=async(m)=>{
    const {error}=await supabase.from('methods').update(toMethodDb(m)).eq('id',editing.id);
    if(error){ toast?.(error.message,"err"); return; }
    await refresh(); setEditing(null); toast?.("Method updated","ok");
  };

  const handleDelete=async(id)=>{
    const {error}=await supabase.from('methods').delete().eq('id',id);
    if(error){ toast?.(error.message,"err"); return; }
    await refresh(); toast?.("Method deleted","info");
  };

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",marginBottom:16}}>
        <h2 style={{flex:1,fontSize:18,fontWeight:700}}>💡 Save &amp; Earn Methods</h2>
        <button className="btn btn-p" onClick={()=>setAdding(true)}>➕ Add Method</button>
      </div>

      {adding&&(
        <div className="card" style={{marginBottom:20}}>
          <h3 style={{marginBottom:14}}>Add Method</h3>
          <MethodForm
            onSave={handleAdd}
            onCancel={()=>setAdding(false)}
          />
        </div>
      )}

      {editing&&(
        <div className="modal-bg">
          <div className="modal" style={{maxWidth:560,width:"95%"}}>
            <h3 style={{marginBottom:14}}>Edit Method</h3>
            <MethodForm
              initial={editing}
              onSave={handleEdit}
              onCancel={()=>setEditing(null)}
            />
          </div>
        </div>
      )}

      {["earn_more","save_more"].map(tab=>{
        const list=methods.filter(m=>m.tabType===tab).sort((a,b)=>a.order-b.order);
        return(
          <div key={tab} style={{marginBottom:28}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em"}}>
              {tab==="earn_more"?"💰 Earn More":"🏷️ Save More"}
            </h3>
            {list.length===0?(
              <p style={{color:"var(--muted)",fontSize:13}}>No methods yet.</p>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {list.map(m=>(
                  <div key={m.id} className="card" style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14}}>{m.title}</div>
                      <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{m.potentialRange}</div>
                    </div>
                    <button className="btn btn-d" style={{padding:"4px 10px",fontSize:12}} onClick={()=>setEditing(m)}>✏️</button>
                    <button className="btn btn-d" style={{padding:"4px 10px",fontSize:12,color:"var(--err)"}}
                      onClick={()=>handleDelete(m.id)}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── OtherWaysPage ─────────────────────────────────────────────
function OtherWaysPage(){
  const [tab,setTab]=useState("earn_more");
  const [expanded,setExpanded]=useState({});
  const [allMethods,setAllMethods]=useState([]);
  const toast=useToast();

  const handleCopyLink=(url)=>{
    const p=navigator.clipboard?.writeText(url);
    if(p) p.then(()=>toast?.("Link copied!","ok"))
            .catch(()=>toast?.("Failed to copy link. Please copy manually.","err"));
    else toast?.("Failed to copy link. Please copy manually.","err");
  };

  useEffect(()=>{
    supabase.from('methods').select('*').order('sort_order',{ascending:true})
      .then(({data})=>setAllMethods((data||[]).map(fromMethodDb)));
  },[]);

  const methods=allMethods.filter(m=>m.tabType===tab);

  const toggle=(id)=>setExpanded(p=>({...p,[id]:!p[id]}));

  return(
    <div className="page">
      <h1 style={{fontSize:26,fontWeight:800,marginBottom:6}}>💡 Other Ways to Save or Earn Money</h1>
      <p style={{color:"var(--muted)",marginBottom:24,fontSize:14}}>
        Beyond deal codes — practical ways to keep more of your money.
      </p>

      <div style={{display:"flex",gap:8,marginBottom:24,borderBottom:"1.5px solid var(--bdr)",paddingBottom:12}}>
        {[["earn_more","💰 Earn More"],["save_more","🏷️ Save More"]].map(([val,label])=>(
          <button
            key={val}
            className={`btn ${tab===val?"btn-p":"btn-d"}`}
            onClick={()=>{ setTab(val); setExpanded({}); }}
          >
            {label}
          </button>
        ))}
      </div>

      {methods.length===0?(
        <div style={{textAlign:"center",padding:48,color:"var(--muted)"}}>
          <p>No methods yet. Check back soon!</p>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {methods.map(m=>(
            <div key={m.id} className="card" style={{padding:0,overflow:"hidden"}}>
              <button
                onClick={()=>toggle(m.id)}
                style={{
                  width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"16px 20px",background:"none",border:"none",cursor:"pointer",
                  textAlign:"left",gap:12
                }}
              >
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:16,color:"var(--txt)",marginBottom:m.summary?4:0}}>{m.title}</div>
                  {m.summary&&<div style={{fontSize:13,color:"var(--muted)"}}>{m.summary}</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  {m.potentialRange&&(
                    <span className="tag tag-ok" style={{fontSize:12}}>{m.potentialRange}</span>
                  )}
                  <span style={{fontSize:18,color:"var(--muted)"}}>{expanded[m.id]?"▲":"▼"}</span>
                </div>
              </button>

              {expanded[m.id]&&(
                <div style={{padding:"0 20px 20px",borderTop:"1px solid var(--bdr)"}}>
                  {m.description&&(
                    <p style={{fontSize:14,color:"var(--muted)",lineHeight:1.7,margin:"16px 0 12px"}}>{m.description}</p>
                  )}

                  {m.steps&&m.steps.length>0&&(
                    <div style={{marginBottom:16}}>
                      <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"var(--txt)"}}>📋 Steps</div>
                      <ol style={{paddingLeft:20,display:"flex",flexDirection:"column",gap:6}}>
                        {m.steps.map((step,i)=>(
                          <li key={i} style={{fontSize:14,color:"var(--txt)",lineHeight:1.6}}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginBottom:16}}>
                    {m.potentialRange&&(
                      <div style={{background:"var(--surf2)",borderRadius:8,padding:"12px 14px"}}>
                        <div style={{fontSize:11,color:"var(--muted)",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:".05em"}}>Potential</div>
                        <div style={{fontWeight:700,fontSize:15,color:"var(--ok)"}}>{m.potentialRange}</div>
                      </div>
                    )}
                    {m.requirements&&(
                      <div style={{background:"var(--surf2)",borderRadius:8,padding:"12px 14px"}}>
                        <div style={{fontSize:11,color:"var(--muted)",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:".05em"}}>Requirements</div>
                        <div style={{fontSize:13,color:"var(--txt)",lineHeight:1.6}}>{m.requirements}</div>
                      </div>
                    )}
                  </div>

                  {m.tips&&(
                    <div style={{background:"#ffd16622",border:"1px solid var(--warn)",borderRadius:8,padding:"12px 14px",marginBottom:12}}>
                      <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:"var(--warn)"}}>💡 Tips</div>
                      <p style={{fontSize:13,color:"var(--txt)",lineHeight:1.6,margin:0}}>{m.tips}</p>
                    </div>
                  )}

                  {m.links&&m.links.length>0&&(
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {m.links.map((url,i)=>(
                        <React.Fragment key={i}>
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="btn btn-o" style={{padding:"6px 14px",fontSize:13}}>
                            🔗 Visit →
                          </a>
                          <button className="btn btn-d" style={{padding:"6px 14px",fontSize:13}} onClick={()=>handleCopyLink(url)}>
                            <I n="copy" s={13}/> Copy Link
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────
function Footer(){
  return(
    <footer style={{
      background:"var(--surf)",
      borderTop:"1.5px solid var(--bdr)",
      padding:"20px 24px",
      marginTop:"auto",
      fontSize:12,
      color:"var(--muted)",
      lineHeight:1.7,
      textAlign:"center"
    }}>
      <div style={{marginBottom:14}}>
        <h3 style={{fontSize:16,fontWeight:700,color:"var(--txt)",marginBottom:6}}>Contact Us</h3>
        <p>
          General questions:{" "}
          <a href="mailto:contact@dealflowhub.xyz" style={{color:"var(--p2)",textDecoration:"underline"}}>
            contact@dealflowhub.xyz
          </a>
        </p>
        <p>
          Request a deal:{" "}
          <a href="mailto:requests@dealflowhub.xyz" style={{color:"var(--p2)",textDecoration:"underline"}}>
            requests@dealflowhub.xyz
          </a>
        </p>
      </div>

      <strong style={{color:"var(--txt)"}}>Amazon Affiliate Disclosure:</strong>{" "}
      Deal Flow Hub is a participant in the Amazon Services LLC Associates Program,
      an affiliate advertising program designed to provide a means for sites to earn
      advertising fees by advertising and linking to Amazon.com. As an Amazon Associate,
      we earn from qualifying purchases at no extra cost to you.
      <div style={{marginTop:10}}>
        <a href="/privacy" style={{color:"var(--p2)",textDecoration:"underline"}}>Privacy Policy</a>
      </div>
      <div style={{marginTop:10}}>
        <strong style={{color:"var(--txt)"}}>Contact Us:</strong>{" "}
        <a href="mailto:contact@dealflowhub.xyz" style={{color:"var(--p2)",textDecoration:"underline"}}>contact@dealflowhub.xyz</a>
        {" · "}
        <a href="mailto:requests@dealflowhub.xyz" style={{color:"var(--p2)",textDecoration:"underline"}}>requests@dealflowhub.xyz</a>
      </div>
      <div style={{marginTop:6}}>
        Request a deal: email <a href="mailto:requests@dealflowhub.xyz" style={{color:"var(--p2)",textDecoration:"underline"}}>requests@dealflowhub.xyz</a>.
      </div>
    </footer>
  );
}

// ── RafflePage ────────────────────────────────────────────────
function RafflePage(){
  const {user}=useAuth();
  const {nav}=useRouter();
  const toast=useToast();
  const [refCode,setRefCode]=useState(null);
  const [weekCount,setWeekCount]=useState(0);
  const [lifeCount,setLifeCount]=useState(0);

  const fetchCounts=useCallback(()=>{
    if(!user) return;
    const now=new Date();
    const monday=new Date(now);
    monday.setDate(now.getDate()-((now.getDay()+6)%7));
    monday.setHours(0,0,0,0);
    supabase.from('raffle_entries').select('*',{count:'exact',head:true})
      .eq('user_id',user.id)
      .gte('created_at',monday.toISOString())
      .then(({count})=>setWeekCount(count||0));
    supabase.from('raffle_entries').select('*',{count:'exact',head:true})
      .eq('user_id',user.id)
      .then(({count})=>setLifeCount(count||0));
  },[user?.id]);

  useEffect(()=>{
    if(!user) return;

    // Fetch or generate ref_code
    supabase.from('profiles').select('ref_code').eq('id',user.id).single()
      .then(async({data})=>{
        if(data?.ref_code){
          setRefCode(data.ref_code);
        } else {
          const code=(crypto.randomUUID().replace(/-/g,"").slice(0,8)).toUpperCase();
          const {error}=await supabase.from('profiles').update({ref_code:code}).eq('id',user.id);
          if(!error) setRefCode(code);
        }
      });

    fetchCounts();
  },[user?.id]);

  // Refresh counts when a referral is redeemed (may happen on same page load)
  useEffect(()=>{
    if(!user) return;
    window.addEventListener('dfh:referral-redeemed',fetchCounts);
    return()=>window.removeEventListener('dfh:referral-redeemed',fetchCounts);
  },[fetchCounts]);

  const referralLink=refCode?`${window.location.origin}/#raffle?ref=${refCode}`:null;

  const copyLink=()=>{
    if(!referralLink) return;
    navigator.clipboard?.writeText(referralLink)
      .then(()=>toast?.("Referral link copied! Share it to earn entries.","ok"))
      .catch(()=>toast?.("Could not copy — please copy the link manually.","err"));
  };

  const prizeAmount = `$${PRIZE_AMOUNT_USD}`;

  return(
    <div className="page" style={{maxWidth:720}}>

      {/* Referral link section */}
      {user?(
        <div className="card" style={{marginBottom:28,padding:20}}>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:6}}>🔗 Your Referral Link</h2>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:14,lineHeight:1.6}}>
            Share this link. When someone signs up using your link, confirms their email, and logs in,
            <strong style={{color:"var(--txt)"}}> you both get +1 raffle entry</strong> for the current week.
          </p>
          {referralLink?(
            <>
              <div style={{display:"flex",gap:8,alignItems:"center",background:"var(--surf2)",border:"1.5px solid var(--bdr)",borderRadius:10,padding:"10px 14px",marginBottom:14,flexWrap:"wrap"}}>
                <span style={{flex:1,fontSize:13,wordBreak:"break-all",color:"var(--p)"}}>{referralLink}</span>
                <button className="btn btn-p" style={{padding:"7px 16px",flexShrink:0}} onClick={copyLink}>
                  <I n="copy" s={13}/> Copy Link
                </button>
              </div>
              <div style={{display:"flex",gap:20,fontSize:13,color:"var(--muted)",flexWrap:"wrap"}}>
                <span>📅 This week: <strong style={{color:"var(--txt)"}}>{weekCount} {weekCount===1?"entry":"entries"}</strong></span>
                <span>⭐ Lifetime: <strong style={{color:"var(--txt)"}}>{lifeCount} {lifeCount===1?"entry":"entries"}</strong></span>
              </div>
            </>
          ):(
            <p style={{color:"var(--muted)",fontSize:13}}>Loading your referral link…</p>
          )}
        </div>
      ):(
        <div className="card" style={{marginBottom:28,padding:20,textAlign:"center"}}>
          <p style={{color:"var(--muted)",marginBottom:14,fontSize:14}}>
            Sign in to get your personal referral link and track your raffle entries.
          </p>
          <button className="btn btn-p" onClick={()=>nav("auth")}>
            <I n="login" s={14}/> Sign In / Sign Up
          </button>
        </div>
      )}

      <h1 style={{fontSize:28,fontWeight:800,marginBottom:8}}>🎁 Referral Raffle — Official Rules</h1>
      <p style={{color:"var(--muted)",marginBottom:28,fontSize:14}}>Last updated: 2025. No purchase necessary.</p>

      {[
        ["Eligibility","Open to legal residents of the United States who are 18 years of age or older at the time of entry. Void where prohibited by law. Employees of Deal Flow Hub and their immediate family members are not eligible."],
        ["Sweepstakes Period","Each weekly drawing period runs from Monday 12:00 AM Central Time (CT) through Sunday 11:59 PM CT. Entries do not carry over between weekly periods."],
        ["How to Enter Without Purchase",<>
          To enter without referring anyone, send your full name and email to <a href="mailto:raffle@dealflowhub.xyz" style={{color:"var(--p)",textDecoration:"underline"}}>raffle@dealflowhub.xyz</a> with the subject line 'Weekly Raffle Entry.' Limit one (1) free entry per person per weekly period.
        </>],
        ["Referral Entries","Share your unique referral link from this page. When a new user signs up via your link, confirms their email, and logs in for the first time, both you and the new user each receive one (1) raffle entry for the current weekly period. The bonus is applied automatically on the referee's first login after email confirmation. Self-referrals are not permitted. Each person may only be referred once. Fraudulent entries will be disqualified."],
        ["Prize",`One (1) winner per weekly period receives ${prizeAmount} USD via PayPal or Venmo. No cash equivalent substitution. Prize is non-transferable. Winner is responsible for all applicable taxes.`],
        ["Winner Selection","One winner is randomly selected from all valid entries received during the weekly period. Odds of winning depend on total entries received."],
        ["Winner Notification","Winners are contacted by email within 24 hours of selection and must respond within 7 calendar days to claim the prize. Unclaimed prizes will result in a new drawing."],
        ["Privacy","Information collected for this sweepstakes will be used solely to administer the drawing and will not be sold to third parties except as required by law."],
        ["General Conditions","Deal Flow Hub reserves the right to cancel, suspend, or modify the sweepstakes at any time if fraud, technical failure, or other factors compromise its integrity."],
        ["Sponsor","Deal Flow Hub, United States. Not affiliated with Amazon, PayPal, Venmo, or any third-party platform referenced on this site."],
      ].map(([title,text])=>(
        <div key={title} style={{marginBottom:20,paddingBottom:20,borderBottom:"1px solid var(--bdr)"}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:6}}>{title}</h3>
          <p style={{fontSize:14,color:"var(--muted)",lineHeight:1.75}}>{text}</p>
        </div>
      ))}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
function App(){
  const {path}=useRouter();

  const routes={
    home:     <HomePage/>,
    deals:    <DealsPage/>,
    deal:     <DealPage/>,
    auth:     <AuthPage/>,
    dashboard:<DashPage/>,
    admin:    <AdminDash/>,
    "admin/bulk-add": <BulkAddDealsPage/>,
    raffle:   <RafflePage/>,
    otherways:<OtherWaysPage/>,
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Navbar/>
      <div style={{flex:1}}>{routes[path]||<HomePage/>}</div>
      <Footer/>
    </div>
  );
}

// ── Mount ─────────────────────────────────────────────────────
const root=ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <RouterProvider>
    <ToastProvider>
      <AuthProvider>
        <AgeProvider>
          <App/>
        </AgeProvider>
      </AuthProvider>
    </ToastProvider>
  </RouterProvider>
);
