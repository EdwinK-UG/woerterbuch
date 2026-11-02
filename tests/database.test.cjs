const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");
const read = (file) => fs.readFileSync(file, "utf8");
test("SQL upgrades replay safely and enforce school, save and attempt boundaries", async () => {
  const db = new PGlite();
  try {
    await db.exec(read("tests/school-security-bootstrap.sql"));
    for (let pass = 0; pass < 2; pass++) {
      await db.exec(read("supabase_setup.sql"));
      await db.exec(read("accounts_setup.sql"));
      // The hosted pg_net/Vault integration has a separate webhook test with stubs.
      for (const file of fs.readdirSync("supabase/migrations").filter(f => !f.endsWith("_welcome_delivery.sql")).sort())
        await db.exec(read("supabase/migrations/" + file));
    }
    await db.exec(read("tests/school-security.sql"));
    const a = "00000000-0000-4000-ab00-000000000051",
      b = "00000000-0000-4000-ab00-000000000052";
    await db.exec(
      "insert into auth.users(id) values ('" +
        a +
        "'),('" +
        b +
        "');set role authenticated;select set_config('request.jwt.claim.sub','" +
        a +
        "',false)",
    );
    const attempt =
      "insert into public.grammar_results(attempt_id,chapter,exercise,score,total,passed) values('00000000-0000-4000-ab00-000000000061',1,'u1',1,1,true) on conflict(user_id,attempt_id) do nothing";
    await db.exec(attempt);
    await db.exec(attempt);
    assert.equal(
      (await db.query("select count(*)::int n from public.grammar_results"))
        .rows[0].n,
      1,
    );
    await db.exec(
      "insert into public.grammar_results(chapter,exercise,score,total,passed) select 2,'u1',1,1,true from generate_series(1,1505)",
    );
    const summary = await db.query(
      "select * from public.practice_summary($1::uuid[])",
      [[a]],
    );
    assert.equal(summary.rows.length, 2);
    assert.equal(Number(summary.rows[1].attempt_count), 1505);
    await db.exec(
      "insert into public.user_data(lists,prefs) values('{\"one\":1}','{\"quizzes\":{}}')",
    );
    await db.exec(
      "update public.user_data set lists='{\"two\":2}' where revision=0",
    );
    assert.equal(
      (await db.query("select revision::int from public.user_data")).rows[0]
        .revision,
      1,
    );
    assert.equal(
      (
        await db.query(
          "update public.user_data set lists='{}' where revision=0 returning *",
        )
      ).rows.length,
      0,
    );
    await db.exec(
      "select set_config('request.jwt.claim.sub','" + b + "',false)",
    );
    assert.equal(
      (
        await db.query("select * from public.practice_summary($1::uuid[])", [
          [a],
        ])
      ).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.user_data")).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
