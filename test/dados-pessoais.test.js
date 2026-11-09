import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

// Confere a limpeza feita ao iniciar: dados pessoais antigos (CPF, nascimento, gênero, assinatura) são apagados.
// Precisa das mesmas variáveis PG* do servidor de teste.
test('Dados pessoais antigos são apagados ao reiniciar o servidor',{skip:!process.env.PGDATABASE&&'Defina PGHOST/PGPORT/PGUSER/PGDATABASE do banco de teste para rodar.'},async()=>{const pool=new pg.Pool({max:1});try{const user=crypto.randomUUID();await pool.query("INSERT INTO manu_users(id,email,name,password) VALUES($1,$2,'Antigo','x')",[user,'antigo-'+user+'@example.com']);await pool.query('INSERT INTO manu_private_profiles(user_id,data) VALUES($1,$2)',[user,{cpf:'52998224725',birthDate:'1990-01-01',gender:'Feminino',signature:'data:image/png;base64,AAAA'}]);
process.env.NODE_ENV='unit-test';const server=await import('../server.js');try{await server.db()}finally{await server.pool.end()}
assert.deepEqual((await pool.query('SELECT data FROM manu_private_profiles WHERE user_id=$1',[user])).rows[0].data,{})}finally{await pool.end()}});
