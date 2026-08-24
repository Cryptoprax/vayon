import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

export class FounderBootstrapRepository {
  constructor(private readonly client: SupabaseClient) {}

  async users(): Promise<readonly User[]> {
    const users: User[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await this.client.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error("Unable to read Founder account status.");
      users.push(...data.users);
      if (!data.nextPage) return users;
      page = data.nextPage;
    }
  }

  async updateRole(user: User, appMetadata: Record<string, unknown>): Promise<User> {
    const { data, error } = await this.client.auth.admin.updateUserById(user.id, {
      app_metadata: appMetadata,
    });
    if (error || !data.user) throw new Error("Unable to update Founder access.");
    return data.user;
  }
}
