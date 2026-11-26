import test from 'node:test';
import assert from 'node:assert/strict';

const base=process.env.TEST_URL||'http://127.0.0.1:18080';
const css=async path=>{const r=await fetch(base+path);assert.equal(r.status,200,path);return r.text()};

test('Animações: janelas e aviso do rodapé entram suavemente e respeitam "reduzir movimento"',async()=>{
for(const path of ['/painel.css','/platform.css']){const text=await css(path);
assert.match(text,/@starting-style\{dialog\[open\]\{opacity:0\}\}/,path+': janela esmaece ao abrir');
assert.match(text,/dialog\{opacity:0;transition:[^}]*overlay 200ms allow-discrete,display 200ms allow-discrete\}/,path+': janela esmaece ao fechar');
assert.match(text,/@starting-style\{#toast\{opacity:0;transform:translate\(-50%,10px\)\}\}/,path+': aviso desliza');
assert.match(text,/@media\(prefers-reduced-motion:no-preference\)\{dialog\{transform:scale\(\.96\)\}/,path+': zoom só sem "reduzir movimento"')}});

test('Animações: "Tudo pronto!" entra uma vez e as perguntas frequentes abrem suavemente',async()=>{
const onboarding=await css('/onboarding.css');
assert.match(onboarding,/#setup-success:not\(\[hidden\]\) img\{animation:manu-pop/);
assert.match(onboarding,/@media\(prefers-reduced-motion:reduce\)\{#setup-success:not\(\[hidden\]\)\{animation:setup-fade/);
const marketing=await css('/marketing.css');
assert.match(marketing,/\.marketing-faq details::details-content\{block-size:0;overflow:hidden/);
assert.match(marketing,/\.marketing-faq details\[open\]::details-content\{block-size:auto;opacity:1\}/)});
