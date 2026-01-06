import React, { useState } from 'react';
import { X, Calendar, CheckCircle, Clock } from 'lucide-react';
import dayjs from 'dayjs';

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onTaskUpdate: (taskId: number, isCompleted: boolean, completionDate?: string, completionNotes?: string) => void;
  currentUser?: any; // Add current user to determine context
}

export default function TaskCompletionModal({ 
  isOpen, 
  onClose, 
  task, 
  onTaskUpdate,
  currentUser 
}: TaskCompletionModalProps) {
  const [isCompleted, setIsCompleted] = useState(task?.isCompleted || false);
  const [completionDate, setCompletionDate] = useState(
    task?.completionDate ? new Date(task.completionDate).toISOString().split('T')[0] : ''
  );
  const [completionNotes, setCompletionNotes] = useState(task?.completionNotes || '');
  const [isLoading, setIsLoading] = useState(false);

  // Determine the workflow based on user context
  const isMyTask = task?.userId === currentUser?.id;
  const isSentTask = task?.assignedBy === currentUser?.id;
  const isSelfAssigned = task?.assignedBy === currentUser?.id && task?.userId === currentUser?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For self-assigned tasks: automatically mark as completed when completion date is set
      // For "My Tasks": only set completion date, don't mark as completed
      // For "Sent Tasks": can mark as truly completed if has completion date
      const shouldMarkCompleted = isSelfAssigned ? (completionDate ? true : false) : (isSentTask && isCompleted);
      
      await onTaskUpdate(
        task.id,
        shouldMarkCompleted,
        completionDate || undefined,
        completionNotes || undefined,
        isSelfAssigned
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
            <h2 className="text-xl font-semibold text-gray-900">
              {isMyTask ? 'تحديد انتهاء المهمة' : 'تحديث حالة المهمة'}
            </h2>
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
              {/* <Calendar className="w-4 h-4" /> */}
              <span>الموعد: {dayjs(task.taskDeadline).format('DD/MM/YYYY')}</span>
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
          {/* For Self-Assigned Tasks: Show automatic completion message */}
          {isSelfAssigned && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                مهمة ذاتية
              </label>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  عند تحديد تاريخ الانتهاء، ستُعتبر المهمة مكتملة تلقائياً (لأنك أسندتها لنفسك)
                </p>
              </div>
            </div>
          )}
          
          {/* For My Tasks (not self-assigned): Only show completion status as informational */}
          {isMyTask && !isSelfAssigned && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                حالة الانتهاء من جانبي
              </label>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  عند تحديد تاريخ الانتهاء، سيتم إشعار الشخص الذي أسند لك المهمة لاعتمادها كمكتملة نهائياً
                </p>
              </div>
            </div>
          )}

          {/* For Sent Tasks (not self-assigned): Show completion approval options */}
          {isSentTask && !isSelfAssigned && task.completionDate && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                حالة المهمة
              </label>
              <div className="p-3 bg-green-50 rounded-lg mb-3">
                <p className="text-sm text-green-800">
                  المكلف بالمهمة أنهى من جانبه في: {new Date(task.completionDate).toLocaleDateString('ar-SA')}
                </p>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="completion"
                    checked={!isCompleted}
                    onChange={() => setIsCompleted(false)}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="text-sm text-gray-700">في انتظار المراجعة</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="completion"
                    checked={isCompleted}
                    onChange={() => setIsCompleted(true)}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="text-sm text-gray-700">اعتماد كمكتملة</span>
                </label>
              </div>
            </div>
          )}

          {/* Completion Date - Always show for My Tasks and self-assigned tasks, conditionally for Sent Tasks */}
          {((isMyTask || isSelfAssigned) || (isSentTask && !task.completionDate)) && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {isSelfAssigned ? 'تاريخ الانتهاء من المهمة' : isMyTask ? 'تاريخ انتهائي من المهمة' : 'تاريخ الانتهاء'}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                {/* <Calendar className="absolute lefft-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /> */}
              </div>
            </div>
          )}

          {/* Completion Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
              placeholder={isMyTask ? "أضف ملاحظات حول إنجازك للمهمة..." : "أضف ملاحظات حول حالة المهمة..."}
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
                  {isSelfAssigned ? 'تحديد مكتمل' : isMyTask ? 'تحديد انتهيت' : 'حفظ التغييرات'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
