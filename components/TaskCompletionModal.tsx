import React, { useState } from 'react';
import { X, Calendar, CheckCircle, Clock } from 'lucide-react';

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onTaskUpdate: (taskId: number, isCompleted: boolean, completionDate?: string, completionNotes?: string) => void;
}

export default function TaskCompletionModal({ 
  isOpen, 
  onClose, 
  task, 
  onTaskUpdate 
}: TaskCompletionModalProps) {
  const [isCompleted, setIsCompleted] = useState(task?.isCompleted || false);
  const [completionDate, setCompletionDate] = useState(
    task?.completionDate ? new Date(task.completionDate).toISOString().split('T')[0] : ''
  );
  const [completionNotes, setCompletionNotes] = useState(task?.completionNotes || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onTaskUpdate(
        task.id,
        isCompleted,
        completionDate || undefined,
        completionNotes || undefined
      );
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsCompleted(task?.isCompleted || false);
    setCompletionDate(task?.completionDate ? new Date(task.completionDate).toISOString().split('T')[0] : '');
    setCompletionNotes(task?.completionNotes || '');
    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">تحديث حالة المهمة</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Task Info */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{task.Title}</h3>
          <div 
            className="text-sm text-gray-600 mb-3"
            dangerouslySetInnerHTML={{ __html: task.description }}
          />
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>الموعد: {new Date(task.taskDeadline).toLocaleDateString('ar-SA')}</span>
            </div>
            {task.priority && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                task.priority === 'عالية الأهمية' ? 'bg-red-100 text-red-600' :
                task.priority === 'متوسط الأهمية' ? 'bg-yellow-100 text-yellow-600' :
                'bg-green-100 text-green-600'
              }`}>
                {task.priority}
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Completion Status */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              حالة المهمة
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="completion"
                  checked={!isCompleted}
                  onChange={() => setIsCompleted(false)}
                  className="w-4 h-4 text-teal-600"
                />
                <span className="text-sm text-gray-700">غير مكتمل</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="completion"
                  checked={isCompleted}
                  onChange={() => setIsCompleted(true)}
                  className="w-4 h-4 text-teal-600"
                />
                <span className="text-sm text-gray-700">مكتمل</span>
              </label>
            </div>
          </div>

          {/* Completion Date */}
          {isCompleted && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                تاريخ الانتهاء
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          )}

          {/* Completion Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              ملاحظات الإنجاز (اختياري)
            </label>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
              placeholder="أضف ملاحظات حول إنجاز المهمة..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
