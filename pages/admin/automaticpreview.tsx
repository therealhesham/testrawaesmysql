import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Layout from 'example/containers/Layout';

interface Homemaid {
  id: string;
  name: string;
  age: string;
  nationality: string;
  birthDate: string;
  babySitting: boolean;
  cleaning: boolean;
  cooking: boolean;
  contractDuration: string;
  height: string;
  laundry: boolean;
  maritalStatus: string;
  officeName: string;
  passportEndDate: string;
  passportNumber: string;
  passportStartDate: string;
  religion: string;
  salary: string;
  stitching: boolean;
  weight: string;
  profileImage?: string;
  fullImage?: string;
}

export default function Home() {
  const [homemaids, setHomemaids] = useState<Homemaid[]>([]);
  const [formData, setFormData] = useState({
    Name: '',
    Age: '',
    Nationality: '',
    BirthDate: '',
    BabySitting: 'No',
    Cleaning: 'No',
    Cooking: 'No',
    Contract_duration: '',
    height: '',
    laundry: 'No',
    MaritalStatus: '',
    OfficeName: '',
    PassportEndDate: '',
    PassportNumber: '',
    PassportStartDate: '',
    Religion: '',
    salary: '',
    stitiching: 'No',
    Weight: '',
    profileImage: '',
    fullImage: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState({
    profileImage: false,
    fullImage: false
  });
  const [imageErrors, setImageErrors] = useState({
    profileImage: '',
    fullImage: ''
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  useEffect(() => {
    fetchHomemaids();
  }, []);

  const fetchHomemaids = async () => {
    try {
      const response = await axios.get('/api/automaticnewhomemaids');
      setHomemaids(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch homemaids');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/homemaid', formData);
      setSuccess('Homemaid created successfully');
      resetForm();
      fetchHomemaids();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create homemaid');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (homemaid: Homemaid) => {
    setEditingId(homemaid.id);
    setFormData({
      Name: homemaid.name || '',
      Age: homemaid.age || '',
      Nationality: homemaid.nationality || '',
      BirthDate: homemaid.birthDate || '',
      BabySitting: homemaid.babySitting ? 'Yes' : 'No',
      Cleaning: homemaid.cleaning ? 'Yes' : 'No',
      Cooking: homemaid.cooking ? 'Yes' : 'No',
      Contract_duration: homemaid.contractDuration || '',
      height: homemaid.height || '',
      laundry: homemaid.laundry ? 'Yes' : 'No',
      MaritalStatus: homemaid.maritalStatus || '',
      OfficeName: homemaid.officeName || '',
      PassportEndDate: homemaid.passportEndDate || '',
      PassportNumber: homemaid.passportNumber || '',
      PassportStartDate: homemaid.passportStartDate || '',
      Religion: homemaid.religion || '',
      salary: homemaid.salary || '',
      stitiching: homemaid.stitching ? 'Yes' : 'No',
      Weight: homemaid.weight || '',
      profileImage: homemaid.profileImage || '',
      fullImage: homemaid.fullImage || ''
    });
    setShowEditModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'profileImage' | 'fullImage') => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setImageErrors(prev => ({ ...prev, [imageType]: 'لم يتم اختيار صورة' }));
      return;
    }

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setImageErrors(prev => ({ ...prev, [imageType]: 'نوع الملف غير مدعوم (صور فقط)' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setImageErrors(prev => ({ ...prev, [imageType]: 'حجم الصورة كبير جداً (الحد الأقصى 5MB)' }));
      return;
    }

    try {
      setImageUploading(prev => ({ ...prev, [imageType]: true }));
      setImageErrors(prev => ({ ...prev, [imageType]: '' }));

      const res = await fetch(`/api/upload-homemaid-image?type=${imageType === 'profileImage' ? 'profile' : 'full'}`);
      if (!res.ok) {
        throw new Error('فشل في الحصول على رابط الرفع');
      }
      const { url, filePath } = await res.json();

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-amz-acl': 'public-read',
        },
      });

      if (!uploadRes.ok) {
        throw new Error('فشل في رفع الصورة');
      }

      setFormData(prev => ({ ...prev, [imageType]: filePath }));
      setImageErrors(prev => ({ ...prev, [imageType]: '' }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setImageErrors(prev => ({ ...prev, [imageType]: error.message || 'حدث خطأ أثناء رفع الصورة' }));
    } finally {
      setImageUploading(prev => ({ ...prev, [imageType]: false }));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.put('/api/automaticnewhomemaids', {
        id: editingId,
        ...formData
      });
      setSuccess('Homemaid updated successfully');
      setShowEditModal(false);
      setEditingId(null);
      fetchHomemaids();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update homemaid');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/automaticnewhomemaids?id=${deleteId}`);
      setSuccess('Homemaid deleted successfully');
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchHomemaids();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete homemaid');
    }
  };

  const resetForm = () => {
    setFormData({
      Name: '',
      Age: '',
      Nationality: '',
      BirthDate: '',
      BabySitting: 'No',
      Cleaning: 'No',
      Cooking: 'No',
      Contract_duration: '',
      height: '',
      laundry: 'No',
      MaritalStatus: '',
      OfficeName: '',
      PassportEndDate: '',
      PassportNumber: '',
      PassportStartDate: '',
      Religion: '',
      salary: '',
      stitiching: 'No',
      Weight: '',
      profileImage: '',
      fullImage: ''
    });
    setImageErrors({ profileImage: '', fullImage: '' });
    setImageUploading({ profileImage: false, fullImage: false });
  };

  return (
    <Layout>
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Homemaid Management</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">عرض البيانات</h1>


        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Homemaid Records</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nationality</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Birth Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Religion</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Marital Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Office</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Passport</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Physical</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {homemaids.map((homemaid) => (
                  <tr key={homemaid.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex space-x-2">
                        {homemaid.profileImage && (
                          <div className="relative cursor-pointer" onClick={() => {
                            setSelectedImage(homemaid.profileImage!);
                            setShowImageModal(true);
                          }}>
                            <img
                              src={homemaid.profileImage}
                              alt="Profile"
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 hover:border-blue-500 transition-colors"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">P</span>
                          </div>
                        )}
                        {homemaid.fullImage && (
                          <div className="relative cursor-pointer" onClick={() => {
                            setSelectedImage(homemaid.fullImage!);
                            setShowImageModal(true);
                          }}>
                            <img
                              src={homemaid.fullImage}
                              alt="Full"
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 hover:border-green-500 transition-colors"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs px-1 rounded">F</span>
                          </div>
                        )}
                        {!homemaid.profileImage && !homemaid.fullImage && (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{homemaid.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{homemaid.age}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{homemaid.nationality}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{homemaid.birthDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{homemaid.religion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{homemaid.maritalStatus}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{homemaid.officeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-xs">
                        <div>No: {homemaid.passportNumber}</div>
                        <div>Start: {homemaid.passportStartDate}</div>
                        <div>End: {homemaid.passportEndDate}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-xs">
                        <div>Duration: {homemaid.contractDuration}</div>
                        <div>Salary: {homemaid.salary}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-xs">
                        <div>Height: {homemaid.height}</div>
                        <div>Weight: {homemaid.weight}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex flex-wrap gap-1">
                        {homemaid.babySitting && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Babysitting</span>}
                        {homemaid.cleaning && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Cleaning</span>}
                        {homemaid.cooking && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Cooking</span>}
                        {homemaid.laundry && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Laundry</span>}
                        {homemaid.stitching && <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">Stitching</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(homemaid)}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(homemaid.id)}
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Homemaid</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        name="Name"
                        value={formData.Name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Age</label>
                      <input
                        type="text"
                        name="Age"
                        value={formData.Age}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nationality</label>
                      <input
                        type="text"
                        name="Nationality"
                        value={formData.Nationality}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Birth Date</label>
                      <input
                        type="date"
                        name="BirthDate"
                        value={formData.BirthDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                      <select
                        name="MaritalStatus"
                        value={formData.MaritalStatus}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Religion</label>
                      <input
                        type="text"
                        name="Religion"
                        value={formData.Religion}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Office Name</label>
                      <input
                        type="text"
                        name="OfficeName"
                        value={formData.OfficeName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Passport Number</label>
                      <input
                        type="text"
                        name="PassportNumber"
                        value={formData.PassportNumber}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Passport Start Date</label>
                      <input
                        type="date"
                        name="PassportStartDate"
                        value={formData.PassportStartDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Passport End Date</label>
                      <input
                        type="date"
                        name="PassportEndDate"
                        value={formData.PassportEndDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contract Duration</label>
                      <input
                        type="text"
                        name="Contract_duration"
                        value={formData.Contract_duration}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Height</label>
                      <input
                        type="text"
                        name="height"
                        value={formData.height}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Weight</label>
                      <input
                        type="text"
                        name="Weight"
                        value={formData.Weight}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Salary</label>
                      <input
                        type="text"
                        name="salary"
                        value={formData.salary}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Baby Sitting</label>
                      <select
                        name="BabySitting"
                        value={formData.BabySitting}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cleaning</label>
                      <select
                        name="Cleaning"
                        value={formData.Cleaning}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cooking</label>
                      <select
                        name="Cooking"
                        value={formData.Cooking}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Laundry</label>
                      <select
                        name="laundry"
                        value={formData.laundry}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stitching</label>
                      <select
                        name="stitiching"
                        value={formData.stitiching}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Images</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Profile Image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          {formData.profileImage ? (
                            <div className="text-center">
                              <img
                                src={formData.profileImage}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover mx-auto mb-2 border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                                onClick={() => {
                                  setSelectedImage(formData.profileImage);
                                  setShowImageModal(true);
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <p className="text-sm text-gray-600 mb-2">Profile Image</p>
                              <a
                                href={formData.profileImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View Full Size
                              </a>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-2">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">No Profile Image</p>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'profileImage')}
                            className="hidden"
                            id="profileImage"
                          />
                          <label
                            htmlFor="profileImage"
                            className="mt-2 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm cursor-pointer text-center block"
                          >
                            {imageUploading.profileImage ? 'Uploading...' : 'Upload Profile Image'}
                          </label>
                          {imageErrors.profileImage && (
                            <p className="text-red-500 text-xs mt-1">{imageErrors.profileImage}</p>
                          )}
                        </div>
                      </div>

                      {/* Full Image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Image</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          {formData.fullImage ? (
                            <div className="text-center">
                              <img
                                src={formData.fullImage}
                                alt="Full"
                                className="w-24 h-24 rounded-full object-cover mx-auto mb-2 border-2 border-gray-300 cursor-pointer hover:border-green-500 transition-colors"
                                onClick={() => {
                                  setSelectedImage(formData.fullImage);
                                  setShowImageModal(true);
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <p className="text-sm text-gray-600 mb-2">Full Image</p>
                              <a
                                href={formData.fullImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View Full Size
                              </a>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-2">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">No Full Image</p>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'fullImage')}
                            className="hidden"
                            id="fullImage"
                          />
                          <label
                            htmlFor="fullImage"
                            className="mt-2 w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm cursor-pointer text-center block"
                          >
                            {imageUploading.fullImage ? 'Uploading...' : 'Upload Full Image'}
                          </label>
                          {imageErrors.fullImage && (
                            <p className="text-red-500 text-xs mt-1">{imageErrors.fullImage}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingId(null);
                        resetForm();
                      }}
                      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Update
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this homemaid record? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteId(null);
                    }}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image View Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full p-2 z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '/images/placeholder.png';
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
    </Layout>
  );
}