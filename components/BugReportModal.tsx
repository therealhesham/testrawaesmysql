'use client';

import React, { useState, useEffect } from 'react';
import { FaBug, FaTimes, FaPaperPlane } from 'react-icons/fa';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshotDataUrl: string | null;
  onSuccess?: () => void;
}

export default function BugReportModal({
  isOpen,
  onClose,
  screenshotDataUrl,
  onSuccess,
}: BugReportModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('العنوان مطلوب');
      return;
    }
    if (!description.trim()) {
      setError('وصف الشكوى مطلوب');
      return;
    }
    setSubmitting(true);
    try {
      const screenshotBase64 = screenshotDataUrl
        ? screenshotDataUrl.replace(/^data:image\/\w+;base64,/, '')
        : undefined;
      const res = await fetch('/api/complaints/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          screenshot: screenshotBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل في إرسال الشكوى');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-teal-800 text-white">
          <div className="flex items-center gap-2">
            <FaBug className="w-6 h-6" />
            <h2 className="text-xl font-semibold">تسجيل شكوى / بلاغ خطأ</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="إغلاق"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {screenshotDataUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                لقطة الشاشة
              </label>
              <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 max-h-40">
                <img
                  src={screenshotDataUrl}
                  alt="لقطة الشاشة"
                  className="w-full h-auto object-contain max-h-40"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="bug-title" className="block text-sm font-medium text-gray-700 mb-1">
              عنوان الشكوى <span className="text-red-500">*</span>
            </label>
            <input
              id="bug-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: خطأ في صفحة العملاء"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              maxLength={255}
            />
          </div>

          <div>
            <label htmlFor="bug-desc" className="block text-sm font-medium text-gray-700 mb-1">
              وصف الشكوى <span className="text-red-500">*</span>
            </label>
            <textarea
              id="bug-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح المشكلة أو الخطأ بالتفصيل..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-teal-700 text-white font-medium hover:bg-teal-800 disabled:opacity-60 transition-colors"
            >
              {submitting ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FaPaperPlane className="w-4 h-4" />
                  إرسال الشكوى
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
