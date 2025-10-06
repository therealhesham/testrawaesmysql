import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DropdownIcon } from '../icons';

// Dynamically import ReactQuill with SSR disabled
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false, // Disable SSR for ReactQuill
});
import 'react-quill/dist/quill.snow.css';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskData) => void;
}

interface TaskData {
  title: string;
  description: string;
  assignee: string;
  deadline: string;
  priority: string;
  isActive: boolean;
  isRepeating: boolean;
  repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeatInterval?: number;
  repeatStartDate?: string;
  repeatEndDate?: string;
  repeatEndType?: 'never' | 'date' | 'count';
  repeatCount?: number;
  repeatDays?: string[];
  repeatTime?: string;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<TaskData>({
    title: '',
    description: '',
    assignee: '',
    deadline: '',
    priority: '',
    isActive: false,
    isRepeating: false,
    repeatType: 'daily',
    repeatInterval: 1,
    repeatStartDate: '',
    repeatEndDate: '',
    repeatEndType: 'never',
    repeatCount: 1,
    repeatDays: [],
    repeatTime: '00:00'
  });

  const [showRepeatDetails, setShowRepeatDetails] = useState(false);
  const [users, setUsers] = useState<Array<{id: number, username: string}>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen && users.length === 0) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData.map((user: any) => ({
          id: user.id,
          username: user.username
        })));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };


  const handleRepeatTypeChange = (repeatType: string) => {
    setFormData(prev => ({ ...prev, repeatType: repeatType as any }));
    setShowRepeatDetails(true);
  };

  const handleRepeatDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      repeatDays: prev.repeatDays?.includes(day)
        ? prev.repeatDays.filter(d => d !== day)
        : [...(prev.repeatDays || []), day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepare the data for API call
      const taskData = {
        title: formData.title,
        description: formData.description,
        assignee: formData.assignee,
        deadline: formData.deadline,
        priority: formData.priority,
        isActive: formData.isActive,
        isRepeating: formData.isRepeating,
        repeatType: formData.repeatType,
        repeatInterval: formData.repeatInterval,
        repeatStartDate: formData.repeatStartDate,
        repeatEndDate: formData.repeatEndDate,
        repeatEndType: formData.repeatEndType,
        repeatCount: formData.repeatCount,
        repeatDays: formData.repeatDays,
        repeatTime: formData.repeatTime
      };

      // Call the onSubmit function with the prepared data
      onSubmit(taskData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        assignee: '',
        deadline: '',
        priority: '',
        isActive: false,
        isRepeating: false,
        repeatType: 'daily',
        repeatInterval: 1,
        repeatStartDate: '',
        repeatEndDate: '',
        repeatEndType: 'never',
        repeatCount: 1,
        repeatDays: [],
        repeatTime: '00:00'
      });
      onClose();
    } catch (error) {
      console.error('Error submitting task:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="task-form-section bg-white rounded-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="form-title text-2xl font-semibold text-gray-800">اضافة مهمة</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-wrapper space-y-6">
          {/* Title Field */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
            <div className="form-input-container bg-gray-50 border border-gray-300 rounded-md p-3 min-h-[44px] flex items-center">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="ادخل عنوان القالب"
                className="w-full border-none outline-none bg-transparent text-right text-gray-600 text-sm"
                dir="rtl"
                required
              />
            </div>
          </div>

          {/* Rich Text Editor */}
          <div className="rich-text-editor bg-white border border-gray-300 rounded-md overflow-hidden">
            <ReactQuill
              theme="snow"
              value={formData.description}
              onChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  [{ align: ['center', 'right', 'justify'] }],
                  ['link', 'image'],
                  [{ color: [] }, { background: [] }],
                  ['clean'],
                ],
              }}
              formats={[
                'header',
                'bold', 'italic', 'underline', 'strike',
                'list', 'bullet',
                'align',
                'link', 'image',
                'color', 'background'
              ]}
              className="min-h-[180px] text-gray-700 text-sm leading-relaxed"
              placeholder="ادخل تفاصيل المهمة هنا.........."
              style={{ 
                direction: 'rtl',
                fontFamily: 'Tajawal, sans-serif'
              }}
            />
          </div>

          {/* Form Row */}
          <div className="form-row grid grid-cols-1 md:grid-cols-3 gap-4 ">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">الشخص المسؤول</label>
              <div className="custom-select bg-gray-50 border border-gray-300 rounded-md p-3 flex justify-between items-center min-h-[44px] cursor-pointer">
                <select
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleInputChange}
                  className="w-full border-none outline-none bg-transparent text-right text-gray-600 text-sm"
                  dir="rtl"
                  required
                  disabled={loadingUsers}
                >
                  <option value="">
                    {loadingUsers ? 'جاري تحميل المستخدمين...' : 'اختر الشخص المسؤول'}
                  </option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id.toString()}>
                      {user.username}
                    </option>
                  ))}
                </select>
                {/* <DropdownIcon className="w-4 h-4 text-gray-600 transform rotate-90" /> */}
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">الموعد النهائي</label>
              <div className="custom-select bg-gray-50 border border-gray-300 rounded-md  flex justify-between items-center ">
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full border-none outline-none bg-transparent text-right text-gray-600 text-sm"
                  dir="rtl"
                  required
                />
                {/* <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg> */}
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">درجة الأهمية</label>
              <div className="form-input-container bg-gray-50 border border-gray-300 rounded-md p-3 min-h-[44px] flex items-center">
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full border-none outline-none bg-transparent text-right text-gray-600 text-sm"
                  dir="rtl"
                  required
                >
                  <option value="">حدد درجة الأهمية</option>
                  <option value="عالية الأهمية">عالية الأهمية</option>
                  <option value="متوسط الأهمية">متوسط الأهمية</option>
                  <option value="منخفض الأهمية">منخفض الأهمية</option>
                </select>
                <DropdownIcon className="w-4 h-4 text-gray-600 transform rotate-90" />
              </div>
            </div>
          </div>

          {/* Checkbox Group */}
          <div className="checkbox-group flex items-center justify-end gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-700">تكرار المهمة</span>
              <input
                type="checkbox"
                name="isRepeating"
                checked={formData.isRepeating}
                onChange={handleInputChange}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-700">تفعيل</span>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
            </label>
          </div>

          {/* Repeat Options */}
          {formData.isRepeating && (
            <div className="repeat-options flex flex-col gap-6">
              <div className="repeat-options-row flex items-center justify-end gap-8">
                <div className="radio-group flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-700">سنوي</span>
                    <input
                      type="radio"
                      name="repeatType"
                      value="yearly"
                      checked={formData.repeatType === 'yearly'}
                      onChange={(e) => handleRepeatTypeChange(e.target.value)}
                      className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                    />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-700">شهري</span>
                    <input
                      type="radio"
                      name="repeatType"
                      value="monthly"
                      checked={formData.repeatType === 'monthly'}
                      onChange={(e) => handleRepeatTypeChange(e.target.value)}
                      className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                    />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-700">أسبوعي</span>
                    <input
                      type="radio"
                      name="repeatType"
                      value="weekly"
                      checked={formData.repeatType === 'weekly'}
                      onChange={(e) => handleRepeatTypeChange(e.target.value)}
                      className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                    />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-700">يومي</span>
                    <input
                      type="radio"
                      name="repeatType"
                      value="daily"
                      checked={formData.repeatType === 'daily'}
                      onChange={(e) => handleRepeatTypeChange(e.target.value)}
                      className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                    />
                  </label>
                </div>
                <label className="text-sm font-medium text-gray-700">تكرار المدة</label>
              </div>

              {/* Repeat Details */}
              {showRepeatDetails && (
                <div className="repeat-details flex flex-col items-start gap-6">
                  <div className="repeat-details-row flex-row items-center justify-end gap-4">
                      <label className="text-sm font-medium text-gray-700">كل</label>
  <div className="form-input-container bg-gray-50 border border-gray-300 rounded-md px-2 py-1 w-16">
                        <input
                          type="number"
                          name="repeatInterval"
                          value={formData.repeatInterval}
                          onChange={handleInputChange}
                          className="w-full border-none outline-none bg-transparent text-center text-sm"
                          min="1"
                        />
                      </div>
                    <div className="form-group flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        {formData.repeatType === 'daily' && 'يوم'}
                        {formData.repeatType === 'weekly' && 'أسبوع'}
                        {formData.repeatType === 'monthly' && 'شهر'}
                        {formData.repeatType === 'yearly' && 'سنة'}
                      </span>
                    
                    </div>
                      {/* Weekly repeat - day selection */}
                  {formData.repeatType === 'weekly' && (
                    <div className="repeat-details-row no-wrap flex  flex-row items-center justify-end gap-2">
                      {['السبت', 'الجمعة', 'الخميس', 'الأربعاء', 'الثلاثاء', 'الاثنين', 'الأحد'].map((day) => (
                        <div key={day} className="checkbox-group flex items-center gap-1">
                          <span className="text-xs text-gray-700">{day}</span>
                          <input
                            type="checkbox"
                            checked={formData.repeatDays?.includes(day)}
                            onChange={() => handleRepeatDayToggle(day)}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  </div>

                  <p className="form-hint text-sm top-0 text-gray-500 text-right">
                    حدد عدد {formData.repeatType === 'daily' && 'ايام'}{formData.repeatType === 'weekly' && 'الاسابيع'}{formData.repeatType === 'monthly' && 'الاشهر'}{formData.repeatType === 'yearly' && 'السنوات'} للتكرار
                  </p>
                

                  <div className="repeat-details-row flex flex-row items-center justify-end gap-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">وقت التنفيذ</label>
                      <div className="custom-select bg-gray-50 border border-gray-300 rounded-md p-3 flex justify-between items-center min-h-[44px]">
                        <input
                          type="time"
                          name="repeatTime"
                          value={formData.repeatTime}
                          onChange={handleInputChange}
                          className="w-full border-none outline-none bg-transparent text-right text-gray-600 text-sm"
                          dir="rtl"
                        />
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">بداية التكرار</label>
                      <div className="custom-select bg-gray-50 border border-gray-300 rounded-md p-3 flex justify-between items-center min-h-[44px]">
                        <input
                          type="date"
                          name="repeatStartDate"
                          value={formData.repeatStartDate}
                          onChange={handleInputChange}
                          className="w-full border-none outline-none bg-transparent text-right text-gray-600 text-sm"
                          dir="rtl"
                        />
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="repeat-details-row flex items-center justify-end gap-6" dir="ltr">
                    <div className="radio-group flex items-center gap-2" >
                      <span className="text-sm text-gray-700">تكرار</span>
                      {formData.repeatEndType === 'count' && (
                        <div className="form-input-container bg-gray-50 border border-gray-300 rounded-md px-2 py-1 w-16">
                          <input
                            type="number"
                            name="repeatCount"
                            value={formData.repeatCount}
                            onChange={handleInputChange}
                            className="w-full border-none outline-none bg-transparent text-center text-sm"
                            min="1"
                          />
                        </div>
                      )}
                      <span className="text-sm text-gray-700">بعد</span>
                      <input
                        type="radio"
                        name="repeatEndType"
                        value="count"
                        checked={formData.repeatEndType === 'count'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                    </div>
                    <div className="radio-group flex items-center gap-2">
                      {formData.repeatEndType === 'date' && (
                        <div className="custom-select bg-gray-50 border border-gray-300 rounded-md p-2 flex justify-between items-center min-w-[169px]">
                          <input
                            type="date"
                            name="repeatEndDate"
                            value={formData.repeatEndDate}
                            onChange={handleInputChange}
                            className="border-none outline-none bg-transparent text-right text-gray-600 text-xs"
                            dir="rtl"
                          />
                        </div>
                      )}
                      <span className="text-sm text-gray-700">تاريخ الانتهاء</span>
                      <input
                        type="radio"
                        name="repeatEndType"
                        value="date"
                        checked={formData.repeatEndType === 'date'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                    </div>
                    <div className="radio-group flex items-center gap-2">
                      <span className="text-sm text-gray-700">بدون انتهاء</span>
                      <input
                        type="radio"
                        name="repeatEndType"
                        value="never"
                        checked={formData.repeatEndType === 'never'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                    </div>
                    <label className="text-sm font-medium text-gray-700">تكرار حتى:</label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons flex justify-center items-center gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary min-w-[116px] h-10 rounded border border-teal-800 text-gray-800 bg-transparent hover:bg-gray-100 flex justify-center items-center text-sm font-medium cursor-pointer transition-colors"
            >
              الغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary min-w-[116px] h-10 rounded bg-teal-800 text-white border-none hover:bg-teal-900 flex justify-center items-center text-sm font-medium cursor-pointer transition-colors"
            >
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
