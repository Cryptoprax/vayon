import { loadEnvConfig } from "@next/env";
import { createClient, type User } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const founderEmails = Object.freeze([
  "prakyathaiagent@gmail.com",
  "vpprakyath@gmail.com",
  "vsukanya1969@gmail.com",
  "prakyathvp@gmail.com",
]);

interface Summary {
  found: number;
  updated: number;
  skipped: number;
  failed: number;
}

async function main(): Promise<void> {
  const summary: Summary = { found: 0, updated: 0, skipped: 0, failed: 0 };
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("FAILED Required Supabase server configuration is missing.");
    summary.failed += 1;
    printSummary(summary);
    process.exitCode = 1;
    return;
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const users = new Map<string, User>();
  try {
    let page = 1;
    while (true) {
      const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error("Unable to list Supabase Auth users.");
      for (const user of data.users) {
        if (user.email) users.set(user.email.trim().toLowerCase(), user);
      }
      if (!data.nextPage) break;
      page = data.nextPage;
    }
  } catch {
    console.error("FAILED Unable to read Supabase Auth accounts.");
    summary.failed += 1;
    printSummary(summary);
    process.exitCode = 1;
    return;
  }

  for (const email of founderEmails) {
    const user = users.get(email);
    if (!user) {
      console.log(`SKIPPED ${email} — authenticated user does not exist`);
      summary.skipped += 1;
      continue;
    }

    summary.found += 1;
    console.log(`FOUND ${email}`);
    if (user.app_metadata?.role === "super_admin") {
      console.log(`SKIPPED ${email} — role already configured`);
      summary.skipped += 1;
      continue;
    }

    const { error } = await client.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, role: "super_admin" },
    });
    if (error) {
      console.error(`FAILED ${email} — role update was rejected`);
      summary.failed += 1;
      continue;
    }

    console.log(`UPDATED ${email}`);
    summary.updated += 1;
  }

  printSummary(summary);
  if (summary.failed > 0) process.exitCode = 1;
}

function printSummary(summary: Summary): void {
  console.log("\nFounder provisioning summary");
  console.log(`FOUND ${summary.found}`);
  console.log(`UPDATED ${summary.updated}`);
  console.log(`SKIPPED ${summary.skipped}`);
  console.log(`FAILED ${summary.failed}`);
}

void main();
