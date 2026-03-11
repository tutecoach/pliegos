import { supabase } from "@/integrations/supabase/client";

interface EnsureCompanySetupResult {
  companyId: string;
  projects: { id: string; name: string }[];
  defaultProjectId: string;
}

export const ensureCompanySetupForUser = async (
  userId: string,
  companyName = "Mi Empresa",
  projectName = "Proyecto General"
): Promise<EnsureCompanySetupResult> => {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) throw profileError;

  let companyId = profile?.company_id ?? null;

  if (!companyId) {
    const generatedCompanyId = crypto.randomUUID();

    const { error: companyError } = await supabase.from("companies").insert({
      id: generatedCompanyId,
      name: companyName,
    });

    if (companyError) throw companyError;

    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ company_id: generatedCompanyId })
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (profileUpdateError) throw profileUpdateError;

    if (!updatedProfile) {
      const { error: profileInsertError } = await supabase.from("profiles").insert({
        user_id: userId,
        company_id: generatedCompanyId,
      });

      if (profileInsertError) throw profileInsertError;
    }

    companyId = generatedCompanyId;
  }

  const { data: companyProjects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (projectsError) throw projectsError;

  let projects = companyProjects ?? [];
  let defaultProjectId = projects[0]?.id ?? "";

  if (!defaultProjectId) {
    const generatedProjectId = crypto.randomUUID();
    const { error: projectError } = await supabase.from("projects").insert({
      id: generatedProjectId,
      company_id: companyId,
      name: projectName,
      status: "active",
    });

    if (projectError) throw projectError;

    projects = [{ id: generatedProjectId, name: projectName }];
    defaultProjectId = generatedProjectId;
  }

  return {
    companyId,
    projects,
    defaultProjectId,
  };
};
