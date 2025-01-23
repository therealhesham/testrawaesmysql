import { useState } from "react";
import Layout from "example/containers/Layout";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import SuccessModal from "office/components/successcoponent";
import Modal from "components/modal";
const TransferPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

  const showSuccessModal = () => {
    setModalMessage("تم تسجيل البيانات بنجاح");
    setModalType("success");
    setIsModalOpen(true);
  };

  const showErrorModal = () => {
    setModalMessage("خطا في تسجيل البيانات.");
    setModalType("error");
    setIsModalOpen(true);
  };

  const closeSuccessfulModal = () => {
    setIsModalOpen(false);
  };
  // Define Yup Validation Schema
  const validationSchema = Yup.object({
    client: Yup.string().required("اسم العميل القديم مطلوب"),
    mobilenumber: Yup.string()
      .matches(/^\d+$/, "Mobile number must contain only digits")
      .required("Mobile number is required"),
    nationalidnumber: Yup.string().required("National ID is required"),
    passportnumber: Yup.string().required("Passport number is required"),
    homemaid: Yup.string().required("Home maid name is required"),
    nationality: Yup.string().required("Nationality is required"),
    kingdomentrydate: Yup.date().required("Kingdom entry date is required"),
    daydate: Yup.date().required("Day date is required"),
    workduration: Yup.number()
      .positive("Work duration must be a positive number")
      .required("Work duration is required"),
    newclientname: Yup.string().required("New client name is required"),
    newclientmobilenumber: Yup.string()
      .matches(/^\d+$/, "Mobile number must contain only digits")
      .required("New client mobile number is required"),
    newclientnationalidnumber: Yup.string().required(
      "New client national ID is required"
    ),
    newclientcity: Yup.string().required("New client city is required"),
    experimentstart: Yup.date().required("Experiment start date is required"),
    experimentend: Yup.date().required("Experiment end date is required"),
    dealcost: Yup.number()
      .positive("Deal cost must be a positive number")
      .required("Deal cost is required"),
    paid: Yup.number()
      .positive("Paid amount must be a positive number")
      .required("Paid amount is required"),
    restofpaid: Yup.number()
      .positive("Rest of paid amount must be a positive number")
      .required("Rest of paid amount is required"),
    experimentresult: Yup.string().required("Experiment result is required"),
    accomaditionnumber: Yup.string().required(
      "Accommodation number is required"
    ),
    marketeername: Yup.string().required("Marketer name is required"),
    notes: Yup.string().required("Notes are required"),
  });

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const response = await fetch("../../api/transfers", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        showSuccessModal();
        resetForm(); // Reset form after successful submission
      } else {
        showErrorModal();
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong. Please try again later.");
    } finally {
      setSubmitting(false); // Stop the submit button from being disabled
    }
  };

  // Dummy data, replace with real data from the API or database
  const transfers = [
    {
      id: 1,
      client: "Client A",
      mobilenumber: "123456789",
      nationalidnumber: "A1234567",
      passportnumber: "P1234567",
      homemaid: "Maid A",
      nationality: "Country A",
      kingdomentrydate: "2021-01-01",
      daydate: "2021-06-01",
      workduration: 12,
      newclientname: "New Client A",
      newclientmobilenumber: "987654321",
      newclientnationalidnumber: "B1234567",
      newclientcity: "City A",
      experimentstart: "2021-06-01",
      experimentend: "2022-06-01",
      dealcost: "5000",
      paid: "3000",
      restofpaid: "2000",
      experimentresult: "Success",
      accomaditionnumber: "Room 101",
      marketeername: "Marketer A",
      notes: "Notes here",
    },
    // Add more records as needed
  ];

  // Manage selected columns visibility
  const [selectedColumns, setSelectedColumns] = useState({
    client: true,
    mobilenumber: true,
    nationalidnumber: true,
    passportnumber: true,
    homemaid: true,
    nationality: true,
    kingdomentrydate: false,
    daydate: false,
    workduration: false,
    newclientname: false,
    newclientmobilenumber: false,
    newclientnationalidnumber: false,
    newclientcity: false,
    experimentstart: false,
    experimentend: false,
    dealcost: false,
    paid: false,
    restofpaid: false,
    experimentresult: false,
    accomaditionnumber: false,
    marketeername: false,
    notes: false,
  });

  // Toggle column visibility
  const handleColumnToggle = (column) => {
    setSelectedColumns((prevState) => ({
      ...prevState,
      [column]: !prevState[column],
    }));
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold text-center mb-6">
          معـامـلات نقل الكفالة
        </h1>

        {/* Button to toggle form */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-4 px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-yellow-500"
        >
          {showForm ? "Hide Form" : "Add New Transfer"}
        </button>

        {/* Form */}
        {showForm && (
          <div className="bg-white p-6 shadow-md rounded-md mb-6">
            <h2 className="text-xl font-semibold mb-4">نقل كفالة جديدة</h2>
            <Formik
              initialValues={{
                client: "",
                mobilenumber: "",
                nationalidnumber: "",
                passportnumber: "",
                homemaid: "",
                nationality: "",
                kingdomentrydate: "",
                daydate: "",
                workduration: "",
                newclientname: "",
                newclientmobilenumber: "",
                newclientnationalidnumber: "",
                newclientcity: "",
                experimentstart: "",
                experimentend: "",
                dealcost: "",
                paid: "",
                restofpaid: "",
                experimentresult: "",
                accomaditionnumber: "",
                marketeername: "",
                notes: "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({
                values,
                handleChange,
                handleBlur,
                touched,
                errors,
                isSubmitting,
              }) => (
                <Form className="space-y-4 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
                  {Object.keys(values).map((key) => (
                    <div key={key}>
                      <label className="block text-sm font-medium">
                        {key.replace(/([A-Z])/g, " $1").toUpperCase()}
                      </label>
                      <Field
                        type={key.includes("date") ? "date" : "text"}
                        name={key}
                        value={values[key]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder={key.replace(/([A-Z])/g, " $1")}
                      />
                      <ErrorMessage
                        name={key}
                        component="div"
                        className="text-red-500 text-xs"
                      />
                    </div>
                  ))}

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting} // Disable button while submitting
                      className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}

        {/* Column Selector */}
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Select Columns to Show</h2>
          <div className="space-x-4">
            {Object.keys(selectedColumns).map((column) => (
              <label key={column} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedColumns[column]}
                  onChange={() => handleColumnToggle(column)}
                  className="form-checkbox"
                />
                <span className="ml-2">
                  {column.replace(/([A-Z])/g, " $1").toUpperCase()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-md">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                {Object.keys(selectedColumns)
                  .filter((column) => selectedColumns[column])
                  .map((column) => (
                    <th key={column} className="px-4 py-2 text-sm font-medium">
                      {column.replace(/([A-Z])/g, " $1").toUpperCase()}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => (
                <tr key={transfer.id} className="border-t">
                  {Object.keys(selectedColumns)
                    .filter((column) => selectedColumns[column])
                    .map((column) => (
                      <td key={column} className="px-4 py-2 text-sm">
                        {transfer[column]}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Modal
          isOpen={isModalOpen}
          message={modalMessage}
          type={modalType}
          onClose={closeSuccessfulModal}
        />
      </div>
    </Layout>
  );
};

export default TransferPage;
