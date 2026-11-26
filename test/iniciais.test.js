import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const base=process.env.TEST_URL||'http://127.0.0.1:18080';

// As iniciais do avatar pegavam as duas primeiras palavras sem maiúscula: "Francisca das Chagas…" virava "Fd".
test('Iniciais: primeiro e último nome, sem partículas, títulos e sufixos',async()=>{
const r=await fetch(base+'/api.js');assert.equal(r.status,200);
const ctx={Intl,fetch:()=>{}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(await r.text(),ctx);
const initials=ctx.Manu.initials;assert.equal(typeof initials,'function','api.js expõe Manu.initials');
for(const [name,expected] of [
['Francisca das Chagas Nascimento Albuquerque Cavalcanti de Oliveira Bezerra Figueiredo de Souza Lima','FL'],
['ana lu','AL'],['Jo','J'],['José','J'],
['Nguyễn Thị Phương Thảo','NT'],
['João da Silva Júnior','JS'],['Bartholomew Fitzgerald-Montgomery III','BF'],
['Dr. Paulo Neto','PN'],['Pedro Filho','PF'],['Dra. Ana Clara Souza','AS'],
['ênio de souza','ÊS'],['🌸 Maria Clara','MC'],
['','' ],['#','#']])assert.equal(initials(name),expected,JSON.stringify(name));
for(const file of ['/painel.js','/platform.js'])assert.match(await (await fetch(base+file)).text(),/initials=s=>Manu\.initials\(s\)/,file+' usa a função comum')});
