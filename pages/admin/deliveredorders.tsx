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
  
  const [fulldata,setFulldata]=useState([])
  const resultsPerPage = 10
  const totalResults = fulldata.length
const router = useRouter()  
  const [paginatedData,setPaginatedData]=useState([])
  
  const [listType,setTypeList] = useState("workers")

function onPageChange(p: number) {
  
setPaginatedData(fulldata.slice((p - 1) * resultsPerPage, p * resultsPerPage))
    // setPage(p)
  }
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
// fetch('../api/deliveredorder',{method:"post",headers: {'Accept':'application/json',
//         "Content-Type": "application/json",
//       },body:JSON.stringify({deliveredorders})})

//       const e= await fetcher.text()
//       console.log(fetcher.status)
// if(fetcher.status == 200) return console.log("error");
// // errorfunc()




}, [])

// patqpqm8yUGAdhSoj.56e6d82c73f5ec39152c7212d8c8a0710856aeb10ba0e268a2bb06a5cf919b06
return (
    <Layout>

      <PageTitle>Foreign Offices</PageTitle>
      <div className="grid gap-6 mb-8 md:grid-cols-2 ">
      </div>

      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableCell>Office Name</TableCell>
              <TableCell>Location</TableCell>
              
              <TableCell>Fiscal</TableCell>
              <TableCell>Flag</TableCell>
              <TableCell>Registered CV</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {paginatedData?.map((e, i) => (
              <TableRow key={i}>
                
                <TableCell>
                  <span className="text-md">{e?.fields["External office - المكتب الخارجي"]}</span>

                </TableCell>
                <TableCell>
                  <span className="text-md">{e?.fields["الدولة"]}</span>


                  {/* <span className="text-md">{e?.fields.Status}</span> */}

                  {/* <Badge type={user.status}>{user.status}</Badge> */}
                </TableCell>
                
                <TableCell>
                  <span className="text-md">
                  <span className="text-md">{e?.fields["المالية"]}</span>

                    
                    {/* {new Date(user.date).toLocaleDateString()} */}
                  </span>
                </TableCell>

                <TableCell>
                  {/* <span className="text-md"> */}
                  <img className="text-md" src={e?.fields["العلم"][0].url} width="30px" height="20px"/>
                    
                    {/* {new Date(user.date).toLocaleDateString()} */}
                  {/* </span> */}
                </TableCell>
                <TableCell>
                 {e.fields["السير الذاتية"] ? <span className="text-md">
                 {e?.fields["السير الذاتية"].map(s=><Link href={"./cvdetails/"+s}><span className="text-md" style={{textDecorationLine:"underline",textDecorationColor:"blueviolet"}}>{s}</span></Link>)}  
                   
                  </span>:""}
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