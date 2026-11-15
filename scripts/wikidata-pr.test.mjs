// Skutečné commity, push do místního bare repozitáře a sloučení; gh je jediná náhrada.
// Bez sítě, dalších balíčků a zápisu do pracovního repozitáře.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("./wikidata-pr.sh", import.meta.url));
const vystupy = ["data/podrobnosti.json", "data/wikidata.json"];
const wikidata = n => JSON.stringify({ zaznamy: { test1234: { cs: "test", m: [n, 2026, 1] } } });

function priprav(t) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "wikidata-pr-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const repo = path.join(tmp, "repo"), remote = path.join(tmp, "remote.git");
  const bin = path.join(tmp, "bin"), capture = path.join(tmp, "gh.json");
  fs.mkdirSync(repo);
  fs.mkdirSync(bin);
  const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1",
    GITHUB_RUN_ID: "12345", GITHUB_RUN_ATTEMPT: "1", GITHUB_REPOSITORY: "fixture/atlas",
    GH_CAPTURE: capture, GH_FAILURE: "0", PATH: bin + path.delimiter + process.env.PATH };
  const git = (...args) => execFileSync("git", args, { cwd: repo, env, encoding: "utf8", stdio: "pipe" }).trim();
  const zapis = (name, text) => {
    const p = path.join(repo, name);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, text);
  };
  const cti = name => fs.readFileSync(path.join(repo, name), "utf8");
  git("init", "--bare", remote);
  git("init", "-b", "main");
  git("config", "user.name", "Workflow test");
  git("config", "user.email", "test@example.invalid");
  zapis("data/wikidata.json", wikidata(100));
  zapis("data/podrobnosti.json", '{"radky":[100]}');
  zapis("data/starovek.json", '{"text":"původní"}');
  zapis("src/app.js", "// původní kód\n");
  zapis("dist/index.html", "původní sestavení");
  zapis("dist/js/old.js", "původní skript");
  git("add", ".");
  git("commit", "-m", "Výchozí stav");
  git("remote", "add", "origin", remote);
  git("push", "-u", "origin", "main");
  fs.writeFileSync(path.join(bin, "gh"), `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
const body = fs.readFileSync(args[args.indexOf("--body-file") + 1], "utf8");
fs.writeFileSync(process.env.GH_CAPTURE, JSON.stringify({ args, body }));
process.exit(Number(process.env.GH_FAILURE));
`, { mode: 0o755 });
  const spust = (extra = {}) => spawnSync("bash", [script], { cwd: repo, env: { ...env, ...extra }, encoding: "utf8" });
  const uspech = (extra = {}) => {
    const r = spust(extra);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return r;
  };
  return { repo, git, zapis, cti, spust, uspech, capture };
}

test("PR přenese jen oba výstupy a pozdější Merge zachová novější web i redakční data", t => {
  const f = priprav(t);
  f.zapis("data/wikidata.json", wikidata(200));
  f.zapis("data/podrobnosti.json", '{"radky":[200]}');
  // Simulace pracovních změn po kontrole: jiné JSON, přepsaný dist i nový hash skriptu.
  f.zapis("data/starovek.json", '{"text":"nesmí do datového PR"}');
  f.zapis("data/nepatri.json", "{}");
  f.zapis("dist/index.html", "zkušební sestavení");
  fs.unlinkSync(path.join(f.repo, "dist/js/old.js"));
  f.zapis("dist/js/generated.js", "zkušební skript");
  f.uspech();
  const branch = f.git("branch", "--show-current");
  assert.match(branch, /^data\/wikidata-\d{4}-\d{2}-\d{2}-12345-1$/);
  assert.deepEqual(f.git("diff", "--name-only", "main..HEAD").split("\n"), vystupy);
  assert.equal(f.git("rev-parse", "refs/remotes/origin/" + branch), f.git("rev-parse", "HEAD"));
  const { args, body } = JSON.parse(fs.readFileSync(f.capture, "utf8"));
  assert.deepEqual(args.slice(0, 2), ["pr", "create"]);
  for (const [flag, value] of [["--repo", "fixture/atlas"], ["--base", "main"], ["--head", branch]]) {
    assert.equal(args[args.indexOf(flag) + 1], value);
  }
  assert.match(body, /Po ručním Merge Netlify znovu spustí/);

  // Runner zahodí výsledek zkušebního sestavení; main mezitím dostane vlastní úpravy.
  f.git("restore", "--", "data/starovek.json", "dist");
  fs.unlinkSync(path.join(f.repo, "data/nepatri.json"));
  fs.unlinkSync(path.join(f.repo, "dist/js/generated.js"));
  f.git("switch", "main");
  const novyStarovek = '{"text":"novější redakční obsah"}', novyKod = "// novější kód\n";
  f.zapis("data/starovek.json", novyStarovek);
  f.zapis("src/app.js", novyKod);
  f.zapis("dist/index.html", "novější web");
  fs.unlinkSync(path.join(f.repo, "dist/js/old.js"));
  f.zapis("dist/js/latest.js", "novější skript");
  f.git("add", ".");
  f.git("commit", "-m", "Novější web a redakční obsah");
  const pred = f.git("rev-parse", "HEAD");
  f.git("merge", "--no-ff", branch, "-m", "Pozdější lidské schválení dat");
  assert.deepEqual(f.git("diff", "--name-only", pred, "HEAD").split("\n"), vystupy);
  assert.equal(f.cti("data/wikidata.json"), wikidata(200));
  assert.equal(f.cti("data/podrobnosti.json"), '{"radky":[200]}');
  assert.equal(f.cti("data/starovek.json"), novyStarovek);
  assert.equal(f.cti("src/app.js"), novyKod);
  assert.equal(f.cti("dist/index.html"), "novější web");
  assert.deepEqual(fs.readdirSync(path.join(f.repo, "dist/js")), ["latest.js"]);
  assert.equal(f.git("status", "--porcelain"), "");
});

test("samotné změny dist/ a ostatních dat nevytvoří prázdný datový PR", t => {
  const f = priprav(t), pred = f.git("rev-parse", "HEAD");
  f.zapis("dist/index.html", "pouze nový den sestavení");
  f.zapis("dist/js/novy.js", "nový soubor");
  f.zapis("data/starovek.json", "{}");
  f.zapis("data/navic.json", "{}");
  assert.match(f.uspech().stdout, /Data se od minula nezměnila/);
  assert.equal(f.git("rev-parse", "HEAD"), pred);
  assert.equal(f.git("ls-remote", "--heads", "origin", "data/*"), "");
  assert.equal(fs.existsSync(f.capture), false);
});

for (const name of vystupy) {
  test(`změna jediného výstupu ${name} stačí k vytvoření PR`, t => {
    const f = priprav(t);
    f.zapis(name, name.endsWith("wikidata.json") ? wikidata(200) : '{"radky":[200]}');
    f.uspech();
    assert.equal(f.git("diff", "--name-only", "main..HEAD"), name);
    assert.equal(fs.existsSync(f.capture), true);
  });
}

test("předem připravený cizí soubor zastaví postup ještě před commitem a pushem", t => {
  const f = priprav(t), pred = f.git("rev-parse", "HEAD");
  f.zapis("data/wikidata.json", wikidata(200));
  f.zapis("data/starovek.json", "{}");
  f.git("add", "data/starovek.json");
  const r = f.spust();
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /Index není prázdný/);
  assert.equal(f.git("rev-parse", "HEAD"), pred);
  assert.equal(f.git("ls-remote", "--heads", "origin", "data/*"), "");
  assert.equal(fs.existsSync(f.capture), false);
});

test("chyba vytvoření PR nezmizí jako úspěch a nahraná datová větev zůstane dostupná", t => {
  const f = priprav(t);
  f.zapis("data/wikidata.json", wikidata(200));
  const r = f.spust({ GH_FAILURE: "1" });
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /Pull request se nepodařilo založit/);
  assert.match(f.git("ls-remote", "--heads", "origin", "data/*"), /data\/wikidata-/);
});

test("opakovaný pokus téhož běhu nekoliduje s již nahranou větví", t => {
  const f = priprav(t);
  f.zapis("data/wikidata.json", wikidata(200));
  f.uspech();
  const prvni = f.git("branch", "--show-current");
  f.git("switch", "main");
  f.zapis("data/wikidata.json", wikidata(200));
  f.uspech({ GITHUB_RUN_ATTEMPT: "2" });
  const druhy = f.git("branch", "--show-current");
  assert.notEqual(prvni, druhy);
  assert.match(druhy, /-12345-2$/);
  assert.equal(f.git("ls-remote", "--heads", "origin", "data/*").split("\n").length, 2);
});
