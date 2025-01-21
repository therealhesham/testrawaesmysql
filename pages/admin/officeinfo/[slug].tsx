//@ts-nocheck
//@ts-ignore

import React, { useState, useEffect } from 'react'
import { useRouter } from "next/router"
// usePDF
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
} from '@roketid/windmill-react-ui'

import { EditIcon, TrashIcon } from 'icons'
import response, { ITableData } from 'utils/demo/tableData'
import Layout from 'example/containers/Layout'
import { ClipLoader, ClockLoader } from 'react-spinners'
import { usePDF } from 'react-to-pdf'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import Link from 'next/dist/client/link'


export default function Page() {
  const router = useRouter()
  // console.log(router.query.slug)
  const [data,setData]=useState([]);
  
  useEffect(() => {
    if(!router.isReady)return;
      try {
        const token = Cookies.get("token")
  const decoder = jwtDecode(token);
(async function name() {
     await fetch(`../../api/admin/${router.query.slug}`).then(response => response.json())
     .then(json  => {
// console.log(json)
      setData(json)
  } 
  // names();
  
)
  })()
    

  } catch (error) {
    // router.replace("/login")
  }
  


}, [router.isReady])

async function fecher(id) {
  
  const sss =await fetch("https://api.airtable.com/v0/app1mph1VMncBBJid/%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%20%D8%A7%D9%84%D8%B0%D8%A7%D8%AA%D9%8A%D8%A9/"+id,{method:"get",headers:{"Authorization":"Bearer patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d"}})
          const waiter = await sss.json()
          return waiter.field["Name - الاسم"]


}
//@ts-ignore
// ClockLoader

return (   <Layout>
      {/* <PageTitle>Tables</PageTitle> */}

      {/* <CTA /> */}

      <SectionTitle>info inserted by company {router.query.slug}</SectionTitle>
      {data.length>0?
      <TableContainer className="mb-8">
        <Table>
          <TableHeader>
            <tr>
              {/* <TableCell>العامل</TableCell> */}
              <TableCell>الجنسية</TableCell>
              <TableCell>السير الذاتية</TableCell>
              {/* <TableCell>الحالة الاجتماعية</TableCell> */}
            </tr>
          </TableHeader>
          <TableBody>
            {data?.map((user) => (
              <TableRow >
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Avatar className="hidden mr-3 md:block" src={user?.fields["العلم"][0].url} alt="User avatar" />
                    <div>
                  <span className="text-sm"> {user.fields["الدولة copy"]}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                      {user?.fields["السير الذاتية"]?<p className="font-semibold">{user?.fields["السير الذاتية"].map(e=>
                        
                    <li>                        <Link href={"/client/cvdetails/"+e}>
                        <span>{e}</span>
                        </Link>
</li>    
                        )}</p>:""}
                </TableCell>
               
                {/* <TableCell>
                  <span className="text-sm"> {user.fields.maritalstatus}</span>
                </TableCell>
                */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableFooter>
          {/* <Pagination
            totalResults={totalResults}
            resultsPerPage={resultsPerPage}
            onChange={onPageChangeTable1}
            label="Table navigation"
          /> */}
        </TableFooter>
      </TableContainer>
:<ClipLoader color="#003749" />}
    </Layout>
)
}