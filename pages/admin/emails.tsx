import { useState, useEffect } from 'react';
import EmailList from 'components/EmailList';
import EmailForm from 'components/EmailForm';
import DeleteEmailModal from 'components/DeleteEmailModal';
import Style from 'styles/Home.module.css';
import Layout from 'example/containers/Layout';

export default function EmailsPage() {
  const [emails, setEmails] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  // Fetch emails on mount
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await fetch('/api/addEmails');
        const data = await response.json();
        if (response.ok) {
          setEmails(data);
        } else {
          console.error('Failed to fetch emails:', data.message);
        }
      } catch (error) {
        console.error('Error fetching emails:', error);
      }
    };
    fetchEmails();
  }, []);

  // Handlers for menu actions
  const handleEdit = (email) => {
    setSelectedEmail(email);
    setShowEditForm(true);
  };

  const handleDelete = (email) => {
    setSelectedEmail(email);
    setShowDeleteModal(true);
  };

  // Handler to refresh emails after add/edit/delete
  const refreshEmails = async () => {
    try {
      const response = await fetch('/api/emails');
      const data = await response.json();
      if (response.ok) {
        setEmails(data);
      }
    } catch (error) {
      console.error('Error refreshing emails:', error);
    }
  };

  return (
    <Layout>
      <main
        className={`max-w-7xl mx-auto p-6 flex flex-col gap-16 bg-[#f2f3f5] min-h-screen ${Style['tajawal-bold']}`}
        dir="rtl"
      >
        <section>
          <button
            className="px-6 py-2 text-base text-white bg-[#1a4d4f] rounded-md hover:bg-[#163e3f]"
            onClick={() => setShowAddForm(true)}
          >
            إضافة بريد إلكتروني
          </button>
          <EmailList emails={emails} onEdit={handleEdit} onDelete={handleDelete} />
        </section>

        {/* Add Email Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-[#232726] bg-opacity-50 flex items-start justify-center pt-10 z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-[731px] w-full">
              <EmailForm
                title="إضافة بريد إلكتروني"
                onClose={() => setShowAddForm(false)}
                onSuccess={refreshEmails}
              />
            </div>
          </div>
        )}

        {/* Edit Email Form Modal */}
        {showEditForm && selectedEmail && (
          <div className="fixed inset-0 bg-[#232726] bg-opacity-50 flex items-start justify-center pt-10 z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-[731px] w-full">
              <EmailForm
                title="تعديل بريد إلكتروني"
                defaultEmail={selectedEmail.email}
                defaultDepartment={selectedEmail.department}
                defaultUsername={selectedEmail.User?.username}
                defaultUserId={selectedEmail.userId}
                emailId={selectedEmail.id}
                onClose={() => setShowEditForm(false)}
                onSuccess={refreshEmails}
              />
            </div>
          </div>
        )}

        {/* Delete Email Modal */}
        {showDeleteModal && selectedEmail && (
          <DeleteEmailModal
            email={selectedEmail.email}
            emailId={selectedEmail.id}
            onClose={() => setShowDeleteModal(false)}
            onSuccess={refreshEmails}
          />
        )}
      </main>
    </Layout>
  );
}