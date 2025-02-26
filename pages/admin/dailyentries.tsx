import Layout from "example/containers/Layout";
import * as React from "react";
import { useState } from "react";

const AccountingEntryForm = ({ addEntry }) => {
  const [description, setDescription] = useState("");
  const [debitAccount, setDebitAccount] = useState("");
  const [creditAccount, setCreditAccount] = useState("");
  const [debitAmount, setDebitAmount] = useState("");
  const [creditAmount, setCreditAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !description ||
      !debitAccount ||
      !creditAccount ||
      !debitAmount ||
      !creditAmount
    ) {
      return;
    }

    // Create the new entry
    const newEntry = {
      description,
      debitAccount,
      creditAccount,
      debitAmount: parseFloat(debitAmount),
      creditAmount: parseFloat(creditAmount),
    };

    // Call the parent function to add this entry
    addEntry(newEntry);

    // Reset form fields
    setDescription("");
    setDebitAccount("");
    setCreditAccount("");
    setDebitAmount("");
    setCreditAmount("");
  };

  return (
    <Layout>
      <div className="w-full mx-auto p-8">
        <form onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium">البيان</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">حساب الدائن</label>
              <input
                type="text"
                value={debitAccount}
                onChange={(e) => setDebitAccount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">حساب المدين</label>
              <input
                type="text"
                value={creditAccount}
                onChange={(e) => setCreditAccount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">مبلغ الدائن</label>
              <input
                type="number"
                value={debitAmount}
                onChange={(e) => setDebitAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">مبلغ المدين</label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-500 text-white p-2 rounded-md"
          >
            اضافة قيود
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default AccountingEntryForm;
