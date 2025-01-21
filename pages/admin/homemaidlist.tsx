// @ts-nocheck 
import React, { useState, useEffect } from 'react'
import { Doughnut, Line, Pie } from 'react-chartjs-2'
import dayjs from 'dayjs'
import CTA from 'example/components/CTA'
import InfoCard from 'example/components/Cards/InfoCard'
import ChartCard from 'example/components/Chart/ChartCard'
import ChartLegend from 'example/components/Chart/ChartLegend'
import PageTitle from 'example/components/Typography/PageTitle'
import RoundIcon from 'example/components/RoundIcon'
import Layout from 'example/containers/Layout'
import response, { ITableData } from 'utils/demo/tableData'
import { ChatIcon, CartIcon, MoneyIcon, PeopleIcon } from 'icons'
// import"
import {
  TableBody,
  Label,
  
  TableContainer,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  TableFooter,
  Select,
  Avatar,
  ModalBody,ModalFooter,ModalHeader,
  Badge,
  Pagination,
  Button,
  Modal,
  Input,
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
import Link from 'next/link'
import { useRouter } from 'next/router'
import toRegex from "to-regex"
import { duration } from '@mui/material'
import { set } from 'mongoose'
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useDemoData } from '@mui/x-data-grid-generator';
function HomeMaidList() {
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
const [dataObject,setDataObject]=useState({})
  // console.log(dayjs())
  const [page, setPage] = useState(1)
  const [length,setLength]=useState(0)
  const [data, setData] = useState([])
  const [time,setTime]=useState(0)
  const [office,setOffice]=useState([])
  // pagination setup
  const [fulldata,setFulldata]=useState([])
  const resultsPerPage = 10
  const totalResults = fulldata.length
  
const router = useRouter()  
// setTimeout(() =
// pagination change control
  const [paginatedData,setPaginatedData]=useState([])
  // console.log(time)
  const [listType,setTypeList] = useState("workers")
  const [isModalOpen, setIsModalOpen] = useState(false)
const [isUpdateStatus,setisUpdateStatus]=useState("")
  function openModal() {
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
  }


function onPageChange(p: number) {
setPaginatedData(filteredData.slice((p - 1) * resultsPerPage, p * resultsPerPage))
  }
const [sponsorName,setSponsor]=useState("");
const [SponsorMobile,setSponsorMobile]=useState("");
const [workerName,setWorkerName]=useState("");
const[workerPassportNumber,setPassportNumber]=useState("");
const[applicationDate,setApplicationDate]=useState("")
const[workerMobile,setWorkerMobile]=useState("")
const[kingdomentry,setKingdomEntry]=useState("")
const[duration,setDuration]=useState("");
const[externalOffice,setExternalOffice]=useState("")
const[endOfMusanadDuration,setendOfMusanadDuration]=useState(0);
const[externalofficeApproval,setExternalOfficeApproval]=useState("");
const[externalOfficelinkDate,setExternalOfficeLinkDate]=useState("");
const[agencyWorkDate,setAgenctWorkDate]=useState("");
const[stampingDate,setStampingDate]=useState("");
const[bookingDate,setBookingDate]=useState("");
const [externalOfficeNotify,setExternalOfficeNotify]=useState("")
const[arrivalDate,setArrivalDate]=useState("");
const[statusDue,setStatusDue]=useState("");
const[medicalCheck,setMedicalCheck]=useState("");
const[sposnorPassportNumber,setSposnorPassportNumber]=useState(0);
const[arrivalCity,setArrivalCity]=useState("");
const[orderStatus,setOrderStatus]=useState("");
const[delegate,setDelegate]=useState("");
const [timeStampe,setTimeStamp]=useState(0)  
const obj ={ 
    id:isUpdateStatus
,      "اسم الكفيل": sponsorName, 
      "\"هوية الكفيل  The identity of the sponsor\"": sposnorPassportNumber,
      "\"جوال الكفيل  The sponsor's mobile\"": SponsorMobile,
      "\"اسم العاملة  The name of the worker\"": workerName,
      "\"تارخ تقديم الطلب  The date of application\"":new Date().toLocaleDateString("fr-ca").replaceAll("/","-"),
      "\"رقم الجواز  Passport number\"": workerPassportNumber,
      "الفترة الزمنية": new Date().toLocaleDateString("fr-ca").replaceAll("/","-"),     
      "\"موافقة المكتب الخارجي  External office approval\"": new Date().toLocaleDateString("fr-ca").replaceAll("/","-"),
      "\"تاريخ الربط مع المكتب الخارجي  Date of connection with the external office\"": new Date().toLocaleDateString("fr-ca").replaceAll("/","-"),
      "\"تاريخ عمل الوكالة  Agency work history\"": new Date().toLocaleDateString("fr-ca").replaceAll("/","-"),
      "\"تاريخ التختيم في السفارة   The date stamped at the embassy\"": new Date().toLocaleDateString("fr-ca").replaceAll("/","-"),
      "\"تاريخ الحجز  booking date\"": new Date().toLocaleDateString("fr-ca").replaceAll("/","-"),
            "\"تاريخ الوصول  date of arrival\"": new Date().toLocaleDateString("fr-ca").replaceAll("/","-"),
      "المبلغ  للمكتب الخارجي": statusDue,
      "الكشف الطبي": medicalCheck, 
           "\"مدينة الوصول  arrival city\"": arrivalCity
      ,"حالة الطلب": orderStatus,
      "التفويض": delegate
    }
const [filteredData,setFilteredDAta]=useState([])
const [filterByStatus,setFilterByStatus]=useState("(.*)")
const [filterByCity,setfilterByCity]=useState("(.*)")
const [filterByNotification,setFilterNotification]=useState("(.*)")
const [filterByMedicalCheck,setfilterByMedicalCheck]=useState("(.*)")
const[filterByNationality,setFilterByNationality]=useState("(.*)")
console.log(filterByStatus,filterByStatus,filterByCity,filterByNotification,filterByMedicalCheck,filterByNationality)
const[filterByPassport,setfilterByPassport]=useState("(.*)")  
useEffect(() => {  
    try {
      async function names( )  {
     await fetch("../api/homemaidlist",{method:"post",body:JSON.stringify({nationality:filterByNationality,exrernalOfficeNotify:filterByNotification,medicalCheck:filterByMedicalCheck,arrivalCity:filterByCity,workerStatus:filterByStatus})}).then(response => response.json())
  .then(json  => {
    json?setLength(json.length):"";
    setFulldata(json);
console.log(json)
  setFilteredDAta(json)
    json?setPaginatedData(json?.slice((0) * resultsPerPage, page * resultsPerPage)):console.log("e");
} )}
names()

} catch (error) {
  console.log(error.message)
}  

}, [timeStampe,

  
filterByStatus,filterByCity,filterByNotification,filterByMedicalCheck,filterByNationality

])
const delet=async(id)=>{

const update = await fetch("../api/deletehomemaid",{body:JSON.stringify({id}),method:"post",headers:{'Accept':'application/json'}});
console.log(update)
if(update.status == 200) {

  setisUpdateStatus(0)
setTimeStamp(Date.now())
}
  
}
const confirmUpdate=async ()=>{

const update = await fetch("../api/updateHomemaid",{body:JSON.stringify(obj),method:"post",headers:{'Accept':'application/json'}});
console.log(update)
if(update.status == 200) {

  setisUpdateStatus(0)
setTimeStamp(Date.now())
}
}
const edit =async (id)=>{

  setisUpdateStatus(id)
const finder =fulldata.find(e=>e.id==id)
console.log(finder)
setSponsor(finder.fields["اسم الكفيل"])
setSponsorMobile(finder.fields["\"جوال الكفيل  The sponsor's mobile\""])
setSposnorPassportNumber(finder.fields[ "\"هوية الكفيل  The identity of the sponsor\""])
setWorkerName(finder.fields["\"اسم العاملة  The name of the worker\""])
setPassportNumber(finder.fields["\"رقم الجواز  Passport number\""])
setApplicationDate(finder.fields["\"تارخ تقديم الطلب  The date of application\""])
setMedicalCheck(finder.fields["الكشف الطبي"])
setKingdomEntry(finder.fields["تاريخ الدخول للمملكة"])
setExternalOffice(finder.fields["المكتب الخارجي"])
setWorkerMobile(finder.fields["رقم جوال العامله"])
setArrivalCity(finder.fields["\"مدينة الوصول  arrival city\""])
setOrderStatus(finder.fields["حالة الطلب"])
setStatusDue(finder.fields["المبلغ  للمكتب الخارجي"])
setDelegate(finder.fields["التفويض"])
}


const [openConfirmModal,setOpenModal]=useState(false)

const filterpassprot = (f:string)=>{
  
  const  filteredByPassport = fulldata.filter(e=>


    e.fields["\"اسم العاملة  The name of the worker\""]?.toUpperCase().includes(f.toUpperCase())

)
// console.log(filteredByPassport)
setFilteredDAta(filteredByPassport)
setPaginatedData(filteredData?.slice((0) * resultsPerPage, page * resultsPerPage))
}
return (
<div>
  <Button style={{margin:"1 3px"}} onClick={()=> router.back()}>الرجوع للخلف</Button>
   <div>
    <Modal isOpen={openConfirmModal} onClose={()=>setOpenModal(false)}>
<ModalHeader>

  تنبيه
</ModalHeader>
      <ModalBody>
هل انت متأكد من حذف البيانات ؟

      </ModalBody>
  <ModalFooter>

    <div style={{display:"flex"}}>
      <Button>Yes</Button>
      
      <Button>No</Button>
    </div>
  </ModalFooter>
    </Modal>
              {/* <Button style={{margin:"13px",backgroundColor:"#Ecc383"}} onClick={()=> router.back()}>الرجوع للخلف</Button> */}
      <PageTitle>قائمة الوصول</PageTitle>
      <div className="grid gap-6 mb-8 md:grid-cols-2 ">
      </div>
<div className='grid gap-6 lg-8 sm:grid-cols-6 m-3'>
  <div>
<Label>حالة الطلب</Label>
          <Select   onChange={(e)=>{setFilterByStatus(e.target.value);}}>
            <option value='(.*)'>-----</option>

            <option value='هروب العاملة '>هروب العاملة </option>

            <option value='الغاء الطلب'>الغاء الطلب</option>

            <option value='تم الوصول '>تم الوصول </option>
            <option value='قيد المراجعة'>قيد المراجعة</option>

            <option value='YES'>YES</option>


            <option value='NO'>NO</option>


          </Select>
</div>
<div><Label>مدينة الوصول</Label>
          <Select   onChange={(e)=>{setfilterByCity(e.target.value);}}>
            <option value='(.*)'>-----</option>

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

</div>


<div>

<Label>الفحص الطبي</Label>
          <Select   onChange={(e)=>{setfilterByMedicalCheck(e.target.value);}}>
            <option value='(.*)'>-----</option>


            <option value='WAITING'>waiting</option>
            <option value='FIT'>fit</option>
            <option value='NOT FIT'>not fit</option>
            <option value='NO'>no</option>


          </Select>

</div>


<div><Label>المبلغ للمكتب الخارجي</Label>
          <Select   onChange={(e)=>{setFilterNotification(e.target.value);}}>
            <option value='(.*)'>-----</option>


            <option value='تم'>تم</option>
            <option value='لم يتم'>لم يتم</option>


          </Select>
</div>



<div><Label>الجنسية</Label>
          <Select   onChange={(e)=>{setFilterByNationality(e.target.value);}}>
            <option value='(.*)'>-----</option>



            <option value="كينيا">كينيا</option>
            <option value='اثيوبيا'>اثيوبيا</option>

          <option value="الفبين">الفلبين</option>

          </Select>


</div>

<Input  placeholder='البحث بالاسم' className="mt-1 " style={{width:"180px"}} onChange={(e)=>
  {setfilterByPassport(e.target.value)
 
 filterpassprot(e.target.value)
 
 }}/>
 

</div>
      {/* <DataGrid {...fulldata} slots={{ toolbar: GridToolbar }} /> */}

      <TableContainer>
  {/* <Button >اضافة جديد</Button> */}
        <Table>
          <TableHeader>

       


            <tr>
              <TableCell>تعديل</TableCell>
{isUpdateStatus?<TableCell>تأكيد</TableCell>:<TableCell>حذف</TableCell>}
              <TableCell>اسم الكفيل</TableCell>
              <TableCell>هوية الكفيل</TableCell>
              <TableCell>جوال الكفيل</TableCell>
              <TableCell>اسم العاملة</TableCell>
              <TableCell>رقم جواز السفر</TableCell>
              <TableCell>حالة الطلب</TableCell>
              <TableCell>مدينة الوصول</TableCell>

              <TableCell>تاريخ تقديم الطلب</TableCell>
              <TableCell>الكشف الطبي</TableCell>
<TableCell>الفترة الزمنية</TableCell>
              <TableCell>تاريخ دخول المملكة</TableCell>

              <TableCell>رقم هاتف العاملة</TableCell>
              <TableCell>ملاحظات</TableCell>






            </tr>
          </TableHeader>
          <TableBody>
            {paginatedData?.map((e, i) => (
              <TableRow key={i}>



                <TableCell>

{isUpdateStatus!=e.id?<Button style={{backgroundColor:"#e28743"}} onClick={()=>edit(e.id)}>تعديل</Button>:<Button color='dodgerblue' onClick={()=>setisUpdateStatus("")}>الغاء التعديل</Button>

}
                </TableCell>

                
                
{

 isUpdateStatus!=e.id?     

<TableCell><Button style={{backgroundColor:"red"}} onClick={()=>setOpenModal(true)}>  حذف</Button>
</TableCell>:    <TableCell>
<Button color='dodgerblue' onClick={()=>confirmUpdate()}>تأكيد التعديل</Button>


                </TableCell>

} 
                <TableCell>
                 {isUpdateStatus!=e.id? <span className="text-md">{e.fields["اسم الكفيل"]}</span>
:<Input value={sponsorName} onChange={(e)=>setSponsor(e.target.value)}/>}
                </TableCell>
                 <TableCell>
                  {isUpdateStatus!=e.id?
                  <span className="text-md">{e.fields[ "\"هوية الكفيل  The identity of the sponsor\""]}</span>:
<Input value={sposnorPassportNumber} onChange={(e)=>setSposnorPassportNumber(e.target.value)}/>
                  }


                </TableCell>

                 <TableCell>
                                    {isUpdateStatus!=e.id?
                  <span className="text-md">{e.fields["\"جوال الكفيل  The sponsor's mobile\""]}</span>
:
<Input value={SponsorMobile} onChange={(e)=>setSponsorMobile(e.target.value)}/>
                  }


                </TableCell>

                 <TableCell>

                  {isUpdateStatus!=e.id?<span className="text-md">{e.fields["\"اسم العاملة  The name of the worker\""]}</span>
:
<Input value={workerName} onChange={(e)=>setWorkerName(e.target.value)}/>

                }</TableCell>
                 <TableCell>

{isUpdateStatus!=e.id?
<span className="text-md">{e.fields["\"رقم الجواز  Passport number\""]}</span>
  :
<Input value={workerPassportNumber} onChange={(e)=>setPassportNumber(e.target.value)}/>


}

                </TableCell>




                 <TableCell>

{isUpdateStatus!=e.id?
<span className="text-md">{e.fields["حالة الطلب"]}</span>
  :
  
          <Select onChange={()=>setOrderStatus(e.target.value)}>
            <option value='------'>-----</option>

            <option value='هروب العاملة '>هروب العاملة </option>

            <option value='الغاء الطلب'>الغاء الطلب</option>

            <option value='تم الوصول '>تم الوصول </option>
            <option value='قيد المراجعة'>قيد المراجعة</option>

            <option value='YES'>YES</option>


            <option value='NO'>NO</option>


          </Select>


}

                </TableCell>



                 <TableCell>

{isUpdateStatus!=e.id?
<span className="text-md">{e.fields["\"مدينة الوصول  arrival city\""]}</span>
  :

  



<Label className="mt-4">
          <span>مدينة الوصول</span>
          
          <Select onChange={(e)=>setArrivalCity(e.target.value)}>
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
          
        </Label>


}

                </TableCell>






                 <TableCell>
{isUpdateStatus!=e.id?
<span className="text-md">{e.fields["\"تارخ تقديم الطلب  The date of application\""]}</span>
:

<Input value={applicationDate} onChange={(e)=>setApplicationDate(e.target.value)} type='date'/>
}
                </TableCell>


                 <TableCell>

{isUpdateStatus!=e.id?

<span className="text-md">{e.fields["الكشف الطبي"]}</span>
:
<Input value={medicalCheck} onChange={(e)=>setMedicalCheck(e.target.value)}/>

}




                </TableCell>

                 <TableCell>

{isUpdateStatus!=e.id?

<span className="text-md">{e.fields["الفترة الزمنية"]}</span>
:
<Input value={duration} onChange={(e)=>setDuration(e.target.value)} type='date'/>

}




                </TableCell>

                 <TableCell>

                  {isUpdateStatus!=e.id?
<span className="text-md">{e.fields["تاريخ الدخول للمملكة"]}</span>
:
<Input value={kingdomentry} onChange={(e)=>setKingdomEntry(e.target.value)} type='date'/>


}

                </TableCell>




                 <TableCell>


                  {isUpdateStatus!=e.id?
                  <span className="text-md">{e.fields["المكتب الخارجي"]}</span>
                  :
                  <Input value={externalOffice} onChange={(e)=>setExternalOffice(e.target.value)}/>
                  }

                </TableCell>

                 <TableCell>
                  {isUpdateStatus!=e.id?

                    <span className="text-md">{e.fields["رقم جوال العامله"]}</span>
              :<Input value={workerMobile} onChange={(e)=>setWorkerMobile(e.target.value)}/>

                  }

                </TableCell>



                 <TableCell>
                  <span className="text-md">{e.fields["ملاحظات"]}</span>

                </TableCell>






              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TableFooter>
          <Pagination
            totalResults={filteredData.length}
            resultsPerPage={resultsPerPage}
            label="Table navigation"
            onChange={onPageChange}
          />
        </TableFooter>
      </TableContainer>

                </div>
 </div>

  )
}

export default HomeMaidList;