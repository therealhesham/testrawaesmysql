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
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

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


function onPageChange(p: number) {
    // json?setData(json?.slice((page - 1) * resultsPerPage, page * resultsPerPage)):console.log("e");
setPaginatedData(fulldata.slice((p - 1) * resultsPerPage, p * resultsPerPage))
    // setPage(p)
  }

const [id,setID] = useState("")
  // on page change, load new sliced data
  // here you would make another server request for new data
  useEffect(() => {
  try {

    const token = Cookies.get("token")
  const decoder = jwtDecode(token);
      if(!decoder.admin)return router.replace("/client");
  
// console.log(decoder.idnumber)
  } catch (error) {
    router.replace("/client")
  }

  
  
    try {
    
  
      async function names( )  {
     await fetch("../api/femaleworkerslist").then(response => 
      
      
      response.json())
  .then(json  => {
    json?setLength(json.length):"";
    // console.log('parsed json', json) // access json.body here
    setFulldata(json)
    json?setPaginatedData(json?.slice((0) * resultsPerPage, page * resultsPerPage)):console.log("e");
 
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
const canceled = await fetch("../api/cancelfemaleworker",{method:"POST",body:JSON.stringify({id:e}),headers:{ 'Accept':'application/json',
        "Content-Type": "application/json"}})
const c = await canceled.text()
setID(c)
}
const endRecord=async(e)=>{
const canceled = await fetch("../api/endfemaleworker",{method:"POST",body:JSON.stringify({id:e}),headers:{ 'Accept':'application/json',
        "Content-Type": "application/json"}})
const c = await canceled.text()
setID(c)

}





return (
  // <Layout>

<div>
  <Button style={{margin:"13px"}} onClick={()=> router.back()}>الرجوع للخلف</Button>
      <PageTitle>العاملات النساء</PageTitle>
  
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
              <TableCell>اسم العاملة</TableCell>
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
<TableCell>مدة التقديم</TableCell>
<TableCell>الغاء العقد</TableCell>
<TableCell>انهاء العقد</TableCell>




            </tr>
          </TableHeader>
          <TableBody>
            {paginatedData?.map((e, i) => (
              <TableRow key={i}>


              <TableCell>
                  <span className="text-md">{e?.clientname}</span>
                
              </TableCell>
              <TableCell>
                  <span className="text-md">{e.insurance}</span>
                
                </TableCell>
              <TableCell>
                                 <span className="text-md">{e.musanedContract}</span>

                
                </TableCell>
              <TableCell>
                  <span className="text-md">{e.visanumber}</span>
                
                
                </TableCell>
              <TableCell>
                  <span className="text-md">{e.idnumber}</span>


                </TableCell>
              <TableCell>
                  <span className="text-md">{e.mobilenumber}</span>
                

              </TableCell>
              <TableCell>
                  <span className="text-md">{e.passportnumber}</span>
                
                
                </TableCell>
              <TableCell>
                  <span className="text-md">{e.workername}</span>
                
                
                </TableCell>
              <TableCell>

                  <span className="text-md">{e.age}</span>

              </TableCell>
              <TableCell>

                  <span className="text-md">{e.experience}</span>

              </TableCell>
              <TableCell>
                  <span className="text-md">{e.contractstatus}</span>
                
                </TableCell>
<TableCell>
  
                  <span className="text-md">{e.city}</span>


</TableCell>


<TableCell>
                  <span className="text-md">{e.visaordernumber}</span>
  


</TableCell>
<TableCell>
                  <span className="text-md">{e.notes}</span>
  
  
  </TableCell>
<TableCell>
                  <span className="text-md">{e.externalmusanedcontract}</span>
  
</TableCell>
<TableCell>
  
                  <span className="text-md">{e.nationality}</span>
  
  
  </TableCell>
<TableCell>
                  <span className="text-md">{e.externaloffice}</span>
  
  
  </TableCell>
              <TableCell>
                
                  <span className="text-md">{e.orderDate}</span>
                
                </TableCell>

<TableCell>
{((dayjs(new Date()).diff(e.orderDate))/100000000).toFixed()}

</TableCell>

                <TableCell>
                 

<DeleteOutlined onClick={()=>cancelRecord(e.id)} style={{color:"dodgerblue"}} />
                </TableCell>

                <TableCell>
                 

<DeleteOutlined onClick={()=>endRecord(e.id)} style={{color:"red"}} />
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
 
  )
}

export default FemaleWorkers