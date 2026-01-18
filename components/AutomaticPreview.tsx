import React from 'react';

interface AutomaticEmployee {
  id: number;
  name?: string;
  age?: string;
  religion?: string;
  maritalStatus?: string;
  birthDate?: string;
  nationality?: string;
  officeName?: string;
  passportNumber?: string;
  passportStartDate?: string;
  passportEndDate?: string;
  contractDuration?: string;
  weight?: string;
  height?: string;
  salary?: string;
  
  // Languages (flattened) - دعم ديناميكي لجميع اللغات
  lang_english?: string;
  lang_arabic?: string;
  [key: `lang_${string}`]: string | undefined;
  
  // Skills (flattened) - دعم ديناميكي لجميع المهارات
  skill_washing?: string;
  skill_cooking?: string;
  skill_babysetting?: string;
  skill_cleaning?: string;
  skill_laundry?: string;
  [key: `skill_${string}`]: string | undefined;
  
  profileImage?: string;
  fullImage?: string;
  
  // دعم للحقول الإضافية
  [key: string]: any;
}

interface AutomaticPreviewProps {
  employee: AutomaticEmployee;
  className?: string;
}

const AutomaticPreview: React.FC<AutomaticPreviewProps> = ({ employee, className = "" }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getSkillLevel = (level?: string) => {
    if (!level) return '';
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  };

  const getLanguageLevel = (level?: string) => {
    if (!level) return '';
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  };

  // استخراج جميع المهارات ديناميكياً
  const skills = Object.entries(employee)
    .filter(([key]) => key.startsWith('skill_'))
    .map(([key, level]) => {
      const skillName = key.replace('skill_', '').replace(/_/g, ' ');
      // تحويل أول حرف إلى كبير وبقية الأحرف إلى صغيرة
      const formattedName = skillName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      return { name: formattedName, level: level as string };
    })
    .filter(skill => skill.level && skill.level !== 'null' && skill.level !== 'undefined' && String(skill.level).trim() !== '');

  // استخراج جميع اللغات ديناميكياً
  const languages = Object.entries(employee)
    .filter(([key]) => key.startsWith('lang_'))
    .map(([key, level]) => {
      const langName = key.replace('lang_', '').replace(/_/g, ' ');
      // تحويل أول حرف إلى كبير وبقية الأحرف إلى صغيرة
      const formattedName = langName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      return { name: formattedName, level: level as string };
    })
    .filter(lang => lang.level && lang.level !== 'null' && lang.level !== 'undefined' && String(lang.level).trim() !== '');

  // استخراج الحقول الإضافية (غير المهارات واللغات والصور)
  const additionalFields = Object.entries(employee)
    .filter(([key]) => {
      // استبعاد الحقول المعروفة
      const knownFields = [
        'id', 'name', 'age', 'religion', 'maritalStatus', 'birthDate',
        'nationality', 'officeName', 'passportNumber', 'passportStartDate',
        'passportEndDate', 'contractDuration', 'weight', 'height', 'salary',
        'profileImage', 'fullImage'
      ];
      return !knownFields.includes(key) && 
             !key.startsWith('skill_') && 
             !key.startsWith('lang_') &&
             key !== 'company_name' && 
             key !== 'CompanyName';
    })
    .filter(([_, value]) => value && value !== 'null' && value !== 'undefined' && String(value).trim() !== '')
    .map(([key, value]) => {
      // تحسين عرض اسم الحقل
      const formattedKey = key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      return { key: formattedKey, value: String(value) };
    });

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Basic Info */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {employee.profileImage && (
              <img
                src={employee.profileImage}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {employee.name || 'N/A'}
              </h2>
              <p className="text-sm text-gray-600">
                {employee.age ? `${employee.age} years old` : 'Age not specified'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">DOB:</span>
              <span className="text-gray-900">
                {employee.birthDate ? formatDate(employee.birthDate) : 'N/A'}
                {employee.age && ` (${employee.age} years)`}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Nationality:</span>
              <span className="text-gray-900">{employee.nationality || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Religion:</span>
              <span className="text-gray-900">{employee.religion || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Marital Status:</span>
              <span className="text-gray-900">{employee.maritalStatus || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Office:</span>
              <span className="text-gray-900">{employee.officeName || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right Column - Passport & Physical */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Passport Information</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Number:</span>
                <span>{employee.passportNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Issue Date:</span>
                <span>{employee.passportStartDate ? formatDate(employee.passportStartDate) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Expiry Date:</span>
                <span>{employee.passportEndDate ? formatDate(employee.passportEndDate) : 'N/A'}</span>
              </div>
              {employee.passportStartDate && employee.passportEndDate && (
                <div className="text-xs text-gray-600 mt-1">
                  Valid: {formatDate(employee.passportStartDate)} → {formatDate(employee.passportEndDate)}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Physical Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Height:</span>
                <span>{employee.height || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Weight:</span>
                <span>{employee.weight || 'N/A'}</span>
              </div>
              {employee.height && employee.weight && (
                <div className="text-xs text-gray-600 mt-1">
                  {employee.height} / {employee.weight}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Job Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Salary:</span>
                <span>{employee.salary || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Contract Duration:</span>
                <span>{employee.contractDuration || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      {skills.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {skills.map((skill, index) => (
              <div key={index} className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-900">{skill.name}</span>
                  <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    {getSkillLevel(skill.level)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages Section */}
      {languages.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Languages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {languages.map((language, index) => (
              <div key={index} className="bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-900">{language.name}</span>
                  <span className="text-sm bg-green-200 text-green-800 px-2 py-1 rounded">
                    {getLanguageLevel(language.level)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Fields Section */}
      {additionalFields.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {additionalFields.map((field, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{field.key}:</span>
                  <span className="text-gray-900">{field.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Image Display */}
      {employee.fullImage && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Full Image</h3>
          <div className="flex justify-center">
            <img
              src={employee.fullImage}
              alt="Full body image"
              className="max-w-full h-auto max-h-96 rounded-lg border-2 border-gray-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomaticPreview;
