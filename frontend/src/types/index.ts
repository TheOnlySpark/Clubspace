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

export type Event = {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  status: 'draft' | 'published' | 'cancelled';
  created_by: string | null;
  created_at: string;
};

export type Announcement = {
  id: string;
  club_id: string;
  title: string;
  body: string;
  sent_by: string | null;
  sent_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  announcement_id: string;
  read: boolean;
  created_at: string;
  announcement?: any;
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