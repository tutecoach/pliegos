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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: requesterProfile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !requesterProfile?.company_id) {
      return new Response(JSON.stringify({ error: "Admin profile not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = requesterProfile.company_id as string;
    const body = await req.json();
    const action = body?.action as string | undefined;

    if (action === "list") {
      const { data: profiles, error: listError } = await supabase
        .from("profiles")
        .select("user_id, full_name, plan_tier, created_at")
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
          };
        })
      );

      return new Response(JSON.stringify({ users: usersWithEmail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "invite") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const fullName = String(body?.fullName ?? "").trim();
      const planTier = body?.planTier as PlanTier;
      const role = body?.role as AppRole;

      if (!email) throw new Error("Email is required");
      if (!validPlanTiers.includes(planTier)) throw new Error("Invalid plan tier");
      if (!validRoles.includes(role)) throw new Error("Invalid role");

      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
        redirectTo: body?.redirectTo || undefined,
      });

      if (inviteError) throw inviteError;

      const invitedUserId = inviteData?.user?.id;
      if (!invitedUserId) throw new Error("Could not resolve invited user id");

      const { error: profileUpsertError } = await supabase.from("profiles").upsert(
        {
          user_id: invitedUserId,
          company_id: companyId,
          full_name: fullName || null,
          plan_tier: planTier,
        },
        { onConflict: "user_id" }
      );

      if (profileUpsertError) throw profileUpsertError;

      const { error: deleteRolesError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", invitedUserId);
      if (deleteRolesError) throw deleteRolesError;

      const { error: insertRoleError } = await supabase
        .from("user_roles")
        .insert({ user_id: invitedUserId, role });
      if (insertRoleError) throw insertRoleError;

      return new Response(JSON.stringify({ success: true, invited_user_id: invitedUserId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const userId = String(body?.userId ?? "").trim();
      const fullName = body?.fullName !== undefined ? String(body.fullName).trim() : undefined;
      const planTier = body?.planTier as PlanTier | undefined;
      const role = body?.role as AppRole | undefined;

      if (!userId) throw new Error("userId is required");
      if (planTier && !validPlanTiers.includes(planTier)) throw new Error("Invalid plan tier");
      if (role && !validRoles.includes(role)) throw new Error("Invalid role");

      const { data: targetProfile, error: targetProfileError } = await supabase
        .from("profiles")
        .select("user_id, company_id")
        .eq("user_id", userId)
        .single();

      if (targetProfileError || !targetProfile || targetProfile.company_id !== companyId) {
        return new Response(JSON.stringify({ error: "User not in your company" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (planTier || fullName !== undefined) {
        const payload: Record<string, unknown> = {};
        if (planTier) payload.plan_tier = planTier;
        if (fullName !== undefined) payload.full_name = fullName || null;

        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update(payload)
          .eq("user_id", userId)
          .eq("company_id", companyId);

        if (profileUpdateError) throw profileUpdateError;
      }

      if (role) {
        const { error: deleteRolesError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);
        if (deleteRolesError) throw deleteRolesError;

        const { error: insertRoleError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (insertRoleError) throw insertRoleError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("manage-company-users error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
