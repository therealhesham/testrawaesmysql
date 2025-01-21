//@ts-nocheck

import React, { useEffect, useState } from "react";
import {
  Input,
  Label,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@roketid/windmill-react-ui";
import PageTitle from "example/components/Typography/PageTitle";
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { ClipLoader } from "react-spinners";

function AddAdmin() {
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Router for redirection
  const router = useRouter();

  // Validate JWT Token
  useEffect(() => {
    try {
      const token = Cookies.get("token");
      const decoder = jwtDecode(token);
      if (!decoder.admin) return router.replace("/client");
    } catch (error) {
      router.replace("/client");
    }
  }, [router]);

  // Open and close modal functions
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openErrorModal = () => setIsErrorModalOpen(true);
  const closeErrorModal = () => setIsErrorModalOpen(false);

  // Form schema for validation using yup
  const Schema = yup.object({
    country: yup.string().required("Country is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(Schema),
  });

  // Handle the form submission
  const handleSignUp = async (data) => {
    setFetching(true);
    try {
      const response = await fetch("../api/addcountry", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.status === 200) {
        setFetching(false);
        openModal();
      } else {
        setFetching(false);
        openErrorModal();
      }
    } catch (error) {
      setFetching(false);
      openErrorModal();
    }
  };

  return (
    <Layout>
      {/* Error Modal */}
      <Modal isOpen={isErrorModalOpen} onClose={closeErrorModal}>
        <ModalHeader color="pink" style={{ color: "red" }}>
          Error Inserting Data
        </ModalHeader>
        <ModalBody>Check Internet Connectivity</ModalBody>
        <ModalFooter>
          <Button
            className="w-full sm:w-auto"
            layout="outline"
            onClick={closeErrorModal}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ModalHeader>Data Inserted Successfully</ModalHeader>
        <ModalBody>تم تسجيل البيانات بنجاح</ModalBody>
        <ModalFooter>
          <Button
            className="w-full sm:w-auto"
            layout="outline"
            onClick={closeModal}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <PageTitle>اضافة دولة</PageTitle>

      {/* Loading spinner */}
      {fetching ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ClipLoader
            cssOverride={{
              width: "390px",
              height: "390px",
              alignSelf: "center",
            }}
          />
        </div>
      ) : (
        // Form
        <form onSubmit={handleSubmit(handleSignUp)}>
          <div className="px-4 py-3 mb-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
            <Label>
              <span>الموقع</span>
              <Input
                className="mt-1"
                placeholder="الموقع"
                {...register("country")}
                type="text"
              />
              {errors.country && (
                <span style={{ color: "red" }}>{errors.country.message}</span>
              )}
            </Label>

            <Button type="submit">
              ِاضافة دولة الى قاعدة بيانات الايرتابل
            </Button>
          </div>
        </form>
      )}
    </Layout>
  );
}

export default AddAdmin;
