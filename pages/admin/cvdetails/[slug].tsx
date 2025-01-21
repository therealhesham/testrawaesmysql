//@ts-nocheck
//@ts-ignore

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from "next/router"
// import "../../"
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
  Input,
  Label,
} from '@roketid/windmill-react-ui'
import { EditIcon, TrashIcon } from 'icons'
import { useReactToPrint } from "react-to-print";
import response, { ITableData } from 'utils/demo/tableData'
import Layout from 'example/containers/Layout'
import { ClipLoader, ClockLoader, GridLoader } from 'react-spinners'
import Header from 'example/components/Header'
import generatePDF, { Resolution, Margin, Options } from "react-to-pdf";
import { PrinterFilled } from '@ant-design/icons'
import Cookies from 'js-cookie'
import axios from 'axios'
// import "../../api/admin"
const options: Options = {
  filename: "advanced-example.pdf",
  method: "save",
  // default is Resolution.MEDIUM = 3, which should be enough, higher values
  // increases the image quality but also the size of the PDF, so be careful
  // using values higher than 10 when having multiple pages generated, it
  // might cause the page to crash or hang.
  resolution: Resolution.EXTREME,
  page: {
    // margin is in MM, default is Margin.NONE = 0
    margin: Margin.SMALL,
    // default is 'A4'
    format: "letter",
    // default is 'portrait'
    orientation: "landscape"
  },
  canvas: {
    // default is 'image/jpeg' for better size performance
    mimeType: "image/jpeg",
    qualityRatio: 1
  },
  // Customize any value passed to the jsPDF instance and html2canvas
  // function. You probably will not need this and things can break,
  // so use with caution.
  overrides: {
    // see https://artskydj.github.io/jsPDF/docs/jsPDF.html for more options
    pdf: {
      compress: true
    },
    // see https://html2canvas.hertzen.com/configuration for more options
    canvas: {
      useCORS: true
    }
  }
};


// import { usePDF } from 'react-to-pdf'
// uses
// usePDF

const response2 = response.concat([]);
export default function Page() {
  const router = useRouter()
  // console.log(router.query.slug)
  const [data,setData]=useState([]);
  useEffect(() => {
if(!router.isReady) return;

    //     try{

// const token = Cookies.get("token")
//   const decoder = jwtDecode(token);
  
// console.log(decoder.idnumber)
//   } catch (error) {
//     router.replace("/login")
//   }

  (async function name() {
await axios.get(`../../api/cv/${router.query.slug}`).then(e=>setData(e.data))    

//      await fetch().then(response => response.json())
//      .then(json  => {
// setData(json)})
  })()
    


}, [router.isReady])
const getTargetElement = () => document.getElementById("cv");

const downloadPdf = () => generatePDF(getTargetElement, options);
 const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

return (   

<Layout>

{data.length>0? <div  id='cv' ref={componentRef}> <header >
<div style={{zIndex:-1}}><img  src='https://res.cloudinary.com/duo8svqci/image/upload/v1716924206/b5e8988f-ae8d-4f15-9eff-43e174b8d7a0.png'/></div>
  <div style={{marginTop:2}}>{data[0].fields["م"]} رقم السيرة الذاتية</div>
   </header>
<a ><button onClick={handlePrint}>Print PDF <PrinterFilled/></button></a>

   <div style={{display:"flex",flexDirection:"row",flexWrap: "nowrap"}}>
<div style={{flexBasis: "50%"}}>
<img 
src={data.length>0?data[0].fields.Picture[0].url:null}
      width={500}
      height={500}
      alt=""
/>
</div>
   <div  style={{direction:"rtl",display: "grid" ,gridTemplateColumns: "repeat(5, auto)"}}>

<div style={{direction:"rtl", display: "grid" ,gridTemplateColumns: "repeat(3, auto)",gridRowGap: "1px",gridColumnGap: "9px",alignItems:"center",width:"100%"}}>

        <Label className="mt-4">
          <span>الاسم</span>
          <Input className="mt-1" value={data[0].fields["Name - الاسم"]} />
        </Label>

<Label className="mt-4" style={{gridColumnStart:2,gridColumnEnd:4}}>
          <span>الجنسية</span>
          <Input className="mt-1" value={data[0].fields["Nationality copy"]} />
        </Label>
<Label className="mt-4">
          <span>تاريخ الميلاد</span>
          <Input className="mt-1" value={data[0].fields["date of birth - تاريخ الميلاد"]} />
        </Label>
<Label className="mt-4">
          <span>العمر</span>
          <Input className="mt-1" value={data[0].fields["age - العمر"]} />
        </Label>
<Label className="mt-4">
          <span>الديانة</span>
               <Input className="mt-1" value={data[0].fields["Religion - الديانة"]} />
        </Label>
<Label className="mt-4">
          <span>جواز السفر</span>
          <Input className="mt-1" value={data[0].fields["Religion - الديانة"]} />
        </Label>
<Label className="mt-4">
          <span>تاريخ الاصدار</span>
          <Input className="mt-1" value="تاريخ الاصدار" />
        </Label>

<Label className="mt-4">
          <span>تاريخ الانتهاء</span>
          <Input className="mt-1" value="تاريخ الانتهاء" />
        </Label>

<Label className="mt-4">
          <span>الحالة الاجتماعية</span>
          

          <Input className="mt-1" value={data[0].fields["marital status - الحالة الاجتماعية"]} />
        </Label>


<Label className="mt-4">
          <span>عدد الاطفال</span>
          <Input className="mt-1" value="عدد الاطفال" />
        </Label>



<Label className="mt-4">
          

          <span>الراتب</span>
          <Input className="mt-1"  value={data[0].fields["Salary - الراتب"]} />
        </Label>


<Label className="mt-4">
          <span>الدرجة العلمية</span>
          <Input className="mt-1" value="الدرجة العلمية" />
        </Label>


<Label className="mt-4">
          <span>العربية   </span>
          <Input className="mt-1" value="" />
        </Label>



<Label className="mt-4">
          <span>   الانجليزي</span>
          <Input className="mt-1" value="" />
        </Label>


{/* <div style={{}}> */}
<div style={{display :'grid',gridTemplateColumns: "repeat(2, auto)",gridColumnStart:1,gridColumnEnd:4}}>

<Label className="mt-4" style={{gridColumnStart:1,gridColumnEnd:3}}>
          <span>   سنوات وأماكن الخبرات</span>
          <Input className="mt-1" value={data[0].fields["Experience - الخبرة"]} />
        </Label>




<Label className="mt-4" >
          <span>   الغسيل</span>
          <Input className="mt-1" value={data[0].fields["laundry - الغسيل"]} />
        </Label>

<Label className="mt-4" >
          <span>   الكوي</span>
          
          <Input className="mt-1" value={data[0].fields["Ironing - كوي"]} />
        </Label>

<Label className="mt-4" >
  
          <span>التنظيف</span>
          <Input className="mt-1" value={data[0].fields["cleaning - التنظيف"]} />
        </Label>

<Label className="mt-4" >
          <span>العناية بالأطفال</span>
          

          <Input className="mt-1" value={data[0].fields["Babysitting - العناية بالأطفال"]}  />
        </Label>

<Label className="mt-4" >
          <span>رعاية كبار السن</span>
          <Input className="mt-1" value="" />
        </Label>



<Label className="mt-4" >
          <span>الطبخ</span>
          <Input className="mt-1" value={data[0].fields["Cooking - الطبخ"]} />
        </Label>



</div>



   
   </div>
   

   </div>

{/* </div> */}



</div>


    
 <footer>
<img  src='https://res.cloudinary.com/duo8svqci/image/upload/v1716924374/40a3153b-1b92-43c1-a1d9-d0476d37a0df.png'/>
  
  
  </footer>   </div>  :<GridLoader color='black'/>}
   
       </Layout>
)
}