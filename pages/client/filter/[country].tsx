
// @ts-nocheck 
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Style from "styles/Home.module.css"

// import {
import { FileOutlined, LogoutOutlined, PlusOutlined, ShareAltOutlined, WhatsAppOutlined } from '@ant-design/icons'
import link from 'next/link'
import Link from 'next/dist/client/link'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { useRouter } from 'next/router'
import { Button, Label, Modal, ModalBody, ModalFooter, ModalHeader, Pagination, Select } from '@roketid/windmill-react-ui'
import { GridLoader } from 'react-spinners'
import { useMediaQuery } from '@mui/material'
import { WhatsappIcon, WhatsappShareButton } from 'next-share'
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import dayjs from 'dayjs'


function DashboardClient() {
 
  const [isModalOpen, setIsModalOpen] = useState(false)
  function openModal() {
    setIsModalOpen(true)
  }
  function closeModal() {
    setIsModalOpen(false)
  }

  // console.log(repos)
    const resultsPerPage = 10
  // const totalResults = response.length

  // pagination change control
  function onPageChange(p: number) {
    setPage(p)
  }
  
function valuetext(value: number) {
  return `${value}`;
}

//  const [initialdata,setinitidata]=useState(datasetiniti)
  const [value, setValue] = React.useState<number[]>([17, 90]);

  const handleChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number[]);
//     // console.log(value)
// const filtering =initialdata?.filter(e=>{ return( e.fields["age - العمر"] >value[0] && e.fields["age - العمر"]< value[1])})
// console.log(filtering)
// // if(fildering.data < 0) setTime()
//       {/* {/* e?.fields[ksd["age - العمر"] } */}
// setData(filtering)

  };
const errorModal=()=>{

setStatus(false);
openModal()

}
const [filtering,setFiltering]=useState(false)
const [filterdatastatus,setStatus]=useState(true)
const post=async()=>{
  setData([])
  setStatus(true)
// console.log("religon",religion)
const fetcher = await fetch('../../api/filter/'+router.query.country+"?religion="+religion+"&experience="+experience,{method:"get"})
if(fetcher.status != 200) return errorModal()
      const waiter = await fetcher.json()
    const filteringData =waiter?.filter(e=>{ return( e.fields["age - العمر"] >value[0] && e.fields["age - العمر"]< value[1])})
    if(filteringData.length == 0) return errorModal();
    setFiltering(true)
setData(filteringData)



}
  
 
  const [array,setArray]=useState([])
  const [times,setTimes]=useState(Date.now())

  // And(REGEX_MATCH({fldUXlZQMZR89xcot} , experience),REGEX_MATCH({fldtal17RtxfMGKFb} , education),REGEX_MATCH({Ironing - كوي} , ironing),REGEX_MATCH({Experience - الخبرة} , experiecetype),REGEX_MATCH({fldJvA6tYkfWokgkC} , arabic),REGEX_MATCH({fldW0JTWrXNBJgll9} , english),REGEX_MATCH({Old people care - رعاية كبار السن} , old),REGEX_MATCH({Experience - الخبرة} , 'Intermediate | مدربة بخبرة متوسطة'),REGEX_MATCH({Babysitting - العناية بالأطفال} , 'Expert - ممتاز'),REGEX_MATCH({sewing - الخياطة} , 'Expert - ممتاز'),REGEX_MATCH({cleaning - التنظيف} , 'Expert - ممتاز'),REGEX_MATCH({laundry - الغسيل} , 'Expert - ممتاز'),REGEX_MATCH({Cooking - الطبخ} ,'Expert - ممتاز' ),REGEX_MATCH({fldEYaSy8nlV1btk6} ,'Islam - الإسلام' ),REGEX_MATCH({fldVp4gvVPuUJnbyR} ,'Married - متزوجة' ))
const [data,setData] = useState([]);
const [religion,setReligon]=useState("(.*)")
const [nationality,setNationality]=useState("(.*)")
const [maritalstatus,setMaritalStatus]=useState("(.*)")
const [education,setEducation]=useState("(.*)")
const [experience,setExperience]=useState("(.*)")
const [oldCare,setOldCare]=useState("(.*)")
const [arabic,setArabic]=useState("(.*)")
const[experiencetype,setExperienceType]=useState("(.*)")
const [english,setEnglish]=useState("(.*)")
const [laundry,setLaundry]=useState("(.*)")
const [ironing,setIroning]=useState("(.*)")
const [cleaning,setCleaning]=useState("(.*)")
const [cooking,setCooking]=useState("(.*)")
const [babysitting,setBabySetting]=useState("(.*)")
const [sewing,setSewing]=useState("(.*)")
const [age,setAge]=useState("(.*)");
const [time,setTime]=useState()
const media = useMediaQuery('(max-width:820px)',{noSsr:false})
 const handleClick = () => {
    const elem = document.activeElement;
    if (elem) {
      elem?.blur();
    }
  };

const [offset,setOffset] = useState("")
  const [previousNationality,setPreviousNationality]=useState("");
const [previousreligion,setPreviousreligion]=useState("");
const [user,setUser]=useState({})
const router=useRouter()
const [dataTopages,setDatepages]=useState(0)
// const [fi]

const filter=(n)=>{
const filtering =data.filter(e=> n<e.fields["age - العمر"] )
      {/* {/* e?.fields[ksd["age - العمر"] } */}
setData(filtering)

}



useEffect(()=>{
  if(!router.isReady) return;
try {
 const token =  Cookies.get("token")
 const decoder = jwtDecode(token)
 console.log(decoder.isUser)
 setUser(decoder)
} catch (error) {
  setUser({isUser:false})
} 
// '../../api/filter/'+router.query.country+"&religion="+religion+"&experience="+experience,{method:"get"}
(async function getname(){
const fetcher = await fetch('../../api/filter/'+router.query.country+"?religion="+religion+"&experience="+experience,{method:"get"})
const waiter = await fetcher.json()


setData(waiter)

})()
  
  },[router.isReady])
return (
<div  style={{backgroundColor:"whitesmoke",minHeight:"100vh"}}>

{media?
<div className="navbar   bg-gray-50 dark:bg-gray-800 shadow-lg ">
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
    <li  className='btn btn-ghost text-l'  onClick={()=>router.push("/client")}>الرئيسية</li>   
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
    </li></ul>
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
 <div>

  <div style={{display:'grid',gridTemplateColumns:media?"100%":"20% 80%"}}>
<div style={{marginTop:"60px",margin:"20px",borderRadius:"10px",gridRowStart:media?"1":null,gridRowEnd:media?"2":null,gridColumnStart:media?null:1,gridColumnEnd:media?null:1,overflow:"hidden",}}>

<Label >
          <span>الديانة</span>
            <Select className="mt-1" onChange={e=>{
              
              setReligon(e.target.value);
              
// post();
}}>



<option placeholder='(.*)' value="(.*)">الكل</option>

<option value="Islam - الإسلام">الاسلام</option>
<option value="Christianity - المسيحية">المسيحية</option>
<option value="Non-Muslim - غير مسلم">غير مسلم</option>

  </Select>

  


  
        </Label>
       
       
<Label >
          <span>سنوات الخبرة</span>
            <Select className="mt-1" onChange={e=>{
              
              setExperience(e.target.value);
              
// post();
}}>



<option placeholder='(.*)' value="(.*)">الكل</option>
<option  value="5 and More - وأكثر">أكثر من 5 اعوام</option>
<option value="3-4 Years - سنوات">3 الى 5 اعوام</option>
<option  value="1-2 Years - سنوات"> عامان الى ثلاث اعوام</option>

  </Select>

  


  
        </Label>
       
       
        <Label>
          <span>العمر</span>
        
        <Box >
      <Slider
        getAriaLabel={() => 'Age Range'}
        value={value}
        style={{color:"#003749"}}
        // color="success"
        onChange={handleChange}
        valueLabelDisplay="auto"
        getAriaValueText={valuetext}
      />
    </Box>
</Label>
        {/* <input type="range" min={0} max="60"  onChange={e=>console.log(e.target.value)} className="range" /> */}


<div style={{display:"flex",justifyContent:"center",marginTop:"5px"}}><Button style={{alignItems:"center",cursor:"pointer",backgroundColor:"#Ecc383"}} onClick={()=>post()}>Search</Button></div>
</div>
  
 <div>
  

       <Modal  isOpen={isModalOpen} onClose={closeModal}>
        <ModalHeader>نأسف</ModalHeader>
        <ModalBody>
         لا يوجد بيانات متعلقة بهذا البحث
        </ModalBody>
        <ModalFooter>
          <Button className="w-full sm:w-auto" layout="outline" onClick={closeModal}>
            Close
          </Button>
         
        </ModalFooter>
      </Modal>
{/* <div> */}
        {!filtering?
        <p style={{display: "flex",justifyContent: "flex-start",marginRight:"16px"}}  dir="rtl"  className={Style['almarai-bold'] } >السير الذاتية الخاصة بـ{router.query.country}</p>:<p style={{display: "flex",justifyContent: "flex-end",margin:"6px"}} className={Style['almarai-bold'] } >نتائج البحث {data.length} سيرة ذاتية </p>}
{/* </div> */}
  {data.length>0?
  <div  className={Style.divbox} style={{display: media?"grid":"grid",marginTop:"10px", gridTemplateColumns: media?"repeat(1, 80%)":"repeat(3, auto)"}}>{data?.map((e,i)=>
  <div style={{width:media?"100%":"90%",display:"flex",gridTemplateColumns:"repeat(2, auto)",justifyContent:"space-around",backgroundColor:"white"}}  key={i} className="card card-compact card-side w-100 bg-base-100 shadow-xl"  onClick={()=>console.log(e)}>
  <div style={{left:"15px",cursor:"pointer",top:"10px",position:"absolute"}}
    
    >
    <WhatsappShareButton
  url={window.location.origin+"/client/cvdetails/"+e.id}


>

    <ShareAltOutlined  />

</WhatsappShareButton>



    </div>

  <div className="pic" style={{marginTop:"9px"}}> 
    {/* <div  style={{width:"80px",height:"70px"}}>  */}
    {/* <div style={{right:"15px",cursor:"pointer",top:"10px",position:"absolute"}}
        >
    <WhatsappShareButton
  url={window.location.origin+"/client/cvdetails/"+e.id}


>

    <ShareAltOutlined  />

</WhatsappShareButton>



    </div> */}
      {e?.fields.Picture?

      <div >
      <img  style={{maxHeight:"200px"}}   src={e?.fields.Picture[0].url}  />
      </div>
      :""}


{/* </div> */}

</div>

  <div className="card-body" >
    <div className="textcard" dir='rtl' style={{margin:"13px"}}>
      {/* {/* e?.fields[ksd["age - العمر"] } */}
      <h2 className="card-title">{e?.fields['م']}</h2>
    {/* <p >{e.fields["Name - الاسم"]}</p> */}
      <li  >{e.fields['Nationality copy']}</li> 

      < li >{Math.ceil(dayjs(new Date()).diff(e.fields['date of birth - تاريخ الميلاد'])/31556952000)} </li> 
      <li >{e?.fields["marital status - الحالة الاجتماعية"]}</li>
      {/* <p  >{e?.fields["External office - المكتب الخارجي (from External office - المكتب الخارجي)"][0]}</p> */}
      <li >{e?.fields["Religion - الديانة"]}</li>

      
      
      
      </div>
    {/* <div className="card-actions justify-end  pointer"> */}
<div style={{display:"flex",justifyContent:"flex-end"}}>
<div  onClick={()=>router.push("../client/book/"+e.id)} style={{display:"inline-flex",cursor:"pointer"}}> 
  {/* <Link href={"../client/book/"+e.id} > */}

 <span style={{backgroundColor:"#003749",cursor:"pointer",borderRadius:"6px",padding:"4px",color:"whitesmoke"}}>احجز الآن



  
 </span>
{/* </Link> */}
 
  {/* <PlusOutlined  /> */}


</div>
<div style={{display:"inline-flex",cursor:"pointer"}}> 
  {/* <Link href={"../client/cvdetails/"+e.id} > */}
 <span style={{backgroundColor:"#Ecc383",borderRadius:"6px",padding:"4px",color:"whitesmoke"}} onClick={()=>router.push("../client/cvdetails/"+e.id)}>التفاصيل</span>

{/* </Link> */}
  {/* <FileOutlined /> */}

</div>

 
</div>
   
{/* </div> */}
    
  </div>    
</div>


)}

  
  </div>: <div style={{display:"flex",justifyContent:"center"}}>
    <GridLoader  loading={filterdatastatus?true:false} style={{width:"800px",height:"600px"}}/>
    </div>
  }
  
  </div></div>
 </div>
  
  
<div>
 



  {/* <footer style={{bottom:1}}>asdasdasda</footer> */}
  </div>
  </div>
  )
}
// 
  // Fetch data from external API
  // const res = await fetch('https://api.github.com/repos/vercel/next.js')
  // Pass data to the page via props
  // const repo: Repo = await res.json()


export default DashboardClient
