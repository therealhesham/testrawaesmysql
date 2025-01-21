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
  TableCell,  TableBody,
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
import Layout from 'client/containers/Layout'
import { ClipLoader, ClockLoader, GridLoader } from 'react-spinners'
import Header from 'example/components/Header'
import generatePDF, { Resolution, Margin, Options } from "react-to-pdf";
import { PrinterFilled } from '@ant-design/icons'
import Cookies from 'js-cookie'
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
  const [data,setData]=useState({fields:{"Name - الاسم":null}});
  useEffect(() => {
    if(!router.isReady )return; 
    // if(!data) return;

(async function fecher() {
  try {
    
  const sss =await fetch("https://api.airtable.com/v0/app1mph1VMncBBJid/%D8%A7%D9%84%D8%B3%D9%8A%D8%B1%20%D8%A7%D9%84%D8%B0%D8%A7%D8%AA%D9%8A%D8%A9/"+router.query.slug,{method:"get",headers:{"Authorization":"Bearer patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d"}})
          const waiter = await sss.json()
          setData(waiter)

  } catch (error) {
   alert("Error Fetching Data ") 
  }
})()

    


}, [router.isReady])
console.log(router.isReady)
console.log(data)
const getTargetElement = () => document.getElementById("cv");

const downloadPdf = () => generatePDF(getTargetElement, options);
 const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

// const { toPDF, targetRef } = usePDF({filename: 'page.pdf'});
// Label
// console.log(data.fields["Name - الاسم"])
return (   

<>

{data.fields["Name - الاسم"] != null? <div  id='cv' ref={componentRef} style={{margin:"25px"}}> <header>

<img  src='https://res.cloudinary.com/duo8svqci/image/upload/v1716924206/b5e8988f-ae8d-4f15-9eff-43e174b8d7a0.png'/>
<p style={{zIndex:+99 ,top:2,fontSize:"2em"}}>{data.fields["م"]}</p>
   </header>

<a ><button onClick={handlePrint}>Print PDF <PrinterFilled/></button></a>

   <div style={{display:"flex",flexDirection:"row",flexWrap: "nowrap"}}>
<div style={{flexBasis: "50%"}}>
<img 
src={data.fields?data.fields.Picture[0].url:null}
      width={500}
      height={500}
      alt=""
/>
</div>
   <div  style={{direction:"rtl",display: "grid" ,gridTemplateColumns: "repeat(5, auto)"}}>

    {/* <div style={{gridColumnStart:4,gridColumnEnd:6}}> */}
{/* <Image 
src=
      width={500}
      height={500}
      alt="Picture of the author"
/> */}


    {/* </div> */}
<div style={{direction:"rtl", display: "grid" ,gridTemplateColumns: "repeat(3, auto)",gridRowGap: "1px",gridColumnGap: "9px",alignItems:"center",width:"100%"}}>
     <Label className="mt-4">
          <span>ID</span>
          {data.fields["Name - الاسم"]?<Input className="mt-1" value={data.fields["م"]} />:null}
        </Label>


        <Label className="mt-4">
          <span>الاسم</span>
          {data.fields["Name - الاسم"]?<Input className="mt-1" value={data.fields["Name - الاسم"]} />:null}
        </Label>

<Label className="mt-4" style={{gridColumnStart:3,gridColumnEnd:4}}>
          <span>الجنسية</span>
          <Input className="mt-1" value={data.fields["Nationality copy"]} />
        </Label>
<Label className="mt-4">
          <span>تاريخ الميلاد</span>
          <Input className="mt-1" value={data.fields["date of birth - تاريخ الميلاد"]} />
        </Label>
<Label className="mt-4">
          <span>العمر</span>
          <Input className="mt-1" value={data.fields["age - العمر"]} />
        </Label>
<Label className="mt-4">
          <span>الديانة</span>
               <Input className="mt-1" value={data.fields["Religion - الديانة"]} />
        </Label>
{/* <Label className="mt-4"> */}
          {/* <span>جواز السفر</span> */}
          {/* <Input className="mt-1" value={data.fields["Religion - الديانة"]} /> */}
        {/* </Label> */}
{/* <Label className="mt-4">
          <span>تاريخ الاصدار</span>
          <Input className="mt-1" value="تاريخ الاصدار" />
        </Label> */}

{/* <Label className="mt-4">
          <span>تاريخ الانتهاء</span>
          <Input className="mt-1" value="تاريخ الانتهاء" />
        </Label> */}

<Label className="mt-4">
          <span>الحالة الاجتماعية</span>
          

          <Input className="mt-1" value={data.fields["marital status - الحالة الاجتماعية"]} />
        </Label>


{/* <Label className="mt-4">
          <span>عدد الاطفال</span>
          <Input className="mt-1" value="عدد الاطفال" />
        </Label>
 */}


<Label className="mt-4">
          

          <span>الراتب</span>
          <Input className="mt-1"  value={data.fields["Salary - الراتب"]} />
        </Label>


{/* <Label className="mt-4">
          <span>الدرجة العلمية</span>
          <Input className="mt-1" value="الدرجة العلمية" />
        </Label>

 */}
<Label className="mt-4">
          <span>العربية   </span>
          <Input className="mt-1" value={data.fields["Arabic -  العربية"]} />
        </Label>



<Label className="mt-4">
          <span>   الانجليزي</span>
          <Input className="mt-1" value={data.fields["English - الانجليزية"]} />
        </Label>


{/* <div style={{}}> */}
<div style={{display :'grid',gridTemplateColumns: "repeat(2, auto)",gridColumnStart:1,gridColumnEnd:4}}>

<Label className="mt-4" style={{gridColumnStart:1,gridColumnEnd:3}}>
          <span>   سنوات وأماكن الخبرات</span>
          <Input className="mt-1" value={data.fields["Experience - الخبرة"]} />
        </Label>




<Label className="mt-4" >
          <span>   الغسيل</span>
          <Input className="mt-1" value={data.fields["laundry - الغسيل"]} />
        </Label>

<Label className="mt-4" >
          <span>   الكوي</span>
          
          <Input className="mt-1" value={data.fields["Ironing - كوي"]} />
        </Label>

<Label className="mt-4" >
  
          <span>التنظيف</span>
          <Input className="mt-1" value={data.fields["cleaning - التنظيف"]} />
        </Label>

<Label className="mt-4" >
          <span>العناية بالأطفال</span>
          

          <Input className="mt-1" value={data.fields["Babysitting - العناية بالأطفال"]}  />
        </Label>

<Label className="mt-4" >
          <span>رعاية كبار السن</span>
          <Input className="mt-1" value="" />
        </Label>



<Label className="mt-4" >
          <span>الطبخ</span>
          <Input className="mt-1" value={data.fields["Cooking - الطبخ"]} />
        </Label>



</div>



   
   </div>
   

   </div>

{/* </div> */}



</div>


    
 <footer>
<img  src='https://res.cloudinary.com/duo8svqci/image/upload/v1716924374/40a3153b-1b92-43c1-a1d9-d0476d37a0df.png'/>
  
  
  </footer>   </div>  :<div style={{display:'flex',justifyContent:"center"}}><GridLoader color='black'/></div>}
   
       </>
)
}