//@ts-nocheck

import React, { useEffect, useState } from 'react'
import { Input, HelperText, Label, Select, Textarea, Button, Modal, ModalHeader, ModalBody, ModalFooter } from '@roketid/windmill-react-ui'
import CTA from 'example/components/CTA'
import PageTitle from 'example/components/Typography/PageTitle'
import SectionTitle from 'example/components/Typography/SectionTitle'
import Layout from 'example/containers/Layout'
import { MailIcon } from 'icons'
import axios from 'axios'
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { ClipLoader } from 'react-spinners'
// import "../api"
import { DeleteOutlined } from '@ant-design/icons'
function Addadmin() {

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [admin, setadmin] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [pictureurl, setpictureurl] = useState<string>('');
  const [username, setusername] = useState<string>('');
const [idnumber, setidnumber] = useState(0);
const [role, setrole] = useState<string>('');
const [ offices,setoffices]=useState([]);
const [cloudinaryImage, setCloudinaryImage] = useState("")
const router = useRouter()
useEffect(()=>{
try {

    const token = Cookies.get("token")
  const decoder = jwtDecode(token);
      if(!decoder.admin)return router.replace("/client");
  
// console.log(decoder.idnumber)
  } catch (error) {
    router.replace("/client")
  }
(      async function names( )  {
    const fetcher =  await fetch("../api/countries");
    const f = await fetcher.json()

  .then(json  => {
 console.log(json)
//  if ()

  json?setoffices(json):"";

  } 

)
})()

  

},[])
// DeleteOutlined
 const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
   function openErrorModal() {
    setIsErrorModalOpen(true)
  }
  function closeErrorModal() {
    setIsErrorModalOpen(false)
  }
  function openModal() {
    setIsModalOpen(true)
  }
  function closeModal() {
    setIsModalOpen(false)
  }


  const [fetching,setFetching] = useState(false);  
const errorfunc=()=>{
setFetching(false)
openErrorModal()
}
const truefunc=()=>{
setValue("phonenumber","")
setFetching(false)
  openModal();
  
}
//@ts-ignore
const [officename,setOfficeName]=useState("")
const [location,setLocation]= useState('')
const [phone,setPhone]=useState("")
const handleSignUp = async () => {
  
setFetching(true)
  const fetcher = await fetch('../api/addoffice',{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json",
      },body:JSON.stringify({officename:officename,country:location})})

      const e= await fetcher.text()
      console.log(fetcher.status)
if(fetcher.status == 200) return truefunc();
errorfunc()

}

const Schema =yup.object({name:yup.string(),country:yup.string()})
  
const{register,handleSubmit,formState:{errors},setValue} = useForm({resolver:yupResolver(Schema)})
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
          تم تسجيل البيانات بنجاح
        </ModalBody>
        <ModalFooter>
          <Button className="w-full sm:w-auto" layout="outline" onClick={closeModal}>
            Close
          </Button>
         
        </ModalFooter>
      </Modal>


      <PageTitle>اضافة مكتب </PageTitle>
      
{fetching?<div  style={{display:"flex",justifyContent:"center"}}><ClipLoader  cssOverride={{width:"390px",height:"390px",alignSelf:"center"}}/>  </div>:
 <form onSubmit={()=>handleSignUp()}>
      <div className="px-4 py-3 mb-8 bg-white rounded-lg shadow-md dark:bg-gray-800">

        <Label>
          <span>اسم المكتب</span>
          
<Input  className="mt-1"   onChange={(e)=>setOfficeName(e.target.valye)} placeholder="اسم المكتب"  type='text' />
       {/* {errors.officename ?<span style={{color:"red"}}>{errors.officename.message}</span>:null } */}
       
        </Label>
        <Label>

          <span>الموقع</span>
<Select onChange={(e)=>setLocation(e.target.value)}>

{offices.map(e=>
<option value={e.id}>
{e?.fields["الدولة"]}
</option>)}

</Select>

          {/* <Input className="mt-1" placeholder="الموقع" {...register("country",{required:false})}  type='text' />
        {errors.location?<span style={{color :"red"}}>{errors.location.message}</span>:null} */}
        </Label>
        <Label>

          <span>رقم الهاتف</span>
          <Input className="mt-1" onChange={e=>setPhone(e.target.value)} placeholder="جوال المكتب" type='text' />
        {/* {errors.location?<span style={{color:"red"}}>{errors.location.message}</span>:null} */}
        </Label>

<Button type='submit' style={{backgroundColor:"#003749"}}>ِاضافة مكتب</Button>

      </div>
</form>}
    </Layout>
  )
}

export default Addadmin

