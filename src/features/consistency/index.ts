export interface ConsistencyFinding {
  id: string;
  novel_id: string;
  scene_id?: string | null;
  finding_type: "character_contradiction" | "timeline_inconsistency" | "lore_conflict" | "plot_hole";
  severity: "suggestion" | "observation" | "potential_conflict";
  title: string;
  description: string;
  source_excerpts?: string[];
  status: "open" | "resolved" | "dismissed";
  created_at: string;
}
