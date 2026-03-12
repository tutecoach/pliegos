import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type PlanTier = "starter" | "professional" | "enterprise";
type AppRole = "admin" | "user";

const validPlanTiers: PlanTier[] = ["starter", "professional", "enterprise"];
const validRoles: AppRole[] = ["admin", "user"];

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "No authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser(token);

    if (authError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) return jsonResponse({ error: "Forbidden" }, 403);

    const { data: requesterProfile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !requesterProfile?.company_id) {
      return jsonResponse({ error: "Admin profile not configured" }, 400);
    }

    const companyId = requesterProfile.company_id as string;
    const body = await req.json();
    const action = body?.action as string | undefined;

    // ─── LIST ───
    if (action === "list") {
      const { data: profiles, error: listError } = await supabase
        .from("profiles")
        .select("user_id, full_name, plan_tier, created_at, demo_expires_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });

      if (listError) throw listError;

      const userIds = (profiles ?? []).map((p) => p.user_id);
      const rolesMap = new Map<string, AppRole>();

      if (userIds.length > 0) {
        const { data: rolesRows, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);
        if (rolesError) throw rolesError;

        for (const row of rolesRows ?? []) {
          if (row.role === "admin") {
            rolesMap.set(row.user_id, "admin");
          } else if (!rolesMap.has(row.user_id)) {
            rolesMap.set(row.user_id, "user");
          }
        }
      }

      const usersWithEmail = await Promise.all(
        (profiles ?? []).map(async (profile) => {
          const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
          return {
            user_id: profile.user_id,
            full_name: profile.full_name,
            email: userData?.user?.email ?? "",
            plan_tier: profile.plan_tier,
            role: rolesMap.get(profile.user_id) ?? "user",
            created_at: profile.created_at,
            demo_expires_at: (profile as any).demo_expires_at ?? null,
          };
        })
      );

      return jsonResponse({ users: usersWithEmail });
    }

    // ─── INVITE (create user in admin's company) ───
    if (action === "invite") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const fullName = String(body?.fullName ?? "").trim();
      const password = String(body?.password ?? "").trim();
      const planTier = body?.planTier as PlanTier;
      const role = body?.role as AppRole;

      if (!email) throw new Error("Email is required");
      if (!password || password.length < 6) throw new Error("Password must be at least 6 characters");
      if (!validPlanTiers.includes(planTier)) throw new Error("Invalid plan tier");
      if (!validRoles.includes(role)) throw new Error("Invalid role");

      let targetUserId: string | null = null;

      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createError) {
        if (createError.code !== "email_exists") throw createError;

        const { data: listedUsers, error: listUsersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listUsersError) throw listUsersError;

        const existingUser = listedUsers.users.find((u) => u.email?.toLowerCase() === email);
        if (!existingUser?.id) throw new Error("User exists but could not be resolved");
        targetUserId = existingUser.id;

        const { data: existingProfile, error: existingProfileError } = await supabase
          .from("profiles").select("company_id").eq("user_id", targetUserId).maybeSingle();
        if (existingProfileError) throw existingProfileError;

        if (existingProfile?.company_id && existingProfile.company_id !== companyId) {
          return jsonResponse({ error: "El email ya pertenece a otra empresa" }, 409);
        }

        const { error: updateAuthUserError } = await supabase.auth.admin.updateUserById(targetUserId, {
          password,
          user_metadata: { full_name: fullName || existingUser.user_metadata?.full_name || "" },
        });
        if (updateAuthUserError) throw updateAuthUserError;
      } else {
        targetUserId = createData?.user?.id ?? null;
      }

      if (!targetUserId) throw new Error("Could not resolve created user id");

      const { error: profileUpsertError } = await supabase.from("profiles").upsert(
        { user_id: targetUserId, company_id: companyId, full_name: fullName || null, plan_tier: planTier },
        { onConflict: "user_id" }
      );
      if (profileUpsertError) throw profileUpsertError;

      const { error: deleteRolesError } = await supabase.from("user_roles").delete().eq("user_id", targetUserId);
      if (deleteRolesError) throw deleteRolesError;

      const { error: insertRoleError } = await supabase.from("user_roles").insert({ user_id: targetUserId, role });
      if (insertRoleError) throw insertRoleError;

      return jsonResponse({ success: true, created_user_id: targetUserId });
    }

    // ─── CREATE DEMO USER ───
    if (action === "create-demo-user") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const fullName = String(body?.fullName ?? "").trim();
      const companyName = String(body?.companyName ?? "").trim();
      const password = String(body?.password ?? "").trim();
      const demoDays = Number(body?.demoDays) || 30;
      const demoRequestId = String(body?.demoRequestId ?? "").trim();

      if (!email) throw new Error("Email is required");
      if (!password || password.length < 6) throw new Error("Password must be at least 6 characters");
      if (!companyName) throw new Error("Company name is required");

      const { data: newCompany, error: companyError } = await supabase
        .from("companies").insert({ name: companyName }).select("id").single();
      if (companyError) throw companyError;

      const demoCompanyId = newCompany.id;
      let targetUserId: string | null = null;

      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: fullName },
      });

      if (createError) {
        if (createError.code !== "email_exists") throw createError;
        const { data: listedUsers, error: listUsersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listUsersError) throw listUsersError;
        const existingUser = listedUsers.users.find((u) => u.email?.toLowerCase() === email);
        if (!existingUser?.id) throw new Error("User exists but could not be resolved");
        targetUserId = existingUser.id;
        const { error: updateErr } = await supabase.auth.admin.updateUserById(targetUserId, {
          password, user_metadata: { full_name: fullName || existingUser.user_metadata?.full_name || "" },
        });
        if (updateErr) throw updateErr;
      } else {
        targetUserId = createData?.user?.id ?? null;
      }

      if (!targetUserId) throw new Error("Could not resolve created user id");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + demoDays);

      const { error: profileError2 } = await supabase.from("profiles").upsert(
        { user_id: targetUserId, company_id: demoCompanyId, full_name: fullName || null, plan_tier: "professional" as PlanTier, demo_expires_at: expiresAt.toISOString() },
        { onConflict: "user_id" }
      );
      if (profileError2) throw profileError2;

      const { error: deleteRolesError } = await supabase.from("user_roles").delete().eq("user_id", targetUserId);
      if (deleteRolesError) throw deleteRolesError;
      const { error: insertRoleError } = await supabase.from("user_roles").insert({ user_id: targetUserId, role: "admin" as AppRole });
      if (insertRoleError) throw insertRoleError;

      if (demoRequestId) {
        await supabase.from("demo_requests").update({ status: "approved" }).eq("id", demoRequestId);
      }

      return jsonResponse({ success: true, created_user_id: targetUserId, company_id: demoCompanyId, demo_expires_at: expiresAt.toISOString() });
    }

    // ─── UPDATE USER ───
    if (action === "update") {
      const userId = String(body?.userId ?? "").trim();
      const fullName = body?.fullName !== undefined ? String(body.fullName).trim() : undefined;
      const planTier = body?.planTier as PlanTier | undefined;
      const role = body?.role as AppRole | undefined;

      if (!userId) throw new Error("userId is required");
      if (planTier && !validPlanTiers.includes(planTier)) throw new Error("Invalid plan tier");
      if (role && !validRoles.includes(role)) throw new Error("Invalid role");

      const { data: targetProfile, error: targetProfileError } = await supabase
        .from("profiles").select("user_id, company_id").eq("user_id", userId).single();

      if (targetProfileError || !targetProfile || targetProfile.company_id !== companyId) {
        return jsonResponse({ error: "User not in your company" }, 403);
      }

      if (planTier || fullName !== undefined) {
        const payload: Record<string, unknown> = {};
        if (planTier) payload.plan_tier = planTier;
        if (fullName !== undefined) payload.full_name = fullName || null;
        const { error: profileUpdateError } = await supabase.from("profiles").update(payload).eq("user_id", userId).eq("company_id", companyId);
        if (profileUpdateError) throw profileUpdateError;
      }

      if (role) {
        const { error: deleteRolesError } = await supabase.from("user_roles").delete().eq("user_id", userId);
        if (deleteRolesError) throw deleteRolesError;
        const { error: insertRoleError } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (insertRoleError) throw insertRoleError;
      }

      return jsonResponse({ success: true });
    }

    // ─── UPDATE PASSWORD ───
    if (action === "update-password") {
      const userId = String(body?.userId ?? "").trim();
      const newPassword = String(body?.newPassword ?? "").trim();

      if (!userId) throw new Error("userId is required");
      if (!newPassword || newPassword.length < 6) throw new Error("Password must be at least 6 characters");

      // Verify user belongs to admin's company
      const { data: targetProfile, error: targetProfileError } = await supabase
        .from("profiles").select("user_id, company_id").eq("user_id", userId).single();

      if (targetProfileError || !targetProfile || targetProfile.company_id !== companyId) {
        return jsonResponse({ error: "User not in your company" }, 403);
      }

      // Cannot change own password through this (use forgot password instead)
      if (userId === user.id) {
        return jsonResponse({ error: "No podés cambiar tu propia contraseña desde aquí. Usá la opción de recuperar contraseña." }, 400);
      }

      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
      if (updateErr) throw updateErr;

      return jsonResponse({ success: true });
    }

    // ─── DELETE USER ───
    if (action === "delete-user") {
      const userId = String(body?.userId ?? "").trim();

      if (!userId) throw new Error("userId is required");

      // Cannot delete yourself
      if (userId === user.id) {
        return jsonResponse({ error: "No podés eliminar tu propia cuenta" }, 400);
      }

      // Verify user belongs to admin's company
      const { data: targetProfile, error: targetProfileError } = await supabase
        .from("profiles").select("user_id, company_id").eq("user_id", userId).single();

      if (targetProfileError || !targetProfile || targetProfile.company_id !== companyId) {
        return jsonResponse({ error: "User not in your company" }, 403);
      }

      // Delete profile, roles, then auth user
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("user_id", userId);

      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteAuthError) throw deleteAuthError;

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Unsupported action" }, 400);
  } catch (error) {
    console.error("manage-company-users error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
