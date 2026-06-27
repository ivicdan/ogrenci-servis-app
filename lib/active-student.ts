const KEY = "veli_student_id";

export function getActiveStudentId(): string {
  try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; }
}

export function setActiveStudentId(id: string): void {
  try { localStorage.setItem(KEY, id); } catch {}
}
