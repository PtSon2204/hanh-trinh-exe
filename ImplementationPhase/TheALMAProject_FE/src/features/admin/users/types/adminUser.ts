import type {
	IsoDateString,
	PaginationQuery,
	UserRole,
} from "../../../../shared/types/api";

export interface AdminUserListDto {
	userId: number;
	email: string;
	fullName: string;
	phone: string | null;
	avatarUrl: string | null;
	role: UserRole;
	isActive: boolean;
	createdAt: IsoDateString | null;
}

export type AdminUserDto = AdminUserListDto;

export interface AdminCreateUserDto {
	email: string;
	passwordHash: string;
	fullName: string;
	phone?: string | null;
	avatarUrl?: string | null;
	role: UserRole;
}

export interface AdminUpdateUserDto extends AdminCreateUserDto {
	userId: number;
}

export interface AdminAssignRoleDto {
	role: UserRole;
}

export interface AdminUserQuery extends PaginationQuery {
	role?: UserRole;
	isActive?: boolean;
}
