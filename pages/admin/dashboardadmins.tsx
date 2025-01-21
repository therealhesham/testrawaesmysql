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
  Button,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  TableFooter,
  Avatar,
  Badge,
  Pagination,
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
  Input,
} from '@roketid/windmill-react-ui'
// jwtDecode

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
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

function Employees() {
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
  const [updater,setUpdater]=useState("")
  const[role,setrole]=useState("")
  const [username,setusername]=useState("")
  const [idnumber,setidnumber]=useState(0)
  const [fulldata,setFulldata]=useState([])
  const resultsPerPage = 10
  const totalResults = fulldata.length
  const router = useRouter()  
  const [paginatedData,setPaginatedData]=useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
 const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)

  const [listType,setTypeList] = useState("workers")


function openModal() {
    setIsModalOpen(true)
  }
  function closeModal() {
    setIsModalOpen(false)
  }



function onPageChange(p: number) {
  
setPaginatedData(fulldata.slice((p - 1) * resultsPerPage, p * resultsPerPage))
    // setPage(p)
  }
  // on page change, load new sliced data
  // here you would make another server request for new data
const errorfunc=()=>{
openErrorModal()
}
const truefunc=(id)=>{
  setUpdater(id+new Date())
  setDeleter(id)
  openModal();
  
}
const [IDDelete,setDeleter]=useState("")
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
     await fetch("../api/admins").then(response => response.json())
  .then(json  => {
    setFulldata(json)
} 

)
}
names()

} catch (error) {
  console.log(error)
}  

}, [IDDelete])

 function openErrorModal() {
    setIsErrorModalOpen(true)
  }
  function closeErrorModal() {
    setIsErrorModalOpen(false)
  }
const Delete =async (id)=>{

  
  const fetcher = await fetch('../api/deletadmin',{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json",
      },body:JSON.stringify({id})})

      const e= await fetcher.text()
      console.log(fetcher.status)
if(fetcher.status == 200) return truefunc(id);
errorfunc()


}

const update =async (id)=>{

  
  const fetcher = await fetch('../api/updateadmin',{method:"post",headers: {'Accept':'application/json',
        "Content-Type": "application/json",
      },body:JSON.stringify({id,username,idnumber,role})})

      const e= await fetcher.text()
if(fetcher.status == 200) return truefunc(id);
errorfunc()


}




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
        <ModalHeader>تم ادخال </ModalHeader>
        <ModalBody>
          تم تسجيل البيانات بنجاح
        </ModalBody>
        <ModalFooter>
          <Button className="w-full sm:w-auto" layout="outline" onClick={closeModal}>
            Close
          </Button>
         
        </ModalFooter>
      </Modal>

      <PageTitle>قائمة المديرين</PageTitle>
      <span> المشرفين فقط يمكنهم حذف او تغيير الادوار</span>
      <div className="grid gap-6 mb-8 md:grid-cols-2 ">
      </div>

      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableCell>الاسم الثلاثي</TableCell>
              
              <TableCell>الدور الوظيفي </TableCell>
              <TableCell>الرقم التعريفي</TableCell>
              
              <TableCell>حذف</TableCell>
              <TableCell> تعديل البيانات</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {fulldata?.map((e, i) => (
              <TableRow key={i}>
                
                <TableCell>
                 { updater == e.id ?<Input  value={username} onChange={(e)=>setusername(e.target.value)}/>:<span className="text-md">{e.username}</span> }
                </TableCell>
                <TableCell>
                 { updater == e.id ?<Input  value={role} onChange={(e)=>setrole(e.target.value)}/>:<span className="text-md">{e.role}</span> }


                  {/* <span className="text-md">{e?.fields.Status}</span> */}

                  {/* <Badge type={user.status}>{user.status}</Badge> */}
                </TableCell>
                
                <TableCell>

                 { updater == e.id ?<Input  value={e.idnumber} onChange={(e)=>setIdnumber(e.target.value)}/>:<span className="text-md">{e.idnumber}</span> }


                    
                </TableCell>

                <TableCell>
                 {updater==e.id? <Button  style={{backgroundColor:'yellowgreen'}} onClick={()=>setUpdater(e.id + new Date())}>الغاء التعديل </Button>:<Button style={{backgroundColor:'red'}} onClick={()=>Delete(e.id)}>حذف </Button>}
                </TableCell>


  <TableCell>
                 
                 
                 {updater==e.id? <Button  style={{backgroundColor:'yellowgreen'}} onClick={()=>update(e.id)}>ارسال التعديل </Button>:<Button  onClick={()=>{
                  setusername(e.username)
                  setidnumber(e.idnumber)
                  setrole(e.role)
                  
                  setUpdater(e.id)}}>تعديل </Button>}
                 
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

                
    </Layout>
  )
}

export default Employees