

//@ts-nocheck
//@ts-ignore
// But


import React, { useState, useEffect, useRef } from 'react'
import * as yup from "yup"
import Style from "styles/Home.module.css"



import { useRouter } from "next/router"
// import "../../"
import PageTitle from 'example/components/Typography/PageTitle'

import SectionTitle from 'example/components/Typography/SectionTitle'
import CTA from 'example/components/CTA'
import {
  Table,
  TableHeader,
  TableCell,
  TableBody,
  TableRow,
  TableFooter,
  TableContainer,
  Badge,

  Avatar,
  Button,
  Pagination,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
} from '@roketid/windmill-react-ui';
// yupResolver
import { EditIcon, TrashIcon } from 'icons'
import { useReactToPrint } from "react-to-print";
import response, { ITableData } from 'utils/demo/tableData'
import { ClipLoader, ClockLoader, GridLoader } from 'react-spinners'
import Header from 'example/components/Header'
import generatePDF, { Resolution, Margin, Options } from "react-to-pdf";
import { FileOutlined, PlusOutlined, PrinterFilled, ShareAltOutlined } from '@ant-design/icons'
import Cookies from 'js-cookie'
import { useForm } from 'react-hook-form'
// Rating
import { yupResolver } from '@hookform/resolvers/yup'
import Link from 'next/link'
import { jwtDecode } from 'jwt-decode'
import dayjs from 'dayjs'
import { Rating, useMediaQuery } from '@mui/material'
import { WhatsappShareButton } from 'next-share'
import Layout from 'example/containers/Layout'
const options: Options = {
  filename: "advanced-example.pdf",
  method: "save",
  // default is Resolution.MEDIUM = 3, which should be enough, higher values
  // increases the image quality but also the size of the PDF, so be careful
  // using values higher than 10 when having multiple pages generated, it
  // might cause the page to crash or hang.
  resolution: Resolution.EXTREME,
  page: {
    // margin is in MM, default is Margin.NONE = 0
    margin: Margin.SMALL,
    // default is 'A4'
    format: "letter",
    // default is 'portrait'
    orientation: "landscape"
  },
  canvas: {
    // default is 'image/jpeg' for better size performance
    mimeType: "image/jpeg",
    qualityRatio: 1
  },
  // Customize any value passed to the jsPDF instance and html2canvas
  // function. You probably will not need this and things can break,
  // so use with caution.
  overrides: {
    // see https://artskydj.github.io/jsPDF/docs/jsPDF.html for more options
    pdf: {
      compress: true
    },
    // see https://html2canvas.hertzen.com/configuration for more options
    canvas: {
      useCORS: true
    }
  }
};


// import { usePDF } from 'react-to-pdf'
// uses
// usePDF

export default function Page() {
  const router = useRouter()
  const media = useMediaQuery('(max-width:920px)',{noSsr:false})
  const mediaWrapping = useMediaQuery('(max-width:1920px)',{noSsr:false})
  const [errorEmail,setErrorEmail]=useState(false);
  const [data,setData]=useState({fields:{"Name - الاسم":null}});

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






  const [fetching,setFetching] = useState(false);  
const errorfunc=()=>{
setFetching(false)
openErrorModal()
}
const truefunc=()=>{
setFetching(false)
router.replace("/client/status")  
}

const erroremailfunc=()=>{
setFetching(false)
// openErrorModal()
setErrorEmail(true)
}
//@ts-ignore

//@ts-ignore
const onSubmitNewclient = async (sata) => {
  console.log(sata)
setFetching(true)
  const fetcher = await fetch('../../api/newclient',{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json",
      },body:JSON.stringify({...sata,id:data.id,cvnumber:data.fields.Name,workername:data.fields["Name - الاسم"]})})

      const e= await fetcher.text()
      console.log(e)
      // console.log(fetcher.status)
if(fetcher.status == 200) {
  Cookies.set("token",e)
    truefunc();}
else if (fetcher.status == 301 ) return erroremailfunc();
else{errorfunc()
  }
  }
  // // console.log(data)
  const [user,setUser] = useState({})
  const [list,setSourceList] = useState([]);

const Schema =yup.object({ id:yup.string(),cv:yup.number(),source:yup.string().notRequired(),email:yup.string().notRequired() , phonenumber:yup.string(),password:yup.string().notRequired(),fullname:yup.string().typeError("الرجاء كتابة الاسم ثلاثي")
})
  const{register,handleSubmit,formState:{errors}} = useForm({resolver:yupResolver(Schema)})

  useEffect(() => {
    // if(data.fields["Name - الاسم"] == null)return;
   


try {
 (async function fecher() {
  
  const sss =await fetch("https://api.airtable.com/v0/app1mph1VMncBBJid/%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%20%D8%A7%D9%84%D8%B0%D8%A7%D8%AA%D9%8A%D8%A9/"+router.query.slug,{method:"get",headers:{"Authorization":"Bearer patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d"}})
          const waiter = await sss.json()
          setData(waiter)


          
 const fetcher = await fetch(`../../api/sourcelist`);
 const f = fetcher.json()
     .then(json  => {
setSourceList(json)
  } 
  
)
})()
// name()
} catch (error) {
  console.log(error)
}
    
}, [router.isReady])
  async function name() {
     
  }

return (   
  <Layout>
<div style={{backgroundColor:"whitesmoke",display:media?"grid":"",justifyItems:media?"center":"",height:"100vh",width:"100%",objectFit:"cover"}}>


  <h3 className='card-title' style={{fontFamily:"Almarai" ,display:"flex",justifyContent:"center", marginTop:"9px"}}>حجز لعميل</h3>

  
<Modal  isOpen={isErrorModalOpen} onClose={closeErrorModal}>
        <ModalHeader color='pink' style={{color:"red"}}>Error</ModalHeader>
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
    {/* <div style={{display:"flex",justifyContent:"center"}}> */}
{fetching?
<div  style={{display:"flex",justifyContent:"center"}}><ClipLoader  cssOverride={{width:"390px",height:"390px",alignSelf:"center"}}/>  
</div>
:<div style={{ }}>
        <div >  
  
  
<div style={{display:"flex",flexDirection:media?"column":"row",columnGap:"10px",marginLeft:"10px",marginRight:"10px",justifySelf:"center",justifyContent:"center",flexWrap:"nowrap"}}>


  
  <form onSubmit={handleSubmit(onSubmitNewclient)} style={{display:media?"flex":"block",alignSelf:"center",marginLeft:"auto",marginRight:"auto",width:media?"100%":"60%",flexDirection:"column",justifyContent:"center"}}>

  <Label className="mt-4">
  

  
  <span>cv number</span>

          <Input className="mt-1" placeholder="Full Name" type='text' {...register("cv",{required:true})}/>
        </Label>

  <Label className="mt-4">
  

  
  <span>اسم العميل</span>

          <Input className="mt-1" placeholder="Full Name" type='text' {...register("fullname",{required:true})}/>
            {errors.fullname?<span>{errors.fullname.message}</span>:""}
        </Label>

  <Label className="mt-4">
  
  
  
  <span>البريد الالكتروني </span>
  
          <Input className="mt-1" placeholder="Email" type='text' {...register("email",{required:true})}/>
{errorEmail?<span style={{color:"red"}}>البريد الالكتروني مسجل في قاعدة البيانات لستجيل الدخول اضغط <Link href="/client/login" ><span style={{color:"black",cursor:"pointer"}}>هنا</span></Link></span>:""}
        </Label>
  
  <Label className="mt-4">
  
  
  
  <span>رقم الهاتف </span>
  
          <Input className="mt-1" placeholder="phonenumber" {...register("phonenumber",{required:true})}/>
        </Label>
  

 <Label className="mt-4">
  
  
  
  <span>الرقم السري لتسجيل الدخول ومتابعة حالة الطلب</span>
  
          <Input className="mt-1" placeholder="password" {...register("password",{required:true})}/>
{/* <span>رقم الجوال سيتم استخدامه كرقم سري لمتابعة الطلب</span> */}
          {/* <h1 className="mt-1"  >{data.fields["Name - الاسم"]}</h1> */}
        </Label>
  


<Label className="mt-4">
          <span>كيف تعرفت علينا</span>

<Select>
  {list.map(s=>
  
  <option >{s.fields["المصدر"]}</option>
)}

</Select>

        </Label>




        <div  style={{display:"flex",justifyContent:"center",marginTop:"3px"}}>
<Button color='#003749' style={{backgroundColor:"#003749"}} type='submit' >  حجز</Button>        </div>
        </form>     
        
        
        
        
         </div>
  
        </div>
  </div>}
  {/* </div> */}
          </div></Layout>

)}
