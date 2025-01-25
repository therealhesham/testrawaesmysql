import React, { useState } from "react";
import { Field, ErrorMessage } from "formik";

const FileUploadField = ({ label, name, ...props }: any) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div>
      <label htmlFor={name} className="block font-semibold text-sm">
        {label}
      </label>
      <div className="flex items-center border rounded-md px-4 py-2 mt-1">
        <input
          id={name}
          name={name}
          type="file"
          className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          onChange={handleFileChange}
          {...props}
        />
        <span className="text-gray-600 ml-2">
          {selectedFile ? selectedFile.name : "No file selected"}
        </span>
      </div>
      <ErrorMessage name={name}>
        {(msg) => <div className="text-red-600 text-sm mt-1">{msg}</div>}
      </ErrorMessage>
    </div>
  );
};

export default FileUploadField;
