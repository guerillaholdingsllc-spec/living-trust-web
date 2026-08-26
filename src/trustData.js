import { supabase } from "./supabaseClient.js";

// SAVE INTAKE FORM DATA
export async function saveIntakeForm(userId, intakeData) {
  try {
    const { data, error } = await supabase
      .from("trust_intakes")
      .upsert(
        {
          user_id: userId,
          full_name: intakeData.fullName,
          email: intakeData.email,
          state: intakeData.state,
          successor_trustee: intakeData.successorTrustee,
          beneficiaries: intakeData.beneficiaries,
          distribution_plan: intakeData.distributionPlan,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );

    if (error) throw new Error(error.message);
    return { data, success: true };
  } catch (error) {
    console.error("Error saving intake form:", error);
    throw error;
  }
}

// GET INTAKE FORM DATA
export async function getIntakeForm(userId) {
  try {
    const { data, error } = await supabase
      .from("trust_intakes")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw new Error(error.message);
    return data || null;
  } catch (error) {
    console.error("Error fetching intake form:", error);
    return null;
  }
}

// SAVE SELECTED CLAUSES
export async function saveTrustClauses(userId, selectedClauses) {
  try {
    const { data, error } = await supabase
      .from("trust_clauses")
      .upsert(
        {
          user_id: userId,
          clauses: selectedClauses,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      );

    if (error) throw new Error(error.message);
    return { data, success: true };
  } catch (error) {
    console.error("Error saving clauses:", error);
    throw error;
  }
}

// GET SELECTED CLAUSES
export async function getTrustClauses(userId) {
  try {
    const { data, error } = await supabase
      .from("trust_clauses")
      .select("clauses")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw new Error(error.message);
    return data?.clauses || [];
  } catch (error) {
    console.error("Error fetching clauses:", error);
    return [];
  }
}

// SAVE CLAUSE QUESTION RESPONSES
export async function saveClauseResponses(userId, clauseId, responses) {
  try {
    const { data, error } = await supabase
      .from("clause_responses")
      .upsert(
        {
          user_id: userId,
          clause_id: clauseId,
          responses: responses,
          updated_at: new Date().toISOString()
        },
        { onConflict: ["user_id", "clause_id"] }
      );

    if (error) throw new Error(error.message);
    return { data, success: true };
  } catch (error) {
    console.error("Error saving clause responses:", error);
    throw error;
  }
}

// GET ALL TRUST DATA FOR USER
export async function getCompleteTrustData(userId) {
  try {
    const intake = await getIntakeForm(userId);
    const clauses = await getTrustClauses(userId);
    
    return {
      intake,
      selectedClauses: clauses,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching complete trust data:", error);
    return { intake: null, selectedClauses: [], timestamp: null };
  }
}