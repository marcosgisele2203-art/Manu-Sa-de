import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:18080';
// Keep this suite on its own loopback address so auth-rate-limit fixtures remain independent.
import http from 'node:http';
async function req(path,method='GET',data,cookie){return new Promise((resolve,reject)=>{const payload=data?JSON.stringify(data):undefined;const r=http.request(base+path,{method,localAddress:'127.0.0.2',headers:{Origin:base,'Content-Type':'application/json',...(payload?{'Content-Length':Buffer.byteLength(payload)}:{}),...(cookie?{Cookie:cookie}:{})}},res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>{try{resolve({status:res.statusCode,data:JSON.parse(text),cookie:res.headers['set-cookie']?.[0]?.split(';')[0]})}catch(e){reject(e)}})});r.on('error',reject);r.end(payload)})}

test('Public bookings reserve atomically, retry safely, protect private data and respect availability',async()=>{
 const account=await req('/api/auth/register','POST',{acceptTerms:true,email:crypto.randomUUID()+'@example.com',name:'Ana',password:'SenhaTeste12345'}),cookie=account.cookie;
 let office=(await req('/api/offices','POST',{office:'Ana',name:'Ana',profession:'Psicologia',published:'yes',mode:'Presencial'},cookie)).data.office;
 const path='/api/offices/'+office.id,publicPath='/api/public/offices/'+office.id;
 let state=(await req(path+'/state','GET',null,cookie)).data;
 Object.assign(state.data.settings,{days:[0,1,2,3,4,5,6],start:'08:00',end:'12:00',dailyLimit:2});
 assert.equal((await req(path+'/state','PUT',state,cookie)).status,200);
 state=(await req(path+'/state','GET',null,cookie)).data;
 const date=new Date(Date.now()+86400000*2).toISOString().slice(0,10),service=state.data.settings.services[0].id;
 const available=()=>req(publicPath+'/availability?date='+date+'&service='+service);
 let slots=await available();assert.deepEqual(Object.keys(slots.data),['slots']);assert(slots.data.slots.includes('08:00'));
 const data={requestId:crypto.randomUUID(),name:'Paciente Teste',phone:'11999991234',date,time:'08:00',service,mode:'Presencial'};
 const competitor={...data,requestId:crypto.randomUUID(),name:'Outro Paciente'};const race=await Promise.all([req(publicPath+'/bookings','POST',data),req(publicPath+'/bookings','POST',competitor)]);
 assert.deepEqual(race.map(r=>r.status).sort(),[201,409]);const winner=race[0].status===201?data:competitor;
 const retry=await req(publicPath+'/bookings','POST',winner);assert.equal(retry.status,200);assert.equal(retry.data.reference,race.find(r=>r.status===201).data.reference);assert(!('phone' in retry.data));
 assert.equal((await req(path+'/state','PUT',state,cookie)).status,409);
 slots=await available();assert(!slots.data.slots.includes('08:00'));assert(!slots.data.slots.includes('08:15'));
 assert.equal((await req(publicPath+'/bookings','POST',{...data,requestId:crypto.randomUUID(),time:'12:00'})).status,409);
 assert.equal((await req(publicPath+'/bookings','POST',{...data,requestId:crypto.randomUUID(),time:slots.data.slots[0]})).status,201);
 assert.deepEqual((await available()).data.slots,[]);
 state=(await req(path+'/state','GET',null,cookie)).data;assert.equal(state.data.appointments.length,2);assert.equal(state.data.appointments[0].status,'Aguardando');assert.equal(state.data.appointments[0].source,'public');
 const pub=(await req(publicPath)).data.office;assert(pub.bookingServices.length);assert(!JSON.stringify(pub).includes('Paciente Teste'));
 office=(await req(path,'PUT',{...office,onlineBooking:'no'},cookie)).data.office;
 assert.equal((await available()).status,404);assert.equal((await req(publicPath+'/bookings','POST',{...data,requestId:crypto.randomUUID()})).status,404);
});
