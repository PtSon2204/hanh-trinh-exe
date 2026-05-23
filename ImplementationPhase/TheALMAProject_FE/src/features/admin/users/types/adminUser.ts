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

export interface AdminUserMutationResponse {
	message: string;
	data?: AdminUserDto | null;
	avatarUrl?: string | null;
}

export interface AdminUserQuery extends PaginationQuery {
	email?: string;
	fullName?: string;
	role?: UserRole;
	isActive?: boolean;
	phone?: string;
}
