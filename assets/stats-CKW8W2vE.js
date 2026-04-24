import{c as n}from"./swords-CCSvt4RR.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],o=n("shield",c),i=e=>Math.pow(e,3),d=async e=>{try{const a=await(await fetch(`https://pokeapi.co/api/v2/pokemon/${e}`)).json();return{name:a.name.charAt(0).toUpperCase()+a.name.slice(1),types:a.types.map(t=>t.type.name),baseStats:{hp:a.stats.find(t=>t.stat.name==="hp").base_stat,attack:a.stats.find(t=>t.stat.name==="attack").base_stat,defense:a.stats.find(t=>t.stat.name==="defense").base_stat,spAtk:a.stats.find(t=>t.stat.name==="special-attack").base_stat,spDef:a.stats.find(t=>t.stat.name==="special-defense").base_stat,speed:a.stats.find(t=>t.stat.name==="speed").base_stat}}}catch{return null}};export{o as S,d as a,i as g};
