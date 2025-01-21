//@ts-ignore
//@ts-nocheck
import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Input,
  HelperText,
  Label,
  Select,
  Textarea,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@roketid/windmill-react-ui";
import CTA from "example/components/CTA";
import PageTitle from "example/components/Typography/PageTitle";
import SectionTitle from "example/components/Typography/SectionTitle";

import Layout from "example/containers/Layout";
import { MailIcon } from "icons";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dayjs from "dayjs";

function Female() {
  const [office, setOffice] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  function openModal() {
    setIsModalOpen(true);
  }
  function closeModal() {
    setIsModalOpen(false);
  }
  const schema = yup
    .object({
      client: yup.string(),
      mobilenumber: yup.string(),
      nationalidnumber: yup.number(),
      passportnumber: yup.string(),
      homemaid: yup.string().required(),
      nationality: yup.string(),
      kingdomentrydate: yup.date().typeError("order date is required value"),
      applicationdate: yup.date().typeError("order date is required value"),

      // daydate:dayjs().get("year")+"-"+(dayjs().get("month")+1) +"-"+dayjs().get("D"),
      workduration: yup.number(),
      newclientname: yup.string(),
      newclientmobilenumber: yup.string(),
      newclientnationalidnumber: yup.number(),
      newclientcity: yup.string(),
      experimentstart: yup.date(),
      experimentend: yup.date(),
      dealcost: yup.number(),
      paid: yup.number(),
      restofpaid: yup.number(),
      experimentresult: yup.string(),
      accomaditionnumber: yup.number(),

      marketeername: yup.string(),

      // notes:yup.string()
    })
    .required();

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const handleSignUp = async (e: React.SyntheticEvent) => {
    e.preventDefault();
  };
  //@ts-ignore
  const onSubmit = async (data) => {
    // console.log(errors)
    const fetcher = await fetch("../api/addtransfer", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const e = await fetcher.text();
    console.log(fetcher.status);
    if (fetcher.status == 200) return openModal();
    // errorfunc()
    alert("error");
  };

  return (
    <Layout>
      {/* <CTA /> */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ModalHeader>تم ادراج البيانات بنجاح</ModalHeader>
        <ModalBody>تم ادراج بيان نقل الكفالة في قاعدة البيانات </ModalBody>
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
      {/* <SectionTitle>Elements</SectionTitle> */}
      <PageTitle>نقل كفالة </PageTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div
          dir="rtl"
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto auto",
            gap: "19px",
          }}
          className="px-4 py-3 mb-8 bg-white rounded-lg shadow-md dark:bg-gray-800"
        >
          <Label>
            <span>اسم العميل المستقدم</span>
            <Input
              aria-invalid={errors.clientname ? "true" : "false"}
              {...register("clientname", { required: true })}
              className="mt-1"
              placeholder="اسم العميل"
              type="text"
              onChange={(e) => setOffice(e.target.value)}
            />
            {errors.clientname ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.clientname.message}
              </span>
            ) : (
              ""
            )}
          </Label>
          <Label>
            <span>رقم جوال صاحب العمل المستقدم</span>
            <Input
              aria-invalid={errors.mobilenumber ? "true" : "false"}
              {...register("mobilenumber", { required: true })}
              className="mt-1"
              placeholder="رقم الجوال"
              type="text"
              onChange={(e) => setOffice(e.target.value)}
            />
            {errors.mobilenumber ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.mobilenumber.message}
              </span>
            ) : (
              ""
            )}
          </Label>
          <Label>
            <span>رقم هوية المستقدم</span>
            <Input
              className="mt-1"
              aria-invalid={errors.nationalidnumber ? "true" : "false"}
              {...register("nationalidnumber", { required: true })}
              placeholder="رقم هوية المستقدم"
              type="text"
            />
            {errors.nationalidnumber ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.nationalidnumber?.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>اسم العاملة</span>
            <Input
              aria-invalid={errors.homemaid ? "true" : "false"}
              {...register("homemaid", { required: true })}
              className="mt-1"
              placeholder="اسم العاملة"
            />
            {errors.homemaid ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.homemaid.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>رقم جواز العاملة</span>
            <Input
              aria-invalid={errors.passportnumber ? "true" : "false"}
              {...register("passportnumber", { required: true })}
              className="mt-1"
              placeholder="رقم جواز العاملة"
            />
            {errors.passportnumber ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.passportnumber.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>الجنسية</span>
            <Input
              className="mt-1"
              placeholder="الجنسية"
              aria-invalid={errors.nationality ? "true" : "false"}
              {...register("nationality", { required: true })}
            />
            {errors.nationality ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.nationality.message}
              </span>
            ) : (
              ""
            )}
          </Label>
          <Label className="mt-4">
            <span>تاريخ وصول المملكة</span>
            <Input
              className="mt-1"
              placeholder="تاريخ وصول المملكة"
              type="date"
              aria-invalid={errors.kingdomentrydate ? "true" : "false"}
              {...register("kingdomentrydate", { required: true })}
            />

            {errors.kindomentrydate ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.kingdomentrydate.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>تاريخ تقديم الطلب</span>
            <Input
              className="mt-1"
              placeholder="تاريخ تقديم الطلب"
              type="date"
              aria-invalid={errors.applicationdate ? "true" : "false"}
              {...register("applicationdate", { required: true })}
            />

            {errors.applicationdate ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.applicationdate.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>المدة</span>
            <Input
              className="mt-1"
              placeholder="المدة"
              aria-invalid={errors.workduration ? "true" : "false"}
              {...register("workduration", { required: true })}
            />

            {errors.workduartion ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.workduartion.message}
              </span>
            ) : (
              ""
            )}
          </Label>
          <Label className="mt-4">
            <span>اسم العميل الجديد</span>
            <Input
              className="mt-1"
              placeholder="اسم العميل الجديد"
              aria-invalid={errors.newclientname ? "true" : "false"}
              {...register("newclientname", { required: true })}
            />
            {errors.newclientname ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.newclientname.message}
              </span>
            ) : (
              ""
            )}
          </Label>
          <Label className="mt-4">
            <span>رقم جوال العميل الجديد</span>
            <Input
              className="mt-1"
              aria-invalid={errors.newclientmobilenumber ? "true" : "false"}
              {...register("newclientmobilenumber", { required: true })}
              placeholder="رقم جوال العميل الجديد"
            />
            {errors.newclientmobilenumber ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.newclientmobilenumber.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>الهوية الوطنية الجديدة</span>
            <Input
              className="mt-1"
              aria-invalid={errors.newclientnationalidnumber ? "true" : "false"}
              {...register("newclientnationalidnumber", { required: true })}
              placeholder="رقم الهوية الجديدة"
            />
            {errors.newclientnationalidnumber ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.newclientnationalidnumber.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>مدينة العميل الجديد</span>
            <Input
              className="mt-1"
              placeholder="مدينة العميل الجديد"
              aria-invalid={errors.newclientcity ? "true" : "false"}
              {...register("newclientcity", { required: true })}
            />
            {errors.newclientcity ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.newclientcity.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>بداية التجربة</span>
            <Input
              className="mt-1"
              placeholder="بداية التجربة"
              type="date"
              aria-invalid={errors.experimentstart ? "true" : "false"}
              {...register("experimentstart", { required: true })}
            />
            {errors.experimentstart ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.experimentstart.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>نهاية التجربة</span>
            <Input
              className="mt-1"
              placeholder="نهاية التجربة"
              type="date"
              aria-invalid={errors.experimentstart ? "true" : "false"}
              {...register("experimentend", { required: true })}
            />
            {errors.experimentend ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.experimentend.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>التكلفة</span>
            <Input
              className="mt-1"
              placeholder="التكلفة"
              aria-invalid={errors.dealcost ? "true" : "false"}
              {...register("dealcost", { required: true })}
            />
            {errors.dealcost ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.dealcost.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>المدفوع</span>
            <Input
              className="mt-1"
              placeholder="المدفوع"
              aria-invalid={errors.paid ? "true" : "false"}
              {...register("paid", { required: true })}
            />
            {errors.paid ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.paid.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>المتبقى من المدفوع</span>
            <Input
              className="mt-1"
              placeholder="المتبقي من المدفوع"
              aria-invalid={errors.restofpaid ? "true" : "false"}
              {...register("restofpaid", { required: true })}
            />
            {errors.restofpaid ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.restofpaid.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>نتيجة التجربة</span>
            <Input
              className="mt-1"
              placeholder="نتيجة التجربة"
              aria-invalid={errors.experimentresult ? "true" : "false"}
              {...register("experimentresult", { required: true })}
            />
            {errors.experimentresult ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.experimentresult.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>رقم الاقامة</span>
            <Input
              className="mt-1"
              placeholder="المدفوع"
              aria-invalid={errors.accomaditionnumber ? "true" : "false"}
              {...register("accomaditionnumber", { required: true })}
            />
            {errors.accomaditionnumber ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.accomaditionnumber.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          <Label className="mt-4">
            <span>اسم المسوق</span>
            <Input
              className="mt-1"
              aria-invalid={errors.marketeername ? "true" : "false"}
              {...register("marketeername", { required: true })}
            />
            {errors.marketeername ? (
              <span style={{ backgroundColor: "pink" }}>
                {errors.marketeername.message}
              </span>
            ) : (
              ""
            )}
          </Label>

          {/* </div> */}

          {/* </Label> */}
        </div>
        <Button type="submit" style={{ backgroundColor: "#Ecc383" }}>
          {" "}
          <h2>تأكيد نقل الكفالة</h2>
        </Button>
      </form>
    </Layout>
  );
}

export default Female;
