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
  Select,
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
import axios from 'axios'
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
  
  const[nationality,setNationality]=useState("") 
      const[birthDate,setBirthDate]=useState("") 
          const [passport,setPassport] = useState("")
          const [salary,setSalary] = useState(0)
          const [degreeSentific,setDegree] = useState("")
          const [arabic,setArabic] = useState("")
          const [english,setEnglish] = useState("")
// const [experienceYears,setExperienceYears] = useState("") 
    const [laundry,setLaundy] = useState("")
            const [ironing,setIroning] = useState("")
              const [cooking,setCooking] = useState("")
               const[religion,setReligion]=useState("") 
                    const [issueDate,setIssueDate] = useState("") 
                   const [endDate,setEndDate] = useState("") 
                   const [maritalStatus,setMaritalStatus] = useState("") 
                   const [numberOFChildren,setNumnerOfChildren] = useState(0) 


        const [cleaning,setCleaning] = useState("")

const [cloudinaryImage,setCloudinaryImage]=useState("")
const [babySetting,setBabySetting]=useState("")
const [oldCare,setoldCare]=useState("") 
  const [data,setData]=useState({fields:{"External office - المكتب الخارجي":null}});
const [fullname,setFullName]=useState("")
  useEffect(() => {
    if(!router.isReady )return; 
    // if(!data) return;

(async function fecher() {
  
  const sss =await fetch("https://api.airtable.com/v0/app1mph1VMncBBJid/%D8%A7%D9%84%D9%85%D9%83%D8%A7%D8%AA%D8%A8%20%D8%A7%D9%84%D8%AE%D8%A7%D8%B1%D8%AC%D9%8A%D8%A9/"+router.query.slug,{method:"get",headers:{"Authorization":"Bearer patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d"}})
          const waiter = await sss.json()
console.log(waiter)
          setData(waiter)

})()

    


}, [router.isReady])
const [sewing,setSewing]=useState("")
const [education,setEducation]=useState("")
const [height,setHeight]=useState(0)
const [weight,setWeight]=useState(0)

const body = [{
        "fields": {
        "Picture": [
          {
            "url":cloudinaryImage
          }
        ],
        "External office - المكتب الخارجي": [
          router.query.slug
        ],
        "Name - الاسم": fullname,
        //  "Nationality copy": data.fields["الدولة copy"],
        "Religion - الديانة": religion,
        "marital status - الحالة الاجتماعية": maritalStatus,
        "weight - الوزن": weight,
        "height - الطول": height,
        "Education -  التعليم": education,
        "Experience - الخبرة":"Intermediate | مدربة بخبرة متوسطة",
        "Passport number - رقم الجواز": passport,
        "Arabic -  العربية": arabic,
        "English - الانجليزية": english,
        "Salary - الراتب": salary,
        "laundry - الغسيل": laundry,
        "Ironing - كوي": ironing,
        "cleaning - التنظيف": cleaning,
        "Cooking - الطبخ": cooking,
        "sewing - الخياطة": sewing,
        "Babysitting - العناية بالأطفال": babySetting,
        "date of birth - تاريخ الميلاد": birthDate
      }
    
    }]
    
const posttoairtableresult = async ()=>{
const airtableResult = await fetch('../api/postcv', {
    method: 'POST',
    body: JSON.stringify(body),
 
    headers: {
        'Content-Type': 'application/json'
    }
});
// if ( )
const jsonify = await airtableResult.json()
if(airtableResult.status == 200 ) alert("Data Sent Correctly")

}
const getTargetElement = () => document.getElementById("cv");

const downloadPdf = () => generatePDF(getTargetElement, options);
 const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

        
const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    formData.append(
      "upload_preset",
      "z8q1vykv"
    );
    formData.append("cloud_name","duo8svqci");
    formData.append("folder", "samples");
// axios
   await axios.post(
      `https://api.cloudinary.com/v1_1/duo8svqci/image/upload`,
      formData
    )
     .then((response) => {
       setCloudinaryImage(response.data.secure_url);
     })
     .catch((error) => {
     });  
  };



// const { toPDF, targetRef } = usePDF({filename: 'page.pdf'});
// Label

return (   

<>

{data.fields!=null? <div  id='cv' ref={componentRef}> <div>
<img  src='https://res.cloudinary.com/duo8svqci/image/upload/v1716924206/b5e8988f-ae8d-4f15-9eff-43e174b8d7a0.png'/>
          <span>CV number is generated automatically</span>

        <Label className="mt-4">
          <span>اسم المكتب</span>
          
          {data.fields!=null?<div className="mt-1"  >{data.fields["External office - المكتب الخارجي"]}</div>:null}
        </Label>

   </div>

   <div style={{display:"flex",flexDirection:"row",flexWrap: "nowrap"}}>
<div style={{flexBasis: "50%"}}>
{cloudinaryImage.length>0?
<img 
src={cloudinaryImage.length > 0?cloudinaryImage:null}
      width={500}
      height={500}
      alt=""
/>:null}

<Label className='mt-6'>
          <span>صورة شخصية </span>
                   <Input  className="file-input file-input-bordered file-input-sm w-full max-w-xs"  type='file' onChange={handleUpload}/>

        </Label>
        <Button onClick={()=>posttoairtableresult()}>Submit</Button>
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
          <span>الاسم</span>
      <Input className="mt-1" value={fullname}  onChange={(e)=>setFullName(e.target.value)}/>
        </Label>

<Label className="mt-4">
          <span>تاريخ الميلاد</span>
          <Input className="mt-1" value={birthDate} type="date" onChange={e=>setBirthDate(e.target.value)} />
        </Label>
{/* <Label className="mt-4">
          <span>العمر</span>
          <Input className="mt-1" value={data.fields["age - العمر"]} />
        </Label> */}

<Label >
          <span>الديانة</span>
            <Select className="mt-1" onChange={e=>{
              
              setReligion(e.target.value);
              
// post();
}}>



<option value="">اختر الديانة</option>

<option value="Islam - الإسلام">الاسلام</option>
<option value="Christianity - المسيحية">المسيحية</option>
<option value="Non-Muslim - غير مسلم">غير مسلم</option>

  </Select>

  


  
        </Label>

<Label className="mt-4">
          <span>جواز السفر</span>
          <Input className="mt-1" value={passport}  onChange={e=>setPassport(e.target.value)}/>
        </Label>
<Label className="mt-4">
          <span>تاريخ الاصدار</span>
          <Input className="mt-1" value="تاريخ الاصدار" type='date' value={issueDate} onChange={e=>setIssueDate(e.target.value)} />
        </Label>

<Label className="mt-4">
          <span>تاريخ الانتهاء</span>
          <Input className="mt-1" value="تاريخ الانتهاء" type='date' value={endDate} onChange={e=>setEndDate(e.target.value)} />
        </Label>

<Label className="mt-4">
          <span>الحالة الاجتماعية</span>


 

<Select className="mt-1" onChange={e=>{
              
            setMaritalStatus(e.target.value);
              
// post();
}}>



<option value="">اختر  الحالة</option>

<option value="Single - عازبة">عزباء</option>
<option value="Married - متزوجة">متزوجة</option>
<option value="Divorced - مطلقة">مطلقة</option>
<option value="Widowed - أرملة">ارملة</option>
<option value="Engaged - مخطوبة">مخطوبة</option>

  </Select>

        </Label>


<Label className="mt-4">
          <span>عدد الاطفال</span>
          <Input className="mt-1" value={numberOFChildren} onChange={e=>setNumnerOfChildren(e.target.value)}  />
        </Label>
          


<Label className="mt-4">
          

          <span>الراتب</span>
          <Input className="mt-1"  value={salary} onChange={e=>setSalary(e.target.value)} />
        </Label>



<Label >
          <span>العربية</span>
            <Select className="mt-1" onChange={e=>{
              
              setArabic(e.target.value);
              
// post();
}}>



<option value=""> المستوى</option>

<option value="Expert - ممتاز">ممتاز</option>
<option value="Advanced - جيد جداً">جيد جدا</option>
<option value="Intermediate - جيد">جيد</option>
<option value="Beginner - مبتدأ">مبتدأ</option>

  </Select>

  


  
        </Label>



<Label >
          <span>اللغة الانجليزية</span>
            <Select className="mt-1" onChange={e=>{
              
              setEnglish(e.target.value);
              
// post();
}}>



<option value=""> المستوى</option>

<option value="Expert - ممتاز">ممتاز</option>
<option value="Advanced - جيد جداً">جيد جدا</option>
<option value="Intermediate - جيد">جيد</option>
<option value="Beginner - مبتدأ">مبتدأ</option>

  </Select>

  


  
        </Label>


<Label >
          <span>التعليم</span>
            <Select className="mt-1" onChange={e=>{
              
              setEducation(e.target.value);
              
// post();
}}>


<option value=""> اختر</option>

<option value="University level - جامعي">جامعي</option>
<option value="High school - ثانوي">ثانوي</option>
<option value="Diploma - دبلوم">دبلوم</option>
<option value="Primary school - ابتدائي">ابتدائي</option>












  </Select>

  


  
        </Label>

<div style={{display :'grid',gridTemplateColumns: "repeat(2, auto)",gridColumnStart:1,gridColumnEnd:4}}>

<Label >
          <span>الخياطة</span>
            <Select className="mt-1" onChange={e=>{
              
              setSewing(e.target.value);
              
// post();
}}>



<option value=""> المستوى</option>

<option value="Expert - ممتاز">ممتاز</option>
<option value="Advanced - جيد جداً">جيد جدا</option>
<option value="Intermediate - جيد">جيد</option>
<option value="Beginner - مبتدأ">مبتدأ</option>
  </Select>

  


  
        </Label>

<Label className="mt-4" style={{gridColumnStart:1,gridColumnEnd:3}}>
          {/* <span>   سنوات الخبرات</span> */}
          {/* <Input className="mt-1" value={experienceYears} onChange={e=>setExperienceYears(e.target.value)} /> */}
        </Label>




<Label className="mt-4" >
          <span>   الغسيل</span>
 
   <Select className="mt-1" onChange={e=>{
              
              setLaundy(e.target.value);
              
// post();
}}>



{/* <option placeholder='الكل'>الكل</option> */}
<option value=""> المستوى</option>

<option value="Expert - ممتاز">ممتاز</option>
<option value="Advanced - جيد جداً">جيد جدا</option>
<option value="Intermediate - جيد">جيد</option>
<option value="Beginner - مبتدأ">مبتدأ</option>

  </Select>

        </Label>

<Label className="mt-4" >
          <span>   الكوي</span>
          <Select className="mt-1" onChange={e=>{
              
              setIroning(e.target.value);
              
}}>



<option value=""> المستوى</option>

<option value="Expert - ممتاز">ممتاز</option>
<option value="Advanced - جيد جداً">جيد جدا</option>
<option value="Intermediate - جيد">جيد</option>
<option value="Beginner - مبتدأ">مبتدأ</option>



  </Select>

  


        </Label>

<Label className="mt-4" >
  
          <span>التنظيف</span>


            <Select className="mt-1" onChange={e=>{
              
              setCleaning(e.target.value);
              
// post();
}}>



{/* <option placeholder='الكل'>الكل</option> */}
<option value=""> المستوى</option>

<option value="Expert - ممتاز">ممتاز</option>
<option value="Advanced - جيد جداً">جيد جدا</option>
<option value="Intermediate - جيد">جيد</option>
<option value="Beginner - مبتدأ">مبتدأ</option>


  </Select>









        </Label>

<Label className="mt-4" >
          <span>العناية بالأطفال</span>
          
            <Select className="mt-1" onChange={e=>{
              
              setBabySetting(e.target.value);
              
}}>


<option value=""> المستوى</option>

<option value="Expert - ممتاز">ممتاز</option>
<option value="Advanced - جيد جداً">جيد جدا</option>
<option value="Intermediate - جيد">جيد</option>
<option value="Beginner - مبتدأ">مبتدأ</option>

  </Select>

        </Label>

<Label className="mt-4" >
          <span>رعاية كبار السن</span>
           <Select className="mt-1" onChange={e=>{
              
              setoldCare(e.target.value);
              
// post();
}}>



<option value=""> نعم/لا</option>

<option value="Yes - نعم">نعم</option>
<option value="No - لا">لا</option>

  </Select>

  

        </Label>



<Label className="mt-4" >
          <span>الطبخ</span>
                      <Select className="mt-1" onChange={e=>{
              
              setCooking(e.target.value);
              
// post();
}}>


<option value=""> المستوى</option>

<option value="Expert - ممتاز">ممتاز</option>
<option value="Advanced - جيد جداً">جيد جدا</option>
<option value="Intermediate - جيد">جيد</option>
<option value="Beginner - مبتدأ">مبتدأ</option>

  </Select>

        </Label>



</div>



   
   </div>
   

   </div>

{/* </div> */}



</div>


    
 <footer>
<img  src='https://res.cloudinary.com/duo8svqci/image/upload/v1716924374/40a3153b-1b92-43c1-a1d9-d0476d37a0df.png'/>
  
  
  </footer>   </div>  :<GridLoader color='black'/>}
   
       </>
)
}