
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


function Cvs() {
 
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
  const [value, setValue] = React.useState<number[]>([20, 37]);

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
setIsModalOpen(true)

}

const [filterdatastatus,setStatus]=useState(true)
const post=async()=>{
  setData([])
  setStatus(true)
// console.log("religon",religion)
const fetcher = await fetch('../api/filterdataforclient',{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json",
      },body:JSON.stringify({religion:religion,time,ironing,cleaning,cooking,babysitting,sewing,nationality,maritalstatus,education,experience,oldCare,arabic,experiencetype,english,laundry})})
if(fetcher.status != 200) return errorModal()
      const waiter = await fetcher.json()
      if(waiter.length == 0) return errorModal()
      console.log(waiter)
      const filtering =waiter?.filter(e=>{ return( e.fields["age - العمر"] >value[0] && e.fields["age - العمر"]< value[1])})
// console.log(filtering)
// // if(fildering.data < 0) setTime()
//       {/* {/* e?.fields[ksd["age - العمر"] } */}
// setData(filtering)
setData(filtering)



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
const [age,setAge]=useState("(1[6-9]|2\d|20)");
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
  
try {
 const token =  Cookies.get("token")
 const decoder = jwtDecode(token)
 console.log(decoder.isUser)
 setUser(decoder)
} catch (error) {
  setUser({isUser:false})
} 
(async function getname(){

const fetcher = await fetch('../api/listfifty',{method:"get"})
const waiter = await fetcher.json()
setData(waiter)




}
)()
  
  },[])
// useEffect(()=>{
//   // console.log(dataTopages)
//   // console.log(encodeURIComponent(english))
// (async function get() {
//  const waiter = await  fetch("https://api.airtable.com/v0/app1mph1VMncBBJid/%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%20%D8%A7%D9%84%D8%B0%D8%A7%D8%AA%D9%8A%D8%A9?filterByFormula=%22And(REGEX_MATCH(%7BfldUXlZQMZR89xcot%7D+%2C+"+encodeURIComponent(experience)+")%2CREGEX_MATCH(%7Bfldtal17RtxfMGKFb%7D+%2C+"+encodeURIComponent(education)+")%2CREGEX_MATCH(%7BIroning+-+%D9%83%D9%88%D9%8A%7D+%2C"+encodeURIComponent(ironing)+")%2CREGEX_MATCH(%7BExperience+-+%D8%A7%D9%84%D8%AE%D8%A8%D8%B1%D8%A9%7D+%2C"+encodeURIComponent(experiecetype)+")%2CREGEX_MATCH(%7BfldJvA6tYkfWokgkC%7D+%2C"+encodeURIComponent(arabic)+")%2CREGEX_MATCH(%7BfldW0JTWrXNBJgll9%7D+%2C"+encodeURIComponent(english)+")%2CREGEX_MATCH(%7BOld+people+care+-+%D8%B1%D8%B9%D8%A7%D9%8A%D8%A9+%D9%83%D8%A8%D8%A7%D8%B1+%D8%A7%D9%84%D8%B3%D9%86%7D+%2C+"+encodeURIComponent(oldCare)+")%2CREGEX_MATCH(%7BBabysitting+-+%D8%A7%D9%84%D8%B9%D9%86%D8%A7%D9%8A%D8%A9+%D8%A8%D8%A7%D9%84%D8%A3%D8%B7%D9%81%D8%A7%D9%84%7D+%2C+"+encodeURIComponent(babysitting)+")%2CREGEX_MATCH(%7Bsewing+-+%D8%A7%D9%84%D8%AE%D9%8A%D8%A7%D8%B7%D8%A9%7D+%2C+"+encodeURIComponent(sewing)+")%2CREGEX_MATCH(%7Bcleaning+-+%D8%A7%D9%84%D8%AA%D9%86%D8%B8%D9%8A%D9%81%7D+%2C"+encodeURIComponent(cleaning)+"+)%2CREGEX_MATCH(%7Blaundry+-+%D8%A7%D9%84%D8%BA%D8%B3%D9%8A%D9%84%7D+%2C+"+encodeURIComponent(laundry)+")%2CREGEX_MATCH(%7BCooking+-+%D8%A7%D9%84%D8%B7%D8%A8%D8%AE%7D+%2C"+encodeURIComponent(cooking)+"+)%2CREGEX_MATCH(%7BfldEYaSy8nlV1btk6%7D+%2C"+encodeURIComponent(religion)+")%2CREGEX_MATCH(%7BfldVp4gvVPuUJnbyR%7D+%2C"+encodeURIComponent(maritalstatus)+"))%22&pageSize=100&offset="+offset+"&view=%D8%A7%D9%84%D8%A7%D8%B3%D8%A7%D8%B3%D9%8A",{method:"get",headers: {'Authorization':'Bearer patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d'}})
//  const dataextracted = await waiter.json()
//  {dataextracted.offset?setOffset(dataextracted.offset):setOffset("")}
//  setData(dataextracted.records)
  
// })()
// },[])
// LogoutOutlined
// console.log()
// document.addEventListener("change",()=>{

// })
// console.log()


// function Detect(){


//   return(<>
//   {filterdatastatus.length > 0?filterdatastatus:
  
//   }
  
//   </>)
// }
return (
  // {media?}
<div  style={{backgroundColor:"whitesmoke",objectFit:"cover",height:"100vh"}}>

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
<li  className='btn btn-ghost text-l' ><a href='rec.rawaes.com'>الرئيسية</a></li>
        
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
  fontStyle: 'normal'}}>الرئيسية</li>

    
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
{/*   
  <div style={{}}  >
  
  <div className="carousel-item object-contain h-20 w-96">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png"
      />
  </div>
  
  
  <div className="carousel-item object-contain h-20 w-96">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png"
      />
  </div>
  <div className="carousel-item object-contain h-20 w-96">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png"
      />
  </div>
  <div className="carousel-item object-contain h-20 w-96">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png"
      />
  </div>
  <div className="carousel-item object-contain h-20 w-96">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png"
      />
  </div>
  <div className="carousel-item object-contain h-20 w-96">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png"
      />
  </div>
  <div className="carousel-item object-contain h-20 w-96">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png"
      />
  </div>

</div> */}
  <div style={{display:'grid',gridTemplateColumns:media?"100%":"20% 80%"}}>
 
<div style={{marginTop:"60px",margin:"20px",borderRadius:"10px",gridRowStart:media?"1":null,gridRowEnd:media?"2":null,gridColumnStart:media?null:1,gridColumnEnd:media?null:1,overflow:"scroll"}}>

<Label >
          <span>الجنسية</span>
            <Select className="mt-1" onChange={e=>{
              
              setNationality(e.target.value);
              
// post();
}}>






<option placeholder='(.*)' value="(.*)">الكل</option>

<option value="Philippines - الفلبين">
  الفلبين</option>

<option value="Kenya - كينيا">
  كينيا</option>

<option value="Ethiopia - إثيوبيا">
  إثيوبيا</option>


<option value="Uganda - أوغندا">
 أوغندا</option>
<option value="Pakistan - باكستان">
 باكستان
 </option>




  </Select>

  


  
        </Label>

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
<option value="3-4 Years - سنوات">4 اعوام</option>
<option  value="1-2 Years - سنوات"> عامان</option>

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
        <p style={{display: "flex",justifyContent: "flex-end"}} className={Style['almarai-bold'] } > السير الذاتية</p>
{/* </div> */}
  {data.length>0?
  <div  className={Style.divbox} style={{marginTop:"10px", gridTemplateColumns: media?"repeat(1, auto)":"repeat(3, auto)"}}>{data?.map((e,i)=>
  <div style={{width:"100%",backgroundColor:"white"}}  key={i} className="card card-compact card-side w-100 bg-base-100 shadow-xl"  onClick={()=>console.log(e)}>
  <div className="pic"> 
    <div  style={{width:"80px",height:"70px"}}> 
    <div style={{right:"15px",cursor:"pointer",top:"10px",position:"absolute"}}
    
    >
    <WhatsappShareButton
  url={window.location.origin+"/client/cvdetails/"+e.id}


>

    <ShareAltOutlined  />

</WhatsappShareButton>
    </div>
      {e?.fields.Picture?<img     src={e?.fields.Picture[0].url}  />:""}
</div>
</div>

  <div className="card-body" >
    <div className="textcard">
      {/* {/* e?.fields[ksd["age - العمر"] } */}
      <h2 className="card-title">{e?.fields['م']}</h2>
    <p >{e.fields["Name - الاسم"]}</p>
      {/* <p  >{e?.fields['age - العمر']?e.fields['age - العمر']:""}</p> years */}
      <p  >{e?.fields["marital status - الحالة الاجتماعية"]}</p>
      {/* <p  >{e?.fields["External office - المكتب الخارجي (from External office - المكتب الخارجي)"][0]}</p> */}
      <p  >{e?.fields["Religion - الديانة"]}</p>

      
      
      
      </div>
    <div className="card-actions justify-end  pointer">
<div style={{display:"inline-flex",justifyContent:"space-around"}}>
<div  onClick={()=>router.push("../client/book/"+e.id)} style={{display:"inline-flex",cursor:"pointer"}}> 
  {/* <Link href={"../client/book/"+e.id} > */}

 <span style={{backgroundColor:"#003749",cursor:"pointer",borderRadius:"6px",padding:"4px",color:"whitesmoke"}}>حجز العاملة</span>
{/* </Link> */}
 
  {/* <PlusOutlined  /> */}


</div>
<div style={{display:"inline-flex",cursor:"pointer"}}> 
  {/* <Link href={"../client/cvdetails/"+e.id} > */}
 <span style={{backgroundColor:"#Ecc383",borderRadius:"6px",padding:"4px",color:"whitesmoke"}} onClick={()=>router.push("../client/cvdetails/"+e.id)}>السيرة الذاتية</span>

{/* </Link> */}
  {/* <FileOutlined /> */}

</div>

 
</div>
   
</div>
    
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


export default Cvs
