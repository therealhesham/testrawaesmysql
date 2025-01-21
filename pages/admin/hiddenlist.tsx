// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Doughnut, Line, Pie } from "react-chartjs-2";
import CTA from "example/components/CTA";
import InfoCard from "example/components/Cards/InfoCard";
import Style from "../../styles/Home.module.css";
import dayjs from "dayjs";
// Rating
import ChartCard from "example/components/Chart/ChartCard";
import ChartLegend from "example/components/Chart/ChartLegend";
import PageTitle from "example/components/Typography/PageTitle";
import RoundIcon from "example/components/RoundIcon";
import Layout from "example/containers/Layout";
import response, { ITableData } from "utils/demo/tableData";
import { ChatIcon, CartIcon, MoneyIcon, PeopleIcon } from "icons";
// import"
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Input,
  TableBody,
  TableContainer,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  TableFooter,
  Button,
  Avatar,
  Badge,
  Pagination,
} from "@roketid/windmill-react-ui";

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
import { Rating } from "@mui/material";

const rates = [
  "inner - مبتدأ",
  "Beginner - مبتدأ",
  "Intermediate - جيد",
  "Advanced - جيد جداً",
  "Expert - ممتاز",
];

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

  const openCvmodal = (cvdata) => {
    setData(cvdata);
    setcvopen(true);
  };
  const closeCvModal = () => {
    setcvopen(false);
  };
  const [isCvModalOpen, setcvopen] = useState(false);

  const Unhide = async (id) => {
    const fetcher = await fetch("../api/unhide", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id }),
    });

    const e = await fetcher.text();
    if (fetcher.status == 200) {
      return setDeletedid(id);
    } // console.log(fetcher.status)
    alert("خطأ");
  };

  function onPageChange(p: number) {
    setPaginatedData(
      fulldata.slice((p - 1) * resultsPerPage, p * resultsPerPage)
    );
    // setPage(p)
  }
  // on page change, load new sliced data
  // here you would make another server request for new data
  const [deletedid, setDeletedid] = useState("");

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
        await fetch("../api/hiddenlist")
          .then((response) => response.json())
          .then(
            (json) => {
              json ? setLength(json.length) : "";
              // console.log('parsed json', json) // access json.body here
              setFulldata(json);
              json
                ? setPaginatedData(
                    json?.slice(0 * resultsPerPage, page * resultsPerPage)
                  )
                : console.log("e");
              // setData(json)
              // const arr=[];
              // json?.length>0?json.map(e=>{if(!arr.includes(e.fields.office)) arr.push(e.fields.office)}):console.log(json.length)
              // setofficelist(arr)
            }
            // names();
          );
      }
      names();
    } catch (error) {
      console.log(error);
    }
  }, [deletedid]);


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

  return (
    <Layout>
      <PageTitle>قائمة العاملات التي تم اخفائها عن واجهة العميل </PageTitle>

      <div style={{ display: "inline-flex" }}>
        {" "}
        <Input
          placeholder="البحث بالاسم او رقم السيرة الذاتية"
          className="mt-1 "
          style={{ width: "180px" }}
          onChange={(e) => {
            filter(e.target.value);
            setCVnumber();
          }}
        />
      </div>
      <div className="grid gap-6 mb-8 md:grid-cols-2 "></div>

      {data.fields ? (
        <Modal isOpen={isCvModalOpen} onClose={closeCvModal}>
          <ModalHeader>{`Details ${data.fields["م"]}`}</ModalHeader>
          <ModalBody>
            {/* <div style={{width:"95%",display:"flex",justifyContent:"center",flexDirection:"column"}}> */}
            {/* <div style={{display:"flex",marginTop:"12px",marginLeft:"auto",justifyContent:"center",marginRight:"auto",width:"60%",backgroundColor:"white"}}   className="card card-compact card-side w-100 bg-base-100 shadow-xl"  > */}

            <div
              className="card-body"
              style={{
                borderRadius: "10px",
                display: "flex",
                flexDirection: "row",
              }}
            >
              <div className="pic">
                <div style={{ width: "80px", height: "70px" }}>
                  <div
                    style={{
                      right: "15px",
                      cursor: "pointer",
                      top: "10px",
                      position: "absolute",
                    }}
                  ></div>
                  <div>
                    {data.fields.Picture ? (
                      <img src={data.fields.Picture[0].url} />
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="card-title" style={{ marginTop: "12px" }}>
                  {data.fields["م"]}
                </h2>

                <h2 className="card-title">{data.fields["Name - الاسم"]}</h2>
                <div className="textcard">
                  {/* data.fields[ksd["age - العمر"] }
      {/* <p  >{data.fields['age - العمر']?data.fields['age - العمر']:""}</p> */}
                  {data.fields["marital status - الحالة الاجتماعية"] ? (
                    <h1 className={Style["almarai-bold"]}>الحالة الاجتماعية</h1>
                  ) : null}

                  <h1>{data.fields["marital status - الحالة الاجتماعية"]}</h1>
                  {/* <p  >{data.fields["External office - المكتب الخارجي"]}</p> */}
                  {data.fields["Education - التعليم"] ? (
                    <h1 className={Style["almarai-bold"]}>التعليم</h1>
                  ) : null}

                  <h1>{data.fields["Education - التعليم"]}</h1>
                  {data.fields["Nationality copy"] ? (
                    <h1 className={Style["almarai-bold"]}>الجنسية</h1>
                  ) : null}

                  <h1>{data.fields["Nationality copy"]}</h1>
                  {data.fields["Salary - الراتب"] ? (
                    <h1 className={Style["almarai-bold"]}>الراتب</h1>
                  ) : null}

                  <h1>{data.fields["Salary - الراتب"]} sar</h1>
                  {data.fields["Religion - الديانة"] ? (
                    <h1 className={Style["almarai-bold"]}>الديانة</h1>
                  ) : null}

                  <h1>{data.fields["Religion - الديانة"]}</h1>
                  {data.fields["date of birth - تاريخ الميلاد"] ? (
                    <h1 className={Style["almarai-bold"]}>العمر</h1>
                  ) : null}

                  <h1>
                    {Math.ceil(
                      dayjs(new Date()).diff(
                        data.fields["date of birth - تاريخ الميلاد"]
                      ) / 31556952000
                    )}
                  </h1>
                  <strong className="card-title">المهارات</strong>
                  {/* <div className="rating rating-sm"> */}

                  {/* </div> */}

                  <strong className="card-title">اللغات</strong>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-around",
                      alignContent: "space-around",
                      justifyItems: "center",
                      flexDirection: "row",
                      width: "50%",
                    }}
                  >
                    <div>
                      {" "}
                      <h4>اللغة العربية</h4>
                      {rates.map((e, i) =>
                        data.fields["Arabic -  العربية"] == e ? (
                          <Rating
                            aria-label={e}
                            name="half-rating"
                            defaultValue={i + 1}
                          />
                        ) : (
                          console.log(e)
                        )
                      )}
                    </div>
                    <div>
                      <h4>اللغة الانجليزية</h4>
                      {rates.map((e, i) =>
                        data.fields["English - الانجليزية"] == e ? (
                          <Rating
                            aria-label={e}
                            name="half-rating"
                            defaultValue={i + 1}
                          />
                        ) : (
                          console.log(e)
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-around",
                  alignContent: "space-around",
                  justifyItems: "center",
                  flexDirection: "row",
                  width: "50%",
                }}
              >
                <div>
                  <h4>الغسيل</h4>{" "}
                  {rates.map((e, i) =>
                    data.fields["laundry - الغسيل"] == e ? (
                      <Rating name="half-rating" defaultValue={i + 1} />
                    ) : (
                      console.log(e)
                    )
                  )}
                </div>
                <div>
                  <h4>الكوي</h4>{" "}
                  {rates.map((e, i) =>
                    data.fields["Ironing - كوي"] == e ? (
                      <Rating name="half-rating" defaultValue={i + 1} />
                    ) : (
                      console.log(e)
                    )
                  )}
                </div>
                <div>
                  <h4>التنظيف</h4>{" "}
                  {rates.map((e, i) =>
                    data.fields["cleaning - التنظيف"] == e ? (
                      <Rating name="half-rating" defaultValue={i + 1} />
                    ) : (
                      console.log(e)
                    )
                  )}
                </div>
                <div>
                  <h4>الطبخ</h4>{" "}
                  {rates.map((e, i) =>
                    data.fields["Cooking - الطبخ"] == e ? (
                      <Rating name="half-rating" defaultValue={i + 1} />
                    ) : (
                      console.log(e)
                    )
                  )}
                </div>

                <div>
                  <h4>الخياطة</h4>{" "}
                  {rates.map((e, i) =>
                    data.fields["sewing - الخياطة"] == e ? (
                      <Rating name="half-rating" defaultValue={i + 1} />
                    ) : (
                      console.log(e)
                    )
                  )}
                </div>
              </div>
            </div>
            {/* </div> */}

            {/* </div> */}
          </ModalBody>
          <ModalFooter>
            <Button
              className="w-full sm:w-auto"
              layout="outline"
              onClick={closeCvModal}
            >
              Close
            </Button>

            <Button
              className="w-full sm:w-auto"
              layout="primary"
              onClick={() =>
                openbookModal(
                  data.fields["م"],
                  data.id,
                  data.fields["Name - الاسم"]
                )
              }
            >
              BOOK
            </Button>
          </ModalFooter>
        </Modal>
      ) : (
        ""
      )}

      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableCell>رقم السي في</TableCell>
              <TableCell>اسم العامل</TableCell>
              <TableCell>الحالة الاجتماعية</TableCell>
              <TableCell>الجنسية</TableCell>
              <TableCell>الديانة</TableCell>
              <TableCell>حالة الحجز</TableCell>
              <TableCell>حجز</TableCell>

              <TableCell>الغاء الاخفاء</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {paginatedData?.map((e, i) => (
              <TableRow key={i}>
                <TableCell>
                  {e?.fields["م"]}
                  {/* <Badge type={user.status}>{user.status}</Badge> */}
                </TableCell>
                <TableCell>
                  <div
                    className="flex items-center text-sm"
                    style={{ width: "200px" }}
                  >
                    <div>
                      {e?.fields["Name - الاسم"] ? (
                        <p
                          style={{
                            textDecorationLine: "underline",
                            cursor: "pointer",
                          }}
                          onClick={() => openCvmodal(e)}
                          className="font-semibold"
                        >
                          {e?.fields["Name - الاسم"]}
                        </p>
                      ) : (
                        ""
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-400"></p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {e?.fields["marital status - الحالة الاجتماعية"] ? (
                    <span className="text-sm">
                      {e?.fields["marital status - الحالة الاجتماعية"]}
                    </span>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    <span className="text-sm">
                      {"Nationality copy" in e.fields
                        ? e.fields["Nationality copy"]
                        : ""}
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  {/* <Link href={"/admin/officeinfo/"+e?.fields["External office - المكتب الخارجي"]}  >                  */}
                  {/* <span className="text-sm"> */}
                  <span className="text-sm">
                    {e?.fields["Religion - الديانة"]
                      ? e?.fields["Religion - الديانة"]
                      : ""}
                  </span>

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
                  <Button
                    disabled={e?.fields["حالة الحجز"] == null ? false : true}
                    onClick={() => {
                      bookmodal(e.fields["م"], e.id, e.fields["Name - الاسم"]);
                    }}
                    style={{
                      cursor: !e?.fields["حالة الحجز"] ? "pointer" : "none",
                      backgroundColor: "wheat",
                      color: "black",
                    }}
                  >
                    Book CV{" "}
                  </Button>
                </TableCell>

                <TableCell>
                  <Button
                    onClick={() => {
                      Unhide(e.id);
                    }}
                    style={{ backgroundColor: "teal" }}
                  >
                    الغاء
                  </Button>
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
  );
}

export default Employees;
