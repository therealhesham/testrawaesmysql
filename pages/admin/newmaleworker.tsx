import React, { createRef, useRef, useState } from 'react'
import { useForm, SubmitHandler } from "react-hook-form"
import { Input, HelperText, Label, Select, Textarea, Button, Modal, ModalHeader, ModalBody, ModalFooter } from '@roketid/windmill-react-ui'
import CTA from 'example/components/CTA'
import PageTitle from 'example/components/Typography/PageTitle'
import SectionTitle from 'example/components/Typography/SectionTitle'
import Layout from 'example/containers/Layout'
import { MailIcon } from 'icons'
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { AntCloudOutlined } from '@ant-design/icons'
import { ClipLoader } from 'react-spinners'



function Male() {

  const [office, setOffice] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false)
  function openModal() {
    setIsModalOpen(true)
  }
  function closeModal() {
    setIsModalOpen(false)
  }

 const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  function openErrorModal() {
    setIsErrorModalOpen(true)
  }
  function closeErrorModal() {
    setIsErrorModalOpen(false)
  }

















  const schema = yup
  .object({
    clientname: yup.string().required(),
insurance: yup.string().required(),
    musanedContract:yup.number().required(),
visanumber:yup.number().required(),
idnumber:yup.number().required(),
mobilenumber:yup.string(),
passportnumber:yup.string(),
workername:yup.string(),
job:yup.string(),
age:yup.number().typeError("please note that age must be a number"),
experience:yup.string(),
contractstatus:yup.string().required().oneOf([
    "تم الوصول",
    " ربط ",
    "تفويض",
    " تفييز"
]),
city:yup.string(),
orderDate:yup.date().typeError("order date is required value"),
dayDate:yup.date().typeError("day date is required value"),
duration:yup.string(),
externaloffice:yup.string(),
nationality:yup.string(),
externalmusanedcontract:yup.number(),
visaordernumber:yup.string(),
notes:yup.string()


  })
  .required()


  const { register,formState: { errors }, handleSubmit } = useForm({
    resolver: yupResolver(schema),
  })

  const handleSignUp = async (e: React.SyntheticEvent) => {
    
    e.preventDefault();

  };
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
  const fetcher = await fetch('../api/addmaleworker',{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json",
      },body:JSON.stringify(data)})

      const e= await fetcher.text()
      console.log(fetcher.status)
if(fetcher.status == 200) return truefunc();
errorfunc()

}

const ref = useRef()
return (
<Layout >
      <div id="ss"   ><CTA/></div>
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
: 
<form  onSubmit={handleSubmit(onSubmit)} >
      <PageTitle>اضافة عمالة ذكور </PageTitle>
       <div dir='rtl' style={{display:"grid",gridTemplateColumns: "auto auto auto",gap:"19px"}} className="px-4 py-3 mb-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <Label>
          <span>اسم العميل</span>
          <Input aria-invalid={errors.clientname ? "true" : "false"} {...register("clientname", { required: true })} className="mt-1" placeholder="اسم العميل"  type='text' onChange={(e=>setOffice(e.target.value))}/>
          {errors.clientname?<span style={{color:"red"}}>{errors.clientname.message}</span>:null}  
        </Label>
        <Label>

          <span>التأمين</span>
          <Input   aria-invalid={errors.insurance ? "true" : "false"} {...register("insurance", { required: true })}    className="mt-1" placeholder="التأمين"  type='text' onChange={(e=>setOffice(e.target.value))}/>
          {errors.insurance?<span style={{color:"red"}}>{errors.insurance.message}</span>:null}  
        
        </Label>
        <Label>

          <span>عقد مساند</span>
          <Input className="mt-1" aria-invalid={errors.musanedContract ? "true" : "false"} {...register("musanedContract", { required: true })}  placeholder="عقد مساند" type='text'/>
          {errors.musanedContract?<span style={{color:"red"}}>{errors.musanedContract.message}</span>:null}  
      
        
        </Label>

        <Label className="mt-4">
          <span>رقم التأشيرة</span>
          <Input aria-invalid={errors.visanumber ? "true" : "false"} {...register("visanumber", { required: true })} className="mt-1" placeholder="رقم التأشيرة" />
          {errors.visanumber?<span style={{color:"red"}}>{errors.visanumber.message}</span>:null}  
        
        </Label>

        <Label className="mt-4">
          <span>رقم الهوية</span>
          <Input className="mt-1" placeholder="رقم الهوية" aria-invalid={errors.idnumber ? "true" : "false"} {...register("idnumber", { required: true })}/>
          {errors.idnumber?<span style={{color:"red"}}>{errors.idnumber.message}</span>:null}  
        
        </Label>
        <Label className="mt-4">
          <span>رقم الجوال</span>
          <Input className="mt-1" placeholder="رقم الجوال"  aria-invalid={errors.mobilenumber ? "true" : "false"} {...register("mobilenumber", { required: true })}/>
          {errors.mobilenumber?<span style={{color:"red"}}>{errors.mobilenumber.message}</span>:null}  
        
        </Label><Label className="mt-4">
          <span>رقم الجواز</span>
          <Input className="mt-1" placeholder="رقم الجواز" aria-invalid={errors.passportnumber ? "true" : "false"} {...register("passportnumber", { required: true })}/>
          {errors.passportnumber?<span style={{color:"red"}}>{errors.passportnumber.message}</span>:null}  
       
        </Label><Label className="mt-4">
          <span>اسم العامل</span>
          <Input className="mt-1" placeholder=" اسم العامل" aria-invalid={errors.workername ? "true" : "false"} {...register("workername", { required: true })}/>
          {errors.workername?<span style={{color:"red"}}>{errors.workername.message}</span>:null}  
       
        </Label>
<Label className="mt-4">
          <span>العمر</span>
          <Input className="mt-1"  aria-invalid={errors.age ? "true" : "false"}  {...register("age", { required: true })} placeholder="العمر" />
          {errors.age?<span style={{color:"red"}}>{errors.age.message}</span>:null}  
       
        </Label><Label className="mt-4">
          <span>الخبرة العملية</span>
          <Input className="mt-1" placeholder="الخبرة العملية" aria-invalid={errors.experience ? "true" : "false"} {...register("experience", { required: true })} />
          {errors.experience?<span style={{color:"red"}}>{errors.experience.message}</span>:null}  
       
        </Label>
        
        <Label className="mt-4">
       
          <span>حالة العقد</span>
          <Select aria-invalid={errors.contractstatus ? "true" : "false"} {...register("contractstatus", { required: true })} > 
<option disabled={false} selected={true}>اختر</option>

<option value="تم الوصول">تم الوصول</option>
<option value=" ربط ">ربط</option>
<option value="تفويض">تفويض</option>
<option value=" تفييز"> تفييز</option>
         
         
         
          </Select>
          {errors.contractstatus?<span style={{color:"red"}}>{errors.contractstatus.message}</span>:null}  
        
        </Label>

<Label className="mt-4">
          <span>المدينة</span>
          <Input className="mt-1" placeholder="المدينة" aria-invalid={errors.city ? "true" : "false"} {...register("city", { required: true })} />
          {errors.city?<span style={{color:"red"}}>{errors.city.message}</span>:null}  
       
        </Label>
        <Label className="mt-4">
          <span>تاريخ تقديم الطلب</span>
          <Input className="mt-1" placeholder="تاريخ تقديم الطلب"  type="date" aria-invalid={errors.orderDate ? "true" : "false"} {...register("orderDate", { required: true })}/>
          {errors.orderDate?<span style={{color:"red"}}>{errors.orderDate.message}</span>:null}  
        
        </Label>
 
<Label className="mt-4">
          <span>المكتب الخارجي</span>
          <Input className="mt-1"   aria-invalid={errors.externaloffice ? "true" : "false"} {...register("externaloffice", { required: true })} placeholder="المكتب الخارجي"  type="text" />
          {errors.externaloffice?<span style={{color:"red"}}>{errors.externaloffice.message}</span>:null}  
     
        </Label>  



<Label className="mt-4">
          <span>الجنسية</span>
          <Input className="mt-1" placeholder="الجسنية" aria-invalid={errors.nationality ? "true" : "false"} {...register("nationality", { required: true })}  type="text" />
          {errors.nationality?<span style={{color:"red"}}>{errors.nationality.message}</span>:null}  
        
        </Label>  

<Label className="mt-4">
          <span>عقد مساند الخارجي</span>
          <Input className="mt-1" aria-invalid={errors.externalmusanedcontract ? "true" : "false"} {...register("externalmusanedcontract", { required: true })} placeholder="عقد مساند الخارجي"  type="text" />
          {errors.externalmusanedcontract?<span style={{color:"red"}}>{errors.externalmusanedcontract.message}</span>:null}  
        
        </Label>  

<Label className="mt-4">
          <span>رقم طلب التأشيرة</span>
          <Input className="mt-1" aria-invalid={errors.visaordernumber ? "true" : "false"} {...register("visaordernumber", { required: true })} placeholder="رقم طلب التأشيرة"  type="text" />
          {errors.visaordernumber?<span style={{color:"red"}}>{errors.visaordernumber.message}</span>:null}  
      
        </Label>  
<Label className="mt-4">
          <span>ملاحظات</span>
        <Textarea  aria-invalid={errors.notes ? "true" : "false"} {...register("notes", { required: false })} cols={50} rows={5}/>
        </Label>  




      {/* </div> */}

        {/* </Label> */}
      </div>
      {/* <link > */}
  <Button type="submit"  onClick={()=>window.scrollTo(0,0)} style={{backgroundColor:"#Ecc383"}}> <h2>اضافة الى قائمة العمالة الذكور</h2>
</Button>
{/* </link> */}
</form> 
  }
      {/* <SectionTitle>Elements</SectionTitle> */}
 
    </Layout>
  )
}

export default Male;
