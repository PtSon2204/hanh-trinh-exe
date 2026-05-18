import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner, faEnvelope, faSearch, faUsers, faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import axiosClient from '../../../../shared/api/axiosClient';
import { AdminShell } from '../../components/AdminShell';

interface UserItem {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);
  
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
  });

  // Fetch users on load
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        // PageSize=200 to fetch a good chunk of users
        const res = await axiosClient.get('/Admin/User?PageSize=200');
        if (res.data && res.data.data) {
          setUsers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
        toast.error('Không thể tải danh sách người dùng.');
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email) 
        : [...prev, email]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredEmails = filteredUsers.map(u => u.email);
    const allFilteredSelected = filteredEmails.every(email => selectedEmails.includes(email));

    if (allFilteredSelected) {
      // Unselect all filtered
      setSelectedEmails(prev => prev.filter(email => !filteredEmails.includes(email)));
    } else {
      // Select all filtered (avoid duplicates)
      setSelectedEmails(prev => {
        const unique = new Set([...prev, ...filteredEmails]);
        return Array.from(unique);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.body.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung email.');
      return;
    }

    if (!sendToAll && selectedEmails.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người nhận hoặc chuyển sang chế độ "Gửi cho tất cả".');
      return;
    }

    // Auto convert newlines \n to HTML line breaks <br/> for non-tech admins
    const formattedBody = formData.body.replace(/\n/g, '<br/>');

    try {
      setLoading(true);
      await axiosClient.post('/Notification/send-email', {
        subject: formData.subject,
        body: formattedBody,
        emails: sendToAll ? null : selectedEmails,
      });
      toast.success('Gửi email thông báo thành công!');
      setFormData({ subject: '', body: '' });
      setSelectedEmails([]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi email.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell activePath="/admin/notifications">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <FontAwesomeIcon icon={faEnvelope} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gửi Thông Báo / Email Marketing</h1>
            <p className="text-sm text-gray-500">Soạn email thông báo gửi tới khách hàng. Hệ thống tự động chuyển dòng văn bản thành đoạn xuống dòng trong email.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Editor Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Send Mode Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đối tượng nhận thông báo
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSendToAll(true)}
                      className={`py-2.5 px-4 rounded-lg font-medium text-sm border transition-all ${
                        sendToAll
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-100'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <FontAwesomeIcon icon={faUsers} className="mr-2" />
                      Gửi cho tất cả ({users.length} người)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendToAll(false)}
                      className={`py-2.5 px-4 rounded-lg font-medium text-sm border transition-all ${
                        !sendToAll
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-100'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <FontAwesomeIcon icon={faCheckSquare} className="mr-2" />
                      Chọn từ danh sách ({selectedEmails.length} đã chọn)
                    </button>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Nhập tiêu đề thông báo ngắn gọn, thu hút..."
                  />
                </div>

                {/* Body (Simple Typing) */}
                <div>
                  <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung email <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="body"
                    name="body"
                    required
                    rows={12}
                    value={formData.body}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y font-sans leading-relaxed text-gray-800"
                    placeholder="Nhập nội dung email của bạn tại đây... 

Cứ xuống dòng bằng phím Enter bình thường. Hệ thống sẽ tự động hiển thị xuống dòng tương ứng trên email khách hàng mà không cần bạn phải viết code hay thẻ HTML!"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg focus:ring-4 focus:ring-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                  >
                    {loading ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faPaperPlane} />
                    )}
                    {loading ? 'Đang gửi...' : 'Gửi thông báo ngay'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: User Checkbox List */}
          <div className={`lg:col-span-1 ${sendToAll ? 'opacity-40 pointer-events-none' : ''} transition-all`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-[calc(100vh-140px)] flex flex-col sticky top-6">
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 flex items-center justify-between">
                  <span>Danh sách người nhận</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-normal">
                    {selectedEmails.length} / {users.length}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">Tìm kiếm và click chọn các tài khoản nhận email.</p>
              </div>

              {/* Search Box */}
              <div className="relative mb-4">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <FontAwesomeIcon icon={faSearch} size="sm" />
                </span>
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Select All Checkbox */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="flex items-center gap-2 text-gray-600 font-semibold hover:text-indigo-600 transition-colors"
                >
                  <FontAwesomeIcon 
                    icon={
                      filteredUsers.length > 0 && filteredUsers.every(u => selectedEmails.includes(u.email))
                        ? faCheckSquare 
                        : faSquare
                    } 
                    className="text-indigo-600 text-sm"
                  />
                  Chọn tất cả kết quả tìm kiếm ({filteredUsers.length})
                </button>
                <button 
                  type="button" 
                  onClick={() => setSelectedEmails([])}
                  className="text-red-500 hover:underline"
                >
                  Bỏ chọn tất cả
                </button>
              </div>

              {/* User List Scroll Container */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 pr-1">
                {usersLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                    <FontAwesomeIcon icon={faSpinner} spin size="lg" />
                    <span className="text-sm">Đang tải danh sách...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    Không tìm thấy người dùng phù hợp
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedEmails.includes(user.email);
                    return (
                      <div
                        key={user.userId}
                        onClick={() => handleSelectUser(user.email)}
                        className={`flex items-start gap-3 py-2.5 px-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handle click on container instead
                          className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{user.fullName}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full mt-1 font-medium ${
                            user.role === 'Admin' 
                              ? 'bg-red-100 text-red-700' 
                              : user.role === 'Product Manager'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
