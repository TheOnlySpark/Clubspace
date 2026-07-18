// src/types/index.ts
export type University = {
  id: string;
  name: string;
  slug: string;
  domain_allowlist: string[];
  settings: Record<string, any>;
  created_at: string;
};

export type Department = {
  id: string;
  university_id: string;
  name: string;
  created_at: string;
};

export type UserRole = {
  id: string;
  user_id: string;
  university_id: string;
  role: 'super_admin' | 'university_admin' | 'club_admin' | 'officer' | 'member';
  created_at: string;
};

export type Profile = {
  id: string;
  university_id: string | null;
  first_name: string | null;
  last_name: string | null;
  student_number: string | null;
  department_id: string | null;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
};

export type Club = {
  id: string;
  university_id: string;
  department_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  privacy: 'public' | 'university' | 'members';
  join_policy: 'open' | 'invite' | 'approval';
  settings: Record<string, any>;
  created_at: string;
};

export type ClubMembership = {
  id: string;
  club_id: string;
  user_id: string;
  role: 'admin' | 'officer' | 'member';
  joined_at: string;
};



export type Announcement = {
  id: string;
  university_id: string;
  club_id: string | null;
  author_id: string;
  title: string;
  body: string;
  status: 'draft' | 'pending_approval' | 'published' | 'archived' | 'rejected';
  visibility: 'club' | 'university' | 'public';
  pinned: boolean;
  publish_at: string | null;
  expires_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  club_name?: string;
  author_name?: string;
};

export type AnnouncementRead = {
  announcement_id: string;
  user_id: string;
  read_at: string;
};

export type AnnouncementAuditLog = {
  id: string;
  announcement_id: string;
  actor_id: string;
  action: string;
  metadata: Record<string, any> | null;
  created_at: string;
};

export type AnnouncementSettings = {
  university_id: string;
  require_approval_for_officers: boolean;
  max_pinned_per_club: number;
  allow_club_public_visibility: boolean;
  retention_days: number;
  branding_color: string;
  updated_at: string;
};

export type InviteLink = {
  id: string;
  club_id: string;
  token: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  revoked: boolean;
  created_by: string | null;
  created_at: string;
};

export type CsvImport = {
  id: string;
  university_id: string;
  uploaded_by: string | null;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  report: Record<string, any>;
  created_at: string;
};

export type GdprRequest = {
  id: string;
  user_id: string;
  type: 'export' | 'erasure';
  status: 'pending' | 'processing' | 'complete';
  created_at: string;
  completed_at: string | null;
};

export type Role =
  | 'super_admin'
  | 'university_admin'
  | 'club_admin'
  | 'officer'
  | 'member';