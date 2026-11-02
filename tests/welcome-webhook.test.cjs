const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");
test("confirmation webhook excludes Auth secrets and sends once on confirmation", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create schema vault; create schema net;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,encrypted_password text);
      create table vault.decrypted_secrets(name text,decrypted_secret text);
      insert into vault.decrypted_secrets values ('deutschklinik_welcome_hook','fixture-secret');
      create table public.test_deliveries(body jsonb);
      create function net.http_post(url text,body jsonb,headers jsonb,timeout_milliseconds integer) returns bigint
      language plpgsql as $$ begin insert into public.test_deliveries values(body); return 1; end $$;`);
    await db.exec(fs.readFileSync("supabase/migrations/20261102_welcome_delivery.sql", "utf8")
      .replace("create extension if not exists pg_net with schema extensions;", ""));
    await db.exec(`insert into auth.users values ('00000000-0000-4000-a000-000000000001','test@example.invalid',null,'NEVER SEND THIS');
      update auth.users set email_confirmed_at=now();
      update auth.users set encrypted_password='OTHER SECRET';
      update auth.users set email_confirmed_at=now();`);
    const rows = (await db.query("select body from public.test_deliveries")).rows;
    assert.equal(rows.length, 1);
    assert.deepEqual(Object.keys(rows[0].body.record).sort(), ["email", "email_confirmed_at", "id"]);
    assert.equal(JSON.stringify(rows).includes("SECRET"), false);
    assert.equal(rows[0].body.type, "UPDATE");
    await db.exec(`insert into auth.users values ('00000000-0000-4000-a000-000000000002','other@example.invalid',now(),'PRIVATE');`);
    assert.equal((await db.query("select * from public.test_deliveries")).rows.length, 2);
  } finally { await db.close(); }
});
