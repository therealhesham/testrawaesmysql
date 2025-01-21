import React from 'react'

import { Input, HelperText, Label, Select, Textarea } from '@roketid/windmill-react-ui'
import CTA from 'office/components/CTA'
import PageTitle from 'office/components/Typography/PageTitle'
import SectionTitle from 'office/components/Typography/SectionTitle'
// import CountList from "../"
import country from "./countries.json"
import Layout from 'office/containers/Layout'
import { MailIcon } from 'icons';
import "arabic-fonts/src/css/arabic-fonts.css";


  const handleSignUp = async (e: React.SyntheticEvent) => {
    
    e.preventDefault();
    //@ts-ignore
await fetch('../api/postcv',{method:"post",headers: {
        "Content-Type": "application/json",
      },body:JSON.stringify({
        email: "ssss"
      })}).then(e=>
 
  e.text()
  // console.log(e.text())


).then(s=>
{  
  console.log(s)
}
)
    
      .then((response) => {

        console.log(response);
        
        
        // router.replace('/example/dashboard');
      })
      .catch((error) => {
        console.log(error);
      });
  };



function Forms() {
  return (
    <Layout>
      {/* <div style={{display:"inline-flex",alignContent:"center" }} > */}
      {/* <div style={{}}> */}
      <PageTitle > <div style={{textAlign:"center"}}>اضافة سيرة ذاتية الى قاعدة بيانات روائس القمم</div></PageTitle>
      {/* </div> */}
        
      
      {/* </div> */}
      {/* <CTA /> */}
      <SectionTitle>البيانات</SectionTitle>

      <div className="px-4 py-3 mb-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <Label>
          <span>Full Name</span>
          <Input className="mt-1" placeholder="Full Name" />
        </Label>
      <Label >
          <span>Nationality</span>
            <Select className="mt-1">


{country.map((e,i)=>
    <option key={i} >{e.country} </option>


)}
  </Select>

        </Label>


        <Label className="mt-4">
          <span>BirthDate</span>
          <Input  className="mt-1"  type='date' />


        </Label>


        <Label className="mt-4">
          <span>Salary</span>
                    <Input  className="mt-1"  type='text' />

        </Label>


        <Label className='mt-6'>
          <span>Picture </span>
                   <Input  className="file-input file-input-bordered file-input-sm w-full max-w-xs"  type='file' />

        </Label>
        <Label className='mt-6'>
          <span>Full body picture </span>
                   <Input  className="file-input file-input-bordered file-input-sm w-full max-w-xs"  type='file' />

        </Label>
      <Label>
  <span>Religion</span>
  <Select  style={{fontSize:"15px" }} >
    <option  >Muslim</option>
    <option>Hindu</option>
    <option>Christian</option>
    <option>Irreligious</option>



  </Select>
</Label>
<Label>
  <span>passport number</span>
                    <Input  className="mt-1"  type='text' />
  
</Label>
<Label>
  <span>Skills</span>
<div style={{backgroundColor:"inherit",borderRadius:"5px" , borderColor:"black 50%",borderWidth:"1px"}} >
<div style={{margin:"10px"}}>
  <span style={{ margin:"10px",padding:"4px",justifyContent:"center",backgroundColor:"blueviolet",borderRadius:"6px"}}> cooking</span>
  </div>



{/* <span style={{maxWidth:"50%"}}> cooking</span> */}

</div>
</Label>
        <Label className="mt-4">
          <span>Multiselect</span>
          <Select className="mt-1" multiple>
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
            <option>Option 4</option>
            <option>Option 5</option>
          </Select>
        </Label>

        <Label className="mt-4">
          <span>Notes</span>
          <Textarea className="mt-1" rows={3} placeholder="Enter some long form content." />
        </Label>
{/* 
        <Label className="mt-6" check>
          <Input type="checkbox" />
          <span className="ml-2">
            I agree to the <span className="underline">privacy policy</span>
          </span>
        </Label> */}
      </div>


    </Layout>
  )
}

export default Forms
