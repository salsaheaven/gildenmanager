import { simulateRun } from './src/systems/combat/CombatSimulator.js';
import { createTestGroup } from './src/systems/combat/TestGroup.js';
import { COMBAT_RULES } from './src/data/combatRules.js';
for (const [d,L] of [['bearCave',1],['ruinedChapel',3],['broodNests',5]]) {
  let rounds=0,n=100,minHp=0;
  for (let i=0;i<n;i++){const r=simulateRun({heroes:createTestGroup(L),dungeonId:d,seed:1+i*7919});
    for(const e of r.encounters) rounds+= (e.rounds ?? e.result?.rounds ?? 0);
    minHp += Math.min(...r.heroes.map(h=>h.hp/h.maxHp));}
  console.log(d,'L'+L,'Ø Runden pro Run',(rounds/n).toFixed(1),'Ø niedrigstes Leben am Ende',(minHp/n*100).toFixed(0)+'%');
}
console.log(JSON.stringify(COMBAT_RULES.pacing||COMBAT_RULES, null, 0).slice(0,600));
