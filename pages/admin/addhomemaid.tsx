//@ts-ignore
//@ts-nocheck
import React, { useEffect, useState } from 'react'
import { useForm, SubmitHandler } from "react-hook-form"
import { Input, HelperText, Label, Select, Textarea, Button, Modal, ModalHeader, ModalBody, ModalFooter } from '@roketid/windmill-react-ui'
import CTA from 'example/components/CTA'
import PageTitle from 'example/components/Typography/PageTitle'
import SectionTitle from 'example/components/Typography/SectionTitle'

import Layout from 'example/containers/Layout'
import { MailIcon } from 'icons'
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { ClipLoader } from 'react-spinners'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
// Cookies
// jwtDecode
// useRouter
// useEffect

function Waitinglist() {
  const router = useRouter();
useEffect(()=>{
try {

    const token = Cookies.get("token")
  const decoder = jwtDecode(token);
      if(!decoder.admin)return router.replace("/client");
  
// console.log(decoder.idnumber)
  } catch (error) {
    router.replace("/client")
  }
},[])
  const [office, setOffice] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false)
  function openModal() {
    setIsModalOpen(true)
  }
  function closeModal() {
    setIsModalOpen(false)
  }
const obj = {
 "اسم الكفيل": "تركيه خليل ابراهيم الحزيمي",
      "\"هوية الكفيل  The identity of the sponsor\"": 1042214955,
      "\"جوال الكفيل  The sponsor's mobile\"": "532422484",
      "\"اسم العاملة  The name of the worker\"": "BEGUM SUMI",
      "\"رقم الجواز  Passport number\"": "A07323151",
      "جنسية العاملة": "بنجلاديش",
      "\"تارخ تقديم الطلب  The date of application\"": "2023-01-11",

      "الفترة الزمنية": "2023-04-11",
      "\"موافقة المكتب الخارجي  External office approval\"": "2023-05-13",
      "\"تاريخ الربط مع المكتب الخارجي  Date of connection with the external office\"": "2023-05-13",
      "\"تاريخ عمل الوكالة  Agency work history\"": "2023-05-27",
      "\"تاريخ التختيم في السفارة   The date stamped at the embassy\"": "2008-06-20",
      "\"تاريخ الحجز  booking date\"": "2023-04-06",
      "\"تاريخ الوصول  date of arrival\"": "2023-06-11",
      "رقم الحدود": 0,
      "المبلغ  للمكتب الخارجي": "تم",
      "الكشف الطبي": "NOT FIT",
      "\"مدينة الوصول  arrival city\"": " المدينة المنورة",
      "حالة الطلب": "تم الوصول ",

      "التفويض": "no"}
const schema = yup
  .object({
   sponsorName: yup.string().required(),
sposnorId: yup.number().required(),
    sponsorMobile:yup.string().required(),
workerName:yup.string().required(),
passportnumber:yup.string(),
nationality:yup.string().required(),
dateOfApplication:yup.string(),
duration:yup.string(),//الفترة الزمنية
externalDateApproval:yup.string(),

externalDateLinking:yup.string().required(),
agencyWorkDate:yup.string().required(),
embassyStampingDate:yup.string().required(),

bookingDate:yup.string().required(),
arrivalDate:yup.string().required(),

limitsNumber:yup.number().required(),
externalOfficeNotify:yup.string().required(),
medicalCheck:yup.string().required(),
arrivalCity:yup.string().required(),
status:yup.string().required(),

delegation:yup.string().required()
,
notes:yup.string().notRequired()
  })
  .required()


  const { register,formState: { errors }, handleSubmit } = useForm({resolver: yupResolver(schema)})

  const handleSignUp = async (e: React.SyntheticEvent) => {
    
    e.preventDefault();

  };

  
 const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  function openErrorModal() {
    setIsErrorModalOpen(true)
  }
  function closeErrorModal() {
    setIsErrorModalOpen(false)
  }


  const [fetching,setFetching] = useState(false);  
const errorfunc=()=>{
setFetching(false)
openErrorModal()
}
const truefunc=()=>{
setFetching(false)
  openModal();
  
}
//@ts-ignore
const onSubmit = async (data) => {
  // console.log(errors)

setFetching(true)
  const fetcher = await fetch('../api/addhomemaid',{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json",
      },body:JSON.stringify({ "اسم الكفيل":data.sponsorName,
      "\"هوية الكفيل  The identity of the sponsor\"":data.sposnorId,
      "\"جوال الكفيل  The sponsor's mobile\"": data.sponsorMobile,
      "\"اسم العاملة  The name of the worker\"": data.workerName,
      "\"رقم الجواز  Passport number\"": data.passportnumber,
      "جنسية العاملة": data.nationality,
      "\"تارخ تقديم الطلب  The date of application\"": data.dateOfApplication,

      "الفترة الزمنية": data.duration,
      "\"موافقة المكتب الخارجي  External office approval\"": data.externalDateApproval,
      "\"تاريخ الربط مع المكتب الخارجي  Date of connection with the external office\"": data.externalDateLinking,
      "\"تاريخ عمل الوكالة  Agency work history\"": data.agencyWorkDate,
      "\"تاريخ التختيم في السفارة   The date stamped at the embassy\"": data.embassyStampingDate,
      "\"تاريخ الحجز  booking date\"": data.bookingDate,
      "\"تاريخ الوصول  date of arrival\"": data.arrivalDate,
      "رقم الحدود": data.limitsNumber,
      "المبلغ  للمكتب الخارجي": data.externalOfficeNotify,
      "الكشف الطبي": data.medicalCheck,
      "\"مدينة الوصول  arrival city\"": data.arrivalCity,
      "حالة الطلب": data.status,

      "التفويض": data.delegation    })})

      const e= await fetcher.json()
      console.log(fetcher.status)
if(fetcher.status == 200) return truefunc();
errorfunc()

}
// const copyPaste=()=>{
  // document.getElementById("externalDateLinking").addEventListener("paste", (e,s)=>{
    // console.log(s)
  // })


// }
// console.log(errors)
  return (

  
    <Layout>
      <Modal  isOpen={isErrorModalOpen} onClose={closeErrorModal}>
        <ModalHeader color='pink' style={{color:"red"}}>Error Inserting Data</ModalHeader>
        <ModalBody>
          Check Internet Connectivity
        </ModalBody>
        <ModalFooter>
          <Button className="w-full sm:w-auto" layout="outline" onClick={closeErrorModal}>
            Close
          </Button>
         
        </ModalFooter>
      </Modal>
    




       <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ModalHeader>Data Inserted Successfully</ModalHeader>
        <ModalBody>
          Thank you for inserting Data , check DataBase in case of you need to update Data
        </ModalBody>
        <ModalFooter>
          <Button className="w-full sm:w-auto" layout="outline" onClick={closeModal}>
            Close
          </Button>
         
        </ModalFooter>
      </Modal>
{fetching?<div  style={{display:"flex",justifyContent:"center"}}><ClipLoader  cssOverride={{width:"390px",height:"390px",alignSelf:"center"}}/>  
</div>
: <form onSubmit={handleSubmit(onSubmit)}>
      <PageTitle>اضافة الى قائمة الوصول</PageTitle>
       <div dir='rtl' style={{display:"grid",gridTemplateColumns: "auto auto auto",gap:"19px"}} className="px-4 py-3 mb-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <Label>
          <span>اسم الكفيل</span>
          <Input aria-invalid={errors.sponsorName ? "true" : "false"} {...register("sponsorName", { required: true })} className="mt-1" placeholder="اسم العميل"  type='text' />
        {errors.sponsorName?<span style={{backgroundColor:"pink"}}>{errors.sponsorName.message}</span>:""}
        
        </Label>
        <Label>

          <span>هوية الكفيل</span>
          <Input   aria-invalid={errors.sposnorId ? "true" : "false"} {...register("sposnorId", { required: true })}    className="mt-1" placeholder="هوية الكفيل"  type='text' />
        {errors.sposnorId?<span style={{backgroundColor:"pink"}}>{errors.sposnorId.message}</span>:""}
                </Label>
        
        <Label>
                  <span>جوال الكفيل</span>
          <Input type="text"  aria-invalid={errors.sponsorMobile ? "true" : "false"} {...register("sponsorMobile", { required: true })}    className="mt-1" placeholder="جوال الكفيل"  type='text' />
        {errors.sponsorMobile?<span style={{backgroundColor:"pink"}}>{errors.sponsorMobile.message}</span>:""}
        
        </Label>
        <Label>

          <span>اسم العاملة</span>
          <Input className="mt-1" aria-invalid={errors.workerName ? "true" : "false"} {...register("workerName", { required: true })}  placeholder="اسم العاملة" type='text'/>
        {errors.workerName?<span style={{backgroundColor:"pink"}}>{errors.workerName.message}</span>:""}
      
        
        </Label>

        <Label className="mt-4">
          <span>جواز سفر العاملة</span>
          <Input aria-invalid={errors.passportnumber ? "true" : "false"} {...register("passportnumber", { required: true })} className="mt-1" placeholder="جواز سفر العاملة" />
        {errors.passportnumber?<span style={{backgroundColor:"pink"}}>{errors.passportnumber.message}</span>:""}
       
        </Label>
          <Label className="mt-4">
          <span>الجنسية</span>
          <Input aria-invalid={errors.nationality ? "true" : "false"} {...register("nationality", { required: true })} className="mt-1" placeholder="الجنسية" />
        {errors.nationality?<span style={{backgroundColor:"pink"}}>{errors.nationality.message}</span>:""}
       
        </Label>


<Label className="mt-4">
          <span>تاريخ التقديم</span>
          <Input aria-invalid={errors.dateOfApplication ? "true" : "false"} type='date'{...register("dateOfApplication", { required: true })} className="mt-1" placeholder="تاريخ الطلب"  type='date'/>
        {errors.dateOfApplication?<span style={{backgroundColor:"pink"}}>{errors.dateOfApplication.message}</span>:""}
       
        </Label>


<Label className="mt-4">
          <span>الفترة الزمنية</span>
          <Input aria-invalid={errors.duration ? "true" : "false"} type='date'{...register("duration", { required: true })} className="mt-1" placeholder="الفترة الزمنية"  type='date'/>
        {errors.duration?<span style={{backgroundColor:"pink"}}>{errors.duration.message}</span>:""}
       
        </Label>



<Label className="mt-4">
          <span>موافقة المكتب الخارجي</span>
          <Input aria-invalid={errors.externalDateApproval ? "true" : "false"} type='date'{...register("externalDateApproval", { required: true })} className="mt-1" placeholder="الفترة الزمنية"  type='date'/>
        {errors.externalDateApproval?<span style={{backgroundColor:"pink"}}>{errors.externalDateApproval.message}</span>:""}
       
        </Label>







<Label className="mt-4">
          <span>تاريخ الربط مع  المكتب الخارجي</span>
          <Input aria-invalid={errors.externalDateLinking ? "true" : "false"} id="externalDateLinking" type='date'{...register("externalDateLinking", { required: true })} className="mt-1" placeholder="تاريخ الربط بالمكتب الخارجي"  type='date'/>
        {errors.externalDateLinking?<span style={{backgroundColor:"pink"}}>{errors.externalDateLinking.message}</span>:""}
       
        </Label>



<Label className="mt-4">
          <span>تاريخ عمل الوكالة</span>
          <Input aria-invalid={errors.agencyWorkDate ? "true" : "false"} type='date'{...register("agencyWorkDate", { required: true })} className="mt-1" placeholder="تاريخ عمل الوكالة"  type='date'/>
        {errors.agencyWorkDate?<span style={{backgroundColor:"pink"}}>{errors.agencyWorkDate.message}</span>:""}
       
        </Label>



<Label className="mt-4">
          <span>تاريخ التختيم في السفارة</span>
          <Input aria-invalid={errors.embassyStampingDate ? "true" : "false"} type='date'{...register("embassyStampingDate", { required: true })} className="mt-1" placeholder="تاريخ عمل الوكالة"  type='date'/>
        {errors.embassyStampingDate?<span style={{backgroundColor:"pink"}}>{errors.embassyStampingDate.message}</span>:""}
       
        </Label>







<Label className="mt-4">
          <span>تاريخ الحجز</span>
          <Input aria-invalid={errors.bookingDate ? "true" : "false"} type='date'{...register("bookingDate", { required: true })} className="mt-1" placeholder="تاريخ الحجز"  type='date'/>
        {errors.bookingDate?<span style={{backgroundColor:"pink"}}>{errors.bookingDate.message}</span>:""}
       
        </Label>


<Label className="mt-4">
          <span>تاريخ الوصول</span>
          <Input aria-invalid={errors.bookingDate ? "true" : "false"} type='date'{...register("arrivalDate", { required: true })} className="mt-1" placeholder="تاريخ الوصول"  />
        {errors.arrivalDate?<span style={{backgroundColor:"pink"}}>{errors.arrivalDate.message}</span>:""}
       
        </Label>


<Label className="mt-4">
          <span>عدد الحدود</span>
          <Input aria-invalid={errors.limitsNumber ? "true" : "false"} type='number '{...register("limitsNumber", { required: true })} style={{borderColor:"black"}} className="mt-4" placeholder="الحدود"  />
        {errors.limitsNumber?<span style={{backgroundColor:"pink"}}>{errors.limitsNumber.message}</span>:""}
       
        </Label>






<Label className="mt-4">
          <span>تبليغ المكتب الخارجي</span>
          
          <Select {...register("externalOfficeNotify", { required: true })}>
            <option value='------'>-----</option>

            <option value='تم'>تم</option>

            <option value='لم يتم'>لم يتم</option>
          </Select>
          
          {errors.externalOfficeNotify?<span style={{backgroundColor:"pink"}}>{errors.externalOfficeNotify.message}</span>:""}
       
        </Label>





<Label className="mt-4">
          <span>الكشف الطبي</span>
          
          <Select {...register("medicalCheck", { required: true })}>
            <option value='------'>-----</option>
          
            <option value='FIT'>FIT</option>

            <option value='WAITING'>WAITING</option>

            <option value='NOT FIT'>NOT FIT</option>

            <option value='NO'>NO</option>


          </Select>
          
          {errors.medicalCheck?<span style={{backgroundColor:"pink"}}>{errors.medicalCheck.message}</span>:""}
       
        </Label>
{/* :yup.string().required() */}




<Label className="mt-4">
          <span>مدينة الوصول</span>
          
          <Select {...register("arrivalCity", { required: true })}>
            <option value='------'>-----</option>

            <option value='المدينة المنورة'>المدينة المنورة</option>

            <option value='الرياض'>الرياض</option>

            <option value='جده'>جده</option>

            <option value='ابها'>ابها</option>


            <option value='الرياض '>الرياض </option>
            <option value='ينبع '>ينبع </option>
            <option value='رفحاء'>رفحاء </option>
            <option value='الباحة'>الباحة </option>
            <option value='الدمام'>الدمام </option>
            <option value='تبوك'>تبوك </option>

       <option value='جازان'>جازان</option>

       <option value='مكه المكرمه'>مكه المكرمه</option>
       <option value='العلا'>العلا</option>


            <option value='الباحه محافظة المخواة '>الباحه محافظة المخواة </option>


          </Select>
          
          {errors.arrivalCity?<span style={{backgroundColor:"pink"}}>{errors.arrivalCity.message}</span>:""}
       
        </Label>









<Label className="mt-4">
          <span>حالة الطلب</span>
          
          <Select {...register("status", { required: true })}>
            <option value='------'>-----</option>

            <option value='هروب العاملة '>هروب العاملة </option>

            <option value='الغاء الطلب'>الغاء الطلب</option>

            <option value='تم الوصول '>تم الوصول </option>
            <option value='قيد المراجعة'>قيد المراجعة</option>

            <option value='YES'>YES</option>


            <option value='NO'>NO</option>


          </Select>
          
          {errors.status?<span style={{backgroundColor:"pink"}}>{errors.status.message}</span>:""}
       
        </Label>




<Label className="mt-4">
          <span>التفويض</span>
          
          <Select {...register("delegation", { required: true })}>

            <option value='WAITING'>WAITING </option>

            <option value='YES'>نعم </option>

            <option value='NO'>لا</option>



          </Select>
          
          {errors.delegation?<span style={{backgroundColor:"pink"}}>{errors.delegation.message}</span>:""}
       
        </Label>

<Label className="mt-4">
          <span>ملاحظات</span>
        <Textarea  aria-invalid={errors.notes ? "true" : "false"} {...register("notes", { required: false })} cols={50} rows={5}/>
        </Label>  


      </div>
  <Button type="submit"  style={{backgroundColor:"#003749"}}> <h2>اضافة عاملة الى قائمة الوصول</h2>
</Button>

</form>} 
    </Layout>
  )
}

export default Waitinglist;
