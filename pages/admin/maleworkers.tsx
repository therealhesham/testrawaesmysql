// @ts-nocheck 
import React, { useState, useEffect } from 'react'
import { Doughnut, Line, Pie } from 'react-chartjs-2'
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
import { DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

function FemaleWorkers() {
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

  
//   const [officelist,setofficelist]=useState([])
//   function datas() {
    
//   }
  
//   const doughnutOptions={
//   data: {
//     datasets: [
//       {
//         data: [67, 33],
//         /**
//          * These colors come from Tailwind CSS palette
//          * https://tailwindcss.com/docs/customizing-colors/#default-color-palette
//          */
//         backgroundColor: ['#0694a2', '#1c64f2',"#3cb44b"],
//         label: 'Dataset 1',
//       },
//     ],
//     labels: officelist.length>0?[...officelist]:0,
//   },
//   options: {
//     responsive: true,
//     cutoutPercentage: 80,
//   },
//   legend: {
//     display: false,
//   },
// }
// console.log(officelist)
  const [page, setPage] = useState(1)
  const [length,setLength]=useState(0)
  const [data, setData] = useState([])
  const [time,setTime]=useState(0)
  const [office,setOffice]=useState([])
  // pagination setup
  const [fulldata,setFulldata]=useState([])
  const resultsPerPage = 10
  const [id,setID]=useState("")
  const totalResults = fulldata.length
const router = useRouter()  
// setTimeout(() =
// pagination change control
  const [paginatedData,setPaginatedData]=useState([])
  // console.log(time)
  const [listType,setTypeList] = useState("workers")


function onPageChange(p: number) {
    // json?setData(json?.slice((page - 1) * resultsPerPage, page * resultsPerPage)):console.log("e");
setPaginatedData(fulldata.slice((p - 1) * resultsPerPage, p * resultsPerPage))
    // setPage(p)
  }
  // on page change, load new sliced data
  // here you would make another server request for new data
  useEffect(() => {
//@ts-ignore
//@ts-nocheck
try {

    const token = Cookies.get("token")
  const decoder = jwtDecode(token);
  
// console.log(decoder.idnumber)
  } catch (error) {
    console.log(error)
    // router.replace("/client")
  }
try {
 
  
      async function names( )  {
     await fetch("../api/maleworkerslist").then(response => response.json())
  .then(json  => {
    json?setLength(json.length):"";
    // console.log('parsed json', json) // access json.body here
    setFulldata(json)
    json?setPaginatedData(json?.slice((0) * resultsPerPage, page * resultsPerPage)):console.log("e");
    // setData(json)   
// const arr=[];
  // json?.length>0?json.map(e=>{if(!arr.includes(e.fields.office)) arr.push(e.fields.office)}):console.log(json.length)
  // setofficelist(arr)
} 
  // names();

)
}
names()

} catch (error) {
  console.log(error)
}  

}, [id])


const cancelRecord=async(e)=>{
  const canceled = await fetch("../api/cancelmaleworker",{method:"POST",body:JSON.stringify({id:e}),headers:{ 'Accept':'application/json',
        "Content-Type": "application/json"}})
const c = await canceled.text()
setID(c)

}
const endRecord=async(e)=>{

    const canceled = await fetch("../api/endmaleworker",{method:"POST",body:JSON.stringify({id:e}),headers:{ 'Accept':'application/json',
        "Content-Type": "application/json"}})
const c = await canceled.text()
setID(c)

}


return (
  <Layout>
<div>
  <Button style={{margin:"13px"}} onClick={()=> router.back()}>الرجوع للخلف</Button>
      <PageTitle>بيان ارسالية العمالة الذكور</PageTitle>
  
      <div className="grid gap-6 mb-8 md:grid-cols-2 ">
      </div>

      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableCell>اسم العميل</TableCell>
              <TableCell>التأمين</TableCell>
              <TableCell>عقد مساند الداخلي</TableCell>
              <TableCell>رقم التأشيرة</TableCell>
              <TableCell>رقم الهوية</TableCell>
              <TableCell>رقم الجوال</TableCell>
              <TableCell>رقم الجواز</TableCell>
              <TableCell>اسم العامل</TableCell>
              <TableCell>العمر</TableCell>
              <TableCell>الخبرة العملية</TableCell>
              <TableCell>حالة العقد</TableCell>
<TableCell>المدينة</TableCell>


<TableCell>رقم طلب التأشيرة</TableCell>
<TableCell>ملاحظات</TableCell>
<TableCell>عقد مساند الخارجي
</TableCell>
<TableCell>الجنسية</TableCell>
<TableCell>المكتب الخارجي</TableCell>
               <TableCell>تاريخ تقديم الطلب</TableCell>
               <TableCell>مدة الطلب</TableCell>
{/* 
<TableCell>الغاء العقد</TableCell>
<TableCell>انهاء العقد</TableCell> */}




            </tr>
          </TableHeader>
          <TableBody>
            {paginatedData?.map((e, i) => (
              <TableRow key={i}>

              <TableCell>
                
                  <span className="text-md">{e.fields["اســــم الـــعــمـــيـــل"]}</span>
                
                </TableCell>
              <TableCell>

                  <span className="text-md">{e.fields["التأمين"]}</span>

              </TableCell>
              <TableCell>
                
                  <span className="text-md">{e.fields["عقد مساند الداخلي"]}</span>
                
                </TableCell>
              <TableCell>
                
                  <span className="text-md">{e.fields["رقم التأشيرة"]}</span>
                
                
                </TableCell>
              <TableCell>
                
                
                  <span className="text-md">{e.fields["رقم الهوية"]}</span>
                
                </TableCell>
              <TableCell>
                
                  <span className="text-md">{e.fields["رقم الجوال"]}</span>
                
                </TableCell>
              <TableCell>
                  <span className="text-md">{e.fields["رقم جواز العاملة"]}</span>
                
                </TableCell>
              <TableCell>
                
                  <span className="text-md">{e.fields["أســـــم  الــعــــامــــل"]}</span>
                
                </TableCell>
              <TableCell>
                  <span className="text-md">{e.fields[" العمر "]}</span>
                
                </TableCell>
              <TableCell>
                  <span className="text-md">{e.fields["المهنة"]}</span>
                
                </TableCell>
              <TableCell>
                  <span className="text-md">{e.fields["حالة العقد"]}</span>
                
                </TableCell>
<TableCell>
  
                  <span className="text-md">{e.fields["المدينة"]}</span>


</TableCell>


<TableCell>
                  <span className="text-md">{e.fields["تاريخ تقديم الطلب"]}</span>
  

</TableCell>
<TableCell>
                  <span className="text-md">{e.fields["تاريخ اليوم"]}</span>
  
  
  </TableCell>
<TableCell>
                  <span className="text-md">{e.fields["مدة التقديم"]}</span>
  
</TableCell>
<TableCell>
                  <span className="text-md">{e.fields["المكتب الخارجي"]}</span>
  
  
  </TableCell>
<TableCell>
  
                  <span className="text-md">{e.fields["الجنسية"]}</span>
  </TableCell>
  <TableCell>
                  <span className="text-md">{e.fields["عقد مساند الخارجي"]}</span>
    
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

                </div>
 
  

</Layout>
)
}

export default FemaleWorkers