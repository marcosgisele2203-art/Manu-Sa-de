// SOMENTE PARA TESTE LOCAL. Nunca rode contra o servidor publicado.
// Cria uma conta e um consultório com o pior caso realista, no limite do que o servidor aceita:
// nomes de 100 letras, e-mails de 150, observações de 500, serviço de 4 horas e R$ 1.250,
// 60 pacientes e 16 consultas hoje, uma atrás da outra.
//
// 1. Suba o servidor apontando para um Postgres DESCARTÁVEL (veja o AGENTS.md).
// 2. node dev/seed-pior-caso.mjs
// 3. Entre em /conta.html com o e-mail e a senha que o roteiro imprimir.
const base=process.env.TEST_URL||'http://127.0.0.1:18080';
if(!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(base)){console.error('Use apenas com um servidor local.');process.exit(1)}
const ip='10.66.'+Math.floor(Math.random()*250)+'.'+Math.floor(Math.random()*250);let cookie='';
async function req(path,{method='GET',data}={}){const r=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json','X-Forwarded-For':ip,...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});const c=r.headers.get('set-cookie');if(c)cookie=c.split(';')[0];const text=await r.text();let json=null;try{json=JSON.parse(text)}catch{}if(r.status>=300)throw Error(method+' '+path+' '+r.status+' '+text);return json}

const email='pior-caso-'+Date.now()+'@example.com',password='senha-teste-segura123';
const professional='Maria Aparecida dos Santos Albuquerque Cavalcanti de Oliveira Bezerra Figueiredo Nascimento';
const office='Clínica Integrada de Psicologia, Fisioterapia e Nutrição Doutora Maria Aparecida Albuquerque';
const timezone='America/Campo_Grande';
await req('/api/auth/register',{method:'POST',data:{email,name:professional,password,acceptTerms:true}});
const {id}=await req('/api/onboarding',{method:'POST',data:{profession:'Psicologia',office,phone:'(67) 99999-0000',start:'07:00',end:'21:00',timezone}});

// Perfil e página pública
const current=(await req('/api/offices')).offices.find(o=>o.id===id)||(await req('/api/offices')).offices[0];
const bio='Atendimento psicológico para adultos, adolescentes e casais, com foco em ansiedade, luto, transições de carreira e relacionamentos. '.repeat(14).slice(0,1990);
await req('/api/offices/'+id,{method:'PUT',data:{...current,published:'yes',bio,specialty:'Psicologia clínica, neuropsicologia, avaliação psicológica e orientação profissional para adultos e adolescentes',
 address:'Avenida Desembargador Joaquim Fernandes de Albuquerque Cavalcanti, 1234, Edifício Centro Médico Paineiras, Bloco C, Sala 1502',
 city:'Miranda',state:'MS',insurance:'Unimed, Bradesco Saúde, SulAmérica, Amil, Cassems, Hapvida NotreDame Intermédica e atendimento particular com recibo para reembolso',
 payment:'Pix, cartão de crédito em até 6 vezes, cartão de débito e dinheiro',email:'contato.clinica.integrada.maria.aparecida.albuquerque@clinica-integrada-psicologia-fisioterapia-nutricao.com.br',
 website:'https://www.clinica-integrada-psicologia-fisioterapia-nutricao-maria-aparecida.com.br/agendamento-online',showEmail:'yes',showPhone:'yes',
 services:'Avaliação neuropsicológica completa com laudo e devolutiva para a família · 240 minutos · R$ 1.250\nPsicoterapia individual · 50 minutos · R$ 180\nTerapia de casal · 80 minutos · R$ 320'}});

// Agenda: serviços, pacientes e consultas
const {data:state,version}=await req('/api/offices/'+id+'/state');
state.settings={...state.settings,start:'07:00',end:'21:00',days:[0,1,2,3,4,5,6],services:[
 {id:'avaliacao',name:'Avaliação neuropsicológica completa com laudo e devolutiva para a família e para a escola',price:1250,duration:240},
 {id:'psico',name:'Psicoterapia individual',price:180,duration:50},
 {id:'casal',name:'Terapia de casal',price:320,duration:80},
 {id:'retorno',name:'Retorno',price:0,duration:30}]};
const names=['Francisca das Chagas Nascimento Albuquerque Cavalcanti de Oliveira Bezerra Figueiredo de Souza Lima','Jo','Nguyễn Thị Phương Thảo','Bartholomew Fitzgerald-Montgomery III','José','Ana Lu','Maria Eduarda Santos','Pedro Henrique Almeida'];
state.patients=Array.from({length:60},(_,i)=>({id:'p'+i,name:i<names.length?names[i]:'Paciente de teste número '+(i+1),phone:i%3?'(67) 9'+String(80000000+i*731).slice(0,4)+'-'+String(1000+i).slice(0,4):'',
 email:i===0?'francisca.das.chagas.nascimento.albuquerque.cavalcanti.de.oliveira.bezerra@empresa-de-contabilidade-e-assessoria-tributaria.com.br':i%4?'':'paciente'+i+'@example.com'}));
const today=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const note='Primeira consulta. Encaminhada pela escola. Prefere atendimento no fim da tarde por causa do trabalho; pediu para confirmar pelo WhatsApp na véspera e avisar se houver atraso. Trazer exames anteriores e o relatório da escola. Responsável financeiro: a tia. Pagamento por Pix no dia. Estacionamento no subsolo, vaga 12. Acompanhante precisa de acessibilidade para cadeira de rodas. '.slice(0,500);
const statuses=['Agendada','Confirmada','Aguardando','Concluída','Não compareceu','Cancelada'];
const pad=n=>String(n).padStart(2,'0');
state.appointments=[{id:'a-longa',patient:'p0',date:today,time:'07:00',status:'Confirmada',service:'avaliacao',serviceName:state.settings.services[0].name,duration:240,price:1250,mode:'Presencial',note}];
for(let i=0;i<14;i++){const start=11*60+i*35,sv=state.settings.services[1+i%3];
 state.appointments.push({id:'a'+i,patient:'p'+(1+i),date:today,time:pad(Math.floor(start/60))+':'+pad(start%60),status:statuses[i%statuses.length],service:sv.id,serviceName:sv.name,duration:30,price:sv.price,mode:i%2?'Online':'Presencial',note:i===0?note:''});}
await req('/api/offices/'+id+'/state',{method:'PUT',data:{data:state,version}});
console.log(JSON.stringify({email,password,office:id,today}));
