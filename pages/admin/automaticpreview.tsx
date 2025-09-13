import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';

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
    Weight: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        Weight: ''
      });
      fetchHomemaids();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create homemaid');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Homemaid Management</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">عرض البيانات</h1>


        {/* Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Homemaid Records</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nationality</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Birth Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {homemaids.map((homemaid) => (
                  <tr key={homemaid.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{homemaid.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{homemaid.age}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{homemaid.nationality}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{homemaid.birthDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {homemaid.babySitting && 'Babysitting, '}
                      {homemaid.cleaning && 'Cleaning, '}
                      {homemaid.cooking && 'Cooking, '}
                      {homemaid.laundry && 'Laundry, '}
                      {homemaid.stitching && 'Stitching'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}