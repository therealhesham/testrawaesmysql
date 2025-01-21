// @ts-nocheck 
import React, { useState, useEffect, useContext } from 'react'
import { Doughnut, Line, Pie } from 'react-chartjs-2'
import CTA from 'example/components/CTA'
import InfoCard from 'example/components/Cards/InfoCard'
import ChartCard from 'example/components/Chart/ChartCard'
import ChartLegend from 'example/components/Chart/ChartLegend'
import Style from "styles/Home.module.css"
// import "../api"
import { VerticalTimeline, VerticalTimelineElement }  from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import PageTitle from 'example/components/Typography/PageTitle'
import RoundIcon from 'example/components/RoundIcon'
import Layout from 'client/containers/Layout'
import response, { ITableData } from 'utils/demo/tableData'
import { ChatIcon, CartIcon, MoneyIcon, PeopleIcon } from 'icons'
import {
  TableBody,
  TableContainer,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  TableFooter,
  Avatar,
  Badge,
  Pagination,
  Button,
} from '@roketid/windmill-react-ui'

import {
  lineOptions,
  doughnutLegends,
  lineLegends,
} from 'utils/demo/chartsData'
// useMediaQuery
import {
  Chart,
  ArcElement,
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import Link from 'next/link'
import { User } from 'utils/usercontext'
import { useRouter } from 'next/router'
import { jwtDecode } from 'jwt-decode'
import Cookies from 'js-cookie'
import { useMediaQuery } from '@mui/material'
import dayjs from 'dayjs'
import { CircleLoader, GridLoader } from 'react-spinners'
function Status() {
  Chart.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  )
const media = useMediaQuery('(max-width:820px)',{noSsr:false})

  const [officelist,setofficelist]=useState([])
  function datas() {
    
  }
  
  const doughnutOptions={
  data: {
    datasets: [
      {
        data: [67, 33],
        /**
         * These colors come from Tailwind CSS palette
         * https://tailwindcss.com/docs/customizing-colors/#default-color-palette
         */
        backgroundColor: ['#0694a2', '#1c64f2',"#3cb44b"],
        label: 'Dataset 1',
      },
      ],
    labels: officelist.length>0?[...officelist]:0,
  },
  options: {
    responsive: true,
    cutoutPercentage: 80,
    },
  legend: {
    display: false,
  },
}
// console.log(officelist)
  const [page, setPage] = useState(1)
  const [length,setLength]=useState(0)
  const [data, setData] = useState([])
  const [time,setTime]=useState(0)
  const [office,setOffice]=useState([])
  // pagination setup
  const [fulldata,setFulldata]=useState([])
  const resultsPerPage = 10
  const totalResults = fulldata.length
  // const user =useContext(User)
// setTimeout(() =
// pagination change control
  const [paginatedData,setPaginatedData]=useState([])
  // console.log(time)
  const [listType,setTypeList] = useState("workers")
const router = useRouter()

function onPageChange(p: number) {
  // json?setData(json?.slice((page - 1) * resultsPerPage, page * resultsPerPage)):console.log("e");
setPaginatedData(fulldata.slice((p - 1) * resultsPerPage, p * resultsPerPage))
    // setPage(p)
    }

    // console.log(paginatedData)
const [user,setUser]=useState({})

  // on page change, load new sliced data
  // here you would make another server request for new data
  useEffect(() => {
        
//@ts-ignore
//@ts-nocheck
try {
 const token =  Cookies.get("token")
 const decoder = jwtDecode(token)
 console.log(decoder.isUser)
 setUser(decoder)
} catch (error) {
  setUser({isUser:false})
} 
    try {

      // alert(router.pathname == "")
      async function names( )  {
        await fetch("../../api/orderlistforclient").then(response => response.json())
        .then(json  => {
    json?setLength(json.length):"";
    setFulldata(json)
    json?setPaginatedData(json?.slice((0) * resultsPerPage, page * resultsPerPage)):console.log("e");
// console.log(json[0])
  } 

)
}
names()

} catch (error) {
  console.log(error);
}  

}, [])
return (
  
    <div style={{backgroundColor:"whitesmoke",marginBottom:"5px"}}>
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
<li  className='btn btn-ghost text-l' onClick={()=>router.push("/client")}>الرئيسية</li>
        
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
    <li className='btn btn-ghost text-l' >
      طلباتي
    </li>
      
      </Link>

 <li className='btn btn-ghost text-l' style={{
  fontWeight: 800,
  fontStyle: 'normal'}} onClick={()=>router.push("/client")}  >الرئيسية</li>

    
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
























{fulldata.length >0 ?
<div >
  {/* <h3  style={{fontFamily:"Almarai" , marginTop:"9px",justifySelf:"center"}}>حجز عاملة منزلية</h3> */}
<h1 style={{fontSize:"23px",justifyContent:"center",marginRight:"12px",display:"flex"}}> قائمة حجوزاتي</h1>
{/* <div style={{display:media?"flex":"block",marginTop:"12px",marginLeft:"auto",justifyContent:"center",marginRight:"auto",width:media?"100%":"60%",backgroundColor:"white"}}   className="card card-compact card-side w-100 bg-base-100 shadow-xl" > */}

{fulldata.map(e=>
    <div style={{isplay:media?"flex":"block",marginTop:"12px",marginLeft:"auto",justifyContent:"center",marginRight:"auto",width:media?"100%":"60%",backgroundColor:"white"}}   className="card card-compact card-side w-100 bg-base-100 shadow-xl"  >

  <div className="card-body" style={{ borderRadius:"10px"}} >
    <div style={{right:"15px",top:"10px",position:"absolute",padding:"10px",borderRadius:"3px"}}>

<h1 style={{cursor:"pointer",textDecoration:"underline" }} onClick={()=>router.push("/client/cv/"+e.id)}  className={Style['almarai-bold']}> تفاصيل السيرة الذاتية</h1>


</div>

   {/* <div className="pic"> 
    <div  style={{width:"80px",height:"70px"}}> 
    <div style={{right:"15px",cursor:"pointer",top:"10px",position:"absolute"}}
    
    >
    
    </div>
      {e.fields.Picture?<img     src={e.fields.Picture[0].url}  />:""}
</div>
</div>
     */}
      {/* <h2 className="card-title">{e.fields["م"]}</h2> */}

    <h2 className="card-title">{e.fields["م"]}</h2>
    <div className="textcard">
      {/* e.fields[ksd["age - العمر"] }
      {/* <p  >{e.fields['age - العمر']?e.fields['age - العمر']:""}</p> */}
        {/* <h1 className={Style['almarai-bold']}> الحالة الاجتماعية</h1>

        <h1 >{e.fields["marital status - الحالة الاجتماعية"]}</h1>
        
        {e.fields["Education - التعليم"]?<h1 className={Style['almarai-bold']}> التعليم</h1>:null}
        
        {e.fields["Education - التعليم"]?<h1>{e.fields["Education - التعليم"]}</h1>:null}
  
        {e.fields["Nationality copy"]?<h1 className={Style['almarai-bold']}> الجنسية</h1>:null}
    {e.fields["Nationality copy"]? <h1 >{e.fields["Nationality copy"]}</h1>:null}
        
    
        {e.fields["Salary - الراتب"]?<h1 className={Style['almarai-bold']}> الراتب</h1>:null}
        {e.fields["Salary - الراتب"]?<h1 >{e.fields["Salary - الراتب"]} sar</h1>:null} 

        {e.fields["Religion - الديانة"]?<h1 className={Style['almarai-bold']}> الديانة</h1>:null}
        {e.fields["Religion - الديانة"]?<h1   >{e.fields["Religion - الديانة"]}</h1>:null}


      {e.fields['date of birth - تاريخ الميلاد']? <h1 className={Style['almarai-bold']}> العمر</h1>:null}

  {e.fields['date of birth - تاريخ الميلاد']?<h1 >{Math.ceil(dayjs(new Date()).diff(e.fields['date of birth - تاريخ الميلاد'])/31556952000)}</h1>:null}
     */}

      </div>
      <div>
        <h4 style={{justifyContent:"center",display:"flex"}} className={Style['almarai-bold']}>حالة الطلب</h4>
{e.fields["حالة الحجز"] == "تم الاستقدام"?

<VerticalTimeline animate={media?false:true}>
  <VerticalTimelineElement
    className="vertical-timeline-element--work"
    // date="2010 - 2011"
    iconStyle={{ background: 'rgb(128, 25, 243)', color: '#fff' }}
  //  icon={}
  style={{backgroundColor:e.fields.Picture[0].url}} 
  >
    <h1  style={{justifyContent:"center",display:"flex"}}  className={Style['almarai-bold']}>التقديم</h1>
    {/* <h4 className="vertical-timeline-element-subtitle">San Francisco, CA</h4> */}
    <p>
      تم ارسال الطلب الى مؤسسة روائس القمم 
    </p>
  </VerticalTimelineElement>
  <VerticalTimelineElement
    className="vertical-timeline-element--work"
    // date="2010 - 2011"25
    iconStyle={{ background: 'rgb(102,255,102)', color: '#fff' }}
    
  >
    <h1 className={Style['almarai-bold']}>محتمل</h1>
    {/* <h4 className="vertical-timeline-element-subtitle">San Francisco, CA</h4> */}
    <p>
     تم استلام الطلب ويتم مراجعته لدينا
    </p>
  </VerticalTimelineElement>
  <VerticalTimelineElement
    className="vertical-timeline-element--work"
    // date="2008 - 2010"
    iconStyle={{ background: 'rgb(33, 150, 243)', color: '#fff' }}
 
  >
    <h1 className={Style['almarai-bold']}>مؤكد</h1>
    {/* <h4 className="vertical-timeline-element-subtitl"e">Los Angeles, CA</h4> */}
    <p>
      تم تأكيد طلبك و اتخاذ اجراءات الاستقدام
    </p>
  </VerticalTimelineElement>
    <VerticalTimelineElement
    className="vertical-timeline-element--education"
    // date="April 2013"
    iconStyle={{ background: 'rgb(233, 30, 99)', color: '#fff' }}
  >
<h1 className={Style['almarai-bold']}>انهاء</h1>
    {/* <h4 className="vertical-timeline-element-subtitl"e">Los Angeles, CA</h4> */}
    <p>
      تهانينا , تم انهاء اجراءات الاستقدام
    </p>


  </VerticalTimelineElement>




</VerticalTimeline>

:null}









{e.fields["حالة الحجز"] == "مؤكد"?

<VerticalTimeline animate={media?false:true}>
  <VerticalTimelineElement
    className="vertical-timeline-element--work"
    // date="2010 - 2011"
    iconStyle={{ background: 'rgb(128, 25, 243)', color: '#fff' }}
    
  >
    <h1 className={Style['almarai-bold']}>التقديم</h1>
    {/* <h4 className="vertical-timeline-element-subtitle">San Francisco, CA</h4> */}
    <p>
      تم ارسال الطلب الى مؤسسة روائس القمم 
    </p>
  </VerticalTimelineElement>
  <VerticalTimelineElement
    className="vertical-timeline-element--work"
    // date="2010 - 2011"25
    iconStyle={{ background: 'rgb(102,255,102)', color: '#fff' }}
    
  >
    <h1 className={Style['almarai-bold']}>محتمل</h1>
    {/* <h4 className="vertical-timeline-element-subtitle">San Francisco, CA</h4> */}
    <p>
     تم استلام الطلب ويتم مراجعته لدينا
    </p>
  </VerticalTimelineElement>
  <VerticalTimelineElement
    className="vertical-timeline-element--work"
    // date="2008 - 2010"
    iconStyle={{ background: 'rgb(33, 150, 243)', color: '#fff' }}
 
  >
    <h1 className={Style['almarai-bold']}>مؤكد</h1>
    {/* <h4 className="vertical-timeline-element-subtitl"e">Los Angeles, CA</h4> */}
    <p>
      تم تأكيد طلبك و اتخاذ اجراءات الاستقدام
    </p>
  </VerticalTimelineElement>
    <VerticalTimelineElement
    className="vertical-timeline-element--education"
    // date="April 2013"
    iconStyle={{ background: 'rgb(224, 224, 224)', color: '#fff' }}
  >
<h1 className={Style['almarai-bold']}>انهاء</h1>
    {/* <h4 className="vertical-timeline-element-subtitl"e">Los Angeles, CA</h4> */}
    <p>
      تهانينا , تم انهاء اجراءات الاستقدام
    </p>


  </VerticalTimelineElement>




</VerticalTimeline>

:null}










{e.fields["حالة الحجز"] == "حجز جديد"?

<VerticalTimeline animate={media?false:true}>
  <VerticalTimelineElement
    className="vertical-timeline-element--work"
    // date="2010 - 2011"
    iconStyle={{ background: 'rgb(128, 25, 243)', color: '#fff' }}
    
  >
    <h1 className={Style['almarai-bold']}>التقديم</h1>
    {/* <h4 className="vertical-timeline-element-subtitle">San Francisco, CA</h4> */}
    <p>
      تم ارسال الطلب الى مؤسسة روائس القمم 
    </p>
  </VerticalTimelineElement>
  <VerticalTimelineElement
    className="vertical-timeline-element--work"
    // date="2010 - 2011"25
    iconStyle={{ background: 'rgb(224, 224, 224)', color: '#fff' }}
    
  >
    <h1 className={Style['almarai-bold']} style={{color:'rgb(224, 224, 224)'}}>محتمل</h1>
    {/* <h4 className="vertical-timeline-element-subtitle">San Francisco, CA</h4> */}
    <p  style={{color:'rgb(224, 224, 224)'}}>
     تم استلام الطلب ويتم مراجعته لدينا
    </p>
  </VerticalTimelineElement>
  <VerticalTimelineElement
    className="vertical-timeline-element--work"
    // date="2008 - 2010"
    iconStyle={{ background: 'rgb(224, 224, 224)', color: '#fff' }}
 
  >
    <h1  style={{color:'rgb(224, 224, 224)'}} className={Style['almarai-bold']}>مؤكد</h1>
    {/* <h4 className="vertical-timeline-element-subtitl"e">Los Angeles, CA</h4> */}
    <p style={{color:'rgb(224, 224, 224)'}}>
      تم تأكيد طلبك و اتخاذ اجراءات الاستقدام
    </p>
  </VerticalTimelineElement>
    <VerticalTimelineElement
    className="vertical-timeline-element--education"
    // date="April 2013"
    iconStyle={{ background: 'rgb(224, 224, 224)', color: '#fff' }}
  >
<h1 style={{color:'rgb(224, 224, 224)'}} className={Style['almarai-bold']}>انهاء</h1>
    {/* <h4 className="vertical-timeline-element-subtitl"e">Los Angeles, CA</h4> */}
    <p style={{color:'rgb(224, 224, 224)'}}>
      تهانينا , تم انهاء اجراءات الاستقدام
    </p>


  </VerticalTimelineElement>




</VerticalTimeline>

:null}




{e.fields["حالة الحجز"] == "محتمل"?

<VerticalTimeline animate={media?false:true}>
  <VerticalTimelineElement
    className="vertical-timeline-element--work"
    // date="2010 - 2011"
    iconStyle={{ background: 'rgb(128, 25, 243)', color: '#fff' }}
  
  >
    <h1 className={Style['almarai-bold']}>التقديم</h1>
    {/* <h4 className="vertical-timeline-element-subtitle">San Francisco, CA</h4> */}
    <p>
      تم ارسال الطلب الى مؤسسة روائس القمم 
    </p>
  </VerticalTimelineElement>
 <VerticalTimelineElement
    className="vertical-timeline-element--work"
    // date="2010 - 2011"25
    iconStyle={{ background: 'rgb(102,255,102)', color: '#fff' }}
    
  >
    <h1 className={Style['almarai-bold']}>محتمل</h1>
    {/* <h4 className="vertical-timeline-element-subtitle">San Francisco, CA</h4> */}
    <p>
     تم استلام الطلب ويتم مراجعته لدينا
    </p>
  </VerticalTimelineElement>
  <VerticalTimelineElement
    className="vertical-timeline-element--work"
    // date="2008 - 2010"
    iconStyle={{ background: 'rgb(224, 224, 224)', color: '#fff' }}
 
  >
    <h1  style={{color:'rgb(224, 224, 224)'}} className={Style['almarai-bold']}>مؤكد</h1>
    {/* <h4 className="vertical-timeline-element-subtitl"e">Los Angeles, CA</h4> */}
    <p style={{color:'rgb(224, 224, 224)'}}>
      تم تأكيد طلبك و اتخاذ اجراءات الاستقدام
    </p>
  </VerticalTimelineElement>
    <VerticalTimelineElement
    className="vertical-timeline-element--education"
    // date="April 2013"
    iconStyle={{ background: 'rgb(224, 224, 224)', color: '#fff' }}
  >
<h1 style={{color:'rgb(224, 224, 224)'}} className={Style['almarai-bold']}>انهاء</h1>
    {/* <h4 className="vertical-timeline-element-subtitl"e">Los Angeles, CA</h4> */}
    <p style={{color:'rgb(224, 224, 224)'}}>
      تهانينا , تم انهاء اجراءات الاستقدام
    </p>


  </VerticalTimelineElement>




</VerticalTimeline>

:null}
























      </div>
    <div style={{right:"15px",bottom:"1px",position:"absolute",borderRadius:"3px",color:"red"}}>
 
 {/* <p>سيتم مراجعة الطلب و التواصل معك في اقرب وقت *</p> */}
 
 </div>   
  </div> 
     </div>
  )  } 
      {/* </div> */}
      </div>:
      <div style={{display:"flex",justifyContent:"center",height:"100vh",alignContent:"center",alignItems:"center"}}>
      <CircleLoader/>
      </div>
      
      }
    </div>
  )
}

export default Status
