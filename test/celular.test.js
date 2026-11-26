import test from 'node:test';
import assert from 'node:assert/strict';

const base=process.env.TEST_URL||'http://127.0.0.1:18080';
const css=async path=>{const r=await fetch(base+path);assert.equal(r.status,200,path);return r.text()};

// No iPhone, tocar num campo com fonte menor que 16px dá zoom na página, que não volta sozinha.
test('Celular: campos com 16px em telas de toque nas folhas de estilo de todas as páginas',async()=>{
for(const path of ['/platform.css','/painel.css']){const text=await css(path);
assert.match(text,/@media\s*\(pointer:\s*coarse\)\s*\{\s*input,\s*select,\s*textarea\s*\{\s*font-size:\s*16px/,path+' precisa da regra de 16px para toque');
assert.match(text,/-webkit-tap-highlight-color:\s*transparent/,path+' sem o flash do toque')}});

// Em tela de toque o :hover fica "preso" depois do toque; todo :hover deve estar dentro de (hover:hover) and (pointer:fine).
test('Celular: nenhum efeito de hover fora da media query de mouse',async()=>{
for(const path of ['/platform.css','/painel.css','/marketing.css','/consultorio.css']){const text=await css(path);
const loose=text.replace(/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{[^{}]*\{[^{}]*\}\s*\}/g,'');
assert.doesNotMatch(loose,/:hover/,path+' tem :hover fora de (hover:hover) and (pointer:fine)')}});

// Até 700px a barra lateral vira menu no topo; com altura fixa o cabeçalho deixava a saudação e o nome
// do profissional vazarem para baixo do menu.
test('Celular: cabeçalho do painel cresce com o conteúdo e mostra só a sigla do profissional',async()=>{
const text=await css('/painel.css');
const block=text.match(/@media\(max-width:700px\)\{\s*main>header\{[^}]*\}[^@]*#header-profile>div\{display:none\}/);
assert(block,'regra do cabeçalho para até 700px');
assert.match(block[0],/main>header\{[^}]*height:auto/,'cabeçalho sem altura fixa');
const js=await (await fetch(base+'/painel.js')).text();
assert.match(js,/<span class="avatar" title="\$\{esc\(office\.name\)\}">/,'sigla com o nome completo no title')});

// Com o gráfico estreito (celular, dois painéis lado a lado), "SEG TER QUA…" se sobrepunham.
test('Celular: dias da semana do gráfico viram letras únicas quando o gráfico é estreito',async()=>{
const text=await css('/painel.css');
assert.match(text,/\.weekday-chart\{container-type:inline-size\}/,'o gráfico é um container');
assert.match(text,/@container \(max-width:259px\)\{\.weekday-bar \.wd-long\{display:none\}\.weekday-bar \.wd-short\{display:inline\}\}/,'abaixo de 260px usa as letras');
const js=await (await fetch(base+'/painel.js')).text();
assert.match(js,/<span class="wd-long">\$\{\['SEG'.*<span class="wd-short" aria-hidden="true">\$\{'STQQSSD'\[i\]\}/,'rótulo longo e curto, com o curto escondido de leitores de tela')});

// Um e-mail longo, sem espaços, passava da borda do cartão do paciente e era cortado.
test('Celular: telefone e e-mail do paciente quebram linha em vez de serem cortados',async()=>{
assert.match(await css('/painel.css'),/\.row-info small\{overflow-wrap:break-word\}/)});

// Uma observação de 500 letras transformava cada consulta da lista num bloco enorme.
test('Agenda: observação da consulta aparece em até 2 linhas e abre ao tocar',async()=>{
const text=await css('/painel.css');
assert.match(text,/\.row-note\{[^}]*-webkit-line-clamp:2/,'até 2 linhas');
assert.match(text,/\.row-note\.is-open\{[^}]*line-clamp:none/,'aberta mostra tudo');
const js=await (await fetch(base+'/painel.js')).text();
assert.match(js,/'<span class="row-note">'\+esc\(a\.note\)\+'<\/span>'/,'observação escapada dentro do span');
assert.match(js,/setAttribute\('aria-expanded'/,'informa aberto ou fechado a leitores de tela')});

// Uma apresentação de um parágrafo só e longo aparecia inteira no topo da página pública e de novo logo abaixo.
test('Página pública: resumo da apresentação no topo em até 3 linhas',async()=>{
assert.match(await css('/consultorio.css'),/\.patient-intro\{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden\}/)});

// No celular, os links do topo da página pública estavam com 9px e o subtítulo com 6px.
test('Página pública: topo legível no celular',async()=>{
const text=await css('/consultorio.css');
const block=text.match(/@media\(max-width:700px\)\{\s*body\.public-office>header nav\{[^@]*?\}\s*\}/);
assert(block,'regra do topo para até 700px');
assert.match(block[0],/nav>a:first-child\{font-size:13px/,'links com 13px, inclusive o primeiro');
assert.match(block[0],/nav \.primary\{flex:1 1 100%[^}]*font-size:14px/,'botão de agendar em linha própria, com 14px');
assert.match(block[0],/small\{font-size:9px/,'subtítulo com 9px')});
