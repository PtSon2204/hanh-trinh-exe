export interface AdminUniversityListDto {
  universityId: number;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
}

export type AdminUniversityDto = AdminUniversityListDto;

export interface AdminCreateUniversityDto {
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
}

export interface AdminUpdateUniversityDto {
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
}
