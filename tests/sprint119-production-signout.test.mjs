import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("both authenticated profile menus submit the canonical logout action", () => {
  const product = read("features/vayon/product-shell/ShellMenus.tsx");
  const platform = read("features/dashboard/components/ProfileDropdown.tsx");
  for (const source of [product, platform]) {
    assert.match(source, /logoutAction/);
    assert.match(source, /<form action=\{logoutAction\}/);
    assert.match(source, /type="submit"/);
  }
});

test("the product profile menu rises above floating surfaces while open", () => {
  const header = read("features/vayon/product-shell/ShellHeader.tsx");
  const menu = read("features/vayon/product-shell/ShellMenus.tsx");
  const styles = read("app/globals.css");
  assert.match(styles, /\.vayon-floating-layout \{[^}]*z-index:70/);
  assert.match(header, /profileOpen\?"z-\[80\]":"z-\[60\]"/);
  assert.match(header, /onOpenChange=\{setProfileOpen\}/);
  assert.match(menu, /onOpenChange\?\.\(next\)/);
});

test("logout awaits Supabase signOut and surfaces provider failure", () => {
  const action = read("features/authentication/actions/auth.actions.ts");
  const service = read("features/authentication/services/authentication.service.ts");
  assert.match(service, /return client\.auth\.signOut\(\)/);
  assert.match(action, /const \{ error \} = await new AuthenticationService\(\)\.logout\(\)/);
  assert.match(action, /if \(error\) throw new Error\("Unable to sign out/);
});

test("successful logout clears routed state before the existing login redirect", () => {
  const action = read("features/authentication/actions/auth.actions.ts");
  const revalidate = action.indexOf('revalidatePath("/", "layout")');
  const redirect = action.indexOf('redirect("/login")', revalidate);
  assert.ok(revalidate >= 0);
  assert.ok(redirect > revalidate);
});

test("middleware remains authoritative after cookie removal", () => {
  const proxy = read("lib/supabase/proxy.ts");
  assert.match(proxy, /await supabase\.auth\.getUser\(\)/);
  assert.match(proxy, /if \(!user && !isPublic\)/);
  assert.match(proxy, /target\.pathname = "\/login"/);
});
