import React, { useState } from 'react'

import { Input, HelperText, Label, Select, Textarea } from '@roketid/windmill-react-ui'
import CTA from 'example/components/CTA'
import PageTitle from 'example/components/Typography/PageTitle'
import SectionTitle from 'example/components/Typography/SectionTitle'

import Layout from 'example/containers/Layout'
import { MailIcon } from 'icons'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'



function Forms() {

  const [office, setOffice] = useState<string>('');
  const [password, setPassword] = useState<string>('');


  const handleSignUp = async (e: React.SyntheticEvent) => {
    
    e.preventDefault();
    //@ts-ignore
await fetch('../api/signup',{method:"post",headers: {
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

// Cookies
// jwtDecode

  return (
    <Layout>
      <PageTitle>اضافة مكتب خارجي </PageTitle>
      <CTA />
      {/* <SectionTitle>Elements</SectionTitle> */}

      <div className="px-4 py-3 mb-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <Label>
          <span>اسم المكتب الخارجي</span>
          <Input className="mt-1" placeholder="اسم المكتب"  type='text' onChange={(e=>setOffice(e.target.value))}/>
        </Label>
        <Label>

          <span>مقر المكتب</span>
          <Input className="mt-1" placeholder="اسم المكتب"  type='text' onChange={(e=>setOffice(e.target.value))}/>
        </Label>
        <Label>

          <span>الرقم التعريفي للدخول</span>
          <Input className="mt-1" placeholder="الرقم التعريفي للدخول" type='number'/>
        </Label>

        <Label className="mt-4">
          <span>الرقم السري</span>
          <Input className="mt-1" placeholder="الرقم السري" />
        </Label>

        <Label className="mt-4">
          <span>اعادة الرقم السري</span>
          <Input className="mt-1" placeholder="الرقم السري" />
        </Label>


      {/* </div> */}
        {/* </Label> */}
      </div>
    </Layout>
  )
}

export default Forms
