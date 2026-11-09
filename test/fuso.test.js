import test from 'node:test';
import assert from 'node:assert/strict';

const base=process.env.TEST_URL||'http://127.0.0.1:18080',origin=base,testIp='10.92.'+Math.floor(Math.random()*250)+'.'+Math.floor(Math.random()*250);
async function request(path,{method='GET',data,cookie}={}){const r=await fetch(base+path,{method,headers:{Origin:origin,'Content-Type':'application/json','X-Forwarded-For':testIp,...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}}

test('Fuso de Campo Grande/Cuiabá é aceito no primeiro acesso e fica salvo no consultório',async()=>{const a=await request('/api/auth/register',{method:'POST',data:{email:'fuso-'+crypto.randomUUID()+'@example.com',name:'Profissional MS',password:'senha-teste-segura123'}});assert.equal(a.status,201);
assert.equal((await request('/api/onboarding',{method:'POST',data:{profession:'Fisioterapia',office:'Fisio Miranda',phone:'(67) 99999-0000',start:'08:00',end:'17:00',timezone:'America/Cuiaba'},cookie:a.cookie})).status,400,'fusos fora da lista continuam recusados');
const r=await request('/api/onboarding',{method:'POST',data:{profession:'Fisioterapia',office:'Fisio Miranda',phone:'(67) 99999-0000',start:'08:00',end:'17:00',timezone:'America/Campo_Grande'},cookie:a.cookie});assert.equal(r.status,201);
const offices=await request('/api/offices',{cookie:a.cookie});assert.equal(offices.data.offices.find(o=>o.id===r.data.id).timezone,'America/Campo_Grande')});
