// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Doughnut, Line, Pie } from "react-chartjs-2";
import CTA from "example/components/CTA";
import InfoCard from "example/components/Cards/InfoCard";
import ChartCard from "example/components/Chart/ChartCard";
import ChartLegend from "example/components/Chart/ChartLegend";
import PageTitle from "example/components/Typography/PageTitle";
import RoundIcon from "example/components/RoundIcon";
import Layout from "example/containers/Layout";
// import '../'
import response, { ITableData } from "utils/demo/tableData";
import { ChatIcon, CartIcon, MoneyIcon, PeopleIcon } from "icons";
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
} from "@roketid/windmill-react-ui";
// jwtDecode

import {
  lineOptions,
  doughnutLegends,
  lineLegends,
} from "utils/demo/chartsData";
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
} from "chart.js";
import Link from "next/link";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

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
  );

  const [page, setPage] = useState(1);
  const [length, setLength] = useState(0);
  const [data, setData] = useState([]);
  const [time, setTime] = useState(0);
  const [office, setOffice] = useState([]);

  const [fulldata, setFulldata] = useState([]);
  const resultsPerPage = 10;
  const totalResults = fulldata.length;
  const router = useRouter();
  const [paginatedData, setPaginatedData] = useState([]);

  const [listType, setTypeList] = useState("workers");

  function onPageChange(p: number) {
    setPaginatedData(
      fulldata.slice((p - 1) * resultsPerPage, p * resultsPerPage)
    );
    // setPage(p)
  }
  // on page change, load new sliced data
  // here you would make another server request for new data
  useEffect(() => {
    try {
      const token = Cookies.get("token");
      const decoder = jwtDecode(token);
      if (!decoder.admin) return router.replace("/client");

      // console.log(decoder.idnumber)
    } catch (error) {
      router.replace("/client");
    }

    try {
      async function names() {
        await fetch("../api/addofficeprisma")
          .then((response) => response.json())
          .then((json) => {
            json ? setLength(json.length) : "";
            setFulldata(json);
            json
              ? setPaginatedData(
                  json?.slice(
                    (page - 1) * resultsPerPage,
                    page * resultsPerPage
                  )
                )
              : console.log("e");
          });
      }
      names();
    } catch (error) {
      console.log(error);
    }
  }, []);

  return (
    <Layout>
      <PageTitle>المكاتب الخارجية</PageTitle>
      <div className="grid gap-6 mb-8 md:grid-cols-2 "></div>

      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableCell>Office Name</TableCell>
              <TableCell>Location</TableCell>

              {/* <TableCell>Fiscal</TableCell> */}
              <TableCell>Flag</TableCell>

              <TableCell>Generate Form</TableCell>
              {/* <TableCell>Registered CV</TableCell> */}
            </tr>
          </TableHeader>
          <TableBody>
            {fulldata?.map((e, i) => (
              <TableRow key={i}>
                <TableCell>
                  <span className="text-md">
                    {e?.fields["External office - المكتب الخارجي"]}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-md">{e?.fields["الدولة copy"]}</span>

                  {/* <span className="text-md">{e?.fields.Status}</span> */}

                  {/* <Badge type={user.status}>{user.status}</Badge> */}
                </TableCell>

                <TableCell>
                  {/* <span className="text-md"> */}
                  {e?.fields["العلم"] ? (
                    <img
                      className="text-md"
                      src={e?.fields["العلم"][0].url}
                      width="30px"
                      height="20px"
                    />
                  ) : (
                    ""
                  )}
                  {/* {new Date(user.date).toLocaleDateString()} */}
                  {/* </span> */}
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        window.location.origin + "/newcv/" + e.id
                      );
                      alert("Link Copied");
                    }}
                  >
                    Generate Form for office{" "}
                  </Button>
                </TableCell>
                {/* <span ></span> */}

                {/* <TableCell>
                 {e.fields["السير الذاتية"] ? <span className="text-md">
                 {e?.fields["السير الذاتية"].map(s=>
                 
                 <li><Link href={"../client/cvdetails/"+s}><span className="text-md" style={{textDecorationLine:"underline",textDecorationColor:"blueviolet"}}>{s}</span></Link></li>)}  
                   
                  </span>:""}
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TableFooter></TableFooter>
      </TableContainer>
    </Layout>
  );
}

export default Employees;
