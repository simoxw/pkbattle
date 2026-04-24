import{u as l,b as i,j as t}from"./index-DJq2nuBn.js";import{c as o,S as r}from"./swords-CCSvt4RR.js";import{S as p}from"./sparkles-CripvAyX.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"r6nss1"}]],h=o("house",d);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=[["path",{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",key:"1a0edw"}],["path",{d:"M12 22V12",key:"d0xqtd"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}]],b=o("package",x);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]],k=o("smartphone",m),g=()=>{const c=l(),s=i(),n=[{label:"Home",icon:h,path:"/",id:"home"},{label:"Lotta",icon:r,path:"/battle",id:"battle"},{label:"Box",icon:b,path:"/box",id:"box"},{label:"Pokedex",icon:k,path:"/pokedex",id:"pokedex"},{label:"Social",icon:p,path:"/social",id:"social"}];return t.jsx("nav",{className:"fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-around items-center px-2 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]",children:n.map(a=>{const e=s.pathname===a.path||a.path!=="/"&&s.pathname.startsWith(a.path);return t.jsxs("button",{onClick:()=>c(a.path),className:`flex flex-col items-center gap-1 transition-all active:scale-90 px-2 flex-1 ${e?"text-pk-red":"text-slate-400 hover:text-slate-500"}`,children:[t.jsx("div",{className:`p-2 rounded-2xl transition-all ${e?"bg-red-50 scale-110 shadow-sm":"bg-transparent"}`,children:t.jsx(a.icon,{size:20,strokeWidth:e?2.5:2})}),t.jsx("span",{className:`text-[9px] font-black uppercase tracking-tighter ${e?"opacity-100":"opacity-70"}`,children:a.label})]},a.id)})})};export{g as B,b as P,k as S};
