import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../../../../shared/api/axiosClient";
import type { UserRole } from "../../../../shared/types/api";
import type { PagedResult } from "../../../../shared/types/pagination";
import { adminUserApi } from "../api/adminUserApi";
import type {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  AdminUserDto,
  AdminUserListDto,
} from "../types/adminUser";

const userRoleOptions: UserRole[] = [
  "Admin",
  "Product Manager",
  "OrderMgr",
  "Customer",
];

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface UserFormState {
  avatarUrl: string;
  email: string;
  fullName: string;
  isActive: boolean;
  passwordHash: string;
  phone: string;
  role: UserRole;
}

const emptyUserForm: UserFormState = {
  avatarUrl: "",
  email: "",
  fullName: "",
  isActive: true,
  passwordHash: "",
  phone: "",
  role: "Customer",
};

function emptyPage<T>(pageNumber: number, pageSize: number): PagedResult<T> {
  return {
    data: [],
    pageNumber,
    pageSize,
    totalPages: 1,
    totalRecords: 0,
  };
}

function formatDate(value: string | null) {
  if (!value) return "Chưa có ngày";
  return dateFormatter.format(new Date(value));
}

function toUserForm(user: AdminUserDto | null): UserFormState {
  if (!user) return emptyUserForm;

  return {
    avatarUrl: user.avatarUrl ?? "",
    email: user.email,
    fullName: user.fullName,
    isActive: user.isActive,
    passwordHash: "",
    phone: user.phone ?? "",
    role: user.role,
  };
}

function getRoleLabel(role: UserRole) {
  if (role === "OrderMgr") return "Order Manager";
  return role;
}

function getRoleTone(role: UserRole) {
  if (role === "Admin") return "danger";
  if (role === "Product Manager") return "info";
  if (role === "OrderMgr") return "warning";
  return "success";
}

function toCreatePayload(form: UserFormState): AdminCreateUserDto {
  return {
    avatarUrl: form.avatarUrl.trim() || null,
    email: form.email.trim(),
    fullName: form.fullName.trim(),
    passwordHash: form.passwordHash,
    phone: form.phone.trim() || null,
    role: form.role,
  };
}

function toUpdatePayload(userId: number, form: UserFormState): AdminUpdateUserDto {
  return {
    avatarUrl: form.avatarUrl.trim() || null,
    email: form.email.trim(),
    fullName: form.fullName.trim(),
    isActive: form.isActive,
    passwordHash: form.passwordHash.trim() || null,
    phone: form.phone.trim() || null,
    role: form.role,
    userId,
  };
}

function isValidMutationForm(form: UserFormState, isUpdate: boolean) {
  return (
    form.fullName.trim().length > 0 &&
    form.email.trim().length > 0 &&
    /^[0-9]{10}$/.test(form.phone.trim()) &&
    (isUpdate || form.passwordHash.length >= 8)
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<PagedResult<AdminUserListDto> | null>(
    null,
  );
  const [selectedUser, setSelectedUser] = useState<AdminUserDto | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyUserForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [emailFilter, setEmailFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("Customer");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      email: emailFilter.trim() || undefined,
      fullName: nameFilter.trim() || undefined,
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      pageNumber,
      pageSize,
      phone: phoneFilter.trim() || undefined,
      role: roleFilter === "all" ? undefined : roleFilter,
    }),
    [emailFilter, nameFilter, pageNumber, pageSize, phoneFilter, roleFilter, statusFilter],
  );

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminUserApi.getUsers(query);
      setUsers(result);
    } catch (err) {
      console.error("Failed to load admin users", err);
      setUsers(emptyPage(query.pageNumber, query.pageSize));
      setError(getApiErrorMessage(err, "Không thể tải danh sách người dùng."));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const activeCount = users?.data.filter((user) => user.isActive).length ?? 0;
  const userCount = users?.data.length ?? 0;

  const startCreate = () => {
    setSelectedUser(null);
    setForm(emptyUserForm);
    setAvatarFile(null);
    setError(null);
    setMessage(null);
  };

  const openUser = async (id: number) => {
    try {
      setDetailLoading(true);
      setError(null);
      setMessage(null);
      const detail = await adminUserApi.getUserById(id);
      setSelectedUser(detail);
      setForm(toUserForm(detail));
      setAvatarFile(null);
    } catch (err) {
      console.error("Failed to load admin user detail", err);
      setError(getApiErrorMessage(err, "Không thể tải chi tiết tài khoản."));
    } finally {
      setDetailLoading(false);
    }
  };

  const submitForm = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const result = selectedUser
        ? await adminUserApi.updateUser(
            selectedUser.userId,
            toUpdatePayload(selectedUser.userId, form),
          )
        : await adminUserApi.createUser(toCreatePayload(form));

      const targetUserId = selectedUser?.userId ?? result.data?.userId;
      let avatarUploadMessage = "";

      if (avatarFile && targetUserId) {
        const avatarResult = await adminUserApi.uploadAvatar(targetUserId, avatarFile);
        avatarUploadMessage = ` ${avatarResult.message}`;
        setAvatarFile(null);
        if (avatarResult.avatarUrl) {
          setForm((current) => ({ ...current, avatarUrl: avatarResult.avatarUrl ?? current.avatarUrl }));
        }
      }

      setMessage(`${result.message}${avatarUploadMessage}`);
      await loadUsers();

      if (targetUserId) {
        await openUser(targetUserId);
      } else {
        setForm(emptyUserForm);
      }
    } catch (err) {
      console.error("Failed to save admin user", err);
      setError(getApiErrorMessage(err, "Không thể lưu tài khoản."));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAvatarFile(event.target.files?.[0] ?? null);
  };


  return (
    <section className="admin-orders-page admin-products-page admin-users-page">
      <div className="admin-dashboard__heading">
        <div>
          <p>Quản lý người dùng</p>
          <h1 className="admin-page-title">Người dùng</h1>
        </div>
        <button
          className="admin-refresh-button"
          type="button"
          onClick={() => void loadUsers()}
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Tải lại data"}
        </button>
      </div>

      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {message ? <div className="admin-success-alert" role="status">{message}</div> : null}

      <section className="admin-stat-grid" aria-label="Thống kê tài khoản">
        <article className="admin-stat-card">
          <div>
            <p>Tổng tài khoản</p>
            <strong>{users?.totalRecords ?? 0}</strong>
            <span>Theo bộ lọc hiện tại</span>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Đang hoạt động</p>
            <strong>{activeCount}</strong>
            <span>Trên trang hiện tại</span>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Người dùng</p>
            <strong>{userCount}</strong>
            <span>Trên trang hiện tại</span>
          </div>
        </article>
      </section>

      <div className="admin-orders-grid admin-products-grid admin-users-grid">
        <section className="admin-panel admin-orders-carousel">
          <div className="admin-panel__header admin-orders-toolbar">
            <div>
              <h2>Danh sách tài khoản</h2>
              <span>Trang {users?.pageNumber ?? pageNumber} / {users?.totalPages ?? 1}</span>
            </div>
            <button className="admin-refresh-button" type="button" onClick={startCreate}>
              Tạo tài khoản mới
            </button>
          </div>

          <div className="admin-orders-controls admin-products-filters">
            <label>
              Email
              <input
                type="search"
                value={emailFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setEmailFilter(event.target.value);
                }}
                placeholder="user@email.com"
              />
            </label>
            <label>
              Họ tên
              <input
                value={nameFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setNameFilter(event.target.value);
                }}
                placeholder="Nguyễn Văn A"
              />
            </label>
            <label>
              Số điện thoại
              <input
                value={phoneFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setPhoneFilter(event.target.value);
                }}
                placeholder="10 chữ số"
              />
            </label>
            <label>
              Vai trò
              <select
                value={roleFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setRoleFilter(event.target.value);
                }}
              >
                <option value="all">Tất cả</option>
                {userRoleOptions.map((role) => (
                  <option key={role} value={role}>{getRoleLabel(role)}</option>
                ))}
              </select>
            </label>
            <label>
              Trạng thái
              <select
                value={statusFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setStatusFilter(event.target.value);
                }}
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã tắt</option>
              </select>
            </label>
            <label>
              Page size
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageNumber(1);
                  setPageSize(Number(event.target.value));
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="admin-empty-state">Đang tải danh sách tài khoản...</div>
          ) : users && users.data.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table admin-users-table">
                <thead>
                  <tr>
                    <th>Tài khoản</th>
                    <th>Liên hệ</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <strong>{user.fullName}</strong>
                        <span>#{user.userId} · {user.email}</span>
                      </td>
                      <td>
                        <strong>{user.phone ?? "Chưa có SĐT"}</strong>
                        <span>{user.avatarUrl ? "Có avatar" : "Chưa có avatar"}</span>
                      </td>
                      <td>
                        <span className={`admin-status admin-status--${getRoleTone(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status admin-status--${user.isActive ? "success" : "danger"}`}>
                          {user.isActive ? "Đang hoạt động" : "Đã tắt"}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" onClick={() => void openUser(user.userId)}>
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty-state">Không có tài khoản phù hợp.</div>
          )}

          <div className="admin-pagination">
            <button
              type="button"
              onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
              disabled={loading || pageNumber <= 1}
            >
              Trang trước
            </button>
            <button
              type="button"
              onClick={() =>
                setPageNumber((current) =>
                  users ? Math.min(users.totalPages || 1, current + 1) : current + 1,
                )
              }
              disabled={loading || (!!users?.totalPages && pageNumber >= users.totalPages)}
            >
              Trang sau
            </button>
          </div>
        </section>

        <aside className="admin-orders-side">
          <section className="admin-panel">
            <h2>{selectedUser ? "Chi tiết tài khoản" : "Tạo tài khoản mới"}</h2>
            {detailLoading ? <div className="admin-empty-state">Đang tải chi tiết...</div> : null}
            <div className="admin-product-form">
              <label>
                Họ tên
                <input
                  value={form.fullName}
                  maxLength={100}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  maxLength={100}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label>
                Số điện thoại
                <input
                  value={form.phone}
                  maxLength={10}
                  pattern="[0-9]{10}"
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="10 chữ số"
                />
              </label>
              <label>
                Vai trò
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))}
                >
                  {userRoleOptions.map((role) => (
                    <option key={role} value={role}>{getRoleLabel(role)}</option>
                  ))}
                </select>
              </label>
              <label>
                Trạng thái
                <select
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === "active" }))}
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Đã tắt</option>
                </select>
              </label>
              <label className="admin-product-form__wide">
                Mật khẩu
                <input
                  type="password"
                  value={form.passwordHash}
                  minLength={8}
                  maxLength={50}
                  onChange={(event) => setForm((current) => ({ ...current, passwordHash: event.target.value }))}
                  placeholder="8-50 ký tự, có hoa/thường/số/ký tự đặc biệt"
                />
                <span className="admin-form-hint">
                  {selectedUser
                    ? "Để trống nếu không muốn đổi mật khẩu."
                    : "Bắt buộc khi tạo tài khoản mới."}
                </span>
              </label>
              <label className="admin-product-form__wide">
                Upload avatar
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleAvatarFileChange}
                />
                <span className="admin-form-hint">
                  {avatarFile
                    ? `Sẽ upload ${avatarFile.name} sau khi lưu tài khoản.`
                    : "Hỗ trợ JPG, PNG, WEBP, GIF, SVG; tối đa 5MB."}
                </span>
              </label>
              {selectedUser ? (
                <div className="admin-user-detail admin-product-form__wide">
                  <dl>
                    <div>
                      <dt>ID</dt>
                      <dd>#{selectedUser.userId}</dd>
                    </div>
                    <div>
                      <dt>Trạng thái</dt>
                      <dd>
                        <span className={`admin-status admin-status--${selectedUser.isActive ? "success" : "danger"}`}>
                          {selectedUser.isActive ? "Đang hoạt động" : "Đã tắt"}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>Ngày tạo</dt>
                      <dd>{formatDate(selectedUser.createdAt)}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}
              <div className="admin-status-form admin-product-form__wide">
                <button
                  type="button"
                  onClick={() => void submitForm()}
                  disabled={saving || !isValidMutationForm(form, Boolean(selectedUser))}
                >
                  {saving ? "Đang lưu..." : selectedUser ? "Cập nhật tài khoản" : "Tạo tài khoản"}
                </button>
                <button type="button" onClick={startCreate} disabled={saving}>
                  Làm mới form
                </button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

export default AdminUsersPage;
