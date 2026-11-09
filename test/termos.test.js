import test from 'node:test';
import assert from 'node:assert/strict';

const base=process.env.TEST_URL||'http://127.0.0.1:18080',origin=base,testIp='10.93.'+Math.floor(Math.random()*250)+'.'+Math.floor(Math.random()*250);
async function request(path,{method='GET',data,cookie}={}){const r=await fetch(base+path,{method,headers:{Origin:origin,'Content-Type':'application/json','X-Forwarded-For':testIp,...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});const text=await r.text();let json=null;try{json=JSON.parse(text)}catch{}return {status:r.status,data:json,text,cookie:r.headers.get('set-cookie')?.split(';')[0]}}
const account=extra=>({email:'termos-'+crypto.randomUUID()+'@example.com',name:'Profissional Termos',password:'senha-teste-segura123',...extra});

test('Termos e privacidade: páginas públicas, aceite obrigatório no cadastro e aceite de contas antigas',async t=>{
for(const path of ['/termos','/termos.html','/privacidade','/privacidade.html']){const r=await request(path);assert.equal(r.status,200,path);assert.match(r.text,path.startsWith('/termos')?/<h1>Termos de uso<\/h1>/:/<h1>Política de privacidade<\/h1>/);assert(!r.text.includes('{{'),'nenhum marcador sem preencher em '+path)}
assert.match((await request('/privacidade')).text,/LGPD/);
assert.equal((await request('/api/auth/register',{method:'POST',data:account()})).status,400,'sem aceite não cria conta');
assert.equal((await request('/api/auth/register',{method:'POST',data:account({acceptTerms:false})})).status,400);
const ok=await request('/api/auth/register',{method:'POST',data:account({acceptTerms:'on'})});assert.equal(ok.status,201,'aceita o valor do checkbox do formulário');
const me=await request('/api/auth/me',{cookie:ok.cookie});assert.equal(me.data.user.termsAccepted,true);assert(!('terms_version' in me.data.user));
if(!process.env.PGDATABASE)return t.diagnostic('Sem PG*: parte das contas antigas pulada.');
const {default:pg}=await import('pg');const pool=new pg.Pool({max:1});t.after(()=>pool.end());
await pool.query('UPDATE manu_users SET terms_version=NULL,terms_accepted_at=NULL WHERE id=$1',[me.data.user.id]);
assert.equal((await request('/api/auth/me',{cookie:ok.cookie})).data.user.termsAccepted,false,'conta antiga precisa aceitar');
assert.equal((await request('/api/auth/accept-terms',{method:'POST',data:{accept:false},cookie:ok.cookie})).status,400);
assert.equal((await request('/api/auth/accept-terms',{method:'POST',data:{accept:true}})).status,401);
assert.equal((await request('/api/auth/accept-terms',{method:'POST',data:{accept:true},cookie:ok.cookie})).status,200);
assert.equal((await request('/api/auth/me',{cookie:ok.cookie})).data.user.termsAccepted,true);
const row=(await pool.query('SELECT terms_version,terms_accepted_at FROM manu_users WHERE id=$1',[me.data.user.id])).rows[0];assert.match(row.terms_version,/^\d{4}-\d{2}-\d{2}$/);assert(row.terms_accepted_at)});

test('Termos e privacidade: dados do responsável vêm do ambiente e são escapados',{skip:!process.env.PGDATABASE&&'Defina PG* para importar o servidor.'},async()=>{process.env.NODE_ENV='unit-test';const server=await import('../server.js');try{
const page=server.legalPage('{{RESPONSAVEL}}|{{DOCUMENTO}}|{{CONTATO}}|{{FORO}}',{LEGAL_NAME:'Clínica <b>X</b> & Cia',LEGAL_DOC:'CNPJ 00.000.000/0001-00',LEGAL_EMAIL:'contato@exemplo.com',LEGAL_CITY:'Miranda/MS'});
assert.match(page,/^Clínica &lt;b&gt;X&lt;\/b&gt; &amp; Cia\|, CNPJ 00\.000\.000\/0001-00\|escreva para <a href="mailto:contato@exemplo\.com">/);assert.match(page,/comarca de Miranda\/MS/);
const empty=server.legalPage('{{RESPONSAVEL}} {{CONTATO}}',{});assert.match(empty,/a informar/,'sem configuração, avisa que falta informar')}finally{await server.pool.end()}});
