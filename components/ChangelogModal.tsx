import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import packageJson from '../package.json';
import changelogData from '../changelog.json';

export default function ChangelogModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState<any>(null);

  useEffect(() => {
    // Get the current version from package.json
    const currentAppVersion = packageJson.version;
    
    // Check local storage for the last version the user saw
    const lastSeenVersion = localStorage.getItem('lastSeenVersion');

    if (lastSeenVersion !== currentAppVersion) {
      // Find the changelog entry that matches the current version
      // By default, assume the first entry in changelogData corresponds to the current version
      const updateEntry = changelogData.find((entry) => entry.version === currentAppVersion) 
        || (changelogData.length > 0 ? { ...changelogData[0], version: currentAppVersion } : null);
      
      if (updateEntry) {
        setLatestUpdate(updateEntry);
        setIsOpen(true);
      } else {
        // If no changelog found for this version, still update local storage so it doesn't try again
        localStorage.setItem('lastSeenVersion', currentAppVersion);
      }
    }
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    // Mark this version as seen
    localStorage.setItem('lastSeenVersion', packageJson.version);
  };

  if (!latestUpdate) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={closeModal} dir="rtl">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto font-sans">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-right align-middle shadow-xl transition-all border border-teal-100">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <Dialog.Title as="h3" className="text-xl font-bold text-teal-800 flex items-center gap-2">
                    <span className="bg-teal-100 text-teal-800 p-2 rounded-full">
                      🎉
                    </span>
                    ما الجديد في الإصدار {latestUpdate.version}؟
                  </Dialog.Title>
                  <span className="text-sm text-gray-400">{latestUpdate.date}</span>
                </div>

                <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {latestUpdate.features && latestUpdate.features.length > 0 && (
                    <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                      <h4 className="font-bold text-teal-700 mb-2 flex items-center gap-2">
                        ✨ ميزات وتحسينات جديدة
                      </h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                        {latestUpdate.features.map((feature: string, index: number) => (
                          <li key={index} className="leading-relaxed">{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestUpdate.fixes && latestUpdate.fixes.length > 0 && (
                    <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                      <h4 className="font-bold text-orange-700 mb-2 flex items-center gap-2">
                        🛠️ إصلاحات
                      </h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                        {latestUpdate.fixes.map((fix: string, index: number) => (
                          <li key={index} className="leading-relaxed">{fix}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-xl border border-transparent bg-teal-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 transition-all shadow-sm hover:shadow"
                    onClick={closeModal}
                  >
                    رائع، فهمت!
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
