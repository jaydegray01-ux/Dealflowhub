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
.deal-img{width:100%;height:160px;object-fit:cover;background:var(--surf2)}
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

const fmtDate = (s) => new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});

// ── Seed data ────────────────────────────────────────────────
const CATS = [
  {id:"electronics",              label:"Electronics",              emoji:"📱", adult:false},
  {id:"beauty",                   label:"Beauty",                   emoji:"💄", adult:false},
  {id:"home-and-kitchen",         label:"Home & Kitchen",           emoji:"🏠", adult:false},
  {id:"pet-supplies",             label:"Pet Supplies",             emoji:"🐾", adult:false},
  {id:"toys-and-games",           label:"Toys & Games",             emoji:"🎮", adult:false},
  {id:"tools-and-home-improvement",label:"Tools & Home Improvement",emoji:"🔧", adult:false},
  {id:"other",                    label:"Other",                    emoji:"🏷️", adult:false},
  {id:"adult-products",           label:"Adult Products 🔞",        emoji:"🔞", adult:true },
];

let _deals = [
  {id:"d1", title:"50% off Cloud Hosting",   desc:"Premium VPS at half price.", link:"https://example.com", dealType:"SALE",  code:"",         cat:"electronics",    clicks:42, saved:12, expires:ad(5),  createdAt:sd(2), featured:true,  active:true},
  {id:"d2", title:"Designer T-Shirts Promo", desc:"Use code for 30% off.",       link:"https://example.com", dealType:"PROMO", code:"STYLE30",   cat:"beauty",         clicks:18, saved:7,  expires:ad(10), createdAt:sd(1), featured:false, active:true},
  {id:"d3", title:"Pizza + Promo Bundle",    desc:"Free pizza and promo code.",   link:"https://example.com", dealType:"BOTH",  code:"PIZZA50",   cat:"home-and-kitchen",clicks:99, saved:34, expires:ad(2),  createdAt:sd(0), featured:true,  active:true},
  {id:"d4", title:"Adult Content Deal",      desc:"Exclusive promo.",             link:"https://example.com", dealType:"PROMO", code:"ADULT20",   cat:"adult-products", clicks:5,  saved:2,  expires:ad(7),  createdAt:sd(3), featured:false, active:true},
];

const getDeals = () => [..._deals];
const getDeal  = (id) => _deals.find(d=>d.id===id)||null;
const addDeal  = (d)  => { _deals=[{...d,id:"d"+Date.now(),clicks:0,saved:0,createdAt:new Date().toISOString()},..._deals]; };
const updateDeal=(id,patch)=>{ _deals=_deals.map(d=>d.id===id?{...d,...patch}:d); };
const deleteDeal=(id)=>{ _deals=_deals.filter(d=>d.id!==id); };

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
  const [ok,setOk]=useState(false);
  const [show,setShow]=useState(false);
  const [cb,setCb]=useState(null);

  const ageReq=(callback)=>{ setCb(()=>callback); setShow(true); };

  // Bug 7 fixed: call cb() before setCb(null)
  const confirm=()=>{ setOk(true); setShow(false); if(cb) cb(); setCb(null); };
  const deny   =()=>{ setShow(false); setCb(null); };

  return(
    <AgeCtx.Provider value={{ageOk:ok,ageReq}}>
      {children}
      {show&&(
        <div className="modal-bg">
          <div className="modal" style={{textAlign:"center"}}>
            <I n="shield" s={40} c="var(--warn)" style={{marginBottom:16}}/>
            <h2 style={{marginBottom:8}}>Age Verification</h2>
            <p style={{color:"var(--muted)",marginBottom:24}}>
              This category contains adult content. You must be 18+ to continue.
            </p>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <button className="btn btn-p" onClick={confirm}>I am 18+</button>
              <button className="btn btn-d" onClick={deny}>Go Back</button>
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

const USERS = [
  {id:"u1",email:"admin@demo.com", password:"admin123", name:"Admin User",  role:"ADMIN"},
  {id:"u2",email:"user@demo.com",  password:"user123",  name:"Regular User", role:"USER"},
];

function AuthProvider({children}){
  const [user,setUser]=useState(()=>{
    try{ return JSON.parse(localStorage.getItem("dfh_user")); }catch{ return null; }
  });

  // Issue 12 fixed: null guard for toast
  const toast = useToast();
  const safeToast = (msg, type) => { if(toast) toast(msg, type); };

  const login=(email,password)=>{
    const found=USERS.find(u=>u.email===email&&u.password===password);
    if(!found){ safeToast("Invalid credentials","err"); return false; }
    const u={id:found.id,email:found.email,name:found.name,role:found.role};
    setUser(u);
    localStorage.setItem("dfh_user",JSON.stringify(u));
    safeToast(`Welcome back, ${u.name}!`,"ok");
    return true;
  };

  const logout=()=>{
    setUser(null);
    localStorage.removeItem("dfh_user");
    safeToast("Logged out","info");
  };

  return(
    <AuthCtx.Provider value={{user,login,logout,isAdmin:user?.role==="ADMIN"}}>
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
  const typeTag={SALE:"tag-ok",PROMO:"tag-p",BOTH:"tag-warn",STACKABLE:"tag-ok"};
  return(
    <div className="deal-card" onClick={()=>nav("deal",{id:deal.id})}>
      <div className="deal-img" style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,overflow:"hidden"}}>
        {deal.imageUrl
          ?<img src={deal.imageUrl} alt={deal.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          :(deal.dealType==="SALE"?"💸":deal.dealType==="PROMO"?"🎫":"🎁")
        }
      </div>
      <div className="deal-body">
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
          <span className={`tag ${typeTag[deal.dealType]||"tag-p"}`}>
            {DT_LABEL[deal.dealType]||deal.dealType}
          </span>
          {deal.featured&&<span className="tag tag-warn"><I n="star" s={11}/> Featured</span>}
          {(deal.dealType==="STACKABLE"||deal.dealType==="BOTH")&&(
            <span className="tag tag-ok">💰 Stack</span>
          )}
        </div>
        <h3 style={{fontSize:15,marginBottom:6,lineHeight:1.3}}>{deal.title}</h3>
        <p style={{fontSize:13,color:"var(--muted)",marginBottom:10,lineHeight:1.4}}>{deal.desc}</p>
        <div style={{display:"flex",gap:12,fontSize:12,color:"var(--muted)"}}>
          <span><I n="clock" s={11}/> {tu(deal.expires)}</span>
          <span><I n="eye" s={11}/> {deal.clicks}</span>
          <span><I n="star" s={11}/> {deal.saved}</span>
        </div>
      </div>
    </div>
  );
}

// ── RaffleBanner ─────────────────────────────────────────────
function RaffleBanner(){
  const {nav}=useRouter();
  const [open,setOpen]=useState(false);
  return(
    <div style={{background:"linear-gradient(90deg,#4338ca,#7c3aed)",color:"#fff",padding:"12px 24px",textAlign:"center",fontSize:14}}>
      <strong>🎁 Refer friends & family for a chance to win $20 cash.</strong> Winner picked every week.{" "}
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
          <p><strong>How to enter:</strong> Refer a friend or family member who creates a new Deal Flow Hub account using your referral link. Each qualifying referral counts as one entry.</p>
          <p><strong>Winner selection:</strong> One winner is randomly selected every Sunday at 11:59 PM CT from all valid entries for that week.</p>
          <p><strong>How winner is contacted:</strong> By email within 24 hours of the drawing. Winner must respond within 7 days to claim the $20 prize (via PayPal or Venmo).</p>
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
  const featured=getDeals().filter(d=>d.featured&&d.active).slice(0,4);

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
          <button className="btn btn-o" onClick={()=>nav("deals",{dt:"SALE"})}>On Sale</button>
          <button className="btn btn-o" onClick={()=>nav("deals",{dt:"PROMO"})}>Promo Codes</button>
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
            onClick={()=>nav("deals",{cat:c.id})}
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

  const [dt,setDt]=useState(params.dt||"");
  const [cat,setCat]=useState(params.cat||"");
  const [stack,setStack]=useState(!!params.stack);
  const [q,setQ]=useState(params.q||"");
  const [sideOpen,setSideOpen]=useState(false);

  // Bug 5 fixed: sync filter state when params change (e.g. navigating from Home → different filter)
  useEffect(()=>{
    setDt(params.dt||"");
    setCat(params.cat||"");
    setStack(!!params.stack);
    setQ(params.q||"");
  },[params.dt,params.cat,params.stack,params.q]);

  const pickCat=(id)=>{
    const found=CATS.find(c=>c.id===id);
    if(found?.adult&&!ageOk){
      ageReq(()=>setCat(id));
    } else {
      setCat(id);
    }
  };

  const deals=useMemo(()=>{
    let list=getDeals().filter(d=>d.active);
    if(dt)   list=list.filter(d=>d.dealType===dt);
    if(cat)  list=list.filter(d=>d.cat===cat);
    if(stack)list=list.filter(d=>["STACKABLE","BOTH"].includes(d.dealType));
    if(q)    list=list.filter(d=>d.title.toLowerCase().includes(q.toLowerCase())||d.desc.toLowerCase().includes(q.toLowerCase()));
    return list;
  },[dt,cat,stack,q]);

  const Sidebar=()=>(
    <div id="deals-sidebar" className={`sidebar card${sideOpen?" open":""}`}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:13,color:"var(--muted)",marginBottom:6}}>Deal Type</div>
        {["","SALE","PROMO","BOTH","STACKABLE"].map(v=>(
          <label key={v} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer",fontSize:14}}>
            <input type="radio" name="dt" checked={dt===v} onChange={()=>setDt(v)} style={{width:"auto"}}/>
            {v||"All Types"}
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
      <label style={{display:"flex",alignItems:"center",gap:8,fontSize:14,cursor:"pointer"}}>
        <input type="checkbox" checked={stack} onChange={e=>setStack(e.target.checked)} style={{width:"auto"}}/>
        Stackable (Promo+)
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
            placeholder="Search deals…"
            value={q}
            onChange={e=>setQ(e.target.value)}
            style={{paddingLeft:36}}
          />
          <I n="search" s={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
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
  const [deal,setDeal]=useState(()=>getDeal(params.id));
  const [revealed,setRevealed]=useState(false);

  const cat=CATS.find(c=>c.id===deal?.cat);

  // Bug 3 fixed: added ageOk to dependency array
  useEffect(()=>{
    if(cat?.adult&&!ageOk) ageReq(()=>{});
  },[deal?.id,ageOk]);

  useEffect(()=>{
    setDeal(getDeal(params.id));
    setRevealed(false);
  },[params.id]);

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

  const copyCode=()=>{
    if(deal.code){
      navigator.clipboard?.writeText(deal.code).catch(()=>{});
      toast?.(`Code copied: ${deal.code}`,"ok");
    }
  };

  // Updated mainAction: SALE/STACKABLE → Shop Deal; PROMO/BOTH → Copy Code & Shop
  const mainAction=()=>{
    if(deal.dealType==="SALE"||deal.dealType==="STACKABLE"){
      updateDeal(deal.id,{clicks:deal.clicks+1});
      setDeal(getDeal(deal.id));
      window.open(deal.link,"_blank","noopener,noreferrer");
    } else {
      // PROMO or BOTH: copy code AND redirect
      copyCode();
      setRevealed(true);
      updateDeal(deal.id,{clicks:deal.clicks+1});
      setDeal(getDeal(deal.id));
      window.open(deal.link,"_blank","noopener,noreferrer");
    }
  };

  const goToProduct=()=>{
    updateDeal(deal.id,{clicks:deal.clicks+1});
    setDeal(getDeal(deal.id));
    window.open(deal.link,"_blank","noopener,noreferrer");
  };

  const typeTag={SALE:"tag-ok",PROMO:"tag-p",BOTH:"tag-warn",STACKABLE:"tag-ok"};

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

        {deal.imageUrl&&(
          <div style={{borderRadius:12,overflow:"hidden",marginBottom:20}}>
            <img src={deal.imageUrl} alt={deal.title} style={{width:"100%",maxHeight:340,objectFit:"cover"}}/>
          </div>
        )}

        <p style={{color:"var(--muted)",marginBottom:20,lineHeight:1.6}}>{deal.desc}</p>

        <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap",fontSize:14,color:"var(--muted)"}}>
          <span><I n="clock" s={13}/> {tu(deal.expires)}</span>
          <span><I n="eye" s={13}/> {deal.clicks} clicks</span>
          <span><I n="star" s={13}/> {deal.saved} saved</span>
          <span>Expires {fmtDate(deal.expires)}</span>
        </div>

        {(deal.dealType==="STACKABLE"||deal.dealType==="BOTH")&&deal.stackInstructions&&(
          <div style={{background:"var(--surf2)",border:"1.5px solid var(--ok)",borderRadius:10,padding:"14px 18px",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,color:"var(--ok)",marginBottom:6}}>💰 Cashback Stack Instructions</div>
            <p style={{fontSize:14,color:"var(--txt)",lineHeight:1.6}}>{deal.stackInstructions}</p>
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
          {(deal.dealType==="SALE"||deal.dealType==="STACKABLE")&&(
            <button className="btn btn-p" onClick={mainAction} style={{flex:1,justifyContent:"center"}}>
              <I n="link" s={14}/> Shop Deal
            </button>
          )}
          {(deal.dealType==="PROMO"||deal.dealType==="BOTH")&&revealed&&(
            <button className="btn btn-p" onClick={goToProduct} style={{flex:1,justifyContent:"center"}}>
              <I n="link" s={14}/> Go to Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AuthPage ──────────────────────────────────────────────────
function AuthPage(){
  const {user,login}=useAuth();
  const {nav}=useRouter();
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);

  // Issue 11 fixed: return null immediately if already logged in (no flicker)
  // instead of using useEffect which causes a render-then-navigate flicker
  if(user){ nav(user.role==="ADMIN"?"admin":"dashboard"); return null; }

  const submit=async(e)=>{
    e.preventDefault();
    setLoading(true);
    await new Promise(r=>setTimeout(r,400));
    const ok=login(email,pass);
    setLoading(false);
    if(ok) nav(email.startsWith("admin")?"admin":"dashboard");
  };

  return(
    <div className="page" style={{display:"flex",justifyContent:"center",paddingTop:60}}>
      <div className="card" style={{width:"100%",maxWidth:400}}>
        <h2 style={{marginBottom:4,textAlign:"center"}}><I n="user" s={20}/> Sign In</h2>
        <p style={{textAlign:"center",color:"var(--muted)",fontSize:13,marginBottom:24}}>
          Demo: user@demo.com / user123 · admin@demo.com / admin123
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
            {loading?"Signing in…":<><I n="login" s={14}/> Sign In</>}
          </button>
        </form>
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
        <h1 style={{marginBottom:8}}>Welcome, {user?.name}</h1>
        <p style={{color:"var(--muted)"}}>Your saved deals and preferences will appear here.</p>
      </div>
    </Guard>
  );
}

// ── DealForm ──────────────────────────────────────────────────
function DealForm({initial,onSave,onCancel}){
  const toast=useToast();
  const [s,setS]=useState(initial||{
    title:"",desc:"",link:"https://",dealType:"SALE",code:"",
    cat:"electronics",expires:ad(7).slice(0,10),featured:false,active:true,
    imageUrl:"", stackInstructions:"",
  });

  const set=(k,v)=>setS(p=>({...p,[k]:v}));

  const submit=(e)=>{
    e.preventDefault();
    if(!s.title||!s.link){ toast?.("Title and link are required","err"); return; }
    if((s.dealType==="PROMO"||s.dealType==="BOTH")&&!s.code.trim()){
      toast?.("Promo code is required for Promo and Sale+Code deal types","err");
      return;
    }
    if(s.dealType==="STACKABLE"&&!(s.stackInstructions||"").trim()){
      toast?.("Stack instructions are required for Stackable deal types","err");
      return;
    }
    onSave(s);
  };

  return(
    <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12}}>
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
        <textarea value={s.desc} onChange={e=>set("desc",e.target.value)} rows={2} placeholder="Brief description"/>
      </div>
      <div>
        <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Product Image URL</label>
        <input value={s.imageUrl||""} onChange={e=>set("imageUrl",e.target.value)} placeholder="https://images.unsplash.com/..."/>
        {s.imageUrl&&(
          <img src={s.imageUrl} alt="preview" style={{marginTop:8,width:"100%",maxHeight:140,objectFit:"cover",borderRadius:8,border:"1px solid var(--bdr)"}} onError={e=>{e.target.style.display="none";}}/>
        )}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Product URL *</label>
          <input value={s.link} onChange={e=>set("link",e.target.value)} required/>
        </div>
        <div>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Promo Code</label>
          <input value={s.code} onChange={e=>set("code",e.target.value)} placeholder="e.g. SAVE20"/>
        </div>
      </div>
      {(s.dealType==="STACKABLE"||s.dealType==="BOTH")&&(
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
      <div style={{display:"flex",gap:16}}>
        <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:14}}>
          <input type="checkbox" checked={s.featured} onChange={e=>set("featured",e.target.checked)} style={{width:"auto"}}/>
          Featured
        </label>
        <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:14}}>
          <input type="checkbox" checked={s.active} onChange={e=>set("active",e.target.checked)} style={{width:"auto"}}/>
          Active
        </label>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        {onCancel&&<button type="button" className="btn btn-d" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn btn-p"><I n="check" s={14}/> Save Deal</button>
      </div>
    </form>
  );
}

// ── AdminDash ─────────────────────────────────────────────────
function AdminDash(){
  const toast=useToast();
  const {nav}=useRouter();
  const [deals,setDeals]=useState(getDeals);
  const [editing,setEditing]=useState(null);
  const [adding,setAdding]=useState(false);

  const refresh=()=>setDeals(getDeals());

  const stats=[
    {l:"Total Deals",  v:deals.length,                          ic:"deals", c:"var(--p)"},
    {l:"Active",       v:deals.filter(d=>d.active).length,      ic:"check", c:"var(--ok)"},
    {l:"Total Clicks", v:deals.reduce((a,d)=>a+d.clicks,0),     ic:"eye",   c:"var(--warn)"},
    {l:"Featured",     v:deals.filter(d=>d.featured).length,    ic:"star",  c:"var(--p2)"},
  ];

  return(
    <Guard adm>
      <div className="page">
        <div style={{display:"flex",alignItems:"center",marginBottom:24}}>
          <h1 style={{flex:1,fontSize:22}}><I n="admin" s={18}/> Admin Dashboard</h1>
          <button className="btn btn-p" onClick={()=>setAdding(true)}><I n="plus" s={14}/> Add Deal</button>
        </div>

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
              onSave={d=>{ addDeal(d); refresh(); setAdding(false); toast?.("Deal added","ok"); }}
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
                onSave={d=>{ updateDeal(editing.id,d); refresh(); setEditing(null); toast?.("Deal updated","ok"); }}
                onCancel={()=>setEditing(null)}
              />
            </div>
          </div>
        )}

        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
            <thead>
              <tr style={{borderBottom:"1.5px solid var(--bdr)",color:"var(--muted)",fontSize:12}}>
                {["Title","Type","Cat","Clicks","Expires","Active",""].map(h=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:600}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map(d=>(
                <tr key={d.id} style={{borderBottom:"1px solid var(--bdr)"}}>
                  <td style={{padding:"10px 12px",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.title}</td>
                  <td style={{padding:"10px 12px"}}><span className={`tag ${d.dealType==="SALE"?"tag-ok":d.dealType==="PROMO"?"tag-p":"tag-warn"}`}>{d.dealType}</span></td>
                  <td style={{padding:"10px 12px",color:"var(--muted)"}}>{d.cat}</td>
                  <td style={{padding:"10px 12px"}}>{d.clicks}</td>
                  <td style={{padding:"10px 12px",color:"var(--muted)",fontSize:12}}>{fmtDate(d.expires)}</td>
                  <td style={{padding:"10px 12px"}}>
                    <input type="checkbox" checked={d.active} onChange={e=>{ updateDeal(d.id,{active:e.target.checked}); refresh(); }} style={{width:"auto"}}/>
                  </td>
                  <td style={{padding:"10px 12px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <button className="btn btn-d" style={{padding:"4px 10px",fontSize:12}} onClick={()=>setEditing(d)}>
                        <I n="edit" s={12}/>
                      </button>
                      <button className="btn btn-d" style={{padding:"4px 10px",fontSize:12,color:"var(--err)"}} onClick={()=>{ deleteDeal(d.id); refresh(); toast?.("Deal deleted","info"); }}>
                        <I n="trash" s={12}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Guard>
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
      <strong style={{color:"var(--txt)"}}>Amazon Affiliate Disclosure:</strong>{" "}
      Deal Flow Hub is a participant in the Amazon Services LLC Associates Program,
      an affiliate advertising program designed to provide a means for sites to earn
      advertising fees by advertising and linking to Amazon.com. As an Amazon Associate,
      we earn from qualifying purchases at no extra cost to you.
    </footer>
  );
}

// ── RafflePage ────────────────────────────────────────────────
function RafflePage(){
  return(
    <div className="page" style={{maxWidth:720}}>
      <h1 style={{fontSize:28,fontWeight:800,marginBottom:8}}>🎁 Referral Raffle — Official Rules</h1>
      <p style={{color:"var(--muted)",marginBottom:28,fontSize:14}}>Last updated: 2025. No purchase necessary.</p>

      {[
        ["Eligibility","Open to legal residents of the United States who are 18 years of age or older at the time of entry. Void where prohibited by law. Employees of Deal Flow Hub and their immediate family members are not eligible."],
        ["Sweepstakes Period","Each weekly drawing period runs from Monday 12:00 AM Central Time (CT) through Sunday 11:59 PM CT. Entries do not carry over between weekly periods."],
        ["How to Enter Without Purchase","To enter without making a purchase or referring anyone, send your full name and email to raffle@dealflowhub.com with the subject line 'Weekly Raffle Entry.' Limit one (1) free entry per person per weekly period."],
        ["Referral Entries","Share your unique referral link. Each new person who creates a Deal Flow Hub account through your referral link during the current weekly period counts as one (1) entry. Self-referrals are not permitted. Fraudulent entries will be disqualified."],
        ["Prize","One (1) winner per weekly period receives $20 USD via PayPal or Venmo. No cash equivalent substitution. Prize is non-transferable. Winner is responsible for all applicable taxes."],
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
    raffle:   <RafflePage/>,
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
