// @ts-nocheck 
import React, { useState, useEffect, useContext } from 'react'
import { Doughnut, Line, Pie } from 'react-chartjs-2'
// import "./officeinfo/[slug]"
import CTA from 'example/components/CTA'
import InfoCard from 'example/components/Cards/InfoCard'
import ChartCard from 'example/components/Chart/ChartCard'
import ChartLegend from 'example/components/Chart/ChartLegend'
// import "./officeinfo/"
import _ from "lodash";
import PageTitle from 'example/components/Typography/PageTitle'
import RoundIcon from 'example/components/RoundIcon'
import Layout from 'example/containers/Layout'
import response, { ITableData } from 'utils/demo/tableData'
import { ChatIcon, CartIcon, MoneyIcon, PeopleIcon, BellIcon } from 'icons'
// import 
import {
  TableBody,
  TableContainer,
  Table,
  Input,
  TableHeader,
  TableCell,
  TableRow,
  TableFooter,
  Avatar,
  Badge,
  Pagination,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '@roketid/windmill-react-ui'

import {
  lineOptions,
  doughnutLegends,
  lineLegends,
} from 'utils/demo/chartsData'

import {
  Chart,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import Link from 'next/dist/client/link'
import Style from "styles/Home.module.css"


// import""
import { User } from 'utils/usercontext'
import { useRouter } from 'next/router'
import { jwtDecode } from 'jwt-decode'
import Cookies from 'js-cookie'
import dayjs from 'dayjs'
import { Alert, Rating } from '@mui/material'
import { BellOutlined } from '@ant-design/icons'
// Rating

// import link from 'next/link'
function Dashboard() {

const rates =["inner - مبتدأ",
"Beginner - مبتدأ",
"Intermediate - جيد",
"Advanced - جيد جداً",
"Expert - ممتاز"]


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
       const [admins,setAdmins] = useState(null)
       const [bookedReserved,setBooked] = useState([]);

       const [Transfer,setTransfer] = useState([]);
    
    
    
       const [cvnumber,setCVnumber]=useState("");
  const [page, setPage] = useState(1);
  const [length,setLength]=useState(0);
  const [data, setData] = useState({});
  const [time,setTime]=useState(0);
  // const [time,setTime]=useState(0)

  const [deletedid,setDeletedid]=useState("")
  const [office,setOffice]=useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)

const [fullname,setFullname]=useState("");
const [phonenumber,setPhonenumber]=useState("");
const [password,setPassword]=useState("");

  // pagination setup
  const [fulldata,setFulldata]=useState([])
  const resultsPerPage = 10
  // Label
  const totalResults = fulldata.length;
  const user =useContext(User)
// setTimeout(() =
// pagination change control
const [cancelledcontracts,setCancelledcontracts]=useState([])
  const [paginatedData,setPaginatedData]=useState([])
  // console.log(time)
  const [listType,setTypeList] = useState("workers")
  const [cvnumberbook,setcvnumberbook]=useState("");
  const [cvid,setcvid]=useState("");
  const [workername,setworkername]=useState("")


  const bookmodal = (cvn,idd,wn)=>{
setworkername(wn);
setcvnumberbook(cvn)
setcvid(idd)
openModal()

  }


  const router = useRouter()
const [list,setList]=useState([]);
const[newres,setResevationsLength]=useState(0)

function onPageChange(p: number) {
  console.log(p)
  // console.log(fulldata.slice((p - 1) * resultsPerPage, p * resultsPerPage))
    // json?setData(json?.slice((page - 1) * resultsPerPage, page * resultsPerPage)):console.log("e");

setPaginatedData(fulldata.slice((p - 1) * resultsPerPage, p * resultsPerPage))
    // setPage(p)
  }
  // on page change, load new sliced data
  // here you would make another server request for new data

 function openModal() {
    setIsModalOpen(true)
  }
  function closeModal() {
    setIsModalOpen(false)
  }




function removeaftersend (){
setPassword("")
setPhonenumber("")
setFullname("")
closeModal()


}

  
const book = async ()=>{

const fetcher =  await fetch("./api/newclientbyadmin",{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json",
      },body:JSON.stringify({id:cvid,cvnumber:cvnumberbook,workername:workername,phonenumber,fullname,password})})
  
      const f = await fetcher.json()

if(fetcher.status == 200) {return removeaftersend()}
if(fetcher.status !=200 ) alert ("Error Booking ")
  // names();


}

// const [originalArray,setOriginalArray]=useState([...paginatedData])


  
const search = ()=>{

      async function names( )  {
    const fetcher =  await fetch("./api/searchbutton",{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json",
      },body:JSON.stringify({cvnumber})})
      if(fetcher.status >=300) return alert ("لا يوجد نتائج")
    const f = await fetcher.json()
// console.log(,f)

.then(json  => {
// if(json.length<1) return console.log("لا يوجد نتائج")

json?setLength(json.length):"";

    // console.log('parsed json', json) // access json.body here
    setFulldata(json)
    json?setPaginatedData(json?.slice((0) * resultsPerPage, page * resultsPerPage)):console.log("e");
// console.log(new Date().getSeconds())
    // setData(json)   

  } 
  // names();

)
}

names()



}
function FindNatioinality(namenation) {
console.log(namenation)



const filtering = list.find(e=> e.id == namenation)
// console.log("filtering",filtering)
// console.log(filtering)
return filtering?.fields["الدولة"];

  
}
// console.log(list[3])
useEffect(() => {
  
  try {

    const token = Cookies.get("token")
  const decoder = jwtDecode(token);
      if(!decoder.admin)return router.replace("/admin/login");
// console.log(decoder.idnumber)
  } catch (error) {
    router.replace("/admin/login")
  }
    try {

      (async function External(){
        const fetcher =  await fetch("./api/externaloffices");
        const f = await fetcher.json()
        setofficelist(f)





})();
(async function NewReservations(){
  const fetcher =  await fetch("./api/newreservations");
    const f = await fetcher.json()
console.log("f",f)
setResevationsLength(f.length)
})()

      async function names( )  {
    const fetcher =  await fetch("./api/hello");
    const f = await fetcher.json()
    .then(json  => {  json?setLength(json.length):"";

    setFulldata(json)
    json?setPaginatedData(_.reverse(json).slice((0) * resultsPerPage, page * resultsPerPage)):console.log("e");

  } 

)
}

names()



 async function orders( )  {
    const fetcher =  await fetch("./api/orders");
    const f = await fetcher.json()

  .then(json  => {
//  
setBooked(json)
  }

)
}

orders()






 async function transfer( )  {
    const fetcher =  await fetch("./api/homemaidlist");
    const f = await fetcher.json()

  .then(json  => {
//  
// console.log(json)
setTransfer(json)
  }

)
}

transfer();


 async function cancelledcontracts( )  {
    const fetcher =  await fetch("./api/cancelledcontracts");
    const f = await fetcher.json()

  .then(json  => {
//  
// console.log(json)
setCancelledcontracts(json)
  }

)
}

cancelledcontracts()





async function Admins() {
   const fetcher =  await fetch("./api/admins");
    const f = await fetcher.json()
setAdmins(f.length)
  }

Admins()









} catch (error) {
  console.log(error)
}  
// if(newres>0) openModal(op)
}, [deletedid])

  async function fetchHidden( )  {
    const fetcher =  await fetch("./api/hiddenlist");
    const f = await fetcher.json()

  .then(json  => {
//  console.log(json)
//  if ()
  json?setLength(json.length):"";

    // console.log('parsed json', json) // access json.body here
    setFulldata(json)
    json?setPaginatedData(_.reverse(json).slice((0) * resultsPerPage, page * resultsPerPage)):console.log("e");
// console.log(new Date().getSeconds())
    // setData(json)   

  } 
  // names();

)
}


const  deleterecord = async (id)=>{

const fetcher = await fetch('../api/hide',{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json",
      },body:JSON.stringify({id:id})})

      const e= await fetcher.text()
if(fetcher.status == 200) setDeletedid(id)
      console.log(fetcher.status)

}
const openCvmodal=(cvdata)=>{

setData(cvdata)
setcvopen(true)

}
const closeCvModal = ()=>{
setcvopen(false)

}


// {bookmodal(e.fields["م"],e.id,e.fields["Name - الاسم"])
  const openbookModal = (m,ids,name)=>{
  setcvopen(false)
setworkername(name);
setcvnumberbook(m)
setcvid(ids)
openModal()



  // openModal()

}

const filter=(e)=>{
try {
if(!Number(e) ){
  const f = fulldata.filter(n=>n.fields["Name - الاسم"].toUpperCase().includes(e.toUpperCase()))
setPaginatedData(f)
}else{
 const s = fulldata.filter(n=>n.fields["م"]==e)
setPaginatedData(s)
}
  
} catch (error) {
console.log(error)  
}

}



const filterpassprot=(e)=>{
try {
if(!Number(e) ){
  const f = fulldata.filter(n=>n.fields["Passport number - رقم الجواز"].toUpperCase().includes(e.toUpperCase()))
setPaginatedData(f)
}else{
 const s = fulldata.filter(n=>n.fields["م"]==e)
setPaginatedData(s)
}
  
} catch (error) {
console.log(error)  
}

}
const [isCvModalOpen,setcvopen]=useState(false)
return (



<Layout >
      {/* {alert(user.username)} */}
      
      {data.fields?
      <Modal  isOpen={isCvModalOpen} onClose={closeCvModal} >
        <ModalHeader>{`Details ${data.fields["م"]}`}</ModalHeader>
        <ModalBody >

{/* <div style={{width:"95%",display:"flex",justifyContent:"center",flexDirection:"column"}}> */}
    {/* <div style={{display:"flex",marginTop:"12px",marginLeft:"auto",justifyContent:"center",marginRight:"auto",width:"60%",backgroundColor:"white"}}   className="card card-compact card-side w-100 bg-base-100 shadow-xl"  > */}
 
  <div className="card-body" style={{ borderRadius:"10px",display:"flex",flexDirection:"row"}} >
   <div className="pic"> 
    <div  style={{width:"80px",height:"70px"}}> 
    <div style={{right:"15px",cursor:"pointer",top:"10px",position:"absolute"}}
    
    >
    
    </div>
   <div>
       {data.fields.Picture?<img     src={data.fields.Picture[0].url}  />:""}
</div>
</div>

</div>

<div>
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
      <strong className='card-title'>المهارات</strong>
      {/* <div className="rating rating-sm"> */}
      
{/* </div> */}

      <strong className='card-title'>اللغات</strong>
<div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-around",alignContent:"space-around",justifyItems:"center",flexDirection:"row",width:"50%"}}><div >  <h4>اللغة العربية</h4>
  {rates.map((e,i)=>
data.fields["Arabic -  العربية"] == e?<Rating   aria-label={e} name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        
        )}
        </div><div>
<h4>اللغة الانجليزية</h4>
  {rates.map((e,i)=>
data.fields["English - الانجليزية"] == e?<Rating aria-label={e} name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}
</div>

</div>


      </div>
 </div>
    <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-around",alignContent:"space-around",justifyItems:"center",flexDirection:"row",width:"50%"}}>
      <div>
      <h4>الغسيل</h4>  {rates.map((e,i)=>
data.fields["laundry - الغسيل"] == e?<Rating  name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}</div>
        <div>
  <h4>الكوي</h4>  {rates.map((e,i)=>
data.fields["Ironing - كوي"] == e?<Rating  name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}</div>
        <div>
 <h4>التنظيف</h4>  {rates.map((e,i)=>
data.fields["cleaning - التنظيف"] == e?<Rating  name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}
</div>
<div>
         <h4>الطبخ</h4>  {rates.map((e,i)=>
data.fields["Cooking - الطبخ"] == e?<Rating  name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}
     </div>


<div>
         <h4>الخياطة</h4>  {rates.map((e,i)=>
data.fields["sewing - الخياطة"] == e?<Rating  name="half-rating" defaultValue={i+1}  />:console.log(e)
        

        )}



     </div>


        </div>
   
  </div>    
{/* </div> */}


  
  {/* </div> */}
           
        </ModalBody>
        <ModalFooter>
          <Button className="w-full sm:w-auto" layout="outline" onClick={closeCvModal}>
            Close
          </Button>

          <Button className="w-full sm:w-auto" layout="primary" onClick={()=>openbookModal(data.fields["م"],data.id,data.fields["Name - الاسم"])}>
            BOOK
          </Button>

        </ModalFooter>
      </Modal>:""

      }





      
<Modal isOpen={isModalOpen} onClose={closeModal}>
        <ModalHeader>{`Book CV Number ${cvnumberbook}`}</ModalHeader>
        <ModalBody>


<Input placeholder='اسم العميل'  value={fullname} onChange={(e)=>setFullname(e.target.value)}/>
<Input placeholder='جوال العميل' value={phonenumber} onChange={(e)=>setPhonenumber(e.target.value)}/>
<Input placeholder='رقم العميل السري' value={password} onChange={(e)=>setPassword(e.target.value)}/>
          
        </ModalBody>
        <ModalFooter>
          <Button className="w-full sm:w-auto" layout="outline" onClick={closeModal}>
            Close
          </Button>

          <Button className="w-full sm:w-auto" layout="primary" onClick={()=>book()}>
            confirm
          </Button>


        </ModalFooter>
      </Modal>

<h1 style={{fontSize:"23px"}}> Hello {user.name}</h1>
      <PageTitle>Dashboard</PageTitle>


      {/* <!-- Cards --> */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
          {/* @ts-ignore */}

          <div  style={{cursor:"pointer"}} onClick={e=>router.push("admin/newreservations")}>
        <InfoCard title=" الحجوزات الجديدة" value={newres}  >
       
{/*        
        <BellIcon  style={{zIndex:1, width:"30px",height:"20px",position:"absolute",marginBottom:"20px",marginRight:"2px"}}/>
                   */}
                 
                 <div className='text-orange-500 mr-4 dark:text-orange-100  dark:bg-orange-500'>

<svg
  fill="none"
  stroke-linecap="round"
  stroke-linejoin="round"
  stroke-width="2"
  viewBox="0 0 24 24"
  stroke="currentColor"  height="40px" width="50px"
>
  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
</svg>







                 </div>
       </InfoCard>
                 </div>


      

          <div  style={{cursor:"pointer"}} onClick={e=>setTypeList("workers")}>
        <InfoCard title=" المتاح من العاملين" value={length}  >
                 <div className='text-green-500 mr-4 dark:text-orange-100 bg-orange-100 dark:bg-orange-500'>



<svg fill="currentColor" viewBox="0 0 20 20" height="40px" width="50px">
  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
</svg>

</div>      </InfoCard>
                 </div>
 
          <div  style={{cursor:"pointer"}} onClick={e=>setTypeList("offices")}>
        <InfoCard  title="المكاتب الخارجية" value={officelist.length}  >
          {/* @ts-ignore */}
         
         
         
                 <div className='text-wheat-500 mr-4 dark:text-orange-100  dark:bg-white-500'>
         
         
         <svg
  fill="none"
  stroke-linecap="round"
  stroke-linejoin="round"
  stroke-width="2"
  viewBox="0 0 24 24"
  stroke="currentColor" height="40px" width="50px"
>
  <path d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
</svg>
         </div>
         
         
         
    
        </InfoCard>
            </div>
<div onClick={()=>router.push("/admin/dashboardadmins") } style={{cursor:"pointer"}}>
        <InfoCard title="المشرفين" value={admins} >
          {/* @ts-ignore */}
          
          
                 <div className='text-orange-500 dark:text-orange-100  dark:bg-orange-500'>
          
         <svg
  // fill="none"
  stroke-linecap="round"
  stroke-linejoin="round"
  stroke-width="2"
  viewBox="0 0 64 64"
  stroke="currentColor" 
  height="40px" width="50px"
> <title>User</title>
  <desc>A line styled icon from Orion Icon Library.</desc>
  <path data-name="layer1" d="M46 26c0 6.1-3.4 11.5-7 14.8V44c0 2 1 5.1 11 7a15.5 15.5 0 0 1 12 11H2a13.4 13.4 0 0 1 11-11c10-1.8 12-5 12-7v-3.2c-3.6-3.3-7-8.6-7-14.8v-9.6C18 6 25.4 2 32 2s14 4 14 14.4z"
  fill="none" stroke="#202020" stroke-miterlimit="10" stroke-width="2" stroke-linejoin="round"
  stroke-linecap="round" ></path>
</svg>
</div>          
          
          
          
          
          
          
          
        </InfoCard>
</div>
        
           <div  onClick={()=>router.push("/admin/orders")} style={{cursor:"pointer"}}>
        <InfoCard  title="المحجوز"  value={bookedReserved.length}  >
          {/* @ts-ignore */}
  
  <div className='text-orange-500 dark:text-orange-100   dark:bg-orange-500'>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-labelledby="title"
  height="40px" width="50px"
aria-describedby="desc" role="img"  >
  {/* <title>Travel Ticket</title> */}
  <desc>A solid styled icon from Orion Icon Library.</desc>
  <path data-name="layer1"
  d="M2 14v36h60V14zm16 30h-8a2 2 0 0 1 0-4h8a2 2 0 0 1 0 4zm12-12H10a2 2 0 0 1 0-4h20a2 2 0 0 1 0 4zm6-8H10a2 2 0 0 1 0-4h26a2 2 0 0 1 0 4zm10 20a2 2 0 0 1-4 0V20a2 2 0 0 1 4 0zm8-2a2 2 0 0 1-4 0v-2a2 2 0 0 1 4 0zm0-10a2 2 0 0 1-4 0V22a2 2 0 0 1 4 0z"
  fill="#e28743" ></path>
</svg>
  </div>
  
        </InfoCard>
            </div> 


           <div  onClick={()=>router.push("/admin/homemaidlist ")} style={{cursor:"pointer"}}>

<InfoCard  title="قائمة الوصول" value={Transfer.length}  >
          {/* @ts-ignore */}

  <div className='text-orange-500 dark:text-orange-100   dark:bg-orange-500'>

          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-labelledby="title"
aria-describedby="desc" role="img" height="40px" width="50px"
ar>
  <title>Airplane Mode</title>
  <desc>A line styled icon from Orion Icon Library.</desc>
  <path data-name="layer1"
  d="M57.5 7.5a5 5 0 0 0-7.1 0L39.9 18.1l-25.6-3.3s-1.9-.3-2.7.5l-3 3a1.3 1.3 0 0 0-.4 1.4c.2.5 1.6 1.2 2 1.4L28 30l-7.2 7.2-.7.7-9.1-1.3a1.6 1.6 0 0 0-1.5.5l-2.2 2.2c-.3.3-.9 1 .4 1.6l11.6 4.8s4.2 10.3 4.8 11.6 1.3.7 1.6.4l2.2-2.2a1.6 1.6 0 0 0 .5-1.5l-1.3-9.1.7-.7 7.2-7.1 9 17.7c.2.5.9 1.9 1.4 2a1.3 1.3 0 0 0 1.4-.4l3-3c.8-.8.5-2.7.5-2.7l-3.4-25.6 10.6-10.6a5 5 0 0 0 0-7z"
  fill="#abdbe3" stroke="#202020" stroke-linecap="round" stroke-linejoin="round"
  stroke-width="2"></path>
</svg>
</div>
        </InfoCard>
</div>        



           <div  onClick={()=>router.push("/admin/cancelledcontracts")} style={{cursor:"pointer"}}>

<InfoCard  title="عقود ملغاة" value={cancelledcontracts.length}  >
          {/* @ts-ignore */}

  <div className='text-orange-500 dark:text-orange-100   dark:bg-orange-500'>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-labelledby="title"
aria-describedby="desc" role="img" height="40px" width="50px">
  <title>Unavailable</title>
  <desc>A line styled icon from Orion Icon Library.</desc>
  <path data-name="layer1"
  d="M32 2a30 30 0 1 0 30 30A30.034 30.034 0 0 0 32 2zm0 7.059a22.82 22.82 0 0 1 13.524 4.425l-32.04 32.04A22.925 22.925 0 0 1 32 9.06zm0 45.883a22.815 22.815 0 0 1-13.523-4.426l32.039-32.04A22.926 22.926 0 0 1 32 54.942z"
  fill="#d80707" stroke="#202020" stroke-miterlimit="10" stroke-width="1" stroke-linejoin="round"
  stroke-linecap="round"></path>
</svg>
</div>
        </InfoCard>
</div>        


           <div  onClick={()=>router.push("/admin/hiddenlist")} style={{cursor:"pointer"}}>

<InfoCard  title="سير تم اخفائها عن العميل"  className="text-white" >
          {/* @ts-ignore */}

  <div className='text-orange-500 dark:text-orange-100  dark:bg-orange-500' >
<svg fill="#202020" height="20px" width="20px" version="1.1" id="Layer_1"   viewBox="0 0 330 330"  >
<path id="XMLID_2_" d="M325.607,304.394l-63.479-63.479c38.57-29.035,63.522-64.92,65.247-67.437c3.501-5.11,3.501-11.846,0-16.956
	c-2.925-4.269-72.659-104.544-162.371-104.544c-25.872,0-50.075,8.345-71.499,20.313L25.607,4.394
	c-5.857-5.858-15.355-5.858-21.213,0c-5.858,5.858-5.858,15.355,0,21.213l63.478,63.478C29.299,118.12,4.35,154.006,2.625,156.523
	c-3.5,5.109-3.5,11.845,0,16.955c2.925,4.268,72.65,104.546,162.378,104.546c25.868,0,50.069-8.345,71.493-20.314l67.897,67.898
	C307.323,328.536,311.161,330,315,330c3.839,0,7.678-1.464,10.606-4.394C331.465,319.749,331.465,310.252,325.607,304.394z
	 M165.003,81.977c60.26,0,113.408,60.338,131.257,83.022c-9.673,12.294-29.705,35.629-55.609,54.439L115.673,94.461
	C131.079,86.902,147.736,81.977,165.003,81.977z M165.003,248.023c-60.285,0-113.439-60.364-131.273-83.037
	c9.651-12.303,29.652-35.658,55.574-54.47l124.99,124.99C198.884,243.084,182.236,248.023,165.003,248.023z"/>
</svg></div>
        </InfoCard>
</div>        



      </div>

      {/* <div>
<TableContainer>

<Table>
<TableHeader>
<tr>
<TableCell>
Status

</TableCell>
<TableCell>
Details
  
</TableCell>
<TableCell>
Date
  
</TableCell>




</tr>

</TableHeader>
<TableBody>
<TableRow></TableRow>

</TableBody>



</Table>

</TableContainer>





      </div> */}
      <Label >
  {/* <span>search by cv number</span> */}
 
 <div style={{display:"inline-flex"}}> <Input  placeholder='البحث بالاسم او رقم السيرة الذاتية' className="mt-1 " style={{width:"180px"}} onChange={(e)=>
  {filter(e.target.value)
  setCVnumber()}}/>
  
   <Button onClick={()=>search()}  style={{backgroundColor:"#e28743"}}> search</Button>
</div>

 <div style={{display:"inline-flex"}}> <Input  placeholder='البحث برقم جواز السفر' className="mt-1 " style={{width:"180px"}} onChange={(e)=>
  {filterpassprot(e.target.value)
  setCVnumber()}}/>
  
   {/* <Button onClick={()=>search()}  style={{backgroundColor:"#e28743"}}> search</Button> */}
</div>


</Label>
{listType =="workers"?
      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              {listType =="workers"?<TableCell>رقم السي في</TableCell>:null}

              {listType =="workers"?<TableCell>اسم العامل</TableCell>:<TableCell>اسماء المكاتب</TableCell>}
              {/* {listType =="workers"?<TableCell>العمر</TableCell>: null} */}
              {listType =="workers"?<TableCell>الحالة الاجتماعية</TableCell>:null}
              {listType =="workers"?<TableCell>الجنسية</TableCell>:null}
              {listType =="workers"?<TableCell>الديانة</TableCell>:null}
             {listType =="workers"?<TableCell>رقم الجواز</TableCell>:null}
             
              {listType =="workers"?<TableCell>حالة الحجز</TableCell>:null}

              {listType =="workers"?<TableCell>حجز</TableCell>:null}

              {listType =="workers"?<TableCell>اخفاء</TableCell>:null}

            </tr>
          </TableHeader>
          <TableBody>
            {paginatedData?.map((e, i) => (
              <TableRow key={i}>
                
                <TableCell>
                 {e?.fields["م"] }
                  {/* <Badge type={user.status}>{user.status}</Badge> */}
                </TableCell>
                <TableCell>
                
                  <div className="flex items-center text-sm" style={{width:"200px"}}>
                    
                    <div>
                     {e?.fields["Name - الاسم"] ? <p style={{textDecorationLine:"underline",cursor:"pointer"}} onClick={()=>openCvmodal(e)} className="font-semibold" >{e?.fields["Name - الاسم"]}</p>:""}
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                 {e?.fields["marital status - الحالة الاجتماعية"]? <span className="text-sm">{e?.fields["marital status - الحالة الاجتماعية"]}</span>:""}

                  {/* <Badge type={user.status}>{user.status}</Badge> */}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                  <span className="text-sm">{("Nationality copy" in e.fields)?e.fields["Nationality copy"]:""}</span>

                    
                    {/* {new Date(user.date).toLocaleDateString()} */}
                  </span>
                </TableCell>
                <TableCell>
                  {/* <Link href={"/admin/officeinfo/"+e?.fields["External office - المكتب الخارجي"]}  >                  */}
                  {/* <span className="text-sm"> */}
                  <span className="text-sm">{e?.fields["Religion - الديانة"]?e?.fields["Religion - الديانة"]:""}</span>

                    
                    {/* {new Date(user.date).toLocaleDateString()} */}
                  {/* </span> */}
                {/* </Link> */}
                </TableCell>
<TableCell>
                  {/* <Link href={"/admin/officeinfo/"+e?.fields["External office - المكتب الخارجي"]}  >                  */}
                  {/* <span className="text-sm"> */}
                  <span className="text-sm">{e?.fields["Passport number - رقم الجواز"]?e?.fields["Passport number - رقم الجواز"]:""}</span>

                    
                    {/* {new Date(user.date).toLocaleDateString()} */}
                  {/* </span> */}
                {/* </Link> */}
                </TableCell>



                <TableCell>
                  {/* <Link href={"/admin/officeinfo/"+e?.fields["External office - المكتب الخارجي"]}  >                  */}
                  {/* <span className="text-sm"> */}
                  <span className="text-sm">{e?.fields["حالة الحجز"]}</span>

                    
                    {/* {new Date(user.date).toLocaleDateString()} */}
                  {/* </span> */}
                {/* </Link> */}
                </TableCell>




                <TableCell>

                <Button        disabled={e?.fields["حالة الحجز"] == null?false:true} onClick={()=>{bookmodal(e.fields["م"],e.id,e.fields["Name - الاسم"]) }} style={{cursor:!e?.fields["حالة الحجز"]?"pointer":"none",backgroundColor:"wheat",color:"black"}}>Book CV </Button>
                </TableCell>







                <TableCell>
                

                <Button onClick={()=>{deleterecord(e.id)  }} style={{backgroundColor:"red"}}>Hide</Button>
                </TableCell>



              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TableFooter>
          <Pagination
            totalResults={totalResults}
            resultsPerPage={resultsPerPage}
            label="Table navigation"
            onChange={onPageChange}
          />
        </TableFooter>
      </TableContainer>
: 
<TableBody>
<ul >
{officelist.map((e) => (
             
  <Link href={"./admin/officeinfo/"+ e.fields["External office - المكتب الخارجي"]}>
  <li  style={{ cursor:"pointer",height:"150px"}}  > 
                  {e?.fields["External office - المكتب الخارجي"]}   
              </li>
                    </Link>

              ))
}          </ul>
               </TableBody>
                }
    </Layout>
  )
}

export default Dashboard

