

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
import Layout from 'client/containers/Layout'
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
const onSubmit = async (sata) => {
  // console.log(sata)
  // return
setFetching(true)
  const fetcher = await fetch('../../api/orderforexistingclient',{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json",
      },body:JSON.stringify({fullname:user.fullname,phonenumber:user.phonenumber,id:data.id,cvnumber:data.fields.Name,workername:data.fields["Name - الاسم"]})})


      const e= await fetcher.text()
      
      // console.log(fetcher.status)
if(fetcher.status == 200) {
  // Cookies.set("token",e)
    truefunc();}
else if (fetcher.status == 301 ) return erroremailfunc();
else{errorfunc()
  }
  }

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

const Schema =yup.object({ id:yup.string(),source:yup.string().notRequired(), phonenumber:yup.string(),password:yup.string().notRequired(),fullname:yup.string().typeError("الرجاء كتابة الاسم ثلاثي")
})
  const{register,handleSubmit,formState:{errors}} = useForm({resolver:yupResolver(Schema)})

  console.log(data.fields["laundry - الغسيل"] )
  useEffect(() => {
    // if(data.fields["Name - الاسم"] == null)return;
    if(!router.isReady )return;
try {
 const token =  Cookies.get("token")
 const decoder = jwtDecode(token)
 console.log(decoder.isUser)
 setUser(decoder)
} catch (error) {
  setUser({isUser:false})
} 



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

const rates =["inner - مبتدأ",
"Beginner - مبتدأ",
"Intermediate - جيد",
"Advanced - جيد جداً",
"Expert - ممتاز"]
return (   
<div style={{backgroundColor:"whitesmoke",display:media?"grid":"",justifyItems:media?"center":"",height:"100vh",width:"100%",objectFit:"cover"}}>


{media?
<div className="navbar   bg-gray-50 dark:bg-gray-800 shadow-lg">
  <div className="navbar-start">
    <div   className="dropdown" >
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </div>
{user.isUser?       
      <ul style={{backgroundColor:"whitesmoke"}} tabIndex={0}        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
<li  className='btn btn-ghost text-l' onClick={()=>router.push("/client")} >الرئيسية</li>
        
    <li className='btn btn-ghost text-l'>
<Link href="/client/status">
      طلباتي
      </Link>
    </li>
        <li  className='btn btn-ghost text-l'><a>نبذة عننا</a></li>
      
<li className='btn btn-ghost text-l' style={{backgroundColor:"#003749" ,color:"whitesmoke"}} onClick={()=>{

        Cookies.remove("token")
router.reload()
      }}>
      تسجيل الخروج
    </li>
</ul>
      :
<ul style={{backgroundColor:"whitesmoke"}} tabIndex={0}        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">

<li className={'btn btn-ghost text-l' + Style['almarai-bold']} onClick={()=>router.push("/client")} >الرئيسية</li>
        
        <li className='btn btn-ghost text-l' ><a>نبذة عنا</a></li>


          <Link  href="/client/login">
        <li className='btn btn-ghost text-l' style={{color :"whitesmoke",backgroundColor:"#003749"}}>
           تسجيل الدخول
          </li>
          </Link  >




      </ul>
      
      
      }
    </div>
  </div>
  <div className="navbar-center" >
    <a  className="btn btn-ghost text-xl">
  <img  style={{width:"70px", height:"50px",justifySelf:"center"}} src='https://res.cloudinary.com/duo8svqci/image/upload/v1716302380/dkqowbgajxgcy8auxskm.svg'/>
      
      {/* daisyUI */}
      
      
      </a>
  </div>
  <div className='navbar-end'></div>
</div>
:
<nav dir='ltr' style={{position:"sticky",zIndex:+1 ,height:"70px"}} className={"flex  justify-between px-6 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 shadow-lg"}>
  
  {/* <div className="" style={{}}>  */}
  <img style={{width:"50px", height:"70px",alignSelf:"center",justifySelf:"center",marginRight:"50px",width:"60px"}} src='https://res.cloudinary.com/duo8svqci/image/upload/v1716302380/dkqowbgajxgcy8auxskm.svg'/>
 
  <a className="text-gray-700 dark:text-gray-400" href="#">
  </a>
  {user.isUser == true?<ul className="flex space-x-4">
 
 <li className='btn btn-ghost text-l' style={{backgroundColor:"#003749" ,color:"whitesmoke"}} onClick={()=>{

        Cookies.remove("token")
router.reload()
      }}>
      تسجيل الخروج
    </li>

 {/* <li className='btn  text-l'>Home</li> */}
 <li className='btn btn-ghost text-l'>نبذة عننا</li>
      <Link href="/client/status">
    <li className='btn btn-ghost text-l'>
      طلباتي
    </li>
      
      </Link>

 <li className='btn btn-ghost text-l' style={{fontFamily: "Almarai",
  fontWeight: 800,
  fontStyle: 'normal'}} onClick={()=>router.push("/client")}>الرئيسية</li>

    
  </ul>:
  
  <ul className={"flex justify-between flex items-center space-x-4" }>
    <li onClick={()=>router.push("/client/login")}  className='btn  text-md'>
تسجيل الدخول
      {/* <Button style={{backgroundColor:"#164654"}} onClick={()=>router.push("/client/login")}>Login</Button> */}

    </li>
 <li  className='btn btn-ghost text-l hover:shadow-[rgba(0,0,0,0.5)_0px_0px_10px_0px]' style={{ fontFamily: "Almarai",
  fontWeight: 800,
  fontStyle: 'normal'}}>نبذة عنا</li>
 <li  className='btn btn-ghost text-l hover:shadow-[rgba(0,0,0,0.5)_0px_0px_10px_0px]' style={{ fontFamily: "Almarai",
  fontWeight: 800,
  fontStyle: 'normal'}}>السير الذاتية</li>

 <li onClick={()=>router.push("/client")} className={'btn btn-ghost text-l hover:shadow-[rgba(0,0,0,0.5)_0px_0px_10px_0px]' } style={{ fontFamily: "Almarai",
  fontWeight: 800,
  fontStyle: 'normal'}}> 
  الرئيسية</li>
    
  </ul>
}
  <div className='navbar-end'></div>

</nav>
  
}
  <h3 className='card-title' style={{fontFamily:"Almarai" ,display:"flex",justifyContent:"center", marginTop:"9px"}}>حجز عاملة منزلية</h3>

  
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
:<div style={{ }}>{user.isUser  ?  

<div style={{display:"flex",flexDirection:media?"column":"row",columnGap:"10px",marginLeft:"10px",marginRight:"10px",justifySelf:"center",justifyContent:"center",flexWrap:"nowrap"}}>
    <div style={{display:media?"flex":"block",marginTop:"12px",marginLeft:"auto",justifyContent:"center",marginRight:"auto",width:media?"100%":"60%",backgroundColor:"white"}}   className="card card-compact card-side w-100 bg-base-100 shadow-xl"  >
 
  <div className="card-body" >
   <div className="pic" style={{right:"3px",position:"absolute"}}> 
    <div  style={{width:"80px",height:"70px"}}> 
    <div style={{right:"15px",cursor:"pointer",top:"10px",position:"absolute"}}
    
    >
    
    </div>
    <div>  {data.fields.Picture?<img     src={data.fields.Picture[0].url}  />:""}</div>
</div>

</div>
     <h2 className="card-title" style={{marginTop:"12px"}}>{data.fields["م"]}</h2>

    <h2 className="card-title">{data.fields["Name - الاسم"]}</h2>
    <div className="textcard">
      {/* data.fields[ksd["age - العمر"] }
      {/* <p  >{data.fields['age - العمر']?data.fields['age - العمر']:""}</p> */}
     {data.fields["marital status - الحالة الاجتماعية"]? <h1 className={Style['almarai-bold']}>الحالة الاجتماعية</h1>:null}
      
      <h1 >{data.fields["marital status - الحالة الاجتماعية"]}</h1>
      {/* <p  >{data.fields["External office - المكتب الخارجي"]}</p> */}
{data.fields["Education - التعليم"]?      <h1 className={Style['almarai-bold']} >التعليم</h1>:null}

      <h1 >{data.fields["Education - التعليم"]}</h1>
 {data.fields["Nationality copy"]? <h1 className={Style['almarai-bold']} >الجنسية</h1>:null}

  <h1 >{data.fields["Nationality copy"]}</h1>
     {data.fields["Salary - الراتب"]? <h1 className={Style['almarai-bold']} >الراتب</h1> :null}
      
      <h1 >{data.fields["Salary - الراتب"]} sar</h1> 
     {data.fields["Religion - الديانة"]? <h1 className={Style['almarai-bold']}  >الديانة</h1>:null}
     
      <h1 >{data.fields["Religion - الديانة"]}</h1>
    {data.fields['date of birth - تاريخ الميلاد']?  <h1 className={Style['almarai-bold']}  >العمر</h1>:null}
      
<h1 >{Math.ceil(dayjs(new Date()).diff(data.fields['date of birth - تاريخ الميلاد'])/31556952000)}</h1>



      {/* <Rating  name="half-rating" defaultValue={4}  /> */}
      <strong className='card-title'>skills</strong>
      {/* <div className="rating rating-sm"> */}
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-around",alignContent:"space-around",justifyItems:"center",flexDirection:"row",width:"50%"}}>
      <div>
      <h4>الغسيل</h4>  {rates.map((e,i)=>
data.fields["laundry - الغسيل"] == e?<Rating disabled style={{opacity:"100%"}}  name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}</div>
        <div>
  <h4>الكوي</h4>  {rates.map((e,i)=>
data.fields["Ironing - كوي"] == e?<Rating  disabled style={{opacity:"100%"}}  name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}</div>
        <div>
 <h4>التنظيف</h4>  {rates.map((e,i)=>
data.fields["cleaning - التنظيف"] == e?<Rating  disabled style={{opacity:"100%"}}  name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}
</div>
<div>
         <h4>الطبخ</h4>  {rates.map((e,i)=>
data.fields["Cooking - الطبخ"] == e?<Rating  disabled style={{opacity:"100%"}}  name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}
     </div>


<div>
         <h4>الخياطة</h4>  {rates.map((e,i)=>
data.fields["sewing - الخياطة"] == e?<Rating disabled style={{opacity:"100%"}}  name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}



     </div>


        </div>
{/* </div> */}

      <strong className='card-title'>Languages</strong>
<div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-around",alignContent:"space-around",justifyItems:"center",flexDirection:"row",width:"50%"}}><div >  <h4>اللغة العربية</h4>
  {rates.map((e,i)=>
data.fields["Arabic -  العربية"] == e?<Rating  disabled style={{opacity:"100%"}}  aria-label={e} name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        
        )}
        </div><div>
<h4>اللغة الانجليزية</h4>
  
  {rates.map((e,i)=>
data.fields["English - الانجليزية"] == e?<Rating disabled style={{opacity:"100%"}}  aria-label={e} name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}
</div>
<div> </div>


</div>

      </div>
 
    
  </div>    
<form onSubmit={onSubmit} style={{display:media?"flex":"block",marginLeft:"auto",marginRight:"auto",width:media?"100%":"60%",flexDirection:"column",justifyContent:"center",justifyItems:"center"}}>



        <div  style={{display:"flex",justifyContent:"center",marginTop:"3px"}}>
<Button color='#003749' style={{backgroundColor:"#003749"}} type='submit' >  تأكيد الحجز</Button>   
     </div>
        </form>
</div>

 </div>:
        <div >  
  
  
<div style={{display:"flex",flexDirection:media?"column":"row",columnGap:"10px",marginLeft:"10px",marginRight:"10px",justifySelf:"center",justifyContent:"center",flexWrap:"nowrap"}}>
    <div style={{display:media?"flex":"block",marginTop:"12px",marginLeft:"auto",justifyContent:"center",marginRight:"auto",width:media?"100%":"60%",backgroundColor:"white"}}   className="card card-compact card-side w-100 bg-base-100 shadow-xl"  >
 
  <div className="card-body" >
     <div className="pic" style={{right:"3px",position:"absolute"}}> 
    <div  style={{width:"80px",height:"70px"}}> 
    <div style={{right:"15px",cursor:"pointer",top:"10px",position:"absolute"}}
    
    >
    
    </div>
    <div>  {data.fields.Picture?<img     src={data.fields.Picture[0].url}  />:""}</div>
</div>

</div>


   <h2 className="card-title" style={{marginTop:"12px"}}>{data.fields["م"]}</h2>

    {/* <h2 className="card-title">{data.fields["Name - الاسم"]}</h2> */}
    <div className="textcard">
      {/* data.fields[ksd["age - العمر"] }
      {/* <p  >{data.fields['age - العمر']?data.fields['age - العمر']:""}</p> */}
     {data.fields["marital status - الحالة الاجتماعية"]? <h1 className={Style['almarai-bold']}>الحالة الاجتماعية</h1>:null}
      
      <h1 >{data.fields["marital status - الحالة الاجتماعية"]}</h1>
      {/* <p  >{data.fields["External office - المكتب الخارجي"]}</p> */}
{data.fields["Education - التعليم"]?      <h1 className={Style['almarai-bold']} >التعليم</h1>:null}

      <h1 >{data.fields["Education - التعليم"]}</h1>
 {data.fields["Nationality copy"]? <h1 className={Style['almarai-bold']} >الجنسية</h1>:null}

  <h1 >{data.fields["Nationality copy"]}</h1>
     {data.fields["Salary - الراتب"]? <h1 className={Style['almarai-bold']} >الراتب</h1> :null}
      
      <h1 >{data.fields["Salary - الراتب"]} sar</h1> 
     {data.fields["Religion - الديانة"]? <h1 className={Style['almarai-bold']}  >الديانة</h1>:null}
     
      <h1 >{data.fields["Religion - الديانة"]}</h1>
    {data.fields['date of birth - تاريخ الميلاد']?  <h1 className={Style['almarai-bold']}  >العمر</h1>:null}
      
<h1 >{Math.ceil(dayjs(new Date()).diff(data.fields['date of birth - تاريخ الميلاد'])/31556952000)}</h1>
      <strong className='card-title'>المهارات</strong>
      {/* <div className="rating rating-sm"> */}
      <div style={{display:"flex",flexWrap:mediaWrapping?"wrap":"nowrap",justifyContent:"space-around",alignContent:"space-around",justifyItems:"center",flexDirection:"row",width:"50%"}}>
      <div>
      <h4>الغسيل</h4>  {rates.map((e,i)=>
data.fields["laundry - الغسيل"] == e?<Rating disabled style={{opacity:"100%"}} name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}</div>
        <div>
  <h4>الكوي</h4>  {rates.map((e,i)=>
data.fields["Ironing - كوي"] == e?<Rating  disabled style={{opacity:"100%"}} name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}</div>
        <div>
 <h4>التنظيف</h4>  {rates.map((e,i)=>
data.fields["cleaning - التنظيف"] == e?<Rating disabled style={{opacity:"100%"}}  name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}
</div>
<div>
         <h4>الطبخ</h4>  {rates.map((e,i)=>
data.fields["Cooking - الطبخ"] == e?<Rating disabled style={{opacity:"100%"}} name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}
     </div>


<div>
         <h4>الخياطة</h4>  {rates.map((e,i)=>
data.fields["sewing - الخياطة"] == e?<Rating  disabled style={{opacity:"100%"}} name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}



     </div>


        </div>
{/* </div> */}

      <strong className='card-title'>اللغات</strong>
<div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-around",alignContent:"space-around",justifyItems:"center",flexDirection:"row",width:"50%"}}><div >  <h4>اللغة العربية</h4>
  {rates.map((e,i)=>
data.fields["Arabic -  العربية"] == e?<Rating  disabled style={{opacity:"100%"}} aria-label={e} name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        
        )}
        </div><div>
<h4>اللغة الانجليزية</h4>
  {rates.map((e,i)=>
data.fields["English - الانجليزية"] == e?<Rating disabled style={{opacity:"100%"}} aria-label={e} name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}
</div>

</div>


      </div>
 
    
  </div>    
</div>


  
  <form onSubmit={handleSubmit(onSubmitNewclient)} style={{display:media?"flex":"block",alignSelf:"center",marginLeft:"auto",marginRight:"auto",width:media?"100%":"60%",flexDirection:"column",justifyContent:"center"}}>
  <Label className="mt-4">
  

  
  <span>اسم العميل</span>

          <Input className="mt-1" placeholder="Full Name" type='text' {...register("fullname",{required:true})}/>
            {errors.fullname?<span>{errors.fullname.message}</span>:""}
          {/* <h1 className="mt-1"  >{data.fields["Name - الاسم"]}</h1> */}
        </Label>
  <Label className="mt-4">
  
  
  
  <span>رقم الهاتف </span>
  
          <Input className="mt-1" placeholder="phonenumber" {...register("phonenumber",{required:true})}/>
{/* <span>رقم الجوال سيتم استخدامه كرقم سري لمتابعة الطلب</span> */}
          {/* <h1 className="mt-1"  >{data.fields["Name - الاسم"]}</h1> */}
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
  
        </div>}
  </div>}
  {/* </div> */}
          </div>

)}
